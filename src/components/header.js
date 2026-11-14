import { icon } from './icons.js';
export const navigation = [ ['home','Trang chủ','home'], ['library','Tài liệu','book'], ['competitions','Cuộc thi','trophy'], ['assistant','Trợ lí','bot'], ['editor','Khởi tạo','code'] ];
export function header(active) {
 return `<header class="site-header"><div class="header-inner"><a href="#/home" class="brand" aria-label="EasySTEM — Trang chủ"><span class="brand-robot">🤖</span><span>Easy<span class="brand-s">S</span><span class="brand-t">T</span><span class="brand-e">E</span><span class="brand-m">M</span><i>✦</i></span></a><nav class="main-nav" aria-label="Điều hướng chính">${navigation.map(([id, label, glyph]) => `<a href="#/${id}" class="nav-link ${id === active ? 'active' : ''}" ${id === active ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></a>`).join('')}</nav><a href="#/auth" class="login-link ${active === 'auth' ? 'active' : ''}">${icon('user')}<span>Đăng nhập</span></a></div></header>`;
}
