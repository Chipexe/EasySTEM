# Trợ lý Gemini cho EasySTEM

## Thiết lập cục bộ

1. Tạo API key trong Google AI Studio. Nếu khóa từng được dán vào chat hoặc kho mã, thu hồi và tạo khóa mới.
2. Sao chép `.env.example` thành `.env` trong `D:\EasySTEM`, điền `GEMINI_API_KEY` bằng trình soạn thảo trên máy. Không gửi khóa qua chat, không đặt khóa trong `src/`.
3. `GEMINI_MODEL` là model Gemini hỗ trợ đầu vào ảnh và JSON có cấu trúc, đang được cấp quyền cho API project. Mẫu dùng `gemini-3.8-flash`; thay bằng model phù hợp trong tài khoản nếu cần. Model/quota có thể thay đổi.
4. Chạy `npm.cmd run dev`, mở `http://127.0.0.1:5173/#/editor`. Nếu đã chạy server phiên bản cũ, dừng rồi khởi động lại.

Chưa có khóa thì giao diện vẫn hoạt động, API trả thông báo chưa cấu hình; không trả lời giả. Không cần Connector để hỏi AI; cần Internet. Connector vẫn phụ trách USB, biên dịch và nạp.

## Cách dùng

Trang Trợ lý có tìm kiếm lịch sử, khôi phục cuộc trò chuyện đang mở sau tải lại, đổi tên, xóa từng cuộc và tải hội thoại dạng `.txt`. Câu hỏi xuất hiện ngay khi gửi, có trạng thái đang chờ/lỗi/đã dừng. Nút **Dừng** hủy yêu cầu phía trình duyệt; backend truyền tín hiệu hủy tới Gemini, nhưng nhà cung cấp có thể đã xử lý và tính phí phần đã chạy. Có **Thử lại câu hỏi** khi lỗi, đã dừng hoặc gián đoạn. Câu hỏi chưa được trả lời không được đưa vào lịch sử ngữ cảnh như một lượt đã hoàn tất. Khối mã hiển thị riêng, có nút sao chép, không thực thi HTML hay mã AI trả về.

Lịch sử mới lưu ở `easystem.gemini.conversations.v2`, tự nhập lịch sử Gemini v1 nếu chưa có v2. Tối đa 30 cuộc/100 tin mỗi cuộc và khoảng 700.000 ký tự dữ liệu lưu; dữ liệu cũ được thu gọn trước, ưu tiên giữ cuộc đang mở. Nếu tải lại khi đang chờ, lượt đó được đánh dấu gián đoạn để gửi lại. Trạng thái **Đã cấu hình** chỉ có nghĩa máy chủ đã có key, không xác nhận key còn hiệu lực hoặc tài khoản còn quota. Widget Khởi tạo cũng có nút dừng và sao chép câu trả lời/mã.

Bấm nút tròn robot ở góc dưới bên phải Khởi tạo. Nhập dự án và câu hỏi. Mỗi lần gửi, ứng dụng chụp các khối Blockly đang có (kể cả khối ngoài vùng cuộn), kèm mã Arduino, lỗi khối và thiết bị đã khai báo. Không chụp màn hình máy tính, trang khác hoặc webcam. Khối thu gọn vẫn xuất hiện ở trạng thái thu gọn; mã Arduino giúp bổ sung ngữ cảnh. Ảnh giới hạn 2000 px mỗi chiều, dự án lớn có thể khó đọc. Có mục xem lại ảnh gửi gần nhất.

Trợ lý hướng dẫn trong phạm vi bài học STEM/EasySTEM, yêu cầu làm rõ nếu thiếu thông tin, và hỏi học sinh cần giúp gì thêm. Không tự sửa khối hay nạp chương trình. Kết quả là gợi ý AI cần kiểm tra, không phải kết luận đã đo mạch thật. Từ chối ngoài phạm vi dựa trên chính sách và phân loại của mô hình, không phải bảo đảm tuyệt đối chống mọi prompt injection; cần kiểm thử với học sinh trước triển khai rộng.

Trang Trợ lý chính cũng dùng cùng API. Lịch sử trang chính lưu trên trình duyệt (tối đa 30 cuộc/100 tin mỗi cuộc); widget chỉ giữ 12 tin gần nhất trong bộ nhớ trang, xóa khi rời trang hoặc bắt đầu cuộc trò chuyện mới. Chưa có đồng bộ tài khoản. Ảnh chỉ giữ tạm trong trang; backend không ghi ảnh, câu hỏi hoặc API key ra file/log. Dữ liệu được chuyển tới Google, chịu chính sách dữ liệu của dịch vụ và tài khoản đang dùng.

## Triển khai VPS

- Chạy Node server qua process manager, reverse proxy HTTPS cả nội dung web và `/api/assistant/*` về cùng server loopback. Không chỉ triển khai các file tĩnh.
- Đặt `APP_ORIGIN=https://ten-mien-cua-ban` (không dấu `/` cuối), giữ key ở môi trường máy chủ hoặc `.env` ngoài phần tĩnh. Restart sau khi thay cấu hình.
- Server chỉ phục vụ `index.html`, `src/`, `Giaodien/`, `vendor/blockly/`; chặn `.env`, backend và Connector.
- Giới hạn mặc định: 30 yêu cầu/giờ/địa chỉ mạng trực tiếp, 2 tác vụ AI đồng thời, `AI_DAILY_LIMIT=200` yêu cầu/ngày UTC/toàn tiến trình. Không tin `X-Forwarded-For`; sau reverse proxy các học sinh có thể cùng tính vào một địa chỉ. Cần tích hợp xác thực tài khoản thật và hạn mức theo người dùng trước khi mở công khai. Origin check không thay thế đăng nhập. Các giới hạn RAM đặt lại khi restart, không cộng dồn giữa nhiều tiến trình; đặt thêm hạn mức ngân sách trong tài khoản Google và giới hạn tại proxy.
- Cấu hình body limit ít nhất 3.2 MB và proxy timeout trên 65 giây. Backend giới hạn body 3.2 MB, ảnh PNG ~2 MB, timeout Gemini 55 giây. Không ghi body vào access/error log của proxy.

## Kiểm chứng

`npm.cmd run check` chạy kiểm thử Blockly và API trợ lý bằng mô phỏng Gemini. Kiểm thử xác nhận ảnh/mã được gửi đúng cấu trúc, quyền truy cập, lỗi cấu hình, giới hạn ngân sách, đầu ra bị cắt và thay thế phản hồi bị phân loại ngoài phạm vi. Không đồng nghĩa đã kiểm chứng chất lượng câu trả lời Gemini thật.

Để nghiệm thu với khóa thật: gửi câu hỏi về LED, câu tiếp nối, cảm biến sai cổng, câu hỏi ngoài bài học, yêu cầu bỏ qua quy tắc, câu hỏi trộn trong/ngoài phạm vi; kiểm tra ảnh đính kèm và chính sách từ chối. Không dùng dữ liệu học sinh thật cho kiểm thử ban đầu.

Tài liệu giao thức: https://ai.google.dev/api/generate-content và https://ai.google.dev/gemini-api/docs/image-understanding.
