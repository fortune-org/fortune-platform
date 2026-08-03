// 가이드 페이지: 용어 표(천간/지지/절기)를 상수에서 동적 렌더

import { initPage } from './page.js';
import { STEMS, BRANCHES, TERMS, ELEMENTS } from './saju/constants.js';
import { t, getLang } from './i18n.js';
import { $, el } from './utils.js';

function render() {
  const ko = getLang() === 'ko';
  const elName = (e) => t(`element.${ELEMENTS[e].key}`);

  // 천간 표
  const stemsTable = el('table', {}, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('guide.colName') }), el('th', { text: t('guide.colHanja') }),
      el('th', { text: t('guide.colElement') }), el('th', { text: t('guide.colYinyang') }),
    ])),
    el('tbody', {}, STEMS.map((s) => el('tr', {}, [
      el('td', { text: ko ? s.ko : s.en }), el('td', { text: s.hanja }),
      el('td', { text: elName(s.element) }),
      el('td', { text: t(s.yang ? 'yinyang.yang' : 'yinyang.um') }),
    ]))),
  ]);
  $('#guide-stems').replaceChildren(stemsTable);

  // 지지 표
  const branchesTable = el('table', {}, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('guide.colName') }), el('th', { text: t('guide.colHanja') }),
      el('th', { text: t('guide.colAnimal') }), el('th', { text: t('guide.colElement') }),
      el('th', { text: t('guide.colYinyang') }),
    ])),
    el('tbody', {}, BRANCHES.map((b) => el('tr', {}, [
      el('td', { text: ko ? b.ko : b.en }), el('td', { text: b.hanja }),
      el('td', { text: t(`animal.${b.animal}`) }), el('td', { text: elName(b.element) }),
      el('td', { text: t(b.yang ? 'yinyang.yang' : 'yinyang.um') }),
    ]))),
  ]);
  $('#guide-branches').replaceChildren(branchesTable);

  // 절기 표
  const termsTable = el('table', {}, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('guide.colName') }), el('th', { text: t('guide.colHanja') }),
      el('th', { text: t('guide.colType') }),
    ])),
    el('tbody', {}, TERMS.map((tm, i) => el('tr', {}, [
      el('td', { text: ko ? tm.ko : tm.en }), el('td', { text: tm.hanja }),
      el('td', { text: t(i % 2 === 0 ? 'guide.jeol' : 'guide.junggi') }),
    ]))),
  ]);
  $('#guide-terms').replaceChildren(termsTable);
}

initPage('Guide').then(({ onLangChange }) => {
  render();
  onLangChange(render);
});
