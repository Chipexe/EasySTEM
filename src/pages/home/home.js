import { icon } from '../../components/icons.js';
import { assets } from '../../components/ui.js';
export function homePage(root) {
 const features = [
  ['code','Lập trình kéo thả','Trực quan, dễ học, phù hợp cho học sinh','editor','blue'],
  ['🤖','Kết nối phần cứng','Làm quen với Arduino, ESP32, STM32','editor','yellow'],
  ['book','Kho tài liệu STEM','Bài học, hướng dẫn và dự án thực hành','library','purple'],
  ['trophy','Thử thách sáng tạo','Tham gia cuộc thi, phát triển ý tưởng của bạn','competitions','green']
 ];
 root.innerHTML = `<div class="home-page"><section class="home-hero container"><div class="home-copy"><span class="home-badge">🚀 Nền tảng học tập STEM trực tuyến</span><h1>Khám phá thế giới<br><span class="stem-word"><b>S</b><b>T</b><b>E</b><b>M</b></span><br><span class="home-highlight">theo cách của bạn</span></h1><p>Học lập trình, làm quen với phần cứng và biến ý tưởng thành những sản phẩm thật cực vui cùng EasySTEM!</p><div class="home-actions"><a class="btn btn-orange" href="#/editor">${icon('play')} Bắt đầu sáng tạo</a><a class="btn btn-outline" href="#/library">${icon('book')} Khám phá tài liệu</a></div><div class="home-micro"><span>🌱 Học từ những điều cơ bản</span><span>✨ Thỏa sức sáng tạo</span></div></div><div class="home-art art-window"><img src="${assets.home}" alt="Hai bạn nhỏ cùng robot học lập trình và khám phá mạch điện Arduino" /></div><span class="home-star" aria-hidden="true">✦</span></section><section class="home-features container" aria-label="Khám phá EasySTEM">${features.map(([glyph, title, copy, url, tone]) => `<a class="feature-card feature-card--${tone}" href="#/${url}"><span class="feature-icon">${glyph.length > 3 ? icon(glyph) : glyph}</span><h2>${title}</h2><p>${copy}</p><span class="feature-explore">Khám phá ${icon('arrow')}</span></a>`).join('')}</section><section class="home-invite container"><span class="invite-robot">🤖</span><div><h2>Một ý tưởng nhỏ, một khám phá lớn!</h2><p>Chưa biết bắt đầu từ đâu? Để Trợ lí EasySTEM đồng hành cùng bạn nhé.</p></div><a class="btn btn-purple" href="#/assistant">Trò chuyện với trợ lí ${icon('arrow')}</a></section></div>`;
}
