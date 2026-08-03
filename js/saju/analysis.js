// 명리 상세 분석 엔진 (Mobidic manseryeok_utils.py 의 분석 파이프라인 1:1 포팅)
// 신강신약 v2(6단계) · 종합 용신 · 조후 · 합충형파해 · 신살 · 공망 상세

import { STEMS, BRANCHES, JIJANGAN, SIPSEONG, ganjiParts } from './constants.js';
import {
  OH, OH_SANGSAENG, OH_SANGGEUK, OH_SAENG_ME, OH_GEUK_ME, MONTH_SEASON_ELEMENT,
  CHEONGAN_HAP, CHEONGAN_CHUNG, JIJI_YUKHAP, JIJI_SAMHAP, JIJI_BANHAP, JIJI_BANGHAP,
  JIJI_CHUNG, JIJI_HYUNG_TRIPLE, JIJI_HYUNG_PAIRS, JIJI_JAHYUNG, JIJI_PA, JIJI_HAE,
  JIJI_WONJIN, JIJI_GWIMUN, JIJI_AMHAP,
  CHEONUL_GWIN, TAEGUK_GWIN, MUNCHANG_GWIN, HAKDANG_GWIN, YUKMA_SAL, DOHWA_SAL,
  HWAGAE_SAL, GEOBSAL, JAESAL, CHEONSAL, JISAL, MANGSIN_SAL, JANGSUNG_SAL, BANAN_SAL,
  WOLSAL, BAEKHO_DAESAL, GOEGANG_SAL, YANGIN_SAL, GEONROK, HONGYEOM_SAL, HYOSIN_SAL,
  SEASON_PROPERTIES, JOHU_YONGSIN,
  STEM_POS_WEIGHT, BRANCH_POS_WEIGHT, HS_WEIGHT, WSXSS,
} from './tables.js';

const POSITIONS = ['year', 'month', 'day', 'hour'];

/** 지지 십신 판정용 (오행 idx, 음양) — 체용 기준 (子=수·음 등, Mobidic jiji_map 미러) */
export const BRANCH_SIP_MAP = [
  [4, 1], [2, 1], [0, 0], [0, 1], [2, 0], [1, 0],
  [1, 1], [2, 1], [3, 0], [3, 1], [2, 0], [4, 0],
];

const stemOh = (stemIdx) => OH[STEMS[stemIdx].element];
const branchOh = (branchIdx) => OH[BRANCHES[branchIdx].element];

/** 십신 (일간 stemIdx 기준, 대상 천간 stemIdx 또는 지지 branchIdx) → SIPSEONG entry */
export function sipsinOf(dayStemIdx, { stemIdx = null, branchIdx = null }) {
  const me = [STEMS[dayStemIdx].element, STEMS[dayStemIdx].yang ? 0 : 1];
  let target;
  if (stemIdx !== null) target = [STEMS[stemIdx].element, STEMS[stemIdx].yang ? 0 : 1];
  else target = BRANCH_SIP_MAP[branchIdx];
  const diff = ((target[0] - me[0]) % 5 + 5) % 5;
  const same = me[1] === target[1];
  return SIPSEONG[diff][same ? 0 : 1];
}

const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const pairInfo = (list, a, b) => {
  for (const [pair, oh, name] of list) {
    if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) return { oh, name };
  }
  return null;
};

