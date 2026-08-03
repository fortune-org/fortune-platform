// 사주 모드 UI: 입력 폼 이벤트, 결과 렌더링, 마크다운 생성

import { computeSaju } from './engine.js';
import {
  STEMS, BRANCHES, ELEMENTS, TERMS, TIMEZONES, HOUR_RANGES,
} from './constants.js';
import { fromPrintedMin } from './calendar.js';
import { $, el, pad2 } from '../utils.js';
import { t, getLang } from '../i18n.js';

let lastResult = null;

/** 오행 뱃지 CSS 클래스 */
const elCls = (e) => `el-${ELEMENTS[e].key}`;

const elName = (e) => t(`element.${ELEMENTS[e].key}`);

function stemLabel(stemIdx) {
  const s = STEMS[stemIdx];
  return getLang() === 'ko' ? `${s.ko}(${s.hanja})` : `${s.hanja} ${s.en}`;
}

function branchLabel(branchIdx) {
  const b = BRANCHES[branchIdx];
  return getLang() === 'ko' ? `${b.ko}(${b.hanja})` : `${b.hanja} ${b.en}`;
}

function ganjiLabel(p) {
  return getLang() === 'ko' ? `${p.ko}(${p.hanja})` : p.hanja;
}

function napeumLabel(n) {
  return getLang() === 'ko' ? `${n.ko}(${n.hanja})` : `${n.en} (${n.hanja})`;
}

function pairLabel(x) {
  return getLang() === 'ko' ? `${x.ko}(${x.hanja})` : x.en;
}

function termLabel(termIdx) {
  const tm = TERMS[termIdx];
  return getLang() === 'ko' ? `${tm.ko}(${tm.hanja})` : `${tm.en} (${tm.hanja})`;
}

function fmtTermTime(kstMin) {
  const v = fromPrintedMin(kstMin);
  return `${v.y}-${pad2(v.m)}-${pad2(v.d)} ${pad2(v.hh)}:${pad2(v.mm)} KST`;
}

/** 폼 초기화 및 이벤트 연결 */
export function initSajuForm(cal, onResult) {
  const form = $('#saju-form');
  const tzSelect = $('#saju-tz');
  const yearIn = $('#saju-year');
  const monthIn = $('#saju-month');
  const dayIn = $('#saju-day');
  const hourIn = $('#saju-hour');
  const minIn = $('#saju-minute');
  const timeUnknown = $('#saju-time-unknown');
  const lunarRadio = $('#saju-cal-lunar');
  const leapWrap = $('#saju-leap-wrap');
  const koreanAdjust = $('#saju-korean-adjust');
  const manualDstWrap = $('#saju-manual-dst-wrap');
  const errBox = $('#saju-error');

  // 시간대 프리셋 → 기본 옵션 반영
  tzSelect.addEventListener('change', () => {
    const tz = TIMEZONES.find((z) => z.key === tzSelect.value);
    koreanAdjust.checked = !!tz?.koreanAdjust;
    manualDstWrap.hidden = !!tz?.auto;
  });
  manualDstWrap.hidden = true;

  // 음력 선택 시 윤달 체크박스 노출
  const syncLeap = () => { leapWrap.hidden = !lunarRadio.checked; };
  for (const r of form.querySelectorAll('input[name="saju-cal"]')) {
    r.addEventListener('change', syncLeap);
  }
  syncLeap();

  // 시간 모름 토글
  const syncTime = () => {
    hourIn.disabled = timeUnknown.checked;
    minIn.disabled = timeUnknown.checked;
  };
  timeUnknown.addEventListener('change', syncTime);
  syncTime();

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    errBox.hidden = true;
    const input = {
      year: parseInt(yearIn.value, 10),
      month: parseInt(monthIn.value, 10),
      day: parseInt(dayIn.value, 10),
      hour: timeUnknown.checked ? null : parseInt(hourIn.value || '0', 10),
      minute: timeUnknown.checked ? 0 : parseInt(minIn.value || '0', 10),
      isLunar: lunarRadio.checked,
      isLeapMonth: lunarRadio.checked && $('#saju-leap').checked,
      timezone: tzSelect.value,
      koreanAdjust: koreanAdjust.checked,
      useYajasi: $('#saju-yajasi').checked,
      manualDst: !manualDstWrap.hidden && $('#saju-manual-dst').checked,
      gender: $('#saju-gender').value || null,
    };
    if (!Number.isInteger(input.year) || !Number.isInteger(input.month) || !Number.isInteger(input.day)) {
      showError(errBox, 'needDate');
      return;
    }
    const result = computeSaju(cal, input);
    if (result.error) {
      showError(errBox, result.error);
      return;
    }
    lastResult = result;
    renderResult(result);
    onResult?.(result);
  });

  form.addEventListener('reset', () => {
    errBox.hidden = true;
    $('#saju-result').hidden = true;
    lastResult = null;
    setTimeout(() => { syncLeap(); syncTime(); }, 0);
  });
}

