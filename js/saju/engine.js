// 사주 만세력 계산 엔진 (순수 함수, 브라우저/Node 공용)
// 기준: 절입 시각(분 단위) 경계, 정자시법 기본(야자시 옵션), JDN 일주 공식

import {
  STEMS, BRANCHES, ELEMENTS, NAPEUM, JIJANGAN, SIPSEONG,
  UNSEONG_NAMES, UNSEONG_START, UNSEONG_DIR,
  KOREA_TZ_HISTORY, KOREA_DST, TIMEZONES, ganjiParts,
} from './constants.js';
import { toJdn, fromJdn, printedMin, fromPrintedMin } from './calendar.js';

// 1900-01-06 소한 이전 (1899 기해년 대설 관할) 폴백
const FALLBACK = { yearIdx: 35, monthIdx: 12, sajuYear: 1899 };

/** 해당 시각(현지)이 한국 서머타임 기간인지 */
export function isKoreaDst(y, m, d, hh, mm) {
  const v = printedMin(y, m, d, hh, mm);
  for (const [from, to] of KOREA_DST) {
    if (v >= printedMin(...from) && v < printedMin(...to)) return true;
  }
  return false;
}

/** 한국 역사적 표준시 오프셋 (분). 기본 +540 */
export function koreaUtcOffset(y, m, d) {
  const v = printedMin(y, m, d);
  for (const { from, to, offset } of KOREA_TZ_HISTORY) {
    if (v >= printedMin(...from) && v < printedMin(...to)) return offset;
  }
  return 540;
}

/**
 * 사주 계산 (만세력).
 *
 * @param {import('./calendar.js').CalendarData} cal
 * @param {object} input
 *   year, month, day        : 생년월일 (양력 또는 음력)
 *   hour, minute            : 출생 시각 (null 이면 시주 생략)
 *   isLunar, isLeapMonth    : 음력 입력 여부/윤달 여부
 *   timezone                : TIMEZONES key (기본 'korea')
 *   koreanAdjust            : -30분 한국식 보정 (기본: 프리셋 값)
 *   manualDst               : 비한국 시간대에서 출생 당시 서머타임 시행 중 (1시간 감산)
 *   applyDst                : 서머타임 보정 적용 여부 (기본 true)
 *   useYajasi               : 야자시법 (23시 이후에도 당일 유지)
 *   gender                  : 'M' | 'F' | null — 대운 계산용
 * @returns {object} result — 실패 시 { error: string 코드 }
 */
