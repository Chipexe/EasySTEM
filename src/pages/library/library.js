import { icon } from '../../components/icons.js';
import { banner, assets, showDialog, escapeHtml } from '../../components/ui.js';
import { categories, lessons, levels } from './library.data.js';
import { getTeacherCourses, joinCourseDialog, teacherCourseMarkup } from './course-access.js';
export function libraryPage(root) {
 let selected = 'all';
 root.innerHTML = `${banner('library','Kho tài liệu STEM — Học, Lập trình, Thực hành, Sáng tạo')}<div class="library-layout container page-content"><aside class="library-sidebar"><h2>📚 Danh mục tài liệu</h2><nav aria-label="Danh mục tài liệu">${categories.map(([id, emoji, title]) => `<button class="category-button ${id === 'all' ? 'active' : ''}" data-category="${id}" aria-pressed="${id === 'all'}"><span>${emoji}</span>${title}</button>`).join('')}</nav><div class="library-sidebar-note"><span>💡</span><p>Mỗi bài học là một bước nhỏ để trở thành nhà sáng tạo!</p></div></aside><div class="library-main"><div class="library-toolbar"><label class="library-search">${icon('search')}<input type="search" id="lesson-search" placeholder="Tìm kiếm bài học, dự án, ví dụ..." aria-label="Tìm kiếm tài liệu" /></label><select id="level-filter" aria-label="Lọc theo cấp độ"><option value="all">Tất cả cấp độ</option>${Object.entries(levels).map(([id,label]) => `<option value="${id}">${label}</option>`).join('')}</select><select id="topic-filter" aria-label="Lọc theo chủ đề">${categories.map(([id,,label]) => `<option value="${id}">${id === 'all' ? 'Tất cả chủ đề' : label}</option>`).join('')}</select></div><div class="library-section-title"><h1 class="page-heading">🌟 Bài học nổi bật</h1><span id="lesson-count" class="muted"></span></div><div class="lesson-grid" id="lesson-grid" aria-live="polite"></div><section class="teacher-section" aria-labelledby="teacher-title"><div class="teacher-section-heading"><div><span class="section-kicker">Học cùng thầy cô</span><h2 id="teacher-title">🎓 Khóa học của giáo viên</h2></div><button class="btn btn-primary" id="add-course">${icon('plus')} Thêm khóa học</button></div><div class="teacher-course-list" id="teacher-courses"></div></section></div></div>`;
 const search = root.querySelector('#lesson-search'), level = root.querySelector('#level-filter'), topic = root.querySelector('#topic-filter');
 function update() {
  const query = search.value.trim().toLocaleLowerCase('vi');
  const visible = lessons.filter(l => (selected === 'all' || l.category.includes(selected)) && (level.value === 'all' || l.level === level.value) && (topic.value === 'all' || l.category.includes(topic.value)) && l.title.toLocaleLowerCase('vi').includes(query));
  root.querySelector('#lesson-count').textContent = `${visible.length} bài học`;
  root.querySelector('#lesson-grid').innerHTML = visible.length ? visible.map(l => `<button class="lesson-card lesson-card--${l.color}" data-lesson="${l.id}" aria-label="Xem bài học ${l.title}"><span class="lesson-art art-window"><img src="${assets.library}" alt="" style="width:576.55%;left:${-134 - l.art % 4 * 110}%;top:${l.art < 4 ? -419 : -613}%;" /></span><span class="lesson-body"><strong>${l.title}</strong><span class="lesson-meta"><span class="pill pill-${l.level}">${levels[l.level]}</span><span class="lesson-time">${icon('clock')} ${l.minutes} phút</span><span class="lesson-play">${icon('play')}</span></span></span></button>`).join('') : '<div class="empty-state"><h3>Chưa tìm thấy bài học</h3><p>Thử từ khóa khác hoặc thay đổi bộ lọc nhé.</p></div>';
 }
 root.querySelectorAll('[data-category]').forEach(btn => btn.onclick = () => {
  selected = btn.dataset.category; topic.value = 'all';
  root.querySelectorAll('[data-category]').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn); }); update();
 });
 search.oninput = update; level.onchange = update; topic.onchange = update;
 root.querySelector('#lesson-grid').onclick = e => {
  const button = e.target.closest('[data-lesson]'); if (!button) return;
  const l = lessons.find(l => l.id === button.dataset.lesson);
  showDialog(l.title, `<span class="pill pill-${l.level}">${levels[l.level]} · ${l.minutes} phút</span><p class="lesson-description">${l.description}</p><div class="demo-note">Đây là phần xem trước bài học. Nội dung chi tiết sẽ được bổ sung trong giai đoạn chức năng.</div><a href="#/editor" class="btn btn-primary btn-full lesson-start">${icon('code')} Khám phá khối lệnh</a>`);
 };
 function updateCourses() {
  const courses = getTeacherCourses();
  root.querySelector('#teacher-courses').innerHTML = courses.length ? courses.map(teacherCourseMarkup).join('') : '<div class="teacher-empty"><span>📬</span><div><strong>Bạn có mã khóa học từ giáo viên?</strong><p>Thêm khóa học để bắt đầu học cùng lớp của mình nhé.</p></div></div>';
 }
 root.querySelector('#add-course').onclick = () => joinCourseDialog(updateCourses);
 root.querySelector('#teacher-courses').onclick = e => {
  const card = e.target.closest('[data-teacher-course]'); if (!card) return;
  const c = getTeacherCourses().find(c => c.id === card.dataset.teacherCourse); if (!c) return;
  showDialog(c.title, `<p class="modal-copy">👩‍🏫 ${escapeHtml(c.teacher)} · Khóa học mẫu</p><ol class="course-syllabus"><li>Làm quen với robot</li><li>Khám phá Arduino</li><li>Thắp sáng đèn LED</li><li>Kết nối cảm biến</li><li>Điều khiển động cơ</li><li>Dự án robot đầu tiên</li></ol><p class="demo-note">Danh sách minh họa giao diện. Bài học riêng và quyền truy cập sẽ do máy chủ cung cấp ở giai đoạn chức năng.</p>`);
 };
 update(); updateCourses();
}
