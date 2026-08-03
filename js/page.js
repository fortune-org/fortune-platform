// 모든 페이지 공통 부트스트랩: i18n, 언어 전환, 연락처 보호, 메타 타이틀

import { initI18n, setLang, getLang, onLangChange, t, applyAll } from './i18n.js';
import { $, $$, protectedEmail } from './utils.js';

/** 크롤링 방지용 이메일 조각 (HTML 소스에 완성 주소 미노출) */
const EMAIL_PARTS = ['vividsaebom', ['gmail', 'com'].join('.')];

export async function initPage(pageKey) {
  await initI18n('.');
  syncMeta(pageKey);

  // 언어 버튼
  for (const btn of $$('[data-lang-btn]')) {
    btn.addEventListener('click', async () => {
      await setLang(btn.getAttribute('data-lang-btn'), '.');
    });
  }
  const markActive = () => {
    for (const btn of $$('[data-lang-btn]')) {
      btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === getLang());
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === getLang()));
    }
  };
  markActive();
  onLangChange(() => { markActive(); syncMeta(pageKey); });

  // 연락처: 클릭 시에만 조립·표시
  const revealBtn = $('#contact-reveal');
  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      const addr = protectedEmail(EMAIL_PARTS);
      const link = document.createElement('a');
      link.href = `mailto:${addr}`;
      link.textContent = addr;
      link.rel = 'nofollow';
      revealBtn.replaceWith(link);
    }, { once: true });
  }

  // 현재 연도
  const yearSpan = $('#footer-year');
  if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

  return { t, applyAll, onLangChange, getLang };
}

function syncMeta(pageKey) {
  const title = t(`meta.title${pageKey}`);
  if (title && !title.startsWith('meta.')) document.title = title;
  if (pageKey === 'Index') {
    const desc = document.querySelector('meta[name="description"]');
    const text = t('meta.descIndex');
    if (desc && text && !text.startsWith('meta.')) desc.setAttribute('content', text);
  }
}