export function computeSaju(cal, input) {
  const {
    year, month, day,
    hour = null, minute = 0,
    isLunar = false, isLeapMonth = false,
    timezone = 'korea',
    manualDst = false,
    applyDst = true,
    useYajasi = false,
    gender = null,
  } = input;

  const tz = TIMEZONES.find((t) => t.key === timezone) || TIMEZONES[0];
  const koreanAdjust = input.koreanAdjust !== undefined ? !!input.koreanAdjust : tz.koreanAdjust;

  // 1. 음력 입력 → 양력 변환
  let sy = year, sm = month, sd = day;
  if (isLunar) {
    const j = cal.lunarToSolar(year, month, isLeapMonth, day);
    if (j == null) return { error: 'invalidLunar' };
    ({ y: sy, m: sm, d: sd } = fromJdn(j));
  } else {
    if (month < 1 || month > 12 || day < 1 || day > 31) return { error: 'invalidDate' };
    const j = toJdn(sy, sm, sd);
    const back = fromJdn(j);
    if (back.y !== sy || back.m !== sm || back.d !== sd) return { error: 'invalidDate' };
  }
  if (!cal.inRange(toJdn(sy, sm, sd))) return { error: 'outOfRange' };

  const hasTime = hour !== null && hour !== undefined && hour !== '';
  let hh = hasTime ? Number(hour) : 12; // 시간 미상 시 정오 가정 (일주 판정 안전값)
  let mi = hasTime ? Number(minute || 0) : 0;
  if (hasTime && (hh < 0 || hh > 23 || mi < 0 || mi > 59)) return { error: 'invalidTime' };

  // 2. 서머타임 감산 (한국: 역사표 자동 / 그 외: 수동 체크)
  let dstApplied = false;
  if (hasTime && applyDst) {
    const dst = tz.auto ? isKoreaDst(sy, sm, sd, hh, mi) : manualDst;
    if (dst) {
      const adj = shiftDateTime(sy, sm, sd, hh, mi, -60);
      ({ y: sy, m: sm, d: sd, hh, mm: mi } = adj);
      dstApplied = true;
    }
  }

  // 3. 시진 index / 정자시법 날짜 전환 (Mobidic 관례 미러: -30분 보정 시 자시 23:30 시작)
  const offset = koreanAdjust ? 30 : 0;
  let effY = sy, effM = sm, effD = sd;
  let hourBranchIdx = null;
  let isNightRat = false;
  if (hasTime) {
    const mins = hh * 60 + mi;
    let adjTotal = mins - offset;
    if (adjTotal < 0) adjTotal += 1440;
    hourBranchIdx = Math.floor((adjTotal + 60) / 120) % 12;
    if (mins >= 23 * 60 + offset) {
      isNightRat = true;
      if (!useYajasi) {
        const next = fromJdn(toJdn(sy, sm, sd) + 1);
        ({ y: effY, m: effM, d: effD } = next);
      }
    }
  }

  const effJdn = toJdn(effY, effM, effD);
  if (!cal.inRange(effJdn)) return { error: 'outOfRange' };

  // 4. 절기 비교 기준 시각 (표기 KST 공간, 분)
  //    한국: 표기 시각 그대로 / 그 외: UTC 경유 후 +540분 (현대 KST)
  let kstMin;
  if (tz.key === 'korea') {
    kstMin = printedMin(sy, sm, sd, hh, mi);
  } else {
    kstMin = printedMin(sy, sm, sd, hh, mi) - tz.offset + 540;
  }

  // 5. 년주 / 월주 (절입 시각 기준)
  const solarYearAtKst = fromPrintedMin(kstMin).y;
  let sajuYear, yearIdx, monthIdx;
  const gj = cal.governingJeol(kstMin);
  if (!gj) {
    ({ yearIdx, monthIdx, sajuYear } = FALLBACK);
  } else {
    const ip = cal.ipchunMin(solarYearAtKst);
    sajuYear = ip !== null && kstMin >= ip ? solarYearAtKst : solarYearAtKst - 1;
    yearIdx = ((sajuYear - 4) % 60 + 60) % 60;
    monthIdx = monthIdxFromJeol(gj.termIdx, sajuYear);
  }

  // 6. 일주 / 시주
  const dayIdx = ((effJdn + cal.dayGanjiOffset) % 60 + 60) % 60;
  const dayStemIdx = dayIdx % 10;
  let hourIdx = null;
  if (hasTime) {
    const hStem = ((dayStemIdx % 5) * 2 + hourBranchIdx) % 10;
    hourIdx = ganjiIdxOf(hStem, hourBranchIdx);
  }

  // 7. 음력 표시 (원 양력 날짜 기준)
  const lunar = cal.solarToLunar(toJdn(sy, sm, sd));

  // 8. 절기 정보
  const [curTerm, nextTerm] = cal.surroundingTerms(kstMin);

  // 9. 기둥 상세
  const pillars = {};
  const pillarIdx = { year: yearIdx, month: monthIdx, day: dayIdx, hour: hourIdx };
  for (const key of ['year', 'month', 'day', 'hour']) {
    const idx = pillarIdx[key];
    if (idx === null) { pillars[key] = null; continue; }
    pillars[key] = buildPillar(idx, dayStemIdx, key === 'day');
  }

  // 10. 오행 분포 (천간 4 + 지지 4)
  const elementCount = [0, 0, 0, 0, 0];
  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = pillars[key];
    if (!p) continue;
    elementCount[STEMS[p.stemIdx].element] += 1;
    elementCount[BRANCHES[p.branchIdx].element] += 1;
  }

  // 11. 공망 (일주 기준)
  const gongmang = gongmangOf(dayIdx);

  // 12. 대운
  let daeun = null;
  if (gender === 'M' || gender === 'F') {
    daeun = computeDaeun(cal, { kstMin, yearIdx, monthIdx, gender });
  }

  return {
    input: {
      solar: { y: sy, m: sm, d: sd },
      hasTime, hour: hasTime ? hh : null, minute: hasTime ? mi : null,
      timezone: tz.key, koreanAdjust, useYajasi, gender,
      dstApplied,
      dayShifted: effJdn !== toJdn(sy, sm, sd),
    },
    lunar,           // {ly, lm, leap, ld}
    weekday: (toJdn(sy, sm, sd) + 1) % 7, // 0=일요일
    pillars,         // year/month/day/hour
    hourBranchIdx,
    isNightRat,
    sajuYear,
    zodiacAnimal: BRANCHES[yearIdx % 12].animal,
    elementCount,
    gongmang,
    curTerm, nextTerm,
    daeun,
  };
}

