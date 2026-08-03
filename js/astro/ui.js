// 점성술 모드 UI: 출생 차트 계산, 결과 렌더, 마크다운

import {
  dayNumber, geocentricLongitude, ascendantMc, findAspect, BODIES,
} from './ephemeris.js';
import { $, el, pad2 } from '../utils.js';
import { t, getLang } from '../i18n.js';

const SIGN_KEYS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const PLANET_GLYPHS = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
};
const SIGN_ELEMENT = ['fire', 'earth', 'air', 'water'];
const SIGN_MODALITY = ['cardinal', 'fixed', 'mutable'];

/** 도시 프리셋: [위도, 경도, UTC 오프셋(분)] */
const CITIES = {
  seoul: [37.5665, 126.978, 540],
  tokyo: [35.6762, 139.6503, 540],
  beijing: [39.9042, 116.4074, 480],
  hongkong: [22.3193, 114.1694, 480],
  bangkok: [13.7563, 100.5018, 420],
  london: [51.5072, -0.1276, 0],
  newyork: [40.7128, -74.006, -300],
  losangeles: [34.0522, -118.2437, -480],
};

let lastChart = null;

const signIdx = (lon) => Math.floor((((lon % 360) + 360) % 360) / 30);
const signDeg = (lon) => (((lon % 360) + 360) % 360) % 30;

function signLabel(lon) {
  const i = signIdx(lon);
  return `${SIGN_GLYPHS[i]} ${t(`astro.sign.${SIGN_KEYS[i]}`)}`;
}

