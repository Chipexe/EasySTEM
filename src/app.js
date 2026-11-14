import { header, navigation } from './components/header.js';
import { closeDialog } from './components/ui.js';
import { homePage } from './pages/home/home.js';
import { libraryPage } from './pages/library/library.js';
import { competitionsPage } from './pages/competitions/competitions.js';
import { assistantPage } from './pages/assistant/assistant.js';
import { editorPage } from './pages/editor/editor.js';
import { authPage } from './pages/auth/auth.js';
const pages = { home: homePage, library: libraryPage, competitions: competitionsPage, assistant: assistantPage, editor: editorPage, auth: authPage };
let cleanup;
function render() {
 if (location.hash === '#main') { document.querySelector('#main')?.focus(); return; }
 cleanup?.(); closeDialog();
 let page = location.hash.replace(/^#\//, '').split('?')[0] || 'home';
 if (!pages[page]) page = 'home';
 document.body.dataset.page = page;
 document.title = `${navigation.find(item => item[0] === page)?.[1] || 'Đăng nhập'} | EasySTEM`;
 document.querySelector('#app').innerHTML = `${header(page)}<main id="main" tabindex="-1"></main><footer class="site-footer">🤖 <strong>EasySTEM</strong><span>Học hỏi mỗi ngày · Sáng tạo theo cách của bạn</span><small>Bản giao diện thử nghiệm</small></footer>`;
 cleanup = pages[page](document.querySelector('#main'));
 window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
render();
