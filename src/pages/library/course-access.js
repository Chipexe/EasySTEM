import { showDialog, closeDialog, loadLocal, saveLocal, escapeHtml, toast } from '../../components/ui.js';
// Frontend-only sample. Replace this adapter with a server API before real course access.
// Never put real course passwords, authorization rules, or private lessons in frontend code.
export const COURSE_STORAGE = 'easystem.demo.courses.v1';
export function getTeacherCourses() {
 const data = loadLocal(COURSE_STORAGE, []);
 return Array.isArray(data) ? data.filter(c => c && typeof c.id === 'string' && typeof c.title === 'string' && typeof c.teacher === 'string') : [];
}
export function joinCourseDialog(onJoined) {
 showDialog('Thêm khóa học của giáo viên', `<p class="modal-copy">Nhập mã khóa học và mật khẩu mà giáo viên đã cung cấp cho bạn.</p><form id="join-course"><div class="field"><label for="course-code">Mã khóa học</label><input id="course-code" name="code" placeholder="Ví dụ: STEM2026" required maxlength="40" autocomplete="off" /></div><div class="field"><label for="course-password">Mật khẩu khóa học</label><input id="course-password" name="password" type="password" placeholder="Nhập mật khẩu giáo viên cung cấp" required maxlength="100" autocomplete="off" /></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary btn-full" type="submit">Thêm khóa học</button></form><p class="demo-note">Bản thử giao diện: dùng mã <strong>STEM2026</strong> và mật khẩu <strong>demo123</strong>. Xác thực khóa học thật sẽ được kết nối sau.</p>`, dialog => {
  dialog.querySelector('form').onsubmit = e => {
   e.preventDefault();
   const form = new FormData(e.target); const error = dialog.querySelector('.form-error');
   const reject = text => { error.hidden = false; error.textContent = text; };
   if (String(form.get('code')).trim().toUpperCase() !== 'STEM2026' || form.get('password') !== 'demo123') { reject('Mã hoặc mật khẩu chưa đúng. Hãy kiểm tra lại với giáo viên.'); return; }
   const courses = getTeacherCourses();
   if (courses.some(c => c.id === 'STEM2026')) { reject('Bạn đã thêm khóa học này rồi.'); return; }
   courses.push({ id:'STEM2026', title:'Cùng em sáng tạo Robot', teacher:'Cô Minh Anh', count:6, emoji:'🤖' });
   if (!saveLocal(COURSE_STORAGE, courses)) return;
   closeDialog(); onJoined(); toast('Đã thêm khóa học mẫu của Cô Minh Anh!');
  };
 });
}
export function teacherCourseMarkup(course) {
 return `<button class="teacher-course" data-teacher-course="${escapeHtml(course.id)}"><span class="teacher-course-art">🤖<span>KHÓA HỌC GIÁO VIÊN</span></span><span class="teacher-course-copy"><strong>${escapeHtml(course.title)}</strong><span>👩‍🏫 ${escapeHtml(course.teacher)}</span><small>6 bài học · Khóa học mẫu</small></span><span class="teacher-course-arrow">→</span></button>`;
}