function showError(box, code) {
  box.textContent = t(`common.errors.${code}`);
  box.hidden = false;
}

/** 결과 다시 그리기 (언어 전환 시) */
export function rerenderSaju() {
  if (lastResult) renderResult(lastResult);
}

export function getSajuMarkdown() {
  return lastResult ? buildMarkdown(lastResult) : '';
}

// ── 렌더링 ─────────────────────────────────────────────────

function renderResult(r) {
  const wrap = $('#saju-result');
  wrap.hidden = false;
  const box = $('#saju-result-body');
  box.innerHTML = '';

  box.append(basicSection(r), pillarsSection(r), elementsSection(r));
  if (r.daeun) box.append(daeunSection(r));

  const notes = [];
  if (!r.input.hasTime) notes.push(t('saju.result.timeUnknownNote'));
  if (r.input.dstApplied) notes.push(t('saju.result.dstNote'));
  if (r.input.dayShifted) notes.push(t('saju.result.dayShiftedNote'));
  else if (r.isNightRat) notes.push(t('saju.result.nightRatNote'));
  if (notes.length) {
    box.append(el('div', { class: 'result-notes' }, notes.map((n) => el('p', { text: `ℹ️ ${n}` }))));
  }
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function kv(key, value, valueNode) {
  return el('div', { class: 'kv' }, [
    el('dt', { text: key }),
    valueNode || el('dd', { text: value }),
  ]);
}

function basicSection(r) {
  const s = r.input.solar;
  const lunarTxt = r.lunar
    ? `${r.lunar.ly}-${pad2(r.lunar.lm)}-${pad2(r.lunar.ld)}${r.lunar.leap ? ` (${t('saju.result.leap')})` : ''}`
    : '-';
  const timeTxt = r.input.hasTime ? ` ${pad2(r.input.hour)}:${pad2(r.input.minute)}` : '';
  const items = [
    kv(t('saju.result.solarDate'), `${s.y}-${pad2(s.m)}-${pad2(s.d)}${timeTxt} (${t(`weekday.${r.weekday}`)})`),
    kv(t('saju.result.lunarDate'), lunarTxt),
    kv(t('saju.result.zodiac'), `${t(`animal.${r.zodiacAnimal}`)} (${t('saju.result.sajuYear')} ${r.sajuYear})`),
  ];
  if (r.curTerm) {
    items.push(kv(t('saju.result.curTerm'), `${termLabel(r.curTerm.termIdx)} — ${fmtTermTime(r.curTerm.kstMin)}`));
  }
  if (r.nextTerm) {
    items.push(kv(t('saju.result.nextTerm'), `${termLabel(r.nextTerm.termIdx)} — ${fmtTermTime(r.nextTerm.kstMin)}`));
  }
  const mb = r.pillars.month.branchIdx;
  items.push(kv(
    t('saju.result.monthLord'),
    `${branchLabel(mb)} · ${t(`animal.${BRANCHES[mb].animal}`)} · ${elName(BRANCHES[mb].element)}`,
  ));
  return section(t('saju.result.basic'), el('dl', { class: 'kv-grid' }, items));
}

const PILLAR_KEYS = ['hour', 'day', 'month', 'year'];

function pillarsSection(r) {
  const cols = PILLAR_KEYS.filter((k) => r.pillars[k]);
  const table = el('table', { class: 'pillar-table', role: 'table' });

  const mkRow = (label, cells) => el('tr', {}, [el('th', { scope: 'row', text: label }), ...cells]);

  const thead = el('thead', {}, el('tr', {}, [
    el('th', { text: '' }),
    ...cols.map((k) => el('th', { scope: 'col', text: t(`saju.result.pillar${cap(k)}`) })),
  ]));

  const tbody = el('tbody', {}, [
    mkRow(t('saju.result.rowSipseong'), cols.map((k) => {
      const p = r.pillars[k];
      const label = k === 'day' ? t('saju.result.dayMaster') : (p.sipseongStem ? pairLabel(p.sipseongStem) : '-');
      return el('td', { text: label });
    })),
    mkRow(t('saju.result.rowStem'), cols.map((k) => {
      const p = r.pillars[k];
      return el('td', {}, el('div', { class: `ganji-cell ${elCls(p.stemElement)}` }, [
        el('span', { class: 'ganji-hanja', text: STEMS[p.stemIdx].hanja }),
        el('span', { class: 'ganji-sub', text: `${getLang() === 'ko' ? STEMS[p.stemIdx].ko : STEMS[p.stemIdx].en} · ${elName(p.stemElement)} · ${t(p.stemYang ? 'yinyang.yang' : 'yinyang.um')}` }),
      ]));
    })),
    mkRow(t('saju.result.rowBranch'), cols.map((k) => {
      const p = r.pillars[k];
      return el('td', {}, el('div', { class: `ganji-cell ${elCls(p.branchElement)}` }, [
        el('span', { class: 'ganji-hanja', text: BRANCHES[p.branchIdx].hanja }),
        el('span', { class: 'ganji-sub', text: `${getLang() === 'ko' ? BRANCHES[p.branchIdx].ko : BRANCHES[p.branchIdx].en} · ${elName(p.branchElement)} · ${t(`animal.${BRANCHES[p.branchIdx].animal}`)}` }),
      ]));
    })),
    mkRow(t('saju.result.rowJijangan'), cols.map((k) => {
      const p = r.pillars[k];
      const stems = p.jijangan.stems.filter((sIdx) => sIdx !== null);
      return el('td', { text: stems.map((sIdx) => STEMS[sIdx].hanja).join(' · ') });
    })),
    mkRow(t('saju.result.rowUnseong'), cols.map((k) => el('td', { text: pairLabel(r.pillars[k].unseong) }))),
    mkRow(t('saju.result.rowNapeum'), cols.map((k) => el('td', { text: napeumLabel(r.pillars[k].napeum) }))),
  ]);
  table.append(thead, tbody);

  const extra = el('p', { class: 'muted small' }, [
    `${t('saju.result.gongmang')}: ${r.gongmang.map((b) => branchLabel(b)).join(', ')}`,
  ]);
  if (r.input.hasTime && r.hourBranchIdx !== null) {
    extra.append(` · ${t('saju.result.hourRange')}: ${BRANCHES[r.hourBranchIdx].hanja} ${HOUR_RANGES[r.hourBranchIdx]}`);
  }
  return section(t('saju.result.pillarsTitle'), el('div', {}, [table, extra]));
}

function elementsSection(r) {
  const total = r.elementCount.reduce((a, b) => a + b, 0) || 1;
  const bars = ELEMENTS.map((e, i) => {
    const n = r.elementCount[i];
    return el('div', { class: 'el-bar-row' }, [
      el('span', { class: `el-chip ${elCls(i)}`, text: elName(i) }),
      el('div', { class: 'el-bar-track' },
        el('div', { class: `el-bar ${elCls(i)}`, style: `width:${(n / total) * 100}%` })),
      el('span', { class: 'el-count', text: String(n) }),
    ]);
  });
  return section(t('saju.result.elementsTitle'), el('div', { class: 'el-bars' }, bars));
}

function daeunSection(r) {
  const d = r.daeun;
  const dir = t(d.forward ? 'saju.result.daeunForward' : 'saju.result.daeunBackward');
  const head = el('p', { class: 'muted small', text: `${dir} · ${t('saju.result.daeunStart')} ${d.startAge}` });
  const cards = el('div', { class: 'daeun-list' }, d.list.map((item) => el('div', { class: 'daeun-item' }, [
    el('span', { class: 'daeun-age', text: `${item.age}${t('saju.result.age')}` }),
    el('span', { class: 'daeun-ganji', text: item.hanja }),
    el('span', { class: 'daeun-sub', text: getLang() === 'ko' ? item.ko : '' }),
  ])));
  return section(t('saju.result.daeunTitle'), el('div', {}, [head, cards]));
}

function section(title, body) {
  return el('section', { class: 'result-section' }, [el('h3', { text: title }), body]);
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ── 마크다운 ───────────────────────────────────────────────

function buildMarkdown(r) {
  const s = r.input.solar;
  const L = [];
  L.push(`## ${t('md.sajuTitle')}`);
  L.push('');
  L.push(`### ${t('saju.result.basic')}`);
  L.push('');
  const timeTxt = r.input.hasTime ? ` ${pad2(r.input.hour)}:${pad2(r.input.minute)}` : '';
  L.push(`- ${t('saju.result.solarDate')}: ${s.y}-${pad2(s.m)}-${pad2(s.d)}${timeTxt} (${t(`weekday.${r.weekday}`)})`);
  if (r.lunar) {
    L.push(`- ${t('saju.result.lunarDate')}: ${r.lunar.ly}-${pad2(r.lunar.lm)}-${pad2(r.lunar.ld)}${r.lunar.leap ? ` (${t('saju.result.leap')})` : ''}`);
  }
  L.push(`- ${t('saju.result.zodiac')}: ${t(`animal.${r.zodiacAnimal}`)} (${t('saju.result.sajuYear')} ${r.sajuYear})`);
  if (r.curTerm) L.push(`- ${t('saju.result.curTerm')}: ${termLabel(r.curTerm.termIdx)} — ${fmtTermTime(r.curTerm.kstMin)}`);
  if (r.nextTerm) L.push(`- ${t('saju.result.nextTerm')}: ${termLabel(r.nextTerm.termIdx)} — ${fmtTermTime(r.nextTerm.kstMin)}`);
  const mb = r.pillars.month.branchIdx;
  L.push(`- ${t('saju.result.monthLord')}: ${branchLabel(mb)} · ${t(`animal.${BRANCHES[mb].animal}`)} · ${elName(BRANCHES[mb].element)}`);
  L.push('');
  L.push(`### ${t('saju.result.pillarsTitle')}`);
  L.push('');
  const cols = PILLAR_KEYS.filter((k) => r.pillars[k]);
  const header = ['', ...cols.map((k) => t(`saju.result.pillar${cap(k)}`))];
  L.push(`| ${header.join(' | ')} |`);
  L.push(`|${header.map(() => '---').join('|')}|`);
  const rows = [
    [t('saju.result.rowSipseong'), ...cols.map((k) => (k === 'day' ? t('saju.result.dayMaster') : (r.pillars[k].sipseongStem ? pairLabel(r.pillars[k].sipseongStem) : '-')))],
    [t('saju.result.rowGanji'), ...cols.map((k) => ganjiLabel(r.pillars[k]))],
    [t('saju.result.rowStem'), ...cols.map((k) => `${stemLabel(r.pillars[k].stemIdx)} ${elName(r.pillars[k].stemElement)}`)],
    [t('saju.result.rowBranch'), ...cols.map((k) => `${branchLabel(r.pillars[k].branchIdx)} ${elName(r.pillars[k].branchElement)}`)],
    [t('saju.result.rowJijangan'), ...cols.map((k) => r.pillars[k].jijangan.stems.filter((x) => x !== null).map((x) => STEMS[x].hanja).join('·'))],
    [t('saju.result.rowUnseong'), ...cols.map((k) => pairLabel(r.pillars[k].unseong))],
    [t('saju.result.rowNapeum'), ...cols.map((k) => napeumLabel(r.pillars[k].napeum))],
  ];
  for (const row of rows) L.push(`| ${row.join(' | ')} |`);
  L.push('');
  L.push(`- ${t('saju.result.gongmang')}: ${r.gongmang.map((b) => branchLabel(b)).join(', ')}`);
  L.push('');
  L.push(`### ${t('saju.result.elementsTitle')}`);
  L.push('');
  L.push(`| ${ELEMENTS.map((_, i) => elName(i)).join(' | ')} |`);
  L.push(`|${ELEMENTS.map(() => '---').join('|')}|`);
  L.push(`| ${r.elementCount.join(' | ')} |`);
  if (r.daeun) {
    L.push('');
    L.push(`### ${t('saju.result.daeunTitle')}`);
    L.push('');
    L.push(`${t(r.daeun.forward ? 'saju.result.daeunForward' : 'saju.result.daeunBackward')} · ${t('saju.result.daeunStart')} ${r.daeun.startAge}`);
    L.push('');
    L.push(`| ${r.daeun.list.map((x) => `${x.age}${t('saju.result.age')}`).join(' | ')} |`);
    L.push(`|${r.daeun.list.map(() => '---').join('|')}|`);
    L.push(`| ${r.daeun.list.map((x) => x.hanja).join(' | ')} |`);
  }
  const notes = [];
  if (!r.input.hasTime) notes.push(t('saju.result.timeUnknownNote'));
  if (r.input.dstApplied) notes.push(t('saju.result.dstNote'));
  if (r.input.dayShifted) notes.push(t('saju.result.dayShiftedNote'));
  if (notes.length) {
    L.push('');
    for (const n of notes) L.push(`> ${n}`);
  }
  L.push('');
  L.push(`---`);
  L.push(`*${t('md.generatedBy')} — https://fortune-org.github.io/fortune-platform/*`);
  return L.join('\n');
}
