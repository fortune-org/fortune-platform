// 서양 점성술용 저정밀 천체력 (순수 JS, 외부 데이터 불필요)
//
// 알고리즘: Paul Schlyter, "Computing planetary positions" (공개 수학 공식 구현)
//   - 태양/달/수성~해왕성: 궤도 요소 + 주요 섭동항
//   - 명왕성: 1900–2100 유효 근사 다항식
// 정밀도(황경): 태양 ≲0.01°, 달 ≲0.1°, 행성 ≲0.1~0.5° 수준 (test/astro-vectors.json 으로 검증)
// 별자리(30° 단위) 판정에는 충분하며, 경계(±0.5°) 부근 출생은 주의 문구를 표시한다.

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const rev = (x) => ((x % 360) + 360) % 360;
const sind = (x) => Math.sin(x * D2R);
const cosd = (x) => Math.cos(x * D2R);
const atan2d = (y, x) => rev(Math.atan2(y, x) * R2D);

/** UTC → Schlyter 기준 일수 d (2000-01-00.0 부터의 일수) */
export function dayNumber(y, m, d, hh = 0, mi = 0) {
  const D = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
    + Math.floor(275 * m / 9) + d - 730530;
  return D + hh / 24 + mi / 1440;
}

/** 황도 경사 */
function obliquity(d) {
  return 23.4393 - 3.563e-7 * d;
}

