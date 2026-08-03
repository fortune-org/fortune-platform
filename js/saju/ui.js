// 사주 모드 UI: 입력 폼, 전체 만세력 렌더링(모비딕 수준), 인터랙티브 운세, 마크다운
// 표시 범위: 사주팔자 / 신강신약 / 오행 / 용신 / 조후 / 근묘화실 / 지장간 /
//           합충형파해 / 납음 / 신살 / 공망 / 대운(평생) / 세운 / 월운 / 일운 달력

import { computeSaju, seunOf, wolunOf, ilunOf } from './engine.js';
import {
  STEMS, BRANCHES, ELEMENTS, TERMS, TIMEZONES, HOUR_RANGES,
} from './constants.js';
import { OH } from './tables.js';
import { fromPrintedMin, toJdn } from './calendar.js';
import { $, el, pad2 } from '../utils.js';
import { t, getLang } from '../i18n.js';

let lastResult = null;
let calRef = null;
// 운세 선택 상태 (대운 → 세운 연도 → 월)
let sel = { daeunNo: null, year: null, month: null };

const elCls = (e) => `el-${ELEMENTS[e].key}`;
const elName = (e) => t(`element.${ELEMENTS[e].key}`);
const ohIdx = (ohChar) => OH.indexOf(ohChar);
const ohName = (ohChar) => (ohChar ? elName(ohIdx(ohChar)) : '-');
const ohShort = (ohChar) => (getLang() === 'ko' ? ohChar : ELEMENTS[ohIdx(ohChar)].en);

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
function pairShort(x) { return getLang() === 'ko' ? x.ko : x.en; }
function termLabel(termIdx) {
  const tm = TERMS[termIdx];
  return getLang() === 'ko' ? `${tm.ko}(${tm.hanja})` : `${tm.en} (${tm.hanja})`;
}
function fmtTermTime(kstMin) {
  const v = fromPrintedMin(kstMin);
  return `${v.y}-${pad2(v.m)}-${pad2(v.d)} ${pad2(v.hh)}:${pad2(v.mm)} KST`;
}
const sinsalName = (name) => t(`saju.sinsalNames.${name}`);

