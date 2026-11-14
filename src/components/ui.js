import { icon } from './icons.js';
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const assets = {
 home: '/Giaodien/900350160_29264890799810263_4975336794033491703_n.png',
 assistant: '/Giaodien/900350164_1128565610048564_8639789531313005649_n.png',
 competitions: '/Giaodien/902408363_4569092803408198_7537900746597712458_n.png',
 editor: '/Giaodien/902515205_1427764672886506_2663115684332694398_n.png',
 library: '/Giaodien/902742890_1490228509645487_5274361970500899470_n.png'
};
export function banner(page, label) {
 return `<section class="reference-banner reference-banner--${page}" aria-label="${escapeHtml(label)}"><img src="${assets[page]}" alt="${escapeHtml(label)}" draggable="false" /></section>`;
}
export function toast(message) {
 const el = document.querySelector('#toast');
 el.textContent = message; el.classList.add('visible');
 clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 4200);
}
let previousFocus;
export function closeDialog() {
 const dialog = document.querySelector('#dialog-root dialog');
 if (dialog?.open) dialog.close();
 document.querySelector('#dialog-root').replaceChildren();
 if (previousFocus?.isConnected) previousFocus.focus();
}
export function showDialog(title, body, setup) {
 previousFocus = document.activeElement;
 const root = document.querySelector('#dialog-root');
 root.innerHTML = `<dialog class="modal" aria-labelledby="modal-title"><div class="modal-heading"><h2 id="modal-title">${escapeHtml(title)}</h2><button class="icon-button" data-close aria-label="Đóng">${icon('close')}</button></div>${body}</dialog>`;
 const dialog = root.querySelector('dialog');
 dialog.querySelector('[data-close]').onclick = closeDialog;
 dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
 dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
 setup?.(dialog); dialog.showModal();
}
export function loadLocal(key, fallback) {
 try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function saveLocal(key, value) {
 try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast('Trình duyệt không cho phép lưu dữ liệu trên thiết bị này.'); return false; }
}
