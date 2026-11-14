import { icon } from '../../components/icons.js';
import { banner, assets, showDialog } from '../../components/ui.js';
import { competitions } from './competitions.data.js';
const statusLabels = { ongoing:'Đang diễn ra', upcoming:'Sắp diễn ra', ended:'Đã kết thúc' };
const stars = n => `<span class="competition-stars" aria-label="Độ khó ${n} trên 5">${'★'.repeat(n)}<span>${'☆'.repeat(5-n)}</span></span>`;
function art(c, featured = false) {
 return `<div class="competition-art art-window ${featured ? 'competition-art-featured' : ''}"><img src="${assets.competitions}" alt="" style="${c.art === 'robot' ? 'width:290%;left:-9.5%;top:0;transform:translateY(-39.7%);' : `width:338.6%;left:${-10.8 - c.art * 108.3}%;top:0;transform:translateY(-67.67%);`}" /></div>`;
}
export function competitionsPage(root) {
 let status = 'ongoing';
 root.innerHTML = `${banner('competitions','Cuộc thi EasySTEM — Sân chơi STEM sáng tạo dành cho học sinh')}<div class="competitions-page container page-content"><div class="competition-tabs" role="group" aria-label="Trạng thái cuộc thi">${[['ongoing','🏆','Cuộc thi đang diễn ra'],['upcoming','🗓️','Sắp diễn ra'],['ended','🏅','Đã kết thúc']].map(([id,emoji,label]) => `<button data-status="${id}" class="competition-tab ${id === status ? 'active' : ''}" aria-pressed="${id === status}"><span>${emoji}</span>${label}</button>`).join('')}</div><p class="competition-demo">Nội dung cuộc thi minh họa cho giao diện.</p><div id="competition-results"></div></div>`;
 function update() {
  const filtered = competitions.filter(c => c.status === status);
  const featured = filtered[0]; const rest = competitions.filter(c => c.id !== featured?.id);
  root.querySelector('#competition-results').innerHTML = featured ? `<article class="competition-featured">${art(featured,true)}<div class="featured-copy"><span class="competition-status competition-status--${status}">${status === 'ongoing' ? '⚡' : '✦'} ${statusLabels[status]}</span><h1>${featured.title}</h1><p>${featured.description}</p><div class="featured-details"><span>👥 ${featured.audience}</span><span>Độ khó: ${stars(featured.difficulty)}</span><span>🗓️ ${status === 'upcoming' ? 'Bắt đầu' : 'Hạn nộp'}: ${featured.date}</span></div></div><button class="btn btn-orange" data-detail="${featured.id}">${status === 'ongoing' ? 'Tham gia ngay' : 'Xem chi tiết'} ${icon('arrow')}</button></article><h2 class="page-heading other-competitions-title">🏆 ${rest.length ? 'Các cuộc thi khác' : 'Khám phá thêm thử thách'}</h2><div class="competition-grid">${(rest.length ? rest : competitions.filter(c => c.id !== featured.id)).map(c => `<article class="competition-card competition-card--${c.color}">${art(c)}<div class="competition-card-body"><span class="competition-small-status">${statusLabels[c.status]}</span><h3>${c.title}</h3><p>${c.description}</p><div class="competition-card-meta"><span>👥 ${c.audience}</span>${stars(c.difficulty)}</div><button class="btn btn-soft btn-full" data-detail="${c.id}">Xem chi tiết ${icon('arrow')}</button></div></article>`).join('')}</div>` : '<div class="empty-state">Chưa có cuộc thi trong mục này.</div>';
 }
 root.querySelectorAll('[data-status]').forEach(button => button.onclick = () => {
  status = button.dataset.status;
  root.querySelectorAll('[data-status]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', b === button); }); update();
 });
 root.querySelector('#competition-results').onclick = e => {
  const btn = e.target.closest('[data-detail]'); if (!btn) return;
  const c = competitions.find(c => c.id === btn.dataset.detail);
  showDialog(c.title, `<p class="modal-copy">${c.description}</p><p>👥 Đối tượng: <strong>${c.audience}</strong></p><p>🗓️ ${c.status === 'upcoming' ? 'Bắt đầu' : 'Hạn nộp'}: <strong>${c.date}</strong></p><p>🏅 Trạng thái: <strong>${statusLabels[c.status]}</strong></p><div class="demo-note">Cuộc thi mẫu để duyệt giao diện. Đăng ký, thể lệ và nộp bài sẽ được triển khai ở giai đoạn chức năng.</div>`);
 };
 update();
}