const PILLAR_KEYS = ['hour', 'day', 'month', 'year'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ── 폼 ─────────────────────────────────────────────────────

export function initSajuForm(cal, onResult) {
  calRef = cal;
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

  tzSelect.addEventListener('change', () => {
    const tz = TIMEZONES.find((z) => z.key === tzSelect.value);
    koreanAdjust.checked = !!tz?.koreanAdjust;
    manualDstWrap.hidden = !!tz?.auto;
  });
  manualDstWrap.hidden = true;

  const syncLeap = () => { leapWrap.hidden = !lunarRadio.checked; };
  for (const r of form.querySelectorAll('input[name="saju-cal"]')) {
    r.addEventListener('change', syncLeap);
  }
  syncLeap();

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
    const result = computeSaju(calRef, input);
    if (result.error) {
      showError(errBox, result.error);
      return;
    }
    result.displayName = ($('#saju-name')?.value || '').trim();
    lastResult = result;
    initSelection(result);
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

export function rerenderSaju() {
  if (lastResult) renderResult(lastResult);
}

export function getSajuMarkdown() {
  return lastResult ? buildMarkdown(lastResult) : '';
}

/** 기본 선택: 현재 나이의 대운, 올해, 이번 달 */
function initSelection(r) {
  const now = new Date();
  sel = { daeunNo: null, year: now.getFullYear(), month: now.getMonth() + 1 };
  if (r.daeun) {
    const age = r.age.man;
    const cur = r.daeun.list.find((d) => age >= d.age && age <= d.endAge) || r.daeun.list[0];
    sel.daeunNo = cur.no;
    const years = seunYearsOf(cur);
    if (!years.includes(sel.year)) sel.year = years[0];
  }
}

/** 대운의 세운 연도 목록 (전환년부터 10년) */
function seunYearsOf(daeunItem) {
  const start = daeunItem.transition?.y ?? (lastResult.input.solar.y + daeunItem.age);
  return Array.from({ length: 10 }, (_, i) => start + i);
}

function selectedDaeun(r) {
  return r.daeun?.list.find((d) => d.no === sel.daeunNo) || r.daeun?.list[0];
}

// ── 렌더링 ─────────────────────────────────────────────────

function renderResult(r) {
  const wrap = $('#saju-result');
  wrap.hidden = false;
  const box = $('#saju-result-body');
  box.innerHTML = '';

  box.append(headerSection(r));
  box.append(pillarsSection(r));
  box.append(strengthSection(r));
  box.append(elementsSection(r));
  box.append(yongsinSection(r));
  box.append(johuSection(r));
  box.append(geunmyoSection(r));
  box.append(jijanganSection(r));
  box.append(relationsSection(r));
  box.append(napeumSection(r));
  box.append(sinsalSection(r));
  box.append(gongmangSection(r));
  if (r.daeun) {
    box.append(daeunSection(r));
    box.append(seunSection(r));
    box.append(wolunSection(r));
    box.append(ilunSection(r));
    box.append(todaySection(r));
    box.append(flowSection(r));
  }

  const notes = [];
  if (!r.input.hasTime) notes.push(t('saju.result.timeUnknownNote'));
  if (r.input.dstApplied) notes.push(t('saju.result.dstNote'));
  if (r.input.dayShifted) notes.push(t('saju.result.dayShiftedNote'));
  else if (r.isNightRat) notes.push(t('saju.result.nightRatNote'));
  if (notes.length) {
    box.append(el('div', { class: 'result-notes' }, notes.map((n) => el('p', { text: `ℹ️ ${n}` }))));
  }
}

function section(title, body, extraCls = '') {
  return el('section', { class: `result-section ${extraCls}` }, [el('h3', { text: title }), body]);
}

function kv(key, valueText, valueNode) {
  return el('div', { class: 'kv' }, [
    el('dt', { text: key }),
    valueNode || el('dd', { text: valueText }),
  ]);
}

/** 命 헤더 */
function headerSection(r) {
  const s = r.input.solar;
  const title = r.displayName
    ? t('saju.result.headerTitle', { name: r.displayName })
    : t('saju.result.headerTitleAnon');
  const timeTxt = r.input.hasTime ? ` ${pad2(r.input.hour)}:${pad2(r.input.minute)}` : '';
  const genderTxt = r.input.gender === 'M' ? t('saju.form.genderM') : r.input.gender === 'F' ? t('saju.form.genderF') : null;
  const parts = [
    `${t('saju.result.solarDate')} ${s.y}-${pad2(s.m)}-${pad2(s.d)}`
    + (r.lunar ? ` (${t('saju.result.lunarDate')} ${r.lunar.ly}-${pad2(r.lunar.lm)}-${pad2(r.lunar.ld)}${r.lunar.leap ? ` ${t('saju.result.leap')}` : ''})` : '')
    + timeTxt,
    genderTxt,
    `${t(`animal.${r.zodiacAnimal}`)}${getLang() === 'ko' ? '띠' : ''}`,
    t('saju.result.manAge', { n: r.age.man }),
  ].filter(Boolean);

  const badges = [
    t(r.input.useYajasi ? 'saju.result.timeMethodYaja' : 'saju.result.timeMethodJeongja'),
  ];
  if (r.input.koreanAdjust) badges.push(t('saju.result.koreanTimeBadge'));
  if (r.input.dstApplied) badges.push(t('saju.result.dstBadge'));

  return el('div', { class: 'saju-header' }, [
    el('div', { class: 'saju-header-mark', 'aria-hidden': 'true', text: '命' }),
    el('div', {}, [
      el('h3', { class: 'saju-header-title', text: title }),
      el('p', { class: 'saju-header-meta', text: parts.join(' · ') }),
      el('div', { class: 'badge-row' }, badges.map((b) => el('span', { class: 'badge', text: b }))),
      ...(r.curTerm ? [el('p', { class: 'muted small', text: `${t('saju.result.curTerm')}: ${termLabel(r.curTerm.termIdx)} — ${fmtTermTime(r.curTerm.kstMin)} · ${t('saju.result.nextTerm')}: ${termLabel(r.nextTerm.termIdx)} — ${fmtTermTime(r.nextTerm.kstMin)}` })] : []),
    ]),
  ]);
}

/** 사주팔자 카드형 (시일월년) */
function pillarsSection(r) {
  const cols = PILLAR_KEYS.filter((k) => r.pillars[k]);
  const grid = el('div', { class: 'pillar-cards' }, cols.map((k) => {
    const p = r.pillars[k];
    const isDay = k === 'day';
    return el('article', { class: `pillar-card${isDay ? ' day-master' : ''}` }, [
      el('header', { class: 'pillar-card-head' }, [
        el('span', { text: t(`saju.result.pillar${cap(k)}`) }),
        ...(isDay ? [el('span', { class: 'badge accent', text: t('saju.result.dayMasterBadge') })] : []),
      ]),
      el('div', { class: `pillar-hanja ${elCls(p.stemElement)}`, text: STEMS[p.stemIdx].hanja }),
      el('div', { class: `pillar-hanja ${elCls(p.branchElement)}`, text: BRANCHES[p.branchIdx].hanja }),
      el('p', { class: 'pillar-ko', text: getLang() === 'ko' ? p.ko : `${STEMS[p.stemIdx].en}·${BRANCHES[p.branchIdx].en}` }),
      el('p', { class: 'pillar-sub', text: `${ohShort(OH[p.stemElement])}/${ohShort(OH[p.branchElement])}` }),
      el('p', { class: 'pillar-sub', text: `${p.sipseongStem ? pairShort(p.sipseongStem) : t('saju.result.dayMaster')} / ${pairShort(p.sipseongBranch)}` }),
      el('p', { class: 'pillar-sub muted', text: pairShort(p.unseong) }),
    ]);
  }));
  const extra = [];
  if (r.input.hasTime && r.hourBranchIdx !== null) {
    extra.push(el('p', { class: 'muted small', text: `${t('saju.result.hourRange')}: ${BRANCHES[r.hourBranchIdx].hanja} ${HOUR_RANGES[r.hourBranchIdx]}` }));
  }
  return section(t('saju.result.pillarsTitle'), el('div', {}, [grid, ...extra]));
}

/** 신강신약 */
function strengthSection(r) {
  const st = r.yongsin.strength;
  const dayP = r.pillars.day;
  const body = el('div', {}, [
    el('p', { class: 'strength-day' }, [
      el('span', { class: `el-chip ${elCls(dayP.stemElement)}`, text: `${STEMS[dayP.stemIdx].hanja}${getLang() === 'ko' ? STEMS[dayP.stemIdx].ko : ` ${STEMS[dayP.stemIdx].en}`} (${ohShort(OH[dayP.stemElement])}${dayP.stemYang ? '+' : '-'})` }),
    ]),
    el('dl', { class: 'kv-grid' }, [
      kv(t('saju.result.strengthVerdict'), t(`saju.strengthLevel.${st.level}`)),
      kv(t('saju.result.strengthScore'), String(st.total)),
      kv(t('saju.result.supportive'), String(st.supportive)),
      kv(t('saju.result.draining'), String(st.draining)),
    ]),
    el('p', { class: 'muted small', text: `${t('saju.result.deukryeong')}: ${t('saju.result.deukText', {
      ji: BRANCHES[r.pillars.month.branchIdx].hanja,
      el: ohName(st.deukryeong.seasonElement),
      day: ohName(st.dayOh),
      status: t(`saju.wsxss.${st.deukryeong.status}`),
    })}` }),
  ]);
  return section(t('saju.result.strengthTitle'), body);
}

/** 오행 분포 */
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
  const dominant = r.elementCount.indexOf(Math.max(...r.elementCount));
  const missing = ELEMENTS.map((_, i) => i).filter((i) => r.elementCount[i] === 0);
  const summary = el('p', { class: 'small' }, [
    `${t('saju.result.strong')}: `,
    el('strong', { text: elName(dominant) }),
    ` · ${t('saju.result.missing')}: `,
    missing.length ? el('strong', { text: missing.map((i) => elName(i)).join(', ') }) : t('common.none'),
  ]);
  return section(t('saju.result.elementsTitle'), el('div', { class: 'el-bars' }, [...bars, summary]));
}

const GROUP_LABELS = {
  비겁: 'Peers', 인성: 'Resource', 식상: 'Output', 재성: 'Wealth', 관성: 'Authority',
};
const pairGroupLabel = (g) => (getLang() === 'ko' ? g : (GROUP_LABELS[g] || g));

/** 용신 분석 */
function yongsinSection(r) {
  const y = r.yongsin;
  const chipBig = (label, ohChar) => el('div', { class: 'yongsin-chip' }, [
    el('span', { class: 'muted small', text: label }),
    ohChar
      ? el('strong', { class: `el-chip ${elCls(ohIdx(ohChar))}`, text: ohName(ohChar) })
      : el('strong', { text: '-' }),
  ]);
  const chips = el('div', { class: 'yongsin-chips' }, [
    chipBig(t('saju.result.yongsin'), y.yongsin),
    chipBig(t('saju.result.huisin'), y.huisin),
    el('div', { class: 'yongsin-chip' }, [
      el('span', { class: 'muted small', text: t('saju.result.confidence') }),
      el('strong', { text: `${y.confidence}%` }),
    ]),
  ]);
  const lines = [
    `${t('saju.result.neededOh')}: ${y.needed.map(ohName).join(' · ') || '-'}`,
    `${t('saju.result.avoidOh')}: ${y.avoid.map(ohName).join(' · ') || '-'}`,
  ];
  if (y.excessGroup) {
    lines.push(`${t('saju.result.excess')}: ${t('saju.result.excessFmt', { group: pairGroupLabel(y.excessGroup), ratio: y.excessRatio })}`);
  }
  return section(t('saju.result.yongsinTitle'), el('div', {}, [
    chips,
    ...lines.map((x) => el('p', { class: 'small', text: x })),
    el('p', { class: 'muted small', text: yongsinReason(r) }),
  ]));
}

function yongsinReason(r) {
  const y = r.yongsin;
  const st = y.strength;
  const parts = [];
  parts.push(t('saju.result.reasonBase', { day: ohName(st.dayOh), level: t(`saju.strengthLevel.${st.level}`), score: st.total }));
  if (y.excessGroup) parts.push(t('saju.result.reasonExcess', { group: pairGroupLabel(y.excessGroup), ratio: y.excessRatio }));
  const levelDesc = st.level === 'weak' || st.level === 'very_weak'
    ? t('saju.result.levelDescWeak')
    : st.level === 'neutral' ? t('saju.result.levelDescNeutral') : t('saju.result.levelDescStrong');
  if (y.yongsin) parts.push(t('saju.result.reasonYongsin', { yongsin: ohName(y.yongsin), group: pairGroupLabel(y.yongsinGroup), levelDesc }));
  if (!y.isConsistent && y.johu?.yongsinOh && y.johu.yongsinOh !== y.yongsin) {
    parts.push(t('saju.result.reasonJohuDiff', { johu: ohName(y.johu.yongsinOh), yongsin: ohName(y.yongsin) }));
  }
  parts.push(t('saju.result.reasonFinal', { yongsin: ohName(y.yongsin), conf: y.confidence }));
  return parts.join(' ');
}

/** 조후 */
function johuSection(r) {
  const j = r.yongsin.johu;
  if (!j) return el('span');
  const dl = el('dl', { class: 'kv-grid' }, [
    kv(t('saju.result.johuSeason'), j.season),
    kv(t('saju.result.johuTemp'), t(`saju.temp.${j.temp}`)),
    kv(t('saju.result.johuHumidity'), t(`saju.moisture.${j.moisture}`)),
    kv(t('saju.result.johuBalance'), t(`saju.johuBalanceText.${j.balance}`)),
  ]);
  const children = [dl];
  if (j.yongsinStemIdx !== null) {
    children.push(el('p', { class: 'small' }, [
      `${t('saju.result.johuYongsin')}: `,
      el('strong', { text: `${stemLabel(j.yongsinStemIdx)} — ${ohName(j.yongsinOh)}` }),
    ]));
  }
  return section(t('saju.result.johuTitle'), el('div', {}, children));
}

/** 근묘화실 */
function geunmyoSection(r) {
  const grid = el('div', { class: 'geunmyo-grid' }, PILLAR_KEYS.filter((k) => r.pillars[k]).map((k) => el('div', { class: 'geunmyo-item' }, [
    el('strong', { text: `${t(`saju.result.pillar${cap(k)}`)} · ${t(`saju.geunmyo.${k}.name`)}` }),
    el('p', { class: 'small', text: t(`saju.geunmyo.${k}.period`) }),
    el('p', { class: 'muted small', text: t(`saju.geunmyo.${k}.family`) }),
  ])));
  return section(t('saju.result.geunmyoTitle'), grid);
}

/** 지장간 표 */
function jijanganSection(r) {
  const cols = PILLAR_KEYS.filter((k) => r.pillars[k]);
  const table = el('table', { class: 'astro-table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: '' }),
      el('th', { text: t('saju.result.jjYeogi') }),
      el('th', { text: t('saju.result.jjJunggi') }),
      el('th', { text: t('saju.result.jjJeonggi') }),
    ])),
    el('tbody', {}, cols.map((k) => {
      const p = r.pillars[k];
      const jj = p.jijangan;
      const cell = (i) => (jj.stems[i] === null
        ? el('td', { class: 'muted', text: '—' })
        : el('td', { text: `${STEMS[jj.stems[i]].hanja} ${t('saju.result.jjDays', { n: jj.days[i] })}` }));
      return el('tr', {}, [
        el('th', { scope: 'row', text: `${t(`saju.result.pillar${cap(k)}`)} ${BRANCHES[p.branchIdx].hanja}` }),
        cell(0), cell(1), cell(2),
      ]);
    })),
  ]);
  return section(t('saju.result.jijanganTitle'), table);
}