function degLabel(lon) {
  const d = signDeg(lon);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}°${pad2(min)}′`;
}

const nearBoundary = (lon) => {
  const d = signDeg(lon);
  return d < 0.5 || d > 29.5;
};

export function initAstroForm() {
  const form = $('#astro-form');
  const citySel = $('#astro-city');
  const manualWrap = $('#astro-manual-wrap');
  const timeUnknown = $('#astro-time-unknown');
  const hourIn = $('#astro-hour');
  const minIn = $('#astro-minute');
  const errBox = $('#astro-error');

  citySel.addEventListener('change', () => {
    manualWrap.hidden = citySel.value !== 'custom';
  });
  manualWrap.hidden = true;

  const syncTime = () => {
    hourIn.disabled = timeUnknown.checked;
    minIn.disabled = timeUnknown.checked;
  };
  timeUnknown.addEventListener('change', syncTime);
  syncTime();

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    errBox.hidden = true;

    const y = parseInt($('#astro-year').value, 10);
    const m = parseInt($('#astro-month').value, 10);
    const d = parseInt($('#astro-day').value, 10);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)
      || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      errBox.textContent = t('common.errors.invalidDate');
      errBox.hidden = false;
      return;
    }
    const hasTime = !timeUnknown.checked;
    const hh = hasTime ? parseInt(hourIn.value || '0', 10) : 12;
    const mi = hasTime ? parseInt(minIn.value || '0', 10) : 0;
    if (hasTime && (hh < 0 || hh > 23 || mi < 0 || mi > 59)) {
      errBox.textContent = t('common.errors.invalidTime');
      errBox.hidden = false;
      return;
    }

    let lat, lon, tzOffset;
    if (citySel.value === 'custom') {
      lat = parseFloat($('#astro-lat').value);
      lon = parseFloat($('#astro-lon').value);
      tzOffset = Math.round(parseFloat($('#astro-tzoff').value || '9') * 60);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        errBox.textContent = t('common.errors.needLocation');
        errBox.hidden = false;
        return;
      }
    } else {
      [lat, lon, tzOffset] = CITIES[citySel.value];
    }
    const dstOn = $('#astro-dst').checked;

    // 현지 시각 → UTC
    const utcMs = Date.UTC(y, m - 1, d, hh, mi) - (tzOffset + (dstOn ? 60 : 0)) * 60000;
    const u = new Date(utcMs);
    const dn = dayNumber(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), u.getUTCHours(), u.getUTCMinutes());

    const planets = BODIES.map((body) => {
      const pos = geocentricLongitude(body, dn);
      // 역행 판정: 1일 간격 황경 감소 여부 (태양/달 제외)
      let retro = false;
      if (body !== 'sun' && body !== 'moon') {
        const next = geocentricLongitude(body, dn + 1).lon;
        let diff = next - pos.lon;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        retro = diff < 0;
      }
      return { body, lon: pos.lon, retro };
    });

    let angles = null;
    if (hasTime) {
      angles = ascendantMc(dn, lat, lon);
    }

    // 이퀄 하우스: ASC 별자리 도수 기준 12등분
    let houses = null;
    if (angles) {
      houses = planets.map((p) => {
        const rel = (((p.lon - angles.asc) % 360) + 360) % 360;
        return Math.floor(rel / 30) + 1;
      });
    }

    // 어스펙트
    const aspects = [];
    for (let i = 0; i < planets.length; i += 1) {
      for (let j = i + 1; j < planets.length; j += 1) {
        const a = findAspect(planets[i].lon, planets[j].lon);
        if (a) aspects.push({ p1: planets[i].body, p2: planets[j].body, aspect: a });
      }
    }

    // 원소/양태 분포 (10행성)
    const elCount = { fire: 0, earth: 0, air: 0, water: 0 };
    const modCount = { cardinal: 0, fixed: 0, mutable: 0 };
    for (const p of planets) {
      const si = signIdx(p.lon);
      elCount[SIGN_ELEMENT[si % 4]] += 1;
      modCount[SIGN_MODALITY[si % 3]] += 1;
    }

    lastChart = {
      input: { y, m, d, hh, mi, hasTime, cityKey: citySel.value, lat, lon, tzOffset, dstOn },
      planets, angles, houses, aspects, elCount, modCount,
    };
    renderChart(lastChart);
  });
}

export function rerenderAstro() {
  if (lastChart) renderChart(lastChart);
}

export function getAstroMarkdown() {
  return lastChart ? buildMarkdown(lastChart) : '';
}

function renderChart(c) {
  const wrap = $('#astro-result');
  wrap.hidden = false;
  const box = $('#astro-result-body');
  box.innerHTML = '';

  // 행성 표
  const table = el('table', { class: 'astro-table' });
  table.append(el('thead', {}, el('tr', {}, [
    el('th', { text: t('astro.result.planet') }),
    el('th', { text: t('astro.result.sign') }),
    el('th', { text: t('astro.result.degree') }),
    ...(c.houses ? [el('th', { text: t('astro.result.house') })] : []),
  ])));
  const tbody = el('tbody');
  c.planets.forEach((p, i) => {
    tbody.append(el('tr', {}, [
      el('td', { text: `${PLANET_GLYPHS[p.body]} ${t(`astro.planet.${p.body}`)}${p.retro ? ` (${t('astro.retrograde')} ℞)` : ''}` }),
      el('td', { text: signLabel(p.lon) + (nearBoundary(p.lon) ? ` ${t('astro.boundaryWarn')}` : '') }),
      el('td', { text: degLabel(p.lon) }),
      ...(c.houses ? [el('td', { text: String(c.houses[i]) })] : []),
    ]));
  });
  table.append(tbody);
  box.append(section(t('astro.result.planets'), table));

  // ASC / MC
  if (c.angles) {
    const dl = el('dl', { class: 'kv-grid' }, [
      el('div', { class: 'kv' }, [el('dt', { text: t('astro.result.asc') }),
        el('dd', { text: `${signLabel(c.angles.asc)} ${degLabel(c.angles.asc)}` })]),
      el('div', { class: 'kv' }, [el('dt', { text: t('astro.result.mc') }),
        el('dd', { text: `${signLabel(c.angles.mc)} ${degLabel(c.angles.mc)}` })]),
    ]);
    const sec = section(t('astro.result.angles'), dl);
    sec.append(el('p', { class: 'muted small', text: t('astro.result.housesNote') }));
    box.append(sec);
  }

  // 어스펙트
  if (c.aspects.length) {
    const list = el('ul', { class: 'aspect-list' }, c.aspects.map((a) => el('li', {
      text: `${PLANET_GLYPHS[a.p1]} ${t(`astro.planet.${a.p1}`)} ${a.aspect.glyph} ${PLANET_GLYPHS[a.p2]} ${t(`astro.planet.${a.p2}`)} — ${t(`astro.aspect.${a.aspect.key}`)} (orb ${a.aspect.orbUsed.toFixed(1)}°)`,
    })));
    box.append(section(t('astro.result.aspectsTitle'), list));
  } else {
    box.append(section(t('astro.result.aspectsTitle'), el('p', { class: 'muted', text: t('astro.result.noAspects') })));
  }

  // 원소/양태
  const balance = el('div', { class: 'balance-grid' }, [
    el('div', {}, [
      el('h4', { text: t('astro.result.elements') }),
      ...Object.entries(c.elCount).map(([k, v]) => el('p', { text: `${t(`astro.el.${k}`)}: ${v}` })),
    ]),
    el('div', {}, [
      el('h4', { text: t('astro.result.modality') }),
      ...Object.entries(c.modCount).map(([k, v]) => el('p', { text: `${t(`astro.mod.${k}`)}: ${v}` })),
    ]),
  ]);
  box.append(section(t('astro.result.balanceTitle'), balance));

  box.append(el('p', { class: 'muted small', text: t('astro.disclaimer') }));
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function section(title, body) {
  return el('section', { class: 'result-section' }, [el('h3', { text: title }), body]);
}

function buildMarkdown(c) {
  const { y, m, d, hh, mi, hasTime, cityKey, lat, lon } = c.input;
  const L = [];
  L.push(`## ${t('md.astroTitle')}`);
  L.push('');
  const place = cityKey === 'custom'
    ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    : t(`astro.city.${cityKey}`);
  L.push(`- ${t('md.birth')}: ${y}-${pad2(m)}-${pad2(d)}${hasTime ? ` ${pad2(hh)}:${pad2(mi)}` : ''} · ${place}`);
  L.push('');
  L.push(`### ${t('astro.result.planets')}`);
  L.push('');
  const cols = [t('astro.result.planet'), t('astro.result.sign'), t('astro.result.degree')];
  if (c.houses) cols.push(t('astro.result.house'));
  L.push(`| ${cols.join(' | ')} |`);
  L.push(`|${cols.map(() => '---').join('|')}|`);
  c.planets.forEach((p, i) => {
    const row = [
      `${t(`astro.planet.${p.body}`)}${p.retro ? ' ℞' : ''}`,
      `${signLabel(p.lon)}`,
      degLabel(p.lon),
    ];
    if (c.houses) row.push(String(c.houses[i]));
    L.push(`| ${row.join(' | ')} |`);
  });
  if (c.angles) {
    L.push('');
    L.push(`### ${t('astro.result.angles')}`);
    L.push('');
    L.push(`- ${t('astro.result.asc')}: ${signLabel(c.angles.asc)} ${degLabel(c.angles.asc)}`);
    L.push(`- ${t('astro.result.mc')}: ${signLabel(c.angles.mc)} ${degLabel(c.angles.mc)}`);
    L.push(`- ${t('astro.result.housesNote')}`);
  }
  L.push('');
  L.push(`### ${t('astro.result.aspectsTitle')}`);
  L.push('');
  if (c.aspects.length) {
    for (const a of c.aspects) {
      L.push(`- ${t(`astro.planet.${a.p1}`)} ${a.aspect.glyph} ${t(`astro.planet.${a.p2}`)} — ${t(`astro.aspect.${a.aspect.key}`)} (orb ${a.aspect.orbUsed.toFixed(1)}°)`);
    }
  } else {
    L.push(`- ${t('astro.result.noAspects')}`);
  }
  L.push('');
  L.push(`### ${t('astro.result.balanceTitle')}`);
  L.push('');
  L.push(`- ${t('astro.result.elements')}: ${Object.entries(c.elCount).map(([k, v]) => `${t(`astro.el.${k}`)} ${v}`).join(' · ')}`);
  L.push(`- ${t('astro.result.modality')}: ${Object.entries(c.modCount).map(([k, v]) => `${t(`astro.mod.${k}`)} ${v}`).join(' · ')}`);
  L.push('');
  L.push(`> ${t('astro.disclaimer')}`);
  L.push('');
  L.push('---');
  L.push(`*${t('md.generatedBy')} — https://fortune-org.github.io/fortune-platform/*`);
  return L.join('\n');
}
