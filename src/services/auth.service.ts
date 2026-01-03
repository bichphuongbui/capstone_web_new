import { api, setAccessToken } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface Profile {
  careSeekerProfileId?: string;
  caregiverProfileId?: string;
  fullName: string;
  phoneNumber: string;
  location: Location;
  birthDate: string;
  age: number;
  gender: string;
  avatarUrl: string;
  profileData: any;
}

export interface LoginResponse {
  code: string;
  message: string;
  token: string;
  refreshToken: string;
  accountId: string;
  email: string;
  roleName: string;
  avatarUrl: string;
  enabled: boolean;
  nonLocked: boolean;
  hasProfile: boolean;
  profile: Profile | null;
}

export interface LoginResult {
  token?: string;
  user?: any;
  raw: any;
}

function pickToken(raw: any): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return (
    raw.token ||
    raw.accessToken ||
    raw.jwt ||
    raw.idToken ||
    raw.data?.accessToken ||
    raw.data?.token ||
    raw.data?.jwt
  );
}

function pickUser(raw: any): any | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  
  // Handle new API response structure
  if (raw.accountId && raw.roleName) {
    // Map roleName to UI format
    const normalizeRole = (roleName: string): string => {
      const value = roleName.toString().trim().toUpperCase();
      if (value.includes('ADMIN')) return 'Admin';
      if (value.includes('CARE_SEEKER') || value.includes('CARESEEKER')) return 'Care Seeker';
      if (value.includes('CAREGIVER') || value.includes('CARE_GIVER')) return 'Caregiver';
      return 'Guest';
    };

    return {
      id: raw.accountId,
      fullName: raw.profile?.fullName || raw.email?.split('@')[0] || '',
      email: raw.email,
      role: normalizeRole(raw.roleName),
      avatarUrl: raw.avatarUrl,
      phoneNumber: raw.profile?.phoneNumber,
      location: raw.profile?.location,
      birthDate: raw.profile?.birthDate,
      age: raw.profile?.age,
      gender: raw.profile?.gender,
      enabled: raw.enabled,
      nonLocked: raw.nonLocked,
      hasProfile: raw.hasProfile,
      profileId: raw.profile?.careSeekerProfileId || raw.profile?.caregiverProfileId,
      status: raw.enabled && raw.nonLocked ? 'active' : 'pending',
    };
  }
  
  return raw.user || raw.account || raw.profile || raw.data?.user || raw.data?.account || raw.data?.profile;
}

export async function login(payload: LoginRequest): Promise<LoginResult> {
  const res = await api.post('/api/v1/accounts/login', {
    email: payload.email,
    password: payload.password,
  });

  console.log('🔐 Login response:', res.data);

  const raw = res.data;
  
  // Check for error response
  if (res.status >= 400 || raw.code === 'Error' || raw.error) {
    throw new Error(raw.message || 'Đăng nhập thất bại');
  }

  const token = pickToken(raw);
  const user = pickUser(raw) ?? (raw && typeof raw === 'object' ? raw : undefined);

  // Persist both access token and refresh token
  if (token) {
    setAccessToken(token);
  }
  
  if (raw.refreshToken) {
    localStorage.setItem('refreshToken', raw.refreshToken);
  }

  return { token, user, raw };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  phone?: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  email?: string;
  raw: any;
}

export async function register(payload: RegisterRequest): Promise<RegisterResult> {
  try {
    // Chuẩn hoá role theo format backend yêu cầu: "careseeker" hoặc "caregiver"
    const normalizedRole = (() => {
      const value = (payload.role || '').toString().trim().toLowerCase();
      if (['care seeker', 'care-seeker', 'careseeker', 'seeker'].includes(value)) return 'careseeker';
      if (['caregiver', 'care giver', 'care-giver'].includes(value)) return 'caregiver';
      return 'careseeker'; // default
    })();

    console.log('🚀 Sending register request:', {
      name: payload.name,
      email: payload.email,
      role: normalizedRole,
      phone: payload.phone,
    });

    const res = await api.post('/api/auth/register', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: normalizedRole,
      phone: payload.phone || '',
    });

    console.log('✅ Register response:', res.data);

    const raw = res.data;
    
    // Check nếu backend trả về error trong response body (dù status 200)
    if (raw.error || raw.success === false) {
      return {
        success: false,
        message: raw.message || raw.error || 'Có lỗi xảy ra khi đăng ký',
        raw,
      };
    }

    return {
      success: true,
      message: raw.message || 'Đăng ký thành công',
      email: payload.email,
      raw,
    };
  } catch (error: any) {
    console.error('❌ Register error:', error);
    console.error('Error response:', error.response?.data);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đăng ký',
      raw: error.response?.data,
    };
  }
}

export interface VerifyEmailRequest {
  email: string;
  verificationCode: string;
}

export interface VerifyEmailResult {
  success: boolean;
  message?: string;
  raw: any;
}

export async function verifyEmail(payload: VerifyEmailRequest): Promise<VerifyEmailResult> {
  try {
    const res = await api.post('/api/auth/verify-email', {
      email: payload.email,
      verificationCode: payload.verificationCode,
    });

    const raw = res.data;
    return {
      success: true,
      message: raw.message || 'Xác thực email thành công',
      raw,
    };
  } catch (error: any) {
    console.error('Verify email error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn',
      raw: error.response?.data,
    };
  }
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResult {
  success: boolean;
  message?: string;
  raw: any;
}

export async function resendVerificationCode(payload: ResendVerificationRequest): Promise<ResendVerificationResult> {
  try {
    console.log('🔄 Resending verification code to:', payload.email);

    const res = await api.post('/api/auth/resend-verification', {
      email: payload.email,
    });

    console.log('✅ Resend verification response:', res.data);

    const raw = res.data;
    return {
      success: true,
      message: raw.message || 'Đã gửi lại mã xác thực. Vui lòng kiểm tra email.',
      raw,
    };
  } catch (error: any) {
    console.error('❌ Resend verification error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại mã xác thực',
      raw: error.response?.data,
    };
  }
}


