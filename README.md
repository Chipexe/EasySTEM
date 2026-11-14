# EasySTEM — Giao diện

Bản frontend cục bộ theo 5 ảnh trong `Giaodien`, bổ sung đăng nhập. Dùng HTML, CSS và JavaScript ES Modules; trang Khởi tạo tích hợp Blockly thật.

## Chạy

Trợ lý Gemini và nút tròn hỗ trợ trong Khởi tạo đã có API phía máy chủ. Xem [hướng dẫn cấu hình Gemini](docs/GEMINI-ASSISTANT.md). Cần đặt API key trong `.env` trên máy chủ rồi khởi động lại server; không đặt key trong frontend. Các mô tả "AI phản hồi mẫu/chưa có backend" ở phần lịch sử bên dưới không còn áp dụng cho trợ lý. Đăng nhập và đồng bộ tài khoản vẫn chưa có backend thật.

Yêu cầu Node.js 20 trở lên:

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Giữ cửa sổ terminal trong khi xem. Kiểm tra mã: `npm run check`.

## Chia module

- `src/pages/home/`: trang chủ.
- `src/pages/library/`: tài liệu, bộ lọc, bài học; `course-access.js` quản lý giao diện thêm khóa học giáo viên.
- `src/pages/competitions/`: cuộc thi và dữ liệu mẫu.
- `src/pages/assistant/`: khung chat và lịch sử mẫu.
- `src/pages/editor/`: khai báo thiết bị Nano, vùng khối lệnh và bảng giá trị cảm biến. Cấu hình cổng ở `editor.board.js`, khai báo ở `editor.devices.js`, bảng giá trị ở `editor.monitor.js`, vùng code ở `editor.workspace.js`.
- `src/pages/auth/`: đăng nhập, đăng ký, quên mật khẩu.
- `src/components/`: thanh điều hướng, icon, hộp thoại, thông báo.
- `src/styles/tokens.css`: bảng màu, font và biến chung.
- `src/styles/base.css`: quy tắc nền tảng.
- `src/app.js`: điều hướng theo hash và vòng đời trang.

CSS mỗi trang đều có selector giới hạn theo thành phần trang. Sửa một trang ưu tiên trong thư mục của trang đó. Chỉ chỉnh các file dùng chung khi cần thay đổi toàn hệ thống.

## Phạm vi hiện tại

Đã có 6 trang; điều hướng; tìm kiếm và lọc tài liệu; xem trước bài học; các tab cuộc thi; nhập mã khóa học; khung chat với phản hồi mẫu; kiểm tra biểu mẫu tài khoản và hiện/ẩn mật khẩu. Có bố cục thích ứng màn hình nhỏ và hỗ trợ bàn phím.

Trang Khởi tạo giữ nguyên thanh menu dùng chung, chỉ thay nội dung bên dưới. Bố cục gồm ô khai báo thiết bị, Blockly thật và bảng giá trị cảm biến. Có kéo/tháo/ghép/lồng khối, sửa tham số, tạo biến số, hoàn tác/làm lại, phóng to/thu nhỏ và kiểm tra chương trình. Danh sách thiết bị ban đầu là ví dụ, cần chỉnh theo linh kiện thực tế. Tab Mã Arduino sinh `setup()` và `loop()` theo các khối và cổng đã khai báo, cho tải file `.ino`. Chưa biên dịch hoặc chạy thử trên mạch thật; người dùng cần kiểm tra và biên dịch bằng Arduino IDE trước khi nạp.

Khối hiện hỗ trợ: bắt đầu, lặp liên tục, nếu/thì/nếu không, so sánh, logic, lặp theo số lần/điều kiện/biến, biến số, toán học cơ bản, chuỗi cho Serial, chờ, millis, LED, servo, máy bơm/quạt và động cơ qua L298N không PWM, khoảng cách siêu âm, ADC, digital và nút nhấn dùng pull-up. Giá trị ADC 0–1023 không phải phần trăm; cần hiệu chuẩn nếu muốn quy đổi. Siêu âm trả -1 khi không nhận Echo trong 30 ms. Các vòng lặp đếm và số ngẫu nhiên giới hạn ở một triệu; servo giới hạn góc 0–180.