/** 합충형파해 */
function relationsSection(r) {
  if (!r.relations.length) {
    return section(t('saju.result.relationsTitle'), el('p', { class: 'muted', text: t('saju.result.relNone') }));
  }
  const list = el('ul', { class: 'rel-list' }, r.relations.map((rel) => {
    const posTxt = rel.posPair ? ` ${rel.posPair.map((p) => t(`saju.posShort.${p}`)).join('-')}` : '';
    const ohTxt = rel.oh ? ` → ${ohName(rel.oh)}` : '';
    return el('li', {}, [
      el('span', { class: 'rel-type', text: t(`saju.relType.${rel.type}`) }),
      ` ${rel.name}${posTxt}${ohTxt}`,
    ]);
  }));
  return section(t('saju.result.relationsTitle'), list);
}

/** 납음오행 */
function napeumSection(r) {
  const cols = PILLAR_KEYS.filter((k) => r.pillars[k]);
  const grid = el('div', { class: 'geunmyo-grid' }, cols.map((k) => {
    const p = r.pillars[k];
    return el('div', { class: 'geunmyo-item' }, [
      el('strong', { text: t(`saju.result.pillar${cap(k)}`) }),
      el('p', { class: 'small', text: `${napeumLabel(p.napeum)} (${ohName(OH[p.napeum.element])})` }),
    ]);
  }));
  return section(t('saju.result.napeumTitle'), grid);
}

