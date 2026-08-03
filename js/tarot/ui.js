// 타로 모드 UI: 스프레드/자유 드로우·주제 선택·조합 해석·마크다운

import { buildDeck, drawCards, SPREADS, findSpecialCombos, cardTag } from './deck.js';
import { $, el, pad2 } from '../utils.js';
import { t, getLang } from '../i18n.js';

const deck = buildDeck();
let lastDraw = null; // { spread, count, topic, question, cards }

function cardName(card) {
  return getLang() === 'ko' ? `${card.nameKo} (${card.nameEn})` : card.nameEn;
}

function keywordsOf(card, reversed) {
  const set = reversed ? card.rev : card.up;
  return (getLang() === 'ko' ? set.ko : set.en).join(', ');
}

function positionLabel(draw, i) {
  if (draw.spread.key === 'free') return t('tarot.pos.cardN', { n: i + 1 });
  return t(`tarot.pos.${draw.spread.positions[i]}`);
}

/** 태그 기반 동적 조합 문장 합성 (Keyword Synthesis) */
function synthesize(draw) {
  const lang = getLang();
  const tags = draw.cards.map(({ card, reversed }) => cardTag(card, reversed, lang));
  const lead = t(`tarot.syn.lead.${draw.topic}`);
  let flow;
  if (tags.length === 1) {
    flow = t('tarot.syn.single', { a: tags[0] });
  } else if (tags.length === 2) {
    flow = t('tarot.syn.two', { a: tags[0], c: tags[1] });
  } else {
    flow = t('tarot.syn.flow', {
      a: tags[0],
      b: tags[Math.floor(tags.length / 2)],
      c: tags[tags.length - 1],
    });
  }
  const parts = [`${lead} ${flow}`];
  const revCount = draw.cards.filter((x) => x.reversed).length;
  if (revCount > 0) parts.push(t('tarot.syn.reversedNote', { n: revCount }));
  return { text: parts.join(' '), specials: findSpecialCombos(draw.cards) };
}

export function initTarotForm() {
  const form = $('#tarot-form');
  const spreadSel = $('#tarot-spread');
  const countWrap = $('#tarot-count-wrap');
  const countIn = $('#tarot-count');

  const syncCount = () => { countWrap.hidden = spreadSel.value !== 'free'; };
  spreadSel.addEventListener('change', syncCount);
  syncCount();

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const spread = SPREADS.find((s) => s.key === spreadSel.value) || SPREADS[0];
    let count = spread.count;
    if (spread.key === 'free') {
      count = Math.min(12, Math.max(1, parseInt(countIn.value || '3', 10)));
    }
    const allowReversed = $('#tarot-reversed').checked;
    const question = $('#tarot-question').value.trim();
    lastDraw = {
      spread,
      count,
      topic: $('#tarot-topic').value || 'free',
      question,
      when: new Date(),
      cards: drawCards(deck, count, allowReversed),
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

  const meta = [];
  meta.push(t(`tarot.spread.${draw.spread.key}`));
  meta.push(t(`tarot.topic.${draw.topic}`));
  box.append(el('p', { class: 'muted small', text: meta.join(' · ') }));

  if (draw.question) {
    box.append(el('p', { class: 'tarot-question' }, [
      el('strong', { text: `${t('md.question')}: ` }), draw.question,
    ]));
  }

  const grid = el('div', { class: 'tarot-grid' });
  draw.cards.forEach(({ card, reversed }, i) => {
    grid.append(el('article', { class: `tarot-card${reversed ? ' reversed' : ''}` }, [
      el('header', { class: 'tarot-card-head' }, [
        el('span', { class: 'tarot-pos', text: `${i + 1}. ${positionLabel(draw, i)}` }),
        el('span', {
          class: `tarot-orient ${reversed ? 'rev' : 'up'}`,
          text: t(reversed ? 'tarot.reversed' : 'tarot.upright'),
        }),
      ]),
      el('div', { class: 'tarot-face', 'aria-hidden': 'true' }, [
        el('span', { class: 'tarot-numeral', text: card.numeral }),
        el('span', { class: 'tarot-suit-glyph', text: suitGlyph(card) }),
      ]),
      el('h4', { class: 'tarot-name', text: cardName(card) }),
      el('p', { class: 'tarot-arcana muted small', text: arcanaLabel(card) }),
      el('p', { class: 'tarot-keywords', text: keywordsOf(card, reversed) }),
    ]));
  });
  box.append(grid);

  // 종합 조합 해석
  const syn = synthesize(draw);
  const synBox = el('div', { class: 'tarot-synthesis' }, [
    el('h4', { text: t('tarot.synthesisTitle') }),
    el('p', { text: syn.text }),
    ...syn.specials.map((sp) => el('p', { class: 'tarot-special' }, [
      el('strong', { text: `${t('tarot.syn.specialTitle')}: ` }),
      getLang() === 'ko' ? sp.ko : sp.en,
    ])),
  ]);
  box.append(synBox);

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
  L.push(`## ${t('md.tarotTitle')} — ${t(`tarot.topic.${draw.topic}`)}`);
  L.push('');
  L.push(`- ${t('md.spread')}: ${t(`tarot.spread.${draw.spread.key}`)}${draw.spread.key === 'free' ? ` ×${draw.count}` : ''}`);
  L.push(`- ${t('md.input')}: ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
  if (draw.question) L.push(`- ${t('md.question')}: ${draw.question}`);
  L.push('');
  L.push(`| # | ${t('md.position')} | ${t('md.card')} | ${t('md.orientation')} | ${t('tarot.keywords')} |`);
  L.push('|---|---|---|---|---|');
  draw.cards.forEach(({ card, reversed }, i) => {
    L.push(`| ${i + 1} | ${positionLabel(draw, i)} | ${cardName(card)} | ${t(reversed ? 'tarot.reversed' : 'tarot.upright')} | ${keywordsOf(card, reversed)} |`);
  });

  // 카드별 상세 문단 (바보 뜻 / 월드 뜻 … 형식)
  L.push('');
  draw.cards.forEach(({ card, reversed }, i) => {
    L.push(`### ${i + 1}. ${cardName(card)} — ${t(reversed ? 'tarot.reversed' : 'tarot.upright')}`);
    L.push('');
    L.push(`> ${keywordsOf(card, reversed)}`);
    L.push('');
  });

  const syn = synthesize(draw);
  L.push(`### ${t('tarot.synthesisTitle')}`);
  L.push('');
  L.push(syn.text);
  for (const sp of syn.specials) {
    L.push('');
    L.push(`> **${t('tarot.syn.specialTitle')}**: ${getLang() === 'ko' ? sp.ko : sp.en}`);
  }
  L.push('');
  L.push(`> ${t('tarot.disclaimer')}`);
  L.push('');
  L.push('---');
  L.push(`*${t('md.generatedBy')} — https://fortune-org.github.io/fortune-platform/*`);
  return L.join('\n');
}