/** 節 termIdx(짝수) + 사주년 → 월주 60갑자 index (오호둔) */
export function monthIdxFromJeol(termIdx, sajuYear) {
  const branch = (termIdx / 2 + 1) % 12;          // 소한(0)→丑(1) … 입춘(2)→寅(2)
  const n = (branch - 2 + 12) % 12;               // 寅월부터의 서수
  const yearStem = ((sajuYear - 4) % 10 + 10) % 10;
  const stem = (yearStem * 2 + 2 + n) % 10;
  return ganjiIdxOf(stem, branch);
}

/** (천간 idx, 지지 idx) → 60갑자 idx */
export function ganjiIdxOf(stemIdx, branchIdx) {
  for (let k = stemIdx; k < 60; k += 10) {
    if (k % 12 === branchIdx) return k;
  }
  return -1; // 음양 불일치 조합은 60갑자에 없음
}

/** 기둥 상세 정보 구성 */
function buildPillar(idx, dayStemIdx, isDay) {
  const g = ganjiParts(idx);
  const jj = JIJANGAN[g.branchIdx];
  return {
    idx,
    stemIdx: g.stemIdx,
    branchIdx: g.branchIdx,
    hanja: g.hanja,
    ko: g.ko,
    stemElement: STEMS[g.stemIdx].element,
    branchElement: BRANCHES[g.branchIdx].element,
    stemYang: STEMS[g.stemIdx].yang,
    branchYang: BRANCHES[g.branchIdx].yang,
    napeum: NAPEUM[idx >> 1],
    jijangan: jj,
    // 십성: 일간 대비 (일주 천간 자신은 '일원')
    sipseongStem: isDay ? null : sipseongOf(dayStemIdx, g.stemIdx),
    sipseongBranch: sipseongOf(dayStemIdx, JIJANGAN[g.branchIdx].stems[2]),
    unseong: unseongOf(dayStemIdx, g.branchIdx),
  };
}

/** 십성: 일간(stem idx) 대비 대상 천간(stem idx) */
export function sipseongOf(dayStemIdx, targetStemIdx) {
  if (targetStemIdx === null || targetStemIdx === undefined) return null;
  const dEl = STEMS[dayStemIdx].element, tEl = STEMS[targetStemIdx].element;
  const diff = ((tEl - dEl) % 5 + 5) % 5;
  const same = STEMS[dayStemIdx].yang === STEMS[targetStemIdx].yang;
  return SIPSEONG[diff][same ? 0 : 1];
}

/** 12운성: 일간 기준 지지 */
export function unseongOf(dayStemIdx, branchIdx) {
  const start = UNSEONG_START[dayStemIdx];
  const dir = UNSEONG_DIR[dayStemIdx];
  const step = dir === 1
    ? ((branchIdx - start) % 12 + 12) % 12
    : ((start - branchIdx) % 12 + 12) % 12;
  return UNSEONG_NAMES[step];
}

/** 공망 (일주 60갑자 기준 두 지지) */
export function gongmangOf(ganjiIdx) {
  const xunStart = ganjiIdx - (ganjiIdx % 10); // 旬 시작 (甲x)
  const b1 = (xunStart % 12 + 10) % 12;
  const b2 = (xunStart % 12 + 11) % 12;
  return [b1, b2];
}

/** 대운: 양남음녀 순행 / 음남양녀 역행, 절입까지 일수 ÷ 3 (절상법 반올림, 최소 1) */
export function computeDaeun(cal, { kstMin, yearIdx, monthIdx, gender }) {
  const yearYang = yearIdx % 2 === 0; // 갑(0)=양 … 짝수 천간 idx = 양간
  const forward = (yearYang && gender === 'M') || (!yearYang && gender === 'F');

  let gapMin;
  if (forward) {
    const nj = cal.nextJeol(kstMin);
    if (!nj) return null;
    gapMin = nj.kstMin - kstMin;
  } else {
    const gj = cal.governingJeol(kstMin);
    if (!gj) return null;
    gapMin = kstMin - gj.kstMin;
  }
  const days = gapMin / 1440;
  let startAge = Math.round(days / 3);
  if (startAge < 1) startAge = 1;
  if (startAge > 10) startAge = 10;

  const list = [];
  for (let i = 1; i <= 10; i += 1) {
    const idx = ((monthIdx + (forward ? i : -i)) % 60 + 60) % 60;
    list.push({ age: startAge + (i - 1) * 10, ...ganjiParts(idx), napeum: NAPEUM[idx >> 1] });
  }
  return { forward, startAge, list };
}

/** 시각을 분 단위로 이동 (달력 안전) */
function shiftDateTime(y, m, d, hh, mi, deltaMin) {
  const t = Date.UTC(y, m - 1, d, hh, mi) + deltaMin * 60000;
  const dt = new Date(t);
  return {
    y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(),
    hh: dt.getUTCHours(), mm: dt.getUTCMinutes(),
  };
}