/** 신살 (기둥 종합 + 특수) */
function sinsalSection(r) {
  const chips = [];
  const seen = new Set();
  for (const k of PILLAR_KEYS.filter((x) => r.pillars[x])) {
    for (const name of r.pillars[k].sinsal) {
      if (seen.has(name)) continue;
      seen.add(name);
      chips.push(el('span', { class: 'badge', text: sinsalName(name) }));
    }
  }
  for (const name of r.specialSal) {
    chips.push(el('span', { class: 'badge accent', text: sinsalName(name) }));
  }
  const body = chips.length
    ? el('div', { class: 'badge-row wrap' }, chips)
    : el('p', { class: 'muted', text: t('saju.result.relNone') });
  return section(t('saju.result.sinsalTitle'), body);
}

/** 공망 */
function gongmangSection(r) {
  const rows = [];
  for (const [key, label] of [['day', t('saju.result.dayGm')], ['year', t('saju.result.yearGm')]]) {
    const g = r.gongmangInfo[key];
    if (!g) continue;
    rows.push(kv(label, `${g.branches.map((b) => branchLabel(b)).join(', ')} (${g.xun}旬)`));
  }
  return section(t('saju.result.gongmangTitle'), el('dl', { class: 'kv-grid' }, rows));
}

// ── 운세 (대운/세운/월운/일운) ──────────────────────────────

function daeunSection(r) {
  const d = r.daeun;
  const head = el('p', { class: 'muted small', text: `${t('saju.result.direction')}: ${t(d.forward ? 'saju.result.daeunForward' : 'saju.result.daeunBackward')} · ${t('saju.result.daeunStartLabel')}: ${d.startAge}${t('saju.result.age')} · ${t('saju.result.daeunExact', { n: d.exactYears })}` });
  const nowAge = r.age.man;
  const cards = el('div', { class: 'luck-list' }, d.list.map((item) => {
    const isSel = sel.daeunNo === item.no;
    const isCur = nowAge >= item.age && nowAge <= item.endAge;
    return el('button', {
      type: 'button',
      class: `luck-item${isSel ? ' selected' : ''}${isCur ? ' current' : ''}`,
      onclick: () => {
        sel.daeunNo = item.no;
        const years = seunYearsOf(item);
        if (!years.includes(sel.year)) sel.year = years[0];
        renderResult(r);
      },
    }, [
      el('span', { class: 'luck-ganji', text: item.hanja }),
      el('span', { class: 'luck-sub', text: getLang() === 'ko' ? item.ko : '' }),
      el('span', { class: 'luck-age', text: t('saju.result.ageRange', { a: item.age, b: item.endAge }) }),
      el('span', { class: 'luck-date muted small', text: `${item.transition.y}.${pad2(item.transition.m)}.${pad2(item.transition.d)}` }),
      el('span', { class: 'luck-tg', text: `${pairShort(item.tenGodStem)}/${pairShort(item.tenGodBranch)}` }),
      ...(isCur ? [el('span', { class: 'badge accent', text: t('saju.result.currentBadge') })] : []),
    ]);
  }));
  return section(t('saju.result.daeunTitle'), el('div', {}, [head, cards,
    el('p', { class: 'muted small', text: t('saju.result.selectHint') })]));
}

