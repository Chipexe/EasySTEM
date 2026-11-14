# EasySTEM Connector 0.1.0

Ứng dụng Windows x64 hỗ trợ web EasySTEM biên dịch/nạp Arduino Nano và đọc số liệu cảm biến qua USB. Có bộ cài theo tài khoản người dùng và bản portable. Đây là bản thử nghiệm chưa ký số; chưa được kiểm thử nạp trên Nano thật.

## Sử dụng

1. Cài bản Setup hoặc mở bản Portable. Đóng cửa sổ chỉ thu nhỏ xuống khay hệ thống; dùng Thoát hẳn ứng dụng để dừng.
2. Mở web EasySTEM. Bản hiện tại là `http://127.0.0.1:5173/#/editor` (máy phát triển cần chạy `npm run dev` ở thư mục gốc).
3. Bấm Kết nối trên web, nhập mã 6 chữ số hiển thị trong Connector. Trình duyệt có thể yêu cầu cho phép truy cập mạng cục bộ.
4. Chọn đúng cổng COM và Nano ATmega328P hoặc Old Bootloader. Đóng Serial Monitor của Arduino IDE nếu nó đang giữ cổng.
5. Khai báo đúng linh kiện/cổng, ghép Blockly, bấm Nạp chương trình và xác nhận. Chương trình cũ trên mạch sẽ bị thay thế.
6. Khi code EasySTEM đã chạy, số đo xuất hiện ở cột Giá trị cảm biến. Rút máy tính, mạch vẫn chạy chương trình khi được cấp nguồn phù hợp.

Chưa có web hosting hoặc đăng nhập/đồng bộ tài khoản. Nút Mở EasySTEM hiện mở web cục bộ phục vụ bản thử nghiệm. Chưa có cập nhật tự động hoặc driver USB đi kèm. Nếu máy không nhận Nano, dùng driver đúng nhà sản xuất USB (CH340/FTDI...) và dây có truyền dữ liệu. Không thể xác định Nano chỉ từ tên COM.

## Dữ liệu và kết nối

- API chỉ lắng nghe trên `127.0.0.1:17431`. Trang phải ghép nối bằng mã ứng dụng; token chỉ dùng với đúng origin và hết hiệu lực khi ứng dụng khởi động lại/đổi mã.
- Cho phép origin HTTPS, hoặc HTTP localhost khi phát triển. Không dùng `Access-Control-Allow-Origin: *` cho API thiết bị. Bản HTTPS triển khai thật cần kiểm thử quyền truy cập loopback của trình duyệt.
- Trình biên dịch chỉ chấp nhận Nano và các header Arduino.h, math.h, Servo.h trong bản này; không chạy lệnh shell do web gửi.
- Đọc Serial ở 115200 baud. Mỗi dòng số đo: `{"type":"sensor","id":"soil","port":"J8","value":680,"unit":"ADC"}`. ID phải khớp thiết bị của dự án; web không hiển thị số đo cũ quá 2 giây.
- Nạp tạm dừng monitor để nhường cổng cho avrdude rồi mở lại. Không đồng thời dùng hai chương trình khác nhau giữ cùng cổng.
- Mã ghép nối và token không đồng bộ với tài khoản web. Dữ liệu ADC chưa hiệu chuẩn phần trăm. Tần suất mục tiêu 200 ms; siêu âm/khối đang chạy có thể làm chậm.

## Phát triển và đóng gói

Yêu cầu Node.js >=22.12, Windows x64.

```sh
npm ci
node node_modules/electron/install.js
npm run prepare:tools -- --cli "đường dẫn Arduino CLI chính thức"
npm test
npm start
npm run dist
```

Nguồn Arduino CLI có thể lấy từ bộ Arduino IDE đã cài, hoặc bản tải chính thức. Script chuẩn bị cài core arduino:avr 1.8.8 và Servo 1.3.0 trong resources riêng, không thay cấu hình Arduino IDE của người dùng. Tools, thư viện và giấy phép đi cùng được đóng gói trong resources/arduino. Arduino CLI: https://github.com/arduino/arduino-cli ; AVR core: https://github.com/arduino/ArduinoCore-avr ; AVR toolchain: https://github.com/arduino/toolchain-avr ; Servo: https://github.com/arduino-libraries/Servo . Các thư mục node_modules có giấy phép của Electron, SerialPort và các thư viện phụ thuộc.

`npm run dist` tạo hai file .exe trong release. Bản cài công khai cần quy trình ký số và kiểm thử driver/bootloader thực tế. Không tự thay thiết lập khởi động Windows; người dùng chọn trong ứng dụng nếu muốn. Bản portable không hỗ trợ tự khởi động.
