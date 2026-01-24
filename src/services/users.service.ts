import axios from 'axios';
import { login as loginApi } from './auth.service';

// Types cho API
export interface RegisterUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
  status?: string;
  credentials?: string;
  credentialImage?: string;
}

// Base URL cho MockAPI
const API_BASE_URL = 'https://68aed258b91dfcdd62ba657c.mockapi.io';

// Service để lấy tất cả users từ API
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get<User[]>(`${API_BASE_URL}/users`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách users:', error);
    return [];
  }
};

// Service để kiểm tra email đã tồn tại
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const users = await getAllUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Lỗi khi kiểm tra email:', error);
    return false;
  }
};

// Service để đăng nhập user
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    // login bằng Backend thật (POST /api/v1/accounts/login)
    const { user } = await loginApi({ email, password });
    if (!user || typeof user !== 'object') return null;

    // Map dữ liệu backend về format User mà UI đang dùng
    const mapped: User = {
      id: String((user as any).id ?? (user as any)._id ?? (user as any).userId ?? (user as any).accountId ?? ''),
      fullName: String((user as any).fullName ?? (user as any).name ?? (user as any).fullname ?? ''),
      email: String((user as any).email ?? email),
      role: String((user as any).role ?? (user as any).userRole ?? (user as any).type ?? 'Guest'),
      createdAt: String((user as any).createdAt ?? (user as any).created_at ?? new Date().toISOString()),
      status: (user as any).status ?? ((user as any).enabled && (user as any).nonLocked ? 'active' : 'pending'),
      credentials: (user as any).credentials,
      credentialImage: (user as any).credentialImage ?? (user as any).credential_image,
    };

    return mapped;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return null;
  }
}

// Service để đăng ký user
export const registerUser = async (data: RegisterUserPayload): Promise<User> => {
  try {
    const response = await axios.post<User>(`${API_BASE_URL}/users`, {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      // Lưu role theo chuẩn để routing/permission không lỗi
      role: (() => {
        const value = data.role?.toString().trim().toLowerCase();
        if (['care seeker', 'care-seeker', 'careseeker', 'seeker'].includes(value)) return 'Care Seeker';
        if (['caregiver', 'care giver', 'care-giver'].includes(value)) return 'Caregiver';
        if (['admin', 'administrator'].includes(value)) return 'Admin';
        return 'Guest';
      })(),
      createdAt: new Date().toISOString()
    });
    
    return response.data;
  } catch (error) {
    // Log lỗi để debug
    console.error('Lỗi khi đăng ký user:', error);
    
    // Throw lỗi để component có thể xử lý
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    }
    
    throw new Error('Có lỗi không xác định xảy ra');
  }
};
