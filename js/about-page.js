// 소개 페이지: 기능/기술 목록을 locale 배열에서 렌더

import { initPage } from './page.js';
import { tRaw } from './i18n.js';
import { $, el } from './utils.js';

function render() {
  const features = tRaw('about.features') || [];
  $('#about-features').replaceChildren(...features.map((f) => el('li', { text: f })));
  const tech = tRaw('about.tech') || [];
  $('#about-tech').replaceChildren(...tech.map((f) => el('li', { text: f })));
}

initPage('About').then(({ onLangChange }) => {
  render();
  onLangChange(render);
});