/** 합충형파해 전체 분석. pillars: {year..hour: {stemIdx, branchIdx} | null} */
export function analyzeRelations(pillars) {
  const gans = POSITIONS.map((p) => (pillars[p] ? STEMS[pillars[p].stemIdx].hanja : ''));
  const jis = POSITIONS.map((p) => (pillars[p] ? BRANCHES[pillars[p].branchIdx].hanja : ''));
  const out = [];
  const push = (type, posI, posJ, name, oh) => {
    out.push({ type, posPair: [POSITIONS[posI], POSITIONS[posJ]], name, oh: oh || null });
  };

  for (let i = 0; i < 4; i += 1) {
    for (let j = i + 1; j < 4; j += 1) {
      if (gans[i] && gans[j]) {
        const hap = pairInfo(CHEONGAN_HAP, gans[i], gans[j]);
        if (hap) push('cheonganHap', i, j, hap.name, hap.oh);
        if (pairIn(CHEONGAN_CHUNG, gans[i], gans[j])) push('cheonganChung', i, j, `${gans[i]}${gans[j]}`);
      }
      if (jis[i] && jis[j]) {
        const yh = pairInfo(JIJI_YUKHAP, jis[i], jis[j]);
        if (yh) push('yukhap', i, j, yh.name, yh.oh);
        if (pairIn(JIJI_CHUNG, jis[i], jis[j])) push('chung', i, j, `${jis[i]}${jis[j]}`);
        const bh = pairInfo(JIJI_BANHAP, jis[i], jis[j]);
        if (bh) push('banhap', i, j, bh.name, bh.oh);
        const ah = pairInfo(JIJI_AMHAP, jis[i], jis[j]);
        if (ah) push('amhap', i, j, ah.name, ah.oh);
        for (const [pair, name] of JIJI_HYUNG_PAIRS) {
          if ((pair[0] === jis[i] && pair[1] === jis[j]) || (pair[0] === jis[j] && pair[1] === jis[i])) {
            push('hyung', i, j, name);
          }
        }
        if (jis[i] === jis[j] && JIJI_JAHYUNG.includes(jis[i])) push('hyung', i, j, '자형');
        if (pairIn(JIJI_PA, jis[i], jis[j])) push('pa', i, j, `${jis[i]}${jis[j]}`);
        if (pairIn(JIJI_HAE, jis[i], jis[j])) push('hae', i, j, `${jis[i]}${jis[j]}`);
        if (pairIn(JIJI_WONJIN, jis[i], jis[j])) push('wonjin', i, j, `${jis[i]}${jis[j]}`);
        if (pairIn(JIJI_GWIMUN, jis[i], jis[j])) push('gwimun', i, j, `${jis[i]}${jis[j]}`);
      }
    }
  }
  const validJis = jis.filter(Boolean);
  for (const [triplet, oh, name] of JIJI_SAMHAP) {
    if (triplet.every((x) => validJis.includes(x))) out.push({ type: 'samhap', posPair: null, name, oh });
  }
  for (const [triplet, oh, name] of JIJI_BANGHAP) {
    if (triplet.every((x) => validJis.includes(x))) out.push({ type: 'banghap', posPair: null, name, oh });
  }
  for (const [triplet, name] of JIJI_HYUNG_TRIPLE) {
    if (triplet.every((x) => validJis.includes(x))) out.push({ type: 'hyung', posPair: null, name: `${name}(삼형)`, oh: null });
  }
  return out;
}

/** 신살 (일간·일지 기준 + 연지 기준) → 한글 이름 배열 */
export function sinsalOf(dayStemIdx, dayBranchIdx, targetBranchIdx, yearBranchIdx = null) {
  const dg = STEMS[dayStemIdx].hanja;
  const base = BRANCHES[dayBranchIdx].hanja;
  const tgt = BRANCHES[targetBranchIdx].hanja;
  const res = [];
  if (YUKMA_SAL[base] === tgt) res.push('역마살');
  if (DOHWA_SAL[base] === tgt) res.push('도화살');
  if (HWAGAE_SAL[base] === tgt) res.push('화개살');
  if (GEOBSAL[base] === tgt) res.push('겁살');
  if (JAESAL[base] === tgt) res.push('재살');
  if (MANGSIN_SAL[base] === tgt) res.push('망신살');
  if (BANAN_SAL[base] === tgt) res.push('반안살');
  if ((CHEONUL_GWIN[dg] || []).includes(tgt)) res.push('천을귀인');
  if ((TAEGUK_GWIN[dg] || []).includes(tgt)) res.push('태극귀인');
  if (MUNCHANG_GWIN[dg] === tgt) res.push('문창귀인');
  if (HAKDANG_GWIN[dg] === tgt) res.push('학당귀인');
  if (YANGIN_SAL[dg] === tgt) res.push('양인살');
  if (GEONROK[dg] === tgt) res.push('건록');
  if (HONGYEOM_SAL[dg] === tgt) res.push('홍염살');
  if (HYOSIN_SAL[dg] === tgt) res.push('효신살');
  if (yearBranchIdx !== null) {
    const yj = BRANCHES[yearBranchIdx].hanja;
    if (CHEONSAL[yj] === tgt) res.push('천살');
    if (JISAL[yj] === tgt) res.push('지살');
    if (JANGSUNG_SAL[yj] === tgt) res.push('장성살');
    if (WOLSAL[yj] === tgt) res.push('월살');
  }
  return res;
}