Không cần cơ sở dữ liệu. Lưu/mở dự án đầy đủ trên trình duyệt, tự lưu bản nháp, xuất/nhập file `.json` để chuyển máy. Bản lưu gồm JSON Blockly (khối, vị trí, biến, tham số), thiết bị và độ phóng. Giới hạn 300 khối, file dự án 1 MB. File được kiểm tra định dạng trước khi nhập. Các khóa mới là `easystem.nano.project.v3` và `easystem.nano.draft.v3`; dữ liệu giao diện v1/v2 được giữ riêng, chưa có bộ chuyển đổi tự động.

Thêm thiết bị trước, rồi chọn đúng thiết bị trong dropdown của khối. Khi đổi cổng, mã sinh ra tự cập nhật. Khi xóa hoặc đổi loại thiết bị, khối giữ tham chiếu và báo lỗi, không tự chuyển sang thiết bị khác. Khối rời, trùng khối bắt đầu/lặp liên tục, thiếu giá trị hoặc thiết bị không hợp lệ sẽ chặn tải `.ino`. Dự án chưa hoàn chỉnh vẫn có thể lưu để làm tiếp.

EasySTEM Connector trong thư mục `connector/` cung cấp API kết nối USB, biên dịch và nạp Nano. Trên web bấm Kết nối, nhập mã ghép nối trong ứng dụng, chọn đúng cổng và bootloader. Bấm Nạp sẽ biên dịch rồi yêu cầu xác nhận thay chương trình. Sau khi nạp, bảng cảm biến nhận dữ liệu Serial 115200 baud. Chương trình tự gửi số đo các cảm biến đã khai báo, kể cả trong thời gian đợi; không cần thêm khối Serial. Mạch vẫn chạy độc lập khi rút máy tính và cấp nguồn phù hợp. Phần mềm đã được kiểm tra với cổng giả lập và trình biên dịch AVR thật; chưa thử nạp/đọc trên Nano vật lý. Hướng dẫn bộ cài ở `connector/README.md`.

Giá trị cảm biến mặc định là dấu gạch; nút Xem dữ liệu mẫu chỉ hiển thị số minh họa có nhãn. LED rời chỉ được khai báo J1/J4 vì hai cổng có điện trở nối tiếp. Blockly được cài từ npm và các tệp cần thiết được sao chép vào `vendor/blockly/` bởi postinstall/predev; sau khi cài đặt, trình duyệt không cần CDN. `npm ci` khôi phục phiên bản theo lockfile.

Các module Blockly nằm ở `src/pages/editor/blockly/`: `blocks.js` định nghĩa khối và dropdown thiết bị, `toolbox.js` danh mục, `arduino-generator.js` sinh mã, `workspace.js` quản lý vùng kéo thả, `project.js` lưu/kiểm tra/xuất dự án, `loader.js` tải thư viện cục bộ. Các bài kiểm tra headless ở `tests/blockly.test.mjs`.

Trong Tài liệu, bấm **Thêm khóa học** và dùng mã `STEM2026`, mật khẩu `demo123`. Khóa học mẫu hiện thành một hàng dưới các bài mặc định. Dữ liệu mẫu lưu trên trình duyệt, chưa gắn với tài khoản; mật khẩu nhập không được lưu.

Đây là bản duyệt giao diện. Chưa có backend, đăng nhập thật, gửi email, phân quyền, xác thực khóa học thật, nội dung bài học hoàn chỉnh, đăng ký cuộc thi, AI, bộ thực thi lập trình đầy đủ hoặc kết nối thiết bị. Các phần đó cần triển khai sau khi duyệt thiết kế. Không đưa mã/mật khẩu khóa học thật vào frontend; việc xác thực và kiểm tra quyền truy cập phải thực hiện ở máy chủ.

Banner và ảnh thẻ hiện sử dụng các vùng ảnh mẫu qua CSS; chữ trong minh họa không chỉnh riêng được. Các nút, tìm kiếm, biểu mẫu, danh sách và nội dung bên ngoài banner là HTML thật. Để hoàn thiện production, thay ảnh tham chiếu bằng các hình minh họa tách lớp và font thương hiệu.

Dữ liệu trên thiết bị dùng các khóa localStorage bắt đầu bằng `easystem.demo.` hoặc `easystem.nano.`. Trình duyệt chặn lưu trữ vẫn có thể dùng Blockly và xuất dự án ra file, nhưng không lưu cục bộ được. Cơ sở dữ liệu chỉ cần khi triển khai lưu theo tài khoản hoặc đồng bộ nhiều máy.