function seunSection(r) {
  const d = selectedDaeun(r);
  if (!d) return el('span');
  const years = seunYearsOf(d);
  const now = new Date();
  const cards = el('div', { class: 'luck-list' }, years.map((y) => {
    const se = seunOf(r, y);
    const isSel = sel.year === y;
    const isCur = now.getFullYear() === y;
    return el('button', {
      type: 'button',
      class: `luck-item${isSel ? ' selected' : ''}${isCur ? ' current' : ''}`,
      onclick: () => { sel.year = y; renderResult(r); },
    }, [
      el('span', { class: 'luck-age', text: t('saju.result.yearN', { y }) }),
      el('span', { class: 'luck-ganji', text: se.hanja }),
      el('span', { class: 'luck-sub', text: getLang() === 'ko' ? se.ko : '' }),
      el('span', { class: 'luck-tg', text: `${pairShort(se.tenGodStem)}/${pairShort(se.tenGodBranch)}` }),
      el('span', { class: 'luck-sub muted', text: `${pairShort(se.unseong)} · ${t(`animal.${se.animal}`)}` }),
      ...(se.sinsal.length ? [el('span', { class: 'luck-sinsal', text: se.sinsal.map(sinsalName).join(' ') })] : []),
      ...(isCur ? [el('span', { class: 'badge accent', text: t('saju.result.thisYearBadge') })] : []),
    ]);
  }));
  return section(`${t('saju.result.seunTitle')} — ${t('saju.result.seunOf', { ganji: d.hanja, a: d.age, b: d.endAge })}`, cards);
}

function wolunSection(r) {
  const now = new Date();
  const seYear = sel.year;
  const se = seunOf(r, seYear);
  const items = [];
  for (let m = 1; m <= 12; m += 1) {
    const wu = wolunOf(calRef, r, seYear, m);
    if (!wu) continue;
    const isSel = sel.month === m;
    const isCur = now.getFullYear() === seYear && now.getMonth() + 1 === m;
    items.push(el('button', {
      type: 'button',
      class: `luck-item${isSel ? ' selected' : ''}${isCur ? ' current' : ''}`,
      onclick: () => { sel.month = m; renderResult(r); },
    }, [
      el('span', { class: 'luck-age', text: t('saju.result.monthN', { n: m }) }),
      el('span', { class: 'luck-ganji', text: wu.hanja }),
      el('span', { class: 'luck-sub', text: getLang() === 'ko' ? wu.ko : '' }),
      el('span', { class: 'luck-tg', text: `${pairShort(wu.tenGodStem)}/${pairShort(wu.tenGodBranch)}` }),
      el('span', { class: 'luck-sub muted', text: pairShort(wu.unseong) }),
      ...(isCur ? [el('span', { class: 'badge accent', text: t('saju.result.thisMonthBadge') })] : []),
    ]));
  }
  return section(`${t('saju.result.wolunTitle')} — ${t('saju.result.wolunOf', { y: seYear, ganji: se.hanja })}`,
    el('div', { class: 'luck-list months' }, items));
}

function ilunSection(r) {
  const y = sel.year, m = sel.month;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const now = new Date();
  const grid = el('div', { class: 'ilun-grid' });
  for (let i = 0; i < 7; i += 1) {
    const full = t(`weekday.${i}`);
    grid.append(el('div', { class: 'ilun-wd', text: getLang() === 'ko' ? full[0] : full.slice(0, 3) }));
  }
  const firstWd = (toJdn(y, m, 1) + 1) % 7;
  for (let i = 0; i < firstWd; i += 1) grid.append(el('div', { class: 'ilun-cell empty' }));
  for (let d = 1; d <= dim; d += 1) {
    const il = ilunOf(calRef, r, y, m, d);
    if (!il) { grid.append(el('div', { class: 'ilun-cell empty' })); continue; }
    const isToday = now.getFullYear() === y && now.getMonth() + 1 === m && now.getDate() === d;
    grid.append(el('div', { class: `ilun-cell${isToday ? ' today' : ''}` }, [
      el('span', { class: 'ilun-day', text: String(d) }),
      el('span', { class: 'ilun-ganji', text: il.hanja }),
      el('span', { class: 'ilun-tg', text: `${pairShort(il.tenGodStem)}/${pairShort(il.tenGodBranch)}` }),
    ]));
  }
  return section(`${t('saju.result.ilunTitle')} — ${t('saju.result.ilunOf', { y, m })}`, grid);
}

/** 오늘/올해/이번달 요약 */
function todaySection(r) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const se = seunOf(r, y);
  const wu = wolunOf(calRef, r, y, m);
  const il = ilunOf(calRef, r, y, m, d);
  const mkCard = (title, item, extras = []) => el('div', { class: 'today-card' }, [
    el('strong', { class: 'small', text: title }),
    el('span', { class: 'luck-ganji', text: item.hanja }),
    el('span', { class: 'luck-sub', text: getLang() === 'ko' ? item.ko : '' }),
    el('p', { class: 'small', text: `${t('saju.result.tenGod')}: ${pairShort(item.tenGodStem)}/${pairShort(item.tenGodBranch)} · ${t('saju.result.unseongLabel')}: ${pairShort(item.unseong)}` }),
    ...(item.sinsal?.length ? [el('p', { class: 'luck-sinsal', text: item.sinsal.map(sinsalName).join(' ') })] : []),
    ...extras,
  ]);
  const cards = el('div', { class: 'today-grid' }, [
    mkCard(t('saju.result.thisYearCard', { y }), se,
      [el('p', { class: 'muted small', text: t('saju.result.animalYear', { animal: t(`animal.${se.animal}`) }) })]),
    ...(wu ? [mkCard(t('saju.result.thisMonthCard', { m }), wu)] : []),
    ...(il ? [mkCard(t('saju.result.todayCard', { m, d }), il, [
      el('p', { class: 'muted small', text: `${t('saju.result.napeumLabel')}: ${napeumLabel(il.napeum)} · ${t('saju.result.lunarShort', { m: il.lunar.lm, d: il.lunar.ld })}${il.lunar.leap ? ` (${t('saju.result.leap')})` : ''}` }),
    ])] : []),
  ]);
  return section(t('saju.result.todayBadge'), cards);
}