/** 특수 신살 (일주 간지) */
export function specialSalOf(dayGanjiIdx) {
  const hanja = ganjiParts(dayGanjiIdx).hanja;
  const res = [];
  if (BAEKHO_DAESAL.includes(hanja)) res.push('백호대살');
  if (GOEGANG_SAL.includes(hanja)) res.push('괴강살');
  return res;
}

/** 공망 상세 (일공망/연공망 + 旬 + 영향 기둥) */
export function gongmangDetail(pillars) {
  const detail = {};
  for (const [key, others] of [['day', ['year', 'month', 'hour']], ['year', ['month', 'day', 'hour']]]) {
    const p = pillars[key];
    if (!p) continue;
    const idx = p.idx;
    const xunStart = idx - (idx % 10);
    const branches = [((xunStart % 12) + 10) % 12, ((xunStart % 12) + 11) % 12];
    const affected = others.filter((o) => pillars[o] && branches.includes(pillars[o].branchIdx));
    detail[key] = { branches, xun: ganjiParts(xunStart).hanja, affected };
  }
  return detail;
}

/** 조후 분석 */
export function analyzeJohu(dayStemIdx, monthBranchIdx, simpleCounts) {
  const monthJi = BRANCHES[monthBranchIdx].hanja;
  const season = SEASON_PROPERTIES[monthJi];
  if (!season) return null;
  const fire = simpleCounts[1], water = simpleCounts[4];
  const isHot = season.temp === '열' || fire >= 3;
  const isCold = season.temp === '한' || water >= 3;
  const isDry = season.moisture === '조' && water === 0;
  const isWet = season.moisture === '습' && fire === 0;

  let balance = 'neutral';
  if (isHot && isDry) balance = 'hotDry';
  else if (isHot) balance = 'hot';
  else if (isCold && isWet) balance = 'coldWet';
  else if (isCold) balance = 'cold';
  else if (isDry) balance = 'dry';
  else if (isWet) balance = 'wet';

  const ygHanja = JOHU_YONGSIN[STEMS[dayStemIdx].hanja]?.[monthJi] || '';
  const ygIdx = STEMS.findIndex((s) => s.hanja === ygHanja);
  const needed = season.needed;
  const hasNeeded = needed.some((oh) => simpleCounts[OH.indexOf(oh)] > 0);

  return {
    season: season.season, temp: season.temp, moisture: season.moisture,
    balance,
    yongsinStemIdx: ygIdx >= 0 ? ygIdx : null,
    yongsinOh: ygIdx >= 0 ? stemOh(ygIdx) : '',
    needed, avoid: season.avoid, satisfied: hasNeeded,
  };
}

// ── 신강신약 v2 (6단계 파이프라인, Python 구현 순서·계수 1:1) ──

function wsxssStatus(monthJi, targetOh) {
  const seasonEl = MONTH_SEASON_ELEMENT[monthJi];
  if (!seasonEl || !targetOh) return '휴';
  if (targetOh === seasonEl) return '왕';
  if (OH_SANGSAENG[seasonEl] === targetOh) return '상';
  if (OH_SAENG_ME[seasonEl] === targetOh) return '휴';
  if (OH_GEUK_ME[seasonEl] === targetOh) return '수';
  if (OH_SANGGEUK[seasonEl] === targetOh) return '사';
  return '휴';
}

