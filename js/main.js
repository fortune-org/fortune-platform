// index.html 앱 진입점: 데이터 로드, 모드 탭, 3개 모드 초기화, 복사 버튼

import { initPage } from './page.js';
import { loadCalendarData } from './saju/calendar.js';
import { initSajuForm, rerenderSaju, getSajuMarkdown } from './saju/ui.js';
import { initTarotForm, rerenderTarot, getTarotMarkdown } from './tarot/ui.js';
import { initAstroForm, rerenderAstro, getAstroMarkdown } from './astro/ui.js';
import { $, bindCopyButton } from './utils.js';
import { t } from './i18n.js';

const MODES = ['saju', 'tarot', 'astro'];

async function main() {
  const { onLangChange } = await initPage('Index');

  // 모드 탭
  const activate = (mode) => {
    for (const m of MODES) {
      const panel = $(`#panel-${m}`);
      const tab = $(`#tab-${m}`);
      const on = m === mode;
      panel.hidden = !on;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', String(on));
    }
    try { localStorage.setItem('fortune-platform.mode', mode); } catch { /* 무시 */ }
  };
  for (const m of MODES) {
    $(`#tab-${m}`).addEventListener('click', () => activate(m));
  }
  let saved = 'saju';
  try { saved = localStorage.getItem('fortune-platform.mode') || 'saju'; } catch { /* 무시 */ }
  activate(MODES.includes(saved) ? saved : 'saju');

  // 타로/점성술은 데이터 불필요 — 즉시 초기화
  initTarotForm();
  initAstroForm();

  // 만세력 데이터 로드 (사주 모드)
  const loading = $('#saju-loading');
  try {
    const cal = await loadCalendarData('.');
    loading.hidden = true;
    $('#saju-form').hidden = false;
    initSajuForm(cal);
  } catch (err) {
    console.error(err);
    loading.textContent = t('common.errors.dataLoad');
    loading.classList.add('error-box');
  }

  // 복사 버튼 (모드별)
  const copyGetters = { saju: getSajuMarkdown, tarot: getTarotMarkdown, astro: getAstroMarkdown };
  for (const m of MODES) {
    const btn = $(`#copy-${m}`);
    if (!btn) continue;
    bindCopyButton(btn, copyGetters[m], () => ({
      idle: t('common.copyAll'), done: t('common.copied'), fail: t('common.copyFailed'),
    }));
  }

  // 언어 전환 시 동적 영역 재렌더 + 버튼 라벨 갱신
  onLangChange(() => {
    rerenderSaju();
    rerenderTarot();
    rerenderAstro();
    for (const m of MODES) {
      const btn = $(`#copy-${m}`);
      if (btn) btn.textContent = t('common.copyAll');
    }
  });
}

main().catch((err) => {
  console.error('init failed', err);
  const box = document.getElementById('app-error');
  if (box) { box.hidden = false; }
});