/** 대운 흐름 타임라인 */
function flowSection(r) {
  const d = r.daeun;
  const nowAge = r.age.man;
  const strip = el('div', { class: 'flow-strip' }, d.list.map((item) => {
    const isCur = nowAge >= item.age && nowAge <= item.endAge;
    const startY = item.transition.y;
    return el('div', { class: `flow-item${isCur ? ' current' : ''}` }, [
      ...(isCur ? [el('span', { class: 'badge accent', text: t('saju.result.currentNth', { n: nowAge - item.age + 1 }) })] : []),
      el('span', { class: 'small muted', text: t('saju.result.ageRange', { a: item.age, b: item.endAge }) }),
      el('span', { class: 'small muted', text: t('saju.result.yearsRange', { a: startY, b: startY + 9 }) }),
      el('span', { class: `flow-hanja ${elCls(STEMS[item.stemIdx].element)}`, text: item.hanja[0] }),
      el('span', { class: `flow-hanja ${elCls(BRANCHES[item.branchIdx].element)}`, text: item.hanja[1] }),
      el('span', { class: 'small', text: `${ohShort(OH[STEMS[item.stemIdx].element])} · ${ohShort(OH[BRANCHES[item.branchIdx].element])}` }),
    ]);
  }));
  return section(t('saju.result.flowTitle'), el('div', {}, [
    el('p', { class: 'muted small', text: t('saju.result.flowNote') }), strip,
  ]));
}

// ── 마크다운 (전체 정보: 대운 평생 + 세운/월운/일운 선택 범위) ──

