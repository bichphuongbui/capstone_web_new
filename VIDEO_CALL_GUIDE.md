# Hướng dẫn sử dụng hệ thống Video Call

## Tổng quan

Hệ thống video call đã được tích hợp vào ứng dụng Elderly Home Care, cho phép Care Seeker và Caregiver tương tác trực tiếp qua video call với các tính năng:

- **Video call real-time** với controls (mic, camera, screen sharing)
- **Chat real-time** trong cuộc gọi
- **Quản lý session** và lịch sử cuộc gọi
- **Đồng bộ controls** giữa các bên tham gia

## Cấu trúc hệ thống

### 1. Services (`src/services/video-call.service.ts`)
- `createVideoCallSession()`: Tạo session video call mới
- `joinVideoCall()`: Tham gia cuộc gọi video
- `getVideoCallSessions()`: Lấy danh sách sessions
- `sendVideoCallMessage()`: Gửi tin nhắn trong cuộc gọi
- `updateVideoCallControls()`: Cập nhật controls (mic, cam, etc.)
- `endVideoCall()`: Kết thúc cuộc gọi

### 2. Components (`src/components/video/VideoCallRoom.tsx`)
- Component chung cho cả Care Seeker và Caregiver
- Giao diện video call với controls
- Chat real-time
- Responsive design

### 3. Pages
- **Caregiver**: `src/pages/caregiver/VideoCallPage.tsx`
- **Care Seeker**: `src/pages/careseeker/VideoConsultationPage.tsx`
- **Test**: `src/pages/VideoCallTestPage.tsx`

## Cách sử dụng

### 1. Test hệ thống
Truy cập: `http://localhost:5173/test/video-call`

- **Tạo session test**: Tạo session mới và vào với vai trò Caregiver
- **Join as Care Seeker**: Tham gia với Meeting ID có sẵn

### 2. Từ Caregiver
1. Vào **Video Requests** (`/care-giver/video-requests`)
2. Chấp nhận yêu cầu video call
3. Click **"Vào phòng video"** để bắt đầu cuộc gọi
4. Sử dụng controls để bật/tắt mic, camera, chia sẻ màn hình
5. Chat với Care Seeker trong sidebar

### 3. Từ Care Seeker
1. Vào **Video Consultation** (`/careseeker/video`)
2. Click **"Tham gia"** trên cuộc tư vấn đang diễn ra
3. Hoặc click **"Bắt đầu cuộc gọi video"** để tạo session mới
4. Sử dụng controls tương tự như Caregiver

## Tính năng chính

### Video Controls
- **Microphone**: Bật/tắt mic
- **Camera**: Bật/tắt camera
- **Screen Sharing**: Chia sẻ màn hình
- **Mute**: Tắt tiếng
- **End Call**: Kết thúc cuộc gọi

### Chat Real-time
- Gửi tin nhắn trong cuộc gọi
- Hiển thị tên người gửi và thời gian
- Auto-scroll đến tin nhắn mới

### Responsive Design
- Tối ưu cho desktop và mobile
- Chat có thể ẩn/hiện trên mobile
- Controls responsive

## Cấu hình

### MockAPI Endpoints
- `GET /video-calls`: Lấy danh sách sessions
- `POST /video-calls`: Tạo session mới
- `PUT /video-calls/:id`: Cập nhật session
- `GET /video-call-messages`: Lấy tin nhắn
- `POST /video-call-messages`: Gửi tin nhắn

### LocalStorage Keys
- `video_controls_${sessionId}`: Lưu trạng thái controls
- `current_user`: Thông tin user hiện tại

## Events
- `video-controls-updated`: Khi controls thay đổi
- `video-call-ended`: Khi cuộc gọi kết thúc
- `auth:changed`: Khi user đăng nhập/đăng xuất

## Troubleshooting

### Lỗi thường gặp
1. **"Không tìm thấy Meeting ID"**: Kiểm tra URL có đúng meetingId không
2. **"Vui lòng đăng nhập"**: Đảm bảo user đã đăng nhập
3. **"Không có quyền tham gia"**: Kiểm tra user role và session permissions

### Debug
- Mở Developer Tools để xem console logs
- Kiểm tra localStorage có dữ liệu user không
- Verify API endpoints hoạt động

## Phát triển thêm

### Thêm tính năng
1. **Recording**: Ghi lại cuộc gọi
2. **File sharing**: Chia sẻ file trong cuộc gọi
3. **Whiteboard**: Bảng trắng tương tác
4. **Breakout rooms**: Chia nhóm trong cuộc gọi

### Tích hợp WebRTC
- Thay thế mock video bằng WebRTC thực
- Sử dụng libraries như Simple-peer, Socket.io
- Implement signaling server

## Kết luận

Hệ thống video call đã được tích hợp hoàn chỉnh với giao diện thân thiện và tính năng đầy đủ. Có thể sử dụng ngay để test và phát triển thêm các tính năng nâng cao.