function sipsungGroup(dayOh, targetOh) {
  if (targetOh === dayOh) return '비겁';
  if (OH_SAENG_ME[dayOh] === targetOh) return '인성';
  if (OH_SANGSAENG[dayOh] === targetOh) return '식상';
  if (OH_SANGGEUK[dayOh] === targetOh) return '재성';
  if (OH_GEUK_ME[dayOh] === targetOh) return '관성';
  return '비겁';
}

const relationToDay = (dayOh, targetOh) =>
  (targetOh === dayOh || OH_SAENG_ME[dayOh] === targetOh) ? 'supportive' : 'draining';

export function analyzeStrength(dayStemIdx, monthBranchIdx, pillars) {
  const dayOh = stemOh(dayStemIdx);
  const dayYy = STEMS[dayStemIdx].yang ? '양' : '음';
  const monthJi = BRANCHES[monthBranchIdx].hanja;
  const posOrder = { year: 0, month: 1, day: 2, hour: 3 };

  // Step 1: 유닛 분해 (천간 3개[일간 제외] + 지장간)
  const units = [];
  for (const pos of POSITIONS) {
    const p = pillars[pos];
    if (!p) continue;
    if (pos !== 'day') {
      const oh = stemOh(p.stemIdx);
      units.push({
        type: 'stem', pos, ohaeng: oh, yinyang: STEMS[p.stemIdx].yang ? '양' : '음',
        relation: relationToDay(dayOh, oh), sipsung: sipsungGroup(dayOh, oh),
        posWeight: STEM_POS_WEIGHT[pos], hsWeight: 1.0, base: 0,
      });
    }
    const jj = JIJANGAN[p.branchIdx];
    jj.stems.forEach((sIdx, i) => {
      if (sIdx === null) return;
      const oh = stemOh(sIdx);
      units.push({
        type: 'branch', pos, jiIdx: p.branchIdx, ohaeng: oh,
        yinyang: STEMS[sIdx].yang ? '양' : '음',
        relation: relationToDay(dayOh, oh), sipsung: sipsungGroup(dayOh, oh),
        posWeight: BRANCH_POS_WEIGHT[pos], hsWeight: HS_WEIGHT[i], base: 0,
      });
    });
  }

  // Step 2: 합충 + phantom (원본 순서 유지: 이 시점 base=0 → 배수는 무효, phantom만 유효)
  const gans = POSITIONS.map((p) => (pillars[p] ? STEMS[pillars[p].stemIdx].hanja : ''));
  const jis = POSITIONS.map((p) => (pillars[p] ? BRANCHES[pillars[p].branchIdx].hanja : ''));
  const phantoms = [];
  for (let i = 0; i < 4; i += 1) {
    for (let j = i + 1; j < 4; j += 1) {
      if (jis[i] && jis[j]) {
        const hap = pairInfo(JIJI_YUKHAP, jis[i], jis[j]);
        if (hap) {
          const isAdj = Math.abs(i - j) === 1;
          const ratio = isAdj ? 0.3 : 0.1;
          const avgW = (BRANCH_POS_WEIGHT[POSITIONS[i]] + BRANCH_POS_WEIGHT[POSITIONS[j]]) / 2;
          phantoms.push({
            type: 'phantom', pos: null, ohaeng: hap.oh,
            relation: relationToDay(dayOh, hap.oh), sipsung: sipsungGroup(dayOh, hap.oh),
            base: avgW * ratio,
          });
        }
      }
    }
  }
  const validJis = jis.filter(Boolean);
  for (const [triplet, oh] of JIJI_SAMHAP) {
    if (triplet.every((x) => validJis.includes(x))) {
      phantoms.push({
        type: 'phantom', pos: null, ohaeng: oh,
        relation: relationToDay(dayOh, oh), sipsung: sipsungGroup(dayOh, oh), base: 0.5,
      });
      break;
    }
  }
  units.push(...phantoms);

  // Step 3: 왕상휴수사 (phantom 제외, base 설정)
  for (const u of units) {
    if (u.type === 'phantom') continue;
    const coeff = WSXSS[wsxssStatus(monthJi, u.ohaeng)] ?? 0.5;
    u.base = u.posWeight * u.hsWeight * coeff;
  }

  // Step 4: 통근·투출
  const stemOhsAll = new Set();
  for (const pos of POSITIONS) {
    if (pillars[pos]) stemOhsAll.add(stemOh(pillars[pos].stemIdx));
  }
  const branchOhsByPos = {};
  for (const u of units) {
    if (u.type === 'branch') (branchOhsByPos[u.pos] = branchOhsByPos[u.pos] || new Set()).add(u.ohaeng);
  }
  for (const u of units) {
    if (u.type === 'branch' && stemOhsAll.has(u.ohaeng)) u.base *= 1.15;
    if (u.type === 'stem') {
      const rooted = POSITIONS.some((pos) => branchOhsByPos[pos]?.has(u.ohaeng));
      if (rooted) u.base *= 1.2;
    }
  }

  // Step 5: 인접 생극 수렴 (3회, phantom 제외, 동시 적용)
  for (let iter = 0; iter < 3; iter += 1) {
    const adj = new Map();
    for (const u of units) {
      if (u.type === 'phantom') continue;
      const up = posOrder[u.pos];
      let acc = 0;
      for (const v of units) {
        if (v === u || v.type === 'phantom') continue;
        const vp = posOrder[v.pos];
        if (Math.abs(up - vp) > 1) continue;
        if (OH_SANGSAENG[v.ohaeng] === u.ohaeng) acc += v.base * 0.05;
        else if (OH_SANGGEUK[v.ohaeng] === u.ohaeng) acc -= v.base * 0.03;
      }
      adj.set(u, acc);
    }
    for (const u of units) {
      const a = adj.get(u) || 0;
      if (a !== 0) u.base = Math.max(0, u.base + a);
    }
  }

  // Step 6: 음양 보정
  for (const u of units) {
    if (u.type === 'phantom') continue;
    if (u.relation === 'supportive' && u.sipsung === '비겁' && u.yinyang === dayYy) u.base *= 0.85;
  }

  // 집계
  let sup = 0, drain = 0;
  const sipsungScores = { 비겁: 0, 인성: 0, 식상: 0, 재성: 0, 관성: 0 };
  const ohScores = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const u of units) {
    if (u.relation === 'supportive') sup += u.base; else drain += u.base;
    sipsungScores[u.sipsung] += u.base;
    ohScores[u.ohaeng] += u.base;
  }
  const total = Math.round((sup - drain) * 1000) / 1000;
  let level = 'neutral';
  if (total >= 3.0) level = 'very_strong';
  else if (total >= 0.5) level = 'strong';
  else if (total <= -3.0) level = 'very_weak';
  else if (total <= -0.5) level = 'weak';

  const totalAbs = Object.values(ohScores).reduce((a, b) => a + Math.abs(b), 0) || 1;
  const ohRatios = {};
  for (const k of OH) ohRatios[k] = Math.round(Math.abs(ohScores[k]) / totalAbs * 1000) / 10;

  const deukStatus = wsxssStatus(monthJi, dayOh);
  return {
    dayOh, dayYy, level, total,
    supportive: Math.round(sup * 1000) / 1000,
    draining: Math.round(drain * 1000) / 1000,
    deukryeong: { status: deukStatus, seasonElement: MONTH_SEASON_ELEMENT[monthJi] || '' },
    ohRatios,
    sipsungScores: Object.fromEntries(Object.entries(sipsungScores).map(([k, v]) => [k, Math.round(v * 1000) / 1000])),
  };
}

