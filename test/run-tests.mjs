// 회귀 테스트 러너 (Node 18+, 의존성 없음)
// 실행: node test/run-tests.mjs
//
// 1) 만세력 엔진 vs 기준 DB 벡터 (test/vectors.json)
// 2) 점성술 저정밀 엔진 vs skyfield/de421 벡터 (test/astro-vectors.json)
// 3) 타로 덱 무결성
// 4) 통합/경계 케이스

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CalendarData, toJdn } from '../js/saju/calendar.js';
import { computeSaju } from '../js/saju/engine.js';
import { buildDeck, drawCards, SPREADS } from '../js/tarot/deck.js';
import { dayNumber, geocentricLongitude, gmst, BODIES } from '../js/astro/ephemeris.js';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p) => JSON.parse(readFileSync(join(here, p), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

function check(cond, label) {
  if (cond) { passed += 1; } else {
    failed += 1;
    if (failures.length < 25) failures.push(label);
  }
}

// ── 데이터 로드 ────────────────────────────────────────────
const cal = new CalendarData(
  readJson('../data/lunar-table.json'),
  readJson('../data/solar-terms.json'),
);
const vectors = readJson('./vectors.json');

const BASE_OPTS = {
  timezone: 'korea', koreanAdjust: false, useYajasi: false, applyDst: false,
};

// ── 1a. 일주 벡터 ─────────────────────────────────────────
for (const [y, m, d, expect] of vectors.days) {
  const r = computeSaju(cal, { ...BASE_OPTS, year: y, month: m, day: d, hour: 12, minute: 0 });
  check(!r.error && r.pillars.day.idx === expect, `day ${y}-${m}-${d}: ${r.pillars?.day?.idx} != ${expect}`);
}

// ── 1b. 년주/월주 벡터 (그날 23:59) ───────────────────────
for (const [y, m, d, ey, em] of vectors.ym) {
  const r = computeSaju(cal, { ...BASE_OPTS, year: y, month: m, day: d, hour: 23, minute: 59, useYajasi: true });
  check(!r.error && r.pillars.year.idx === ey && r.pillars.month.idx === em,
    `ym ${y}-${m}-${d}: ${r.pillars?.year?.idx}/${r.pillars?.month?.idx} != ${ey}/${em}`);
}

// ── 1c. 절입일 00:00 은 이전 월/년 ────────────────────────
for (const [y, m, d, ey, em] of vectors.ymPre) {
  const r = computeSaju(cal, { ...BASE_OPTS, year: y, month: m, day: d, hour: 0, minute: 0 });
  check(!r.error && r.pillars.year.idx === ey && r.pillars.month.idx === em,
    `ymPre ${y}-${m}-${d}: ${r.pillars?.year?.idx}/${r.pillars?.month?.idx} != ${ey}/${em}`);
}

// ── 1d. 음력 변환 벡터 (양방향) ───────────────────────────
for (const [y, m, d, ly, lm, leap, ld] of vectors.lunar) {
  const got = cal.solarToLunar(toJdn(y, m, d));
  check(got && got.ly === ly && got.lm === lm && got.leap === !!leap && got.ld === ld,
    `s2l ${y}-${m}-${d}`);
  const back = cal.lunarToSolar(ly, lm, !!leap, ld);
  check(back === toJdn(y, m, d), `l2s ${ly}-${lm}${leap ? '(leap)' : ''}-${ld}`);
}

// ── 1e. 음력 입력 모드 통합 ───────────────────────────────
{
  const sample = vectors.lunar.find(([, , , , , leap]) => leap === 1);
  if (sample) {
    const [y, m, d, ly, lm, , ld] = sample;
    const r = computeSaju(cal, {
      ...BASE_OPTS, year: ly, month: lm, day: ld, isLunar: true, isLeapMonth: true, hour: 12,
    });
    check(!r.error && r.input.solar.y === y && r.input.solar.m === m && r.input.solar.d === d,
      `lunar-input ${ly}-${lm}-${ld}`);
  }
}

// ── 1f. 스펙 테스트 케이스: 1990-05-15 14:30 (한국, -30분 보정) ──
{
  const r = computeSaju(cal, {
    year: 1990, month: 5, day: 15, hour: 14, minute: 30,
    timezone: 'korea', koreanAdjust: true, gender: 'M',
  });
  check(r.pillars.year.hanja === '庚午', `spec year ${r.pillars.year.hanja}`);
  check(r.pillars.month.hanja === '辛巳', `spec month ${r.pillars.month.hanja}`);
  check(r.pillars.day.hanja === '庚辰', `spec day ${r.pillars.day.hanja}`);
  check(r.pillars.hour.hanja === '癸未', `spec hour ${r.pillars.hour.hanja}`);
  check(r.lunar.ly === 1990 && r.lunar.lm === 4 && r.lunar.ld === 21 && !r.lunar.leap,
    `spec lunar ${JSON.stringify(r.lunar)}`);
  check(r.zodiacAnimal === 'horse', `spec animal ${r.zodiacAnimal}`);
  check(r.daeun && r.daeun.forward === true && r.daeun.list.length === 10
    && r.daeun.startAge >= 1 && r.daeun.startAge <= 10, 'spec daeun');
  check(r.pillars.day.napeum.ko === '백랍금', `spec napeum ${r.pillars.day.napeum.ko}`);
  // 오행 분포 합 = 8 (년월일시 × 간지)
  check(r.elementCount.reduce((a, b) => a + b, 0) === 8, 'spec element sum');
}

// ── 1g. 경계/옵션 케이스 ─────────────────────────────────
{
  // 1900-01-03: 소한(1900-01-06) 이전 → 기해년(35) 병자월(12) 폴백
  const r = computeSaju(cal, { ...BASE_OPTS, year: 1900, month: 1, day: 3, hour: 12 });
  check(r.pillars.year.idx === 35 && r.pillars.month.idx === 12, `fallback ${r.pillars.year.idx}/${r.pillars.month.idx}`);
}
{
  // 정자시법: 23:30(-30분 보정 시 자시 시작) → 익일 일주 / 야자시법 → 당일 유지
  const base = computeSaju(cal, { ...BASE_OPTS, year: 1990, month: 5, day: 15, hour: 12 });
  const night = computeSaju(cal, {
    year: 1990, month: 5, day: 15, hour: 23, minute: 30,
    timezone: 'korea', koreanAdjust: true,
  });
  const yaja = computeSaju(cal, {
    year: 1990, month: 5, day: 15, hour: 23, minute: 30,
    timezone: 'korea', koreanAdjust: true, useYajasi: true,
  });
  check(night.pillars.day.idx === (base.pillars.day.idx + 1) % 60, 'night-rat next day');
  check(night.isNightRat && yaja.isNightRat, 'night-rat flags');
  check(yaja.pillars.day.idx === base.pillars.day.idx, 'yajasi keeps day');
  check(night.pillars.hour.branchIdx === 0 && yaja.pillars.hour.branchIdx === 0, 'night-rat hour = 子');
}
{
  // 한국 서머타임 자동 감지 (1987-06-15 12:00 → DST 기간)
  const r = computeSaju(cal, {
    year: 1987, month: 6, day: 15, hour: 12, minute: 0, timezone: 'korea', koreanAdjust: false,
  });
  check(r.input.dstApplied === true, 'korea DST auto');
  const r2 = computeSaju(cal, {
    year: 1987, month: 6, day: 15, hour: 12, minute: 0, timezone: 'korea', koreanAdjust: false, applyDst: false,
  });
  check(r2.input.dstApplied === false, 'korea DST off');
}
{
  // 시간대 변환: 뉴욕 1989-12-31 22:00 (UTC-5) = KST 1990-01-01 12:00
  const ny = computeSaju(cal, {
    year: 1989, month: 12, day: 31, hour: 22, minute: 0, timezone: 'newyork',
  });
  const kr = computeSaju(cal, { ...BASE_OPTS, year: 1990, month: 1, day: 1, hour: 12 });
  check(ny.pillars.year.idx === kr.pillars.year.idx && ny.pillars.month.idx === kr.pillars.month.idx,
    'timezone ym conversion');
  // 일주/시주는 현지 날짜/시각 기준
  check(ny.pillars.day.idx === (kr.pillars.day.idx + 59) % 60, 'timezone local day pillar');
}
{
  // 오류 처리
  check(computeSaju(cal, { ...BASE_OPTS, year: 2101, month: 1, day: 1 }).error === 'outOfRange', 'outOfRange');
  check(computeSaju(cal, { ...BASE_OPTS, year: 1990, month: 2, day: 30 }).error === 'invalidDate', 'invalidDate');
  check(computeSaju(cal, {
    ...BASE_OPTS, year: 1990, month: 3, day: 1, isLunar: true, isLeapMonth: true,
  }).error === 'invalidLunar', 'invalidLunar');
  // 시간 미입력 → 시주 없음
  const noTime = computeSaju(cal, { ...BASE_OPTS, year: 1990, month: 5, day: 15 });
  check(noTime.pillars.hour === null && !noTime.input.hasTime, 'no time = no hour pillar');
}

// ── 2. 점성술 벡터 ────────────────────────────────────────
const astro = readJson('./astro-vectors.json');
const TOL = {
  sun: 0.05, moon: 0.45, mercury: 0.35, venus: 0.25, mars: 0.35,
  jupiter: 0.6, saturn: 0.7, uranus: 0.6, neptune: 0.6, pluto: 1.2,
};
const maxErr = {};
for (const s of astro.samples) {
  const [y, m, d, hh, mi] = s.utc;
  const dn = dayNumber(y, m, d, hh, mi);
  for (const body of BODIES) {
    const got = geocentricLongitude(body, dn).lon;
    let diff = Math.abs(got - s.lon[body]);
    if (diff > 180) diff = 360 - diff;
    maxErr[body] = Math.max(maxErr[body] || 0, diff);
    check(diff <= TOL[body], `astro ${body} @${y}-${m}-${d}: err ${diff.toFixed(3)}°`);
  }
  const gh = gmst(dn);
  let gdiff = Math.abs(gh - s.gast);
  if (gdiff > 12) gdiff = 24 - gdiff;
  // 허용 72s: GMST vs GAST(분점차 ~1s) + 20세기 초 ΔT/UT1 차이. ASC 환산 ≤0.3°
  check(gdiff < 0.02, `gmst @${y}-${m}-${d}: err ${(gdiff * 3600).toFixed(1)}s`);
}

// ── 3. 타로 덱 ────────────────────────────────────────────
{
  const deck = buildDeck();
  check(deck.length === 78, `deck size ${deck.length}`);
  check(new Set(deck.map((c) => c.id)).size === 78, 'deck ids unique');
  check(deck.filter((c) => c.arcana === 'major').length === 22, 'major count');
  check(deck.every((c) => c.up.ko.length > 0 && c.up.en.length > 0
    && c.rev.ko.length > 0 && c.rev.en.length > 0), 'keywords present');
  for (const spread of SPREADS) {
    const drawn = drawCards(deck, spread.count, true);
    check(drawn.length === spread.count, `spread ${spread.key} count`);
    check(new Set(drawn.map((x) => x.card.id)).size === spread.count, `spread ${spread.key} no dupes`);
  }
  const upright = drawCards(deck, 10, false);
  check(upright.every((x) => !x.reversed), 'no reversed when disabled');
}

// ── 결과 ─────────────────────────────────────────────────
console.log(`\npassed: ${passed}, failed: ${failed}`);
console.log('astro max errors (deg):',
  Object.fromEntries(Object.entries(maxErr).map(([k, v]) => [k, +v.toFixed(3)])));
if (failed > 0) {
  console.error('\nfailures (first 25):');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('ALL TESTS PASSED');
