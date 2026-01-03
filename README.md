# AI Elderly Care Platform

Nền tảng chăm sóc người cao tuổi thông minh - kết nối người cần chăm sóc với người chăm sóc.

## Tính năng

- **Đăng ký/Đăng nhập** với phân quyền theo vai trò
- **Dashboard riêng** cho từng loại người dùng (Admin, Caregiver, Care Seeker)
- **Quản lý người dùng** - thêm, sửa, khoá/mở khoá tài khoản
- **Blog** - chia sẻ kiến thức chăm sóc
- **Giao diện responsive** - dễ sử dụng trên mọi thiết bị

## Vai trò người dùng

- **Admin**: Quản lý hệ thống, người dùng, blog
- **Caregiver**: Người chăm sóc - quản lý lịch làm việc
- **Care Seeker**: Người cần chăm sóc - tìm kiếm dịch vụ
- **Guest**: Khách truy cập - xem thông tin chung

## Công nghệ

- React 18 + TypeScript
- TailwindCSS (UI)
- React Router v6 (Định tuyến)
- Axios + MockAPI (Backend)

## Cấu trúc dự án

```
src/
├── components/     # Header, Footer, UI components
├── pages/         # Các trang chính
├── services/      # API calls
├── routes/         # Cấu hình routing
└── layouts/        # Layout templates
```

## Chạy dự án

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Truy cập: http://localhost:5173

## Tài khoản test
- **Tạo tài khoản mới**: Đăng ký tại /register