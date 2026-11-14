# Kiểm tra EasySTEM Connector 0.1.0

Ngày kiểm tra: 12/11/2026. Môi trường: Windows 10 x64, Node.js 24.22.2, Electron 43.8.8, Arduino CLI 1.5.1, Arduino AVR core 1.8.8, Servo 1.3.0.

## Đã kiểm tra

- 17 bài kiểm tra của web/Blockly đều đạt.
- 8 bài kiểm tra Connector về ghép nối, giới hạn origin, dữ liệu Serial phân mảnh, kiểm tra code, xác thực API, khóa tác vụ, nhường cổng khi nạp và khôi phục khi nạp lỗi đều đạt. Hardware và thao tác upload trong các bài này là đối tượng giả lập, không ghi vào thiết bị.
- Một bài tích hợp biên dịch thật mã sinh từ Blockly với Servo, siêu âm, nút nhấn, L298N và vòng lặp đã đạt cho cả Nano ATmega328P và Old Bootloader. File hex được tạo bằng avr-gcc.
- Bộ công cụ sau khi chuyển sang thư mục release/win-unpacked/resources/arduino tiếp tục biên dịch thành công, kiểm tra khả năng di chuyển đường dẫn.
- Bản Electron đóng gói mở được cửa sổ; cây truy cập xác nhận mã ghép nối, trạng thái công cụ offline và danh sách cổng. API health chạy tại 127.0.0.1:17431.
- Trình duyệt nhận diện được Connector và mở biểu mẫu ghép nối. Chưa ghép nối ứng dụng thật trong kiểm tra UI để tránh cấp quyền hoặc tác động USB ngoài ý muốn.
- npm audit --omit=dev --offline báo không có lỗ hổng trong các phụ thuộc chạy thực tế theo dữ liệu audit có sẵn. Các phụ thuộc build không nằm trong kết luận này.

## Chưa được xác nhận

- Chưa xác định COM3/COM4 trên máy là thiết bị gì; không chọn hoặc nạp vào chúng.
- Chưa kiểm tra nạp, reset và đọc cảm biến trên Nano vật lý, hoặc hệ thống máy bơm/quạt thật.
- Chưa chạy trình cài đặt để thay đổi cài đặt Windows. Đã kiểm tra bản giải nén do electron-builder tạo.
- Chưa thử cài trên máy sạch không có Arduino IDE/driver; bộ công cụ đã được đóng gói nhưng driver USB vẫn phụ thuộc loại Nano.
- Chưa ký số, tự cập nhật, triển khai tên miền HTTPS thật hoặc kiểm tra các chính sách mạng cục bộ của tất cả trình duyệt.
- Chưa triển khai đăng nhập và đồng bộ nhiều máy. Web thử nghiệm hiện chạy tại http://127.0.0.1:5173.

## Bước thử với thiết bị thật

Người dùng tự chọn đúng cổng, kiểm tra bootloader và nguồn, bắt đầu bằng LED rời trên J1/J4. Nạp chương trình đơn giản, kiểm tra hoạt động, sau đó thử siêu âm và ADC. Chỉ sau khi kiểm tra đúng cực tính và nguồn tải mới thử máy bơm/quạt qua L298N. Khi web cho phép ghép nối, mã nhập phải lấy từ ứng dụng đang chạy trên chính máy đó.
