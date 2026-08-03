// 타로 모드 UI: 스프레드 선택, 카드 드로우, 결과 렌더, 마크다운

import { buildDeck, drawCards, SPREADS } from './deck.js';
import { $, el, pad2 } from '../utils.js';
import { t, getLang } from '../i18n.js';

const deck = buildDeck();
let lastDraw = null; // { spread, question, cards: [{card, reversed}] }

function cardName(card) {
  return getLang() === 'ko' ? `${card.nameKo} (${card.nameEn})` : card.nameEn;
}

function keywordsOf(card, reversed) {
  const set = reversed ? card.rev : card.up;
  return (getLang() === 'ko' ? set.ko : set.en).join(', ');
}

export function initTarotForm() {
  const form = $('#tarot-form');
  const spreadSel = $('#tarot-spread');

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const spread = SPREADS.find((s) => s.key === spreadSel.value) || SPREADS[0];
    const allowReversed = $('#tarot-reversed').checked;
    const question = $('#tarot-question').value.trim();
    lastDraw = {
      spread,
      question,
      when: new Date(),
      cards: drawCards(deck, spread.count, allowReversed),
    };
    renderTarot(lastDraw);
    $('#tarot-draw-btn').textContent = t('tarot.form.redraw');
  });
}

export function rerenderTarot() {
  if (lastDraw) renderTarot(lastDraw);
}

export function getTarotMarkdown() {
  return lastDraw ? buildMarkdown(lastDraw) : '';
}

function renderTarot(draw) {
  const wrap = $('#tarot-result');
  wrap.hidden = false;
  const box = $('#tarot-result-body');
  box.innerHTML = '';

  if (draw.question) {
    box.append(el('p', { class: 'tarot-question' }, [
      el('strong', { text: `${t('md.question')}: ` }), draw.question,
    ]));
  }

  const grid = el('div', { class: 'tarot-grid' });
  draw.cards.forEach(({ card, reversed }, i) => {
    const posKey = draw.spread.positions[i];
    grid.append(el('article', { class: `tarot-card${reversed ? ' reversed' : ''}` }, [
      el('header', { class: 'tarot-card-head' }, [
        el('span', { class: 'tarot-pos', text: `${i + 1}. ${t(`tarot.pos.${posKey}`)}` }),
        el('span', {
          class: `tarot-orient ${reversed ? 'rev' : 'up'}`,
          text: t(reversed ? 'tarot.reversed' : 'tarot.upright'),
        }),
      ]),
      el('div', { class: 'tarot-face', 'aria-hidden': 'true' }, [
        el('span', { class: 'tarot-numeral', text: card.arcana === 'major' ? card.numeral : card.numeral }),
        el('span', { class: 'tarot-suit-glyph', text: suitGlyph(card) }),
      ]),
      el('h4', { class: 'tarot-name', text: cardName(card) }),
      el('p', { class: 'tarot-arcana muted small', text: arcanaLabel(card) }),
      el('p', { class: 'tarot-keywords', text: keywordsOf(card, reversed) }),
    ]));
  });
  box.append(grid);
  box.append(el('p', { class: 'muted small', text: t('tarot.disclaimer') }));
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function suitGlyph(card) {
  if (card.arcana === 'major') return '★';
  return { wands: '🜂', cups: '🜄', swords: '🜁', pentacles: '🜃' }[card.suit.key] || '';
}

function arcanaLabel(card) {
  if (card.arcana === 'major') return `${t('tarot.major')} ${card.numeral}`;
  return `${t('tarot.minor')} · ${t(`tarot.suit.${card.suit.key}`)}`;
}

function buildMarkdown(draw) {
  const L = [];
  const d = draw.when;
  L.push(`## ${t('md.tarotTitle')}`);
  L.push('');
  L.push(`- ${t('md.spread')}: ${t(`tarot.spread.${draw.spread.key}`)}`);
  L.push(`- ${t('md.input')}: ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
  if (draw.question) L.push(`- ${t('md.question')}: ${draw.question}`);
  L.push('');
  L.push(`| # | ${t('md.position')} | ${t('md.card')} | ${t('md.orientation')} | ${t('tarot.keywords')} |`);
  L.push('|---|---|---|---|---|');
  draw.cards.forEach(({ card, reversed }, i) => {
    const posKey = draw.spread.positions[i];
    L.push(`| ${i + 1} | ${t(`tarot.pos.${posKey}`)} | ${cardName(card)} | ${t(reversed ? 'tarot.reversed' : 'tarot.upright')} | ${keywordsOf(card, reversed)} |`);
  });
  L.push('');
  L.push(`> ${t('tarot.disclaimer')}`);
  L.push('');
  L.push('---');
  L.push(`*${t('md.generatedBy')} — https://fortune-org.github.io/fortune-platform/*`);
  return L.join('\n');
}