function buildMarkdown(r) {
  const s = r.input.solar;
  const L = [];
  const title = r.displayName
    ? t('saju.result.headerTitle', { name: r.displayName })
    : t('md.sajuTitle');
  L.push(`# 命 ${title}`);
  L.push('');
  const timeTxt = r.input.hasTime ? ` ${pad2(r.input.hour)}:${pad2(r.input.minute)}` : '';
  const genderTxt = r.input.gender === 'M' ? t('saju.form.genderM') : r.input.gender === 'F' ? t('saju.form.genderF') : '';
  L.push(`${t('saju.result.solarDate')} ${s.y}-${pad2(s.m)}-${pad2(s.d)}${timeTxt}`
    + (r.lunar ? ` (${t('saju.result.lunarDate')} ${r.lunar.ly}-${pad2(r.lunar.lm)}-${pad2(r.lunar.ld)}${r.lunar.leap ? ` ${t('saju.result.leap')}` : ''})` : '')
    + (genderTxt ? ` · ${genderTxt}` : '')
    + ` · ${t(`animal.${r.zodiacAnimal}`)}${getLang() === 'ko' ? '띠' : ''} · ${t('saju.result.manAge', { n: r.age.man })}`);
  const badges = [t(r.input.useYajasi ? 'saju.result.timeMethodYaja' : 'saju.result.timeMethodJeongja')];
  if (r.input.koreanAdjust) badges.push(t('saju.result.koreanTimeBadge'));
  if (r.input.dstApplied) badges.push(t('saju.result.dstBadge'));
  L.push(`*${badges.join(' · ')}*`);
  if (r.curTerm) {
    L.push('');
    L.push(`- ${t('saju.result.curTerm')}: ${termLabel(r.curTerm.termIdx)} — ${fmtTermTime(r.curTerm.kstMin)}`);
    L.push(`- ${t('saju.result.nextTerm')}: ${termLabel(r.nextTerm.termIdx)} — ${fmtTermTime(r.nextTerm.kstMin)}`);
  }

  // 사주팔자
  L.push('');
  L.push(`## ${t('saju.result.pillarsTitle')}`);
  L.push('');
  const cols = PILLAR_KEYS.filter((k) => r.pillars[k]);
  const header = ['', ...cols.map((k) => t(`saju.result.pillar${cap(k)}`))];
  L.push(`| ${header.join(' | ')} |`);
  L.push(`|${header.map(() => '---').join('|')}|`);
  const rows = [
    [t('saju.result.rowGanji'), ...cols.map((k) => ganjiLabel(r.pillars[k]))],
    [t('saju.result.rowStem'), ...cols.map((k) => `${stemLabel(r.pillars[k].stemIdx)} ${ohName(OH[r.pillars[k].stemElement])}`)],
    [t('saju.result.rowBranch'), ...cols.map((k) => `${branchLabel(r.pillars[k].branchIdx)} ${ohName(OH[r.pillars[k].branchElement])}`)],
    [t('saju.result.rowSipseong'), ...cols.map((k) => `${r.pillars[k].sipseongStem ? pairShort(r.pillars[k].sipseongStem) : t('saju.result.dayMaster')} / ${pairShort(r.pillars[k].sipseongBranch)}`)],
    [t('saju.result.rowUnseong'), ...cols.map((k) => pairLabel(r.pillars[k].unseong))],
    [t('saju.result.rowNapeum'), ...cols.map((k) => napeumLabel(r.pillars[k].napeum))],
  ];
  for (const row of rows) L.push(`| ${row.join(' | ')} |`);

  // 신강신약
  const st = r.yongsin.strength;
  L.push('');
  L.push(`## ${t('saju.result.strengthTitle')}`);
  L.push('');
  L.push(`- ${t('saju.result.strengthVerdict')}: **${t(`saju.strengthLevel.${st.level}`)}** · ${t('saju.result.strengthScore')}: ${st.total}`);
  L.push(`- ${t('saju.result.supportive')} ${st.supportive} / ${t('saju.result.draining')} ${st.draining}`);
  L.push(`- ${t('saju.result.deukryeong')}: ${t('saju.result.deukText', {
    ji: BRANCHES[r.pillars.month.branchIdx].hanja,
    el: ohName(st.deukryeong.seasonElement),
    day: ohName(st.dayOh),
    status: t(`saju.wsxss.${st.deukryeong.status}`),
  })}`);

  // 오행
  L.push('');
  L.push(`## ${t('saju.result.elementsTitle')}`);
  L.push('');
  L.push(`| ${ELEMENTS.map((_, i) => elName(i)).join(' | ')} |`);
  L.push(`|${ELEMENTS.map(() => '---').join('|')}|`);
  L.push(`| ${r.elementCount.join(' | ')} |`);
  const dominant = r.elementCount.indexOf(Math.max(...r.elementCount));
  const missing = ELEMENTS.map((_, i) => i).filter((i) => r.elementCount[i] === 0);
  L.push('');
  L.push(`- ${t('saju.result.strong')}: **${elName(dominant)}** · ${t('saju.result.missing')}: ${missing.length ? missing.map((i) => `**${elName(i)}**`).join(' ') : t('common.none')}`);

  // 용신
  const yg = r.yongsin;
  L.push('');
  L.push(`## ${t('saju.result.yongsinTitle')}`);
  L.push('');
  L.push(`- ${t('saju.result.yongsin')}: **${ohName(yg.yongsin)}** · ${t('saju.result.huisin')}: **${ohName(yg.huisin)}** · ${t('saju.result.confidence')}: ${yg.confidence}%`);
  L.push(`- ${t('saju.result.neededOh')}: ${yg.needed.map(ohName).join(' · ') || '-'} · ${t('saju.result.avoidOh')}: ${yg.avoid.map(ohName).join(' · ') || '-'}`);
  if (yg.excessGroup) L.push(`- ${t('saju.result.excess')}: ${t('saju.result.excessFmt', { group: pairGroupLabel(yg.excessGroup), ratio: yg.excessRatio })}`);
  L.push('');
  L.push(`> ${yongsinReason(r)}`);

  // 조후
  const j = yg.johu;
  if (j) {
    L.push('');
    L.push(`## ${t('saju.result.johuTitle')}`);
    L.push('');
    L.push(`- ${t('saju.result.johuSeason')}: ${j.season} · ${t('saju.result.johuTemp')}: ${t(`saju.temp.${j.temp}`)} · ${t('saju.result.johuHumidity')}: ${t(`saju.moisture.${j.moisture}`)}`);
    L.push(`- ${t('saju.result.johuBalance')}: ${t(`saju.johuBalanceText.${j.balance}`)}`);
    if (j.yongsinStemIdx !== null) L.push(`- ${t('saju.result.johuYongsin')}: **${stemLabel(j.yongsinStemIdx)}** — ${ohName(j.yongsinOh)}`);
  }

  // 근묘화실
  L.push('');
  L.push(`## ${t('saju.result.geunmyoTitle')}`);
  L.push('');
  for (const k of cols) {
    L.push(`- ${t(`saju.result.pillar${cap(k)}`)} · **${t(`saju.geunmyo.${k}.name`)}** — ${t(`saju.geunmyo.${k}.period`)} · ${t(`saju.geunmyo.${k}.family`)}`);
  }

  // 지장간
  L.push('');
  L.push(`## ${t('saju.result.jijanganTitle')}`);
  L.push('');
  L.push(`| | ${t('saju.result.jjYeogi')} | ${t('saju.result.jjJunggi')} | ${t('saju.result.jjJeonggi')} |`);
  L.push('|---|---|---|---|');
  for (const k of cols) {
    const p = r.pillars[k];
    const cell = (i) => (p.jijangan.stems[i] === null ? '—' : `${STEMS[p.jijangan.stems[i]].hanja} ${t('saju.result.jjDays', { n: p.jijangan.days[i] })}`);
    L.push(`| ${t(`saju.result.pillar${cap(k)}`)} ${BRANCHES[p.branchIdx].hanja} | ${cell(0)} | ${cell(1)} | ${cell(2)} |`);
  }

  // 합충형파해
  L.push('');
  L.push(`## ${t('saju.result.relationsTitle')}`);
  L.push('');
  if (r.relations.length) {
    for (const rel of r.relations) {
      const posTxt = rel.posPair ? ` ${rel.posPair.map((p) => t(`saju.posShort.${p}`)).join('-')}` : '';
      const ohTxt = rel.oh ? ` → ${ohName(rel.oh)}` : '';
      L.push(`- ${t(`saju.relType.${rel.type}`)}: ${rel.name}${posTxt}${ohTxt}`);
    }
  } else L.push(`- ${t('saju.result.relNone')}`);

  // 납음
  L.push('');
  L.push(`## ${t('saju.result.napeumTitle')}`);
  L.push('');
  for (const k of cols) L.push(`- ${t(`saju.result.pillar${cap(k)}`)}: ${napeumLabel(r.pillars[k].napeum)} (${ohName(OH[r.pillars[k].napeum.element])})`);

  // 신살
  L.push('');
  L.push(`## ${t('saju.result.sinsalTitle')}`);
  L.push('');
  const allSinsal = new Set();
  for (const k of cols) for (const nm of r.pillars[k].sinsal) allSinsal.add(nm);
  for (const nm of r.specialSal) allSinsal.add(nm);
  L.push(allSinsal.size ? [...allSinsal].map(sinsalName).join(' · ') : t('saju.result.relNone'));

  // 공망
  L.push('');
  L.push(`## ${t('saju.result.gongmangTitle')}`);
  L.push('');
  for (const [key, label] of [['day', t('saju.result.dayGm')], ['year', t('saju.result.yearGm')]]) {
    const g = r.gongmangInfo[key];
    if (g) L.push(`- ${label}: ${g.branches.map((b) => branchLabel(b)).join(', ')} (${g.xun}旬)`);
  }

  // 대운 (평생 전체) → 세운(선택 대운) → 월운(선택 연도) → 일운(선택 월)
  if (r.daeun) {
    const d = r.daeun;
    L.push('');
    L.push(`## ${t('saju.result.daeunTitle')}`);
    L.push('');
    L.push(`${t('saju.result.direction')}: ${t(d.forward ? 'saju.result.daeunForward' : 'saju.result.daeunBackward')} · ${t('saju.result.daeunStartLabel')}: ${d.startAge}${t('saju.result.age')} · ${t('saju.result.daeunExact', { n: d.exactYears })}`);
    L.push('');
    L.push(`| ${t('form.year')} | ${t('saju.result.rowGanji')} | ${t('saju.result.tenGod')} | ${t('saju.result.unseongLabel')} | ${t('saju.result.napeumLabel')} | ${t('saju.result.daeunStartLabel')} |`);
    L.push('|---|---|---|---|---|---|');
    for (const item of d.list) {
      L.push(`| ${t('saju.result.ageRange', { a: item.age, b: item.endAge })} | ${ganjiLabel(item)} | ${pairShort(item.tenGodStem)}/${pairShort(item.tenGodBranch)} | ${pairShort(item.unseong)} | ${napeumLabel(item.napeum)} | ${item.transition.y}.${pad2(item.transition.m)}.${pad2(item.transition.d)} |`);
    }

    const sd = selectedDaeun(r);
    L.push('');
    L.push(`## ${t('saju.result.seunTitle')} — ${t('saju.result.seunOf', { ganji: sd.hanja, a: sd.age, b: sd.endAge })}`);
    L.push('');
    L.push(`| ${t('form.year')} | ${t('saju.result.rowGanji')} | ${t('saju.result.tenGod')} | ${t('saju.result.unseongLabel')} | ${t('saju.result.sinsalTitle')} |`);
    L.push('|---|---|---|---|---|');
    for (const y of seunYearsOf(sd)) {
      const se = seunOf(r, y);
      L.push(`| ${y} | ${ganjiLabel(se)} | ${pairShort(se.tenGodStem)}/${pairShort(se.tenGodBranch)} | ${pairShort(se.unseong)} | ${se.sinsal.map(sinsalName).join(' ') || '-'} |`);
    }

    const seSel = seunOf(r, sel.year);
    L.push('');
    L.push(`## ${t('saju.result.wolunTitle')} — ${t('saju.result.wolunOf', { y: sel.year, ganji: seSel.hanja })}`);
    L.push('');
    L.push(`| ${t('form.month')} | ${t('saju.result.rowGanji')} | ${t('saju.result.tenGod')} | ${t('saju.result.unseongLabel')} |`);
    L.push('|---|---|---|---|');
    for (let m = 1; m <= 12; m += 1) {
      const wu = wolunOf(calRef, r, sel.year, m);
      if (wu) L.push(`| ${m} | ${ganjiLabel(wu)} | ${pairShort(wu.tenGodStem)}/${pairShort(wu.tenGodBranch)} | ${pairShort(wu.unseong)} |`);
    }

    L.push('');
    L.push(`## ${t('saju.result.ilunTitle')} — ${t('saju.result.ilunOf', { y: sel.year, m: sel.month })}`);
    L.push('');
    L.push(`| ${t('form.day')} | ${t('saju.result.rowGanji')} | ${t('saju.result.tenGod')} | ${t('saju.result.unseongLabel')} |`);
    L.push('|---|---|---|---|');
    const dim = new Date(Date.UTC(sel.year, sel.month, 0)).getUTCDate();
    for (let dd = 1; dd <= dim; dd += 1) {
      const il = ilunOf(calRef, r, sel.year, sel.month, dd);
      if (il) L.push(`| ${dd} | ${ganjiLabel(il)} | ${pairShort(il.tenGodStem)}/${pairShort(il.tenGodBranch)} | ${pairShort(il.unseong)} |`);
    }

    const now = new Date();
    const ty = now.getFullYear(), tm = now.getMonth() + 1, td = now.getDate();
    const seNow = seunOf(r, ty);
    const wuNow = wolunOf(calRef, r, ty, tm);
    const ilNow = ilunOf(calRef, r, ty, tm, td);
    L.push('');
    L.push(`## ${t('saju.result.todayBadge')} (${ty}-${pad2(tm)}-${pad2(td)})`);
    L.push('');
    L.push(`- ${t('saju.result.thisYearCard', { y: ty })}: ${ganjiLabel(seNow)} · ${pairShort(seNow.tenGodStem)}/${pairShort(seNow.tenGodBranch)} · ${pairShort(seNow.unseong)}${seNow.sinsal.length ? ` · ${seNow.sinsal.map(sinsalName).join(' ')}` : ''}`);
    if (wuNow) L.push(`- ${t('saju.result.thisMonthCard', { m: tm })}: ${ganjiLabel(wuNow)} · ${pairShort(wuNow.tenGodStem)}/${pairShort(wuNow.tenGodBranch)} · ${pairShort(wuNow.unseong)}`);
    if (ilNow) L.push(`- ${t('saju.result.todayCard', { m: tm, d: td })}: ${ganjiLabel(ilNow)} · ${pairShort(ilNow.tenGodStem)}/${pairShort(ilNow.tenGodBranch)} · ${pairShort(ilNow.unseong)} · ${napeumLabel(ilNow.napeum)} · ${t('saju.result.lunarShort', { m: ilNow.lunar.lm, d: ilNow.lunar.ld })}`);
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
  L.push('---');
  L.push(`*${t('md.generatedBy')} — https://fortune-org.github.io/fortune-platform/*`);
  return L.join('\n');
}
