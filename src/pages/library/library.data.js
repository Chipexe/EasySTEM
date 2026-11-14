export const categories = [ ['all','🗂️','Tất cả tài liệu'], ['intro','🌱','Nhập môn STEM'], ['electronics','🔮','Điện tử cơ bản'], ['arduino','♾️','Arduino'], ['esp32','📶','ESP32'], ['stm32','🔹','STM32'], ['sensors','📡','Cảm biến & Thiết bị'], ['projects','🚀','Dự án thực hành'] ];
export const lessons = [
 { id:'arduino', title:'Làm quen với Arduino', level:'beginner', minutes:15, category:['intro','arduino'], art:0, color:'yellow', description:'Khám phá board Arduino Uno, các chân kết nối và cách bắt đầu dự án đầu tiên.' },
 { id:'led', title:'Điều khiển đèn LED', level:'beginner', minutes:20, category:['electronics','arduino'], art:1, color:'purple', description:'Tìm hiểu đèn LED và xây dựng chương trình bật, tắt đèn bằng khối lệnh.' },
 { id:'distance', title:'Cảm biến khoảng cách', level:'intermediate', minutes:25, category:['sensors','arduino'], art:2, color:'pink', description:'Làm quen với cảm biến siêu âm và tìm hiểu cách đo khoảng cách đến một vật.' },
 { id:'watering', title:'Tưới cây tự động', level:'intermediate', minutes:30, category:['projects','sensors'], art:3, color:'green', description:'Khám phá hệ thống tưới cây sử dụng cảm biến độ ẩm đất và máy bơm.' },
 { id:'traffic', title:'Đèn giao thông thông minh', level:'advanced', minutes:40, category:['projects','arduino'], art:4, color:'blue', description:'Kết hợp các đèn LED để thiết kế mô hình đèn giao thông theo trình tự.' },
 { id:'temperature', title:'Hệ thống cảnh báo nhiệt độ', level:'intermediate', minutes:35, category:['sensors','stm32'], art:5, color:'mint', description:'Tìm hiểu cách đọc nhiệt độ và đưa ra cảnh báo khi vượt ngưỡng.' },
 { id:'wifi', title:'Kết nối WiFi với ESP32', level:'advanced', minutes:45, category:['esp32'], art:6, color:'purple', description:'Khám phá khả năng kết nối không dây và ứng dụng IoT cùng ESP32.' },
 { id:'car', title:'Xe tự hành cơ bản', level:'advanced', minutes:50, category:['projects','arduino'], art:7, color:'orange', description:'Kết hợp động cơ và cảm biến để lên ý tưởng cho một chiếc xe tự hành.' }
];
export const levels = { beginner:'Cơ bản', intermediate:'Trung bình', advanced:'Nâng cao' };
