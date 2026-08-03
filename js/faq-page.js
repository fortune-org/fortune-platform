// FAQ 페이지: locale 배열에서 Q/A 렌더

import { initPage } from './page.js';
import { tRaw } from './i18n.js';
import { $, el } from './utils.js';

function render() {
  const items = tRaw('faq.items') || [];
  $('#faq-list').replaceChildren(...items.map((item, i) => el('details', { class: 'faq-item', ...(i === 0 ? { open: '' } : {}) }, [
    el('summary', { text: `Q. ${item.q}` }),
    el('p', { text: item.a }),
  ])));
}

initPage('Faq').then(({ onLangChange }) => {
  render();
  onLangChange(render);
});
