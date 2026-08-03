// 공통 유틸리티

/** DOM 헬퍼 */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** 요소 생성 헬퍼 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** HTML 이스케이프 (XSS 방지: 사용자 입력을 innerHTML 에 넣기 전 반드시 사용) */
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
/** 클립보드 복사 (Clipboard API + 폴백) */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* 폴백으로 진행 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** 복사 버튼 동작: 성공/실패 피드백 포함. labels 는 객체 또는 함수(언어 전환 대응) */
export function bindCopyButton(button, getText, labels) {
  button.addEventListener('click', async () => {
    const L = typeof labels === 'function' ? labels() : labels;
    const text = getText();
    if (!text) return;
    const ok = await copyText(text);
    button.textContent = ok ? L.done : L.fail;
    button.classList.add(ok ? 'copied' : 'copy-failed');
    setTimeout(() => {
      button.textContent = (typeof labels === 'function' ? labels() : labels).idle;
      button.classList.remove('copied', 'copy-failed');
    }, 1800);
  });
}

/** 숫자 2자리 패딩 */
export const pad2 = (n) => String(n).padStart(2, '0');

/** 연락처 크롤링 방지: 조각을 조립해 지연 렌더링 */
export function protectedEmail(parts) {
  // parts: ['user', 'domain.tld'] — HTML 소스에 완성형 주소가 남지 않도록 조립만 담당
  return parts.join('\u0040');
}
