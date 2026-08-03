// 다국어(i18n) 관리: locales/*.json 로드, data-i18n 속성 적용, 언어 전환
// 우선순위: ?lang= 쿼리 → localStorage → 브라우저 언어 → ko

const STORAGE_KEY = 'fortune-platform.lang';
const SUPPORTED = ['ko', 'en'];

let dict = {};
let currentLang = 'ko';
const listeners = new Set();

/** 초기 언어 결정 */
export function detectLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && SUPPORTED.includes(q)) return q;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch { /* storage 접근 불가 환경 */ }
  const nav = (navigator.language || 'ko').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : 'en';
}

/** locale JSON 로드 후 적용 */
export async function initI18n(baseUrl = '.') {
  currentLang = detectLang();
  await loadDict(baseUrl, currentLang);
  applyAll();
  document.documentElement.lang = currentLang;
  return currentLang;
}

async function loadDict(baseUrl, lang) {
  const res = await fetch(`${baseUrl}/locales/${lang}.json`);
  if (!res.ok) throw new Error(`locale ${lang} HTTP ${res.status}`);
  dict = await res.json();
}

/** 언어 전환 */
export async function setLang(lang, baseUrl = '.') {
  if (!SUPPORTED.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* 무시 */ }
  await loadDict(baseUrl, lang);
  applyAll();
  document.documentElement.lang = lang;
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
  for (const fn of listeners) fn(lang);
}

export function getLang() { return currentLang; }

/** 언어 변경 구독 (동적 렌더 영역 재그리기용) */
export function onLangChange(fn) { listeners.add(fn); }

/** 키 조회: 'calculator.title' 형식. {var} 치환 지원 */
export function t(key, vars) {
  let cur = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in cur) cur = cur[part];
    else return key; // 누락 키는 키 자체 노출 (개발 시 발견 용이)
  }
  let out = typeof cur === 'string' ? cur : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

/** 키 조회 (raw): 배열/객체 반환 가능. 누락 시 null */
export function tRaw(key) {
  let cur = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in cur) cur = cur[part];
    else return null;
  }
  return cur;
}

/** data-i18n / data-i18n-placeholder / data-i18n-title / data-i18n-aria 적용 */
export function applyAll(root = document) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.getAttribute('data-i18n'));
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) {
    node.setAttribute('placeholder', t(node.getAttribute('data-i18n-placeholder')));
  }
  for (const node of root.querySelectorAll('[data-i18n-title]')) {
    node.setAttribute('title', t(node.getAttribute('data-i18n-title')));
  }
  for (const node of root.querySelectorAll('[data-i18n-aria]')) {
    node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria')));
  }
}
