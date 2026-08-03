// 달력 유틸: 율리우스적일(JDN), 음력 변환, 절기 조회
// 데이터: data/lunar-table.json, data/solar-terms.json (1900–2100, 기준 만세력 DB에서 추출)

/** 그레고리력 → 율리우스 적일 (정오 기준 정수) */
export function toJdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
    Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** 율리우스 적일 → 그레고리력 {y, m, d} */
export function fromJdn(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d2 / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * m2 + 2) / 5) + 1,
    m: m2 + 3 - 12 * Math.floor(m2 / 10),
    y: 100 * b + d2 - 4800 + Math.floor(m2 / 10),
  };
}

/** 표기 시각(만세력 표기 = 한국 표기시)을 epoch 분으로. Date.UTC 를 표기 공간으로 사용 */
export function printedMin(y, m, d, hh = 0, mm = 0) {
  return Math.floor(Date.UTC(y, m - 1, d, hh, mm) / 60000);
}

/** epoch 분 → {y, m, d, hh, mm} (표기 공간) */
export function fromPrintedMin(min) {
  const dt = new Date(min * 60000);
  return {
    y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(),
    hh: dt.getUTCHours(), mm: dt.getUTCMinutes(),
  };
}

export class CalendarData {
  /**
   * @param {object} lunarTable data/lunar-table.json
   * @param {object} solarTerms data/solar-terms.json
   */
  constructor(lunarTable, solarTerms) {
    this.months = lunarTable.months; // [ly, lm, leap, startJdn, days]
    this.dayGanjiOffset = lunarTable.dayGanjiOffset;
    this.terms = solarTerms.terms;   // [printedKstEpochMin, termIdx] 정렬
    this.termMins = this.terms.map((t) => t[0]);
    this.minJdn = this.months[0][3];
    const last = this.months[this.months.length - 1];
    this.maxJdn = last[3] + last[4] - 1;
    // 입춘(termIdx=2) 연도별 시각
    this.ipchun = new Map();
    for (const [min, idx] of this.terms) {
      if (idx === 2) this.ipchun.set(fromPrintedMin(min).y, min);
    }
  }

  /** 지원 범위 (양력) */
  inRange(jdn) {
    return jdn >= this.minJdn && jdn <= this.maxJdn;
  }

  /** 양력 JDN → 음력 {ly, lm, leap, ld} */
  solarToLunar(jdn) {
    const ms = this.months;
    let lo = 0, hi = ms.length - 1;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (ms[m][3] <= jdn) lo = m; else hi = m - 1;
    }
    const m = ms[lo];
    if (jdn < m[3] || jdn >= m[3] + m[4]) return null;
    return { ly: m[0], lm: m[1], leap: !!m[2], ld: jdn - m[3] + 1 };
  }

  /** 음력 → 양력 JDN (없으면 null) */
  lunarToSolar(ly, lm, leap, ld) {
    for (const m of this.months) {
      if (m[0] === ly && m[1] === lm && !!m[2] === !!leap) {
        if (ld >= 1 && ld <= m[4]) return m[3] + ld - 1;
        return null;
      }
    }
    return null;
  }

  /** 해당 음력 연도의 윤달 번호 (없으면 0) */
  leapMonthOf(ly) {
    for (const m of this.months) {
      if (m[0] === ly && m[2]) return m[1];
    }
    return 0;
  }

  /** 음력 연/월의 일수 */
  lunarMonthDays(ly, lm, leap) {
    for (const m of this.months) {
      if (m[0] === ly && m[1] === lm && !!m[2] === !!leap) return m[4];
    }
    return 0;
  }

  /** kstMin 시점 직전(포함) 절기 index 위치. 없으면 -1 */
  termPosBefore(kstMin) {
    const arr = this.termMins;
    let lo = 0, hi = arr.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= kstMin) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }

  /** 시점 기준 [직전 절기, 다음 절기] — {termIdx, kstMin} */
  surroundingTerms(kstMin) {
    const pos = this.termPosBefore(kstMin);
    const cur = pos >= 0 ? { termIdx: this.terms[pos][1], kstMin: this.terms[pos][0] } : null;
    const next = pos + 1 < this.terms.length
      ? { termIdx: this.terms[pos + 1][1], kstMin: this.terms[pos + 1][0] } : null;
    return [cur, next];
  }

  /** 시점 기준 관할 節 (짝수 termIdx). 1900-01-06 소한 이전은 null (엔진에서 폴백) */
  governingJeol(kstMin) {
    let pos = this.termPosBefore(kstMin);
    while (pos >= 0 && this.terms[pos][1] % 2 === 1) pos -= 1;
    if (pos < 0) return null;
    return { termIdx: this.terms[pos][1], kstMin: this.terms[pos][0] };
  }

  /** 다음 節 (짝수 termIdx) — 대운수 계산용 */
  nextJeol(kstMin) {
    let pos = this.termPosBefore(kstMin) + 1;
    while (pos < this.terms.length && this.terms[pos][1] % 2 === 1) pos += 1;
    if (pos >= this.terms.length) return null;
    return { termIdx: this.terms[pos][1], kstMin: this.terms[pos][0] };
  }

  /** 입춘 시각 (표기 epoch 분). 없으면 null */
  ipchunMin(year) {
    return this.ipchun.has(year) ? this.ipchun.get(year) : null;
  }
}

/** JSON 두 파일을 fetch 하여 CalendarData 생성 (브라우저용) */
export async function loadCalendarData(baseUrl = '.') {
  const [lunar, terms] = await Promise.all([
    fetch(`${baseUrl}/data/lunar-table.json`).then((r) => {
      if (!r.ok) throw new Error(`lunar-table.json HTTP ${r.status}`);
      return r.json();
    }),
    fetch(`${baseUrl}/data/solar-terms.json`).then((r) => {
      if (!r.ok) throw new Error(`solar-terms.json HTTP ${r.status}`);
      return r.json();
    }),
  ]);
  return new CalendarData(lunar, terms);
}