/** 종합 용신 (억부 + 조후 + 부작용 + 신뢰도) */
export function analyzeYongsin(dayStemIdx, monthBranchIdx, pillars, simpleCounts) {
  const strength = analyzeStrength(dayStemIdx, monthBranchIdx, pillars);
  const johu = analyzeJohu(dayStemIdx, monthBranchIdx, simpleCounts);
  const dayOh = strength.dayOh;
  const level = strength.level;

  const bigeop = dayOh;
  const inseong = OH_SAENG_ME[dayOh];
  const siksang = OH_SANGSAENG[dayOh];
  const jaeseong = OH_SANGGEUK[dayOh];
  const gwanseong = OH_GEUK_ME[dayOh];

  let eokbu;
  if (level === 'strong' || level === 'very_strong') {
    eokbu = { yongsin: siksang, huisin: jaeseong, avoid: level === 'strong' ? [bigeop, inseong] : [bigeop, inseong] };
  } else if (level === 'weak') {
    eokbu = { yongsin: inseong, huisin: bigeop, avoid: [gwanseong, jaeseong, siksang] };
  } else if (level === 'very_weak') {
    eokbu = { yongsin: inseong, huisin: bigeop, avoid: [gwanseong, jaeseong] };
  } else {
    eokbu = { yongsin: '', huisin: '', avoid: [] };
  }

  const johuOh = johu?.yongsinOh || '';
  const isConsistent = !!(johuOh && eokbu.yongsin) && johuOh === eokbu.yongsin;

  let finalYongsin, finalHuisin, priority;
  if (level === 'neutral') {
    finalYongsin = johuOh || eokbu.yongsin;
    finalHuisin = '';
    if (johu?.needed) {
      for (const oh of johu.needed) if (oh !== finalYongsin) { finalHuisin = oh; break; }
    }
    priority = 'johu';
  } else if (isConsistent) {
    finalYongsin = eokbu.yongsin;
    finalHuisin = eokbu.huisin;
    priority = 'both';
  } else {
    finalYongsin = eokbu.yongsin;
    finalHuisin = eokbu.huisin;
    if (johuOh && !eokbu.avoid.includes(johuOh) && johuOh !== finalYongsin) finalHuisin = johuOh;
    priority = 'eokbu';
  }

  // 부작용 (용신이 생하는 오행 비중)
  let sideSeverity = 'none', sideTarget = null, sideRatio = 0;
  if (finalYongsin) {
    const gen = OH_SANGSAENG[finalYongsin];
    sideRatio = strength.ohRatios[gen] || 0;
    sideTarget = gen;
    if (sideRatio >= 40) sideSeverity = 'severe';
    else if (sideRatio >= 30) sideSeverity = 'moderate';
  }

  // 신뢰도
  let conf = 70;
  conf += isConsistent ? 15 : -5;
  if (sideSeverity === 'none') conf += 10;
  else if (sideSeverity === 'severe') conf -= 15;
  else conf -= 5;
  const maxRatio = Math.max(...Object.values(strength.ohRatios));
  if (maxRatio >= 50) conf -= 5;
  else if (maxRatio <= 30) conf += 5;
  if (level === 'very_strong' || level === 'very_weak') conf -= 5;
  conf = Math.max(10, Math.min(99, conf));

  // 과다 유형
  let excessGroup = '', excessRatio = 0;
  const entries = Object.entries(strength.sipsungScores);
  if (entries.length) {
    const maxEntry = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    if (maxRatio >= 35) { excessGroup = maxEntry[0]; excessRatio = maxRatio; }
  }

  const needed = [finalYongsin, finalHuisin].filter((x, i, arr) => x && arr.indexOf(x) === i);
  return {
    strength, johu,
    yongsin: finalYongsin, huisin: finalHuisin,
    yongsinGroup: finalYongsin ? sipsungGroup(dayOh, finalYongsin) : '',
    needed, avoid: eokbu.avoid, priority, isConsistent,
    confidence: conf,
    excessGroup, excessRatio,
    sideEffects: { severity: sideSeverity, target: sideTarget, ratio: sideRatio },
  };
}

/** 지장간 가중 오행 (0.3/0.5/1.0) — {목..수: number} */
export function weightedCounts(pillars) {
  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const w = [0.3, 0.5, 1.0];
  for (const pos of POSITIONS) {
    const p = pillars[pos];
    if (!p) continue;
    counts[stemOh(p.stemIdx)] += 1.0;
    JIJANGAN[p.branchIdx].stems.forEach((sIdx, i) => {
      if (sIdx !== null) counts[stemOh(sIdx)] += w[i];
    });
  }
  for (const k of OH) counts[k] = Math.round(counts[k] * 10) / 10;
  return counts;
}