/** 케플러 방정식 풀이 → 진근점이각/동경 반환 도우미 */
function eccentricAnomaly(M, e) {
  let E = M + e * R2D * sind(M) * (1 + e * cosd(M));
  for (let i = 0; i < 12; i += 1) {
    const dE = (E - e * R2D * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

/** 궤도 요소로 궤도면 좌표 → 황도 직교 좌표 (일심) */
function heliocentric(el) {
  const { N, i, w, a, e, M } = el;
  const E = eccentricAnomaly(M, e);
  const xv = a * (cosd(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sind(E));
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
  const yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
  const zh = r * (sind(v + w) * sind(i));
  return { x: xh, y: yh, z: zh, r, lon: atan2d(yh, xh), lat: Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * R2D, v };
}

/** 태양 지심 황경 + 지구-태양 직교 좌표 */
export function sunPosition(d) {
  const w = rev(282.9404 + 4.70935e-5 * d);
  const e = 0.016709 - 1.151e-9 * d;
  const M = rev(356.0470 + 0.9856002585 * d);
  const E = M + e * R2D * sind(M) * (1 + e * cosd(M));
  const xv = cosd(E) - e;
  const yv = Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = rev(v + w);
  return { lon, r, x: r * cosd(lon), y: r * sind(lon) };
}

/** 달 지심 황경/황위 (주요 섭동항 포함) */
export function moonPosition(d) {
  const N = rev(125.1228 - 0.0529538083 * d);
  const i = 5.1454;
  const w = rev(318.0634 + 0.1643573223 * d);
  const a = 60.2666;
  const e = 0.054900;
  const M = rev(115.3654 + 13.0649929509 * d);
  const p = heliocentric({ N, i, w, a, e, M });

  // 섭동 인자
  const Ms = rev(356.0470 + 0.9856002585 * d);            // 태양 평균근점이각
  const ws = rev(282.9404 + 4.70935e-5 * d);
  const Ls = rev(Ms + ws);                                 // 태양 평균황경
  const Lm = rev(N + w + M);                               // 달 평균황경
  const D = rev(Lm - Ls);                                  // 평균 이각
  const F = rev(Lm - N);                                   // 승교점 이각

  let lon = p.lon
    - 1.274 * sind(M - 2 * D)      // Evection
    + 0.658 * sind(2 * D)          // Variation
    - 0.186 * sind(Ms)             // Yearly equation
    - 0.059 * sind(2 * M - 2 * D)
    - 0.057 * sind(M - 2 * D + Ms)
    + 0.053 * sind(M + 2 * D)
    + 0.046 * sind(2 * D - Ms)
    + 0.041 * sind(M - Ms)
    - 0.035 * sind(D)              // Parallactic equation
    - 0.031 * sind(M + Ms)
    - 0.015 * sind(2 * F - 2 * D)
    + 0.011 * sind(M - 4 * D);
  let lat = p.lat
    - 0.173 * sind(F - 2 * D)
    - 0.055 * sind(M - F - 2 * D)
    - 0.046 * sind(M + F - 2 * D)
    + 0.033 * sind(F + 2 * D)
    + 0.017 * sind(2 * M + F);
  return { lon: rev(lon), lat };
}

/** 행성 궤도 요소 */
const PLANET_ELEMENTS = {
  mercury: (d) => ({
    N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.00e-8 * d, w: 29.1241 + 1.01444e-5 * d,
    a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: rev(168.6562 + 4.0923344368 * d),
  }),
  venus: (d) => ({
    N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.8910 + 1.38374e-5 * d,
    a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: rev(48.0052 + 1.6021302244 * d),
  }),
  mars: (d) => ({
    N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d,
    a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: rev(18.6021 + 0.5240207766 * d),
  }),
  jupiter: (d) => ({
    N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d,
    a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: rev(19.8950 + 0.0830853001 * d),
  }),
  saturn: (d) => ({
    N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d,
    a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: rev(316.9670 + 0.0334442282 * d),
  }),
  uranus: (d) => ({
    N: 74.0005 + 1.3978e-5 * d, i: 0.7733 + 1.9e-8 * d, w: 96.6612 + 3.0565e-5 * d,
    a: 19.18171 - 1.55e-8 * d, e: 0.047318 + 7.45e-9 * d, M: rev(142.5905 + 0.011725806 * d),
  }),
  neptune: (d) => ({
    N: 131.7806 + 3.0173e-5 * d, i: 1.7700 - 2.55e-7 * d, w: 272.8461 - 6.027e-6 * d,
    a: 30.05826 + 3.313e-8 * d, e: 0.008606 + 2.15e-9 * d, M: rev(260.2471 + 0.005995147 * d),
  }),
};

/** 목성/토성/천왕성 주요 상호 섭동 (황경 보정, 도) */
function outerPerturbations(d, key, lon) {
  const Mj = rev(19.8950 + 0.0830853001 * d);
  const Msa = rev(316.9670 + 0.0334442282 * d);
  const Mu = rev(142.5905 + 0.011725806 * d);
  let dlon = 0;
  if (key === 'jupiter') {
    dlon = -0.332 * sind(2 * Mj - 5 * Msa - 67.6)
      - 0.056 * sind(2 * Mj - 2 * Msa + 21)
      + 0.042 * sind(3 * Mj - 5 * Msa + 21)
      - 0.036 * sind(Mj - 2 * Msa)
      + 0.022 * cosd(Mj - Msa)
      + 0.023 * sind(2 * Mj - 3 * Msa + 52)
      - 0.016 * sind(Mj - 5 * Msa - 69);
  } else if (key === 'saturn') {
    dlon = 0.812 * sind(2 * Mj - 5 * Msa - 67.6)
      - 0.229 * cosd(2 * Mj - 4 * Msa - 2)
      + 0.119 * sind(Mj - 2 * Msa - 3)
      + 0.046 * sind(2 * Mj - 6 * Msa - 69)
      + 0.014 * sind(Mj - 3 * Msa + 32);
  } else if (key === 'uranus') {
    dlon = 0.040 * sind(Msa - 2 * Mu + 6)
      + 0.035 * sind(Msa - 3 * Mu + 33)
      - 0.015 * sind(Mj - Mu + 20);
  }
  return rev(lon + dlon);
}

/** 명왕성 근사 (Schlyter, 1900–2100 유효) — 일심 좌표 */
function plutoHeliocentric(d) {
  const S = 50.03 + 0.033459652 * d;
  const P = 238.95 + 0.003968789 * d;
  const lonecl = 238.9508 + 0.00400703 * d
    - 19.799 * sind(P) + 19.848 * cosd(P)
    + 0.897 * sind(2 * P) - 4.956 * cosd(2 * P)
    + 0.610 * sind(3 * P) + 1.211 * cosd(3 * P)
    - 0.341 * sind(4 * P) - 0.190 * cosd(4 * P)
    + 0.128 * sind(5 * P) - 0.034 * cosd(5 * P)
    - 0.038 * sind(6 * P) + 0.031 * cosd(6 * P)
    + 0.020 * sind(S - P) - 0.010 * cosd(S - P);
  const latecl = -3.9082
    - 5.453 * sind(P) - 14.975 * cosd(P)
    + 3.527 * sind(2 * P) + 1.673 * cosd(2 * P)
    - 1.051 * sind(3 * P) + 0.328 * cosd(3 * P)
    + 0.179 * sind(4 * P) - 0.292 * cosd(4 * P)
    + 0.019 * sind(5 * P) + 0.100 * cosd(5 * P)
    - 0.031 * sind(6 * P) - 0.026 * cosd(6 * P)
    + 0.011 * cosd(S - P);
  const r = 40.72
    + 6.68 * sind(P) + 6.90 * cosd(P)
    - 1.18 * sind(2 * P) - 0.03 * cosd(2 * P)
    + 0.15 * sind(3 * P) - 0.14 * cosd(3 * P);
  return {
    x: r * cosd(lonecl) * cosd(latecl),
    y: r * sind(lonecl) * cosd(latecl),
    z: r * sind(latecl),
  };
}

/** 지심 황경 계산 (모든 천체) — {lon(도), lat(도)} */
export function geocentricLongitude(body, d) {
  if (body === 'sun') {
    const s = sunPosition(d);
    return { lon: s.lon, lat: 0 };
  }
  if (body === 'moon') {
    const m = moonPosition(d);
    return { lon: m.lon, lat: m.lat };
  }
  const s = sunPosition(d);
  let h;
  if (body === 'pluto') {
    h = plutoHeliocentric(d);
  } else {
    const el = PLANET_ELEMENTS[body](d);
    const p = heliocentric(el);
    let lon = p.lon;
    if (body === 'jupiter' || body === 'saturn' || body === 'uranus') {
      lon = outerPerturbations(d, body, lon);
    }
    const rxy = p.r * cosd(p.lat);
    h = { x: rxy * cosd(lon), y: rxy * sind(lon), z: p.r * sind(p.lat) };
  }
  const gx = h.x + s.x;
  const gy = h.y + s.y;
  const gz = h.z;
  return { lon: atan2d(gy, gx), lat: Math.atan2(gz, Math.sqrt(gx * gx + gy * gy)) * R2D };
}

/** 그리니치 평균 항성시 (시간 단위) — IAU 1982 공식 */
export function gmst(d) {
  const du = d - 1.5;            // JD - 2451545.0
  const T = du / 36525;
  const theta = 280.46061837 + 360.98564736629 * du
    + 0.000387933 * T * T - (T * T * T) / 38710000;
  return rev(theta) / 15;
}

/** 상승점(ASC)·중천점(MC) 황경 계산
 *  @param d Schlyter 일수 (UTC)
 *  @param latDeg 위도 (북위 +)
 *  @param lonDeg 경도 (동경 +)
 */
export function ascendantMc(d, latDeg, lonDeg) {
  const lst = (gmst(d) + lonDeg / 15 + 24) % 24; // 지방 항성시 (h)
  const ramc = lst * 15;                          // RAMC (도)
  const eps = obliquity(d);
  // MC 황경
  const mc = atan2d(sind(ramc), cosd(ramc) * cosd(eps));
  // ASC 황경 (표준 공식)
  const asc = atan2d(
    cosd(ramc),
    -(sind(ramc) * cosd(eps) + Math.tan(latDeg * D2R) * sind(eps)),
  );
  return { asc: rev(asc), mc: rev(mc), lst };
}

/** 행성 목록 (표시 순서) */
export const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

/** 어스펙트 정의 */
export const ASPECTS = [
  { key: 'conjunction', angle: 0, orb: 8, glyph: '☌' },
  { key: 'sextile', angle: 60, orb: 4, glyph: '⚹' },
  { key: 'square', angle: 90, orb: 6, glyph: '□' },
  { key: 'trine', angle: 120, orb: 6, glyph: '△' },
  { key: 'opposition', angle: 180, orb: 8, glyph: '☍' },
];

/** 두 황경 사이 어스펙트 판정 */
export function findAspect(lon1, lon2) {
  let diff = Math.abs(rev(lon1) - rev(lon2));
  if (diff > 180) diff = 360 - diff;
  for (const a of ASPECTS) {
    const orb = Math.abs(diff - a.angle);
    if (orb <= a.orb) return { ...a, exact: diff, orbUsed: orb };
  }
  return null;
}
