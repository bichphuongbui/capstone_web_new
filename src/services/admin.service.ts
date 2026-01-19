import { api } from './api';

// Types
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  avatar?: string;
}

export interface Certificate {
  _id: string;
  userId: string;
  caregiver?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  caregiverProfile?: {
    _id: string;
    user: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    permanentAddress?: string;
    temporaryAddress?: string;
    idCardNumber?: string;
    idCardFrontImage?: string;
    idCardBackImage?: string;
    yearsOfExperience?: number;
    workHistory?: string;
    education?: string;
    profileImage?: string;
    bio?: string;
    profileStatus?: string;
  };
  userName?: string;
  userEmail?: string;
  name?: string;
  certificateName?: string;
  certificateType: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  expirationDate?: string;
  certificateUrl?: string;
  certificateImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
}

export interface CaregiverProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  permanentAddress: string;
  temporaryAddress: string;
  idCardNumber: string;
  idCardFrontImage: string;
  idCardBackImage: string;
  yearsOfExperience: number;
  workHistory: string;
  education: string;
  universityDegreeImage?: string;
  certificates: {
    name: string;
    issueDate: string;
    expirationDate?: string;
    issuingOrganization: string;
    certificateType: string;
    certificateImage: string;
    _id: string;
  }[];
  profileImage: string;
  bio: string;
  agreeToEthics: boolean;
  agreeToTerms: boolean;
  profileStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface GetCertificatesParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface GetCertificatesResponse {
  certificates: Certificate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetCaregiverProfilesParams {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

export interface GetCaregiverProfilesResponse {
  profiles: CaregiverProfile[];
  total: number;
  currentPage: number;
  totalPages: number;
}

// New types for pending verification caregivers
export interface PendingCaregiver {
  caregiverProfileId: string;
  fullName: string;
  phoneNumber: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    service_radius_km?: number;
  };
  bio: string;
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  isNeededReviewCertificate: boolean;
  acceptedAt: string | null;
  declinedAt: string | null;
  reviewedBy: string | null;
  birthDate: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  profileData: {
    citizen_id?: string;
    citizen_id_front_image_url?: string;
    citizen_id_back_image_url?: string;
    preferences?: {
      elderly_age_preference?: {
        max_age: number;
        min_age: number;
      };
      preferred_health_status?: string;
    };
    free_schedule?: {
      booked_slots: Array<{
        date: string;
        end_time: string;
        start_time: string;
      }>;
      available_all_time?: boolean;
    };
    ratings_reviews?: {
      total_reviews: number;
      overall_rating: number;
      rating_breakdown: {
        '1_star': number;
        '2_star': number;
        '3_star': number;
        '4_star': number;
        '5_star': number;
      };
    };
    years_experience?: number;
    max_hours_per_week?: number;
    experience?: string;
    certifications?: string[];
    specializations?: string[];
  };
  accountId: string;
  email: string;
  avatarUrl: string;
  enabled: boolean;
  nonLocked: boolean;
  qualifications: Array<{
    qualificationId: string;
    qualificationTypeId: string;
    qualificationTypeName: string;
    certificateNumber: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate: string;
    certificateUrl: string;
    isVerified: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    acceptedAt: string | null;
    declinedAt: string | null;
    reviewedBy: string | null;
    notes: string;
  }>;
}

export interface GetPendingCaregiversResponse {
  status: string;
  message: string;
  data: PendingCaregiver[];
}

export interface GetUsersParams {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lấy danh sách users (Admin only)
 * GET /api/profiles/users
 */
export async function getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
  try {
    console.log('📋 Fetching users with params:', params);

    const queryParams = new URLSearchParams();
    
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `/api/profiles/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await api.get(url);

    console.log('✅ Get users response:', res.data);

    const data = res.data;

    // Map response về format chuẩn
    return {
      users: data.users || data.data || [],
      total: data.total || data.totalUsers || 0,
      page: data.page || data.currentPage || 1,
      limit: data.limit || data.pageSize || 10,
      totalPages: data.totalPages || Math.ceil((data.total || 0) / (data.limit || 10)),
    };
  } catch (error: any) {
    console.error('❌ Get users error:', error);
    console.error('Error response:', error.response?.data);
    
    // Return empty result nếu có lỗi
    return {
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
}

/**
 * Lấy thông tin chi tiết user theo ID (Admin only)
 * GET /api/profiles/users/:id
 */
export async function getUserById(userId: string): Promise<AdminUser | null> {
  try {
    console.log('👤 Fetching user:', userId);

    const res = await api.get(`/api/profiles/users/${userId}`);

    console.log('✅ Get user response:', res.data);

    return res.data.user || res.data.data || res.data;
  } catch (error: any) {
    console.error('❌ Get user error:', error);
    return null;
  }
}

/**
 * Cập nhật trạng thái user (Admin only)
 * PATCH /api/profiles/users/:id/status
 */
export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔄 Updating user status:', { userId, isActive });

    const res = await api.patch(`/api/profiles/users/${userId}/status`, {
      isActive,
    });

    console.log('✅ Update status response:', res.data);

    return {
      success: true,
      message: res.data.message || 'Cập nhật trạng thái thành công',
    };
  } catch (error: any) {
    console.error('❌ Update status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái',
    };
  }
}

/**
 * Toggle trạng thái user (block/activate) (Admin only)
 * PUT /api/profiles/users/:userId/toggle-status
 */
export async function toggleUserAccountStatus(
  userId: string
): Promise<{ success: boolean; message?: string; user?: AdminUser }> {
  try {
    console.log('🔀 Toggling user status:', userId);

    const res = await api.put(`/api/profiles/users/${userId}/toggle-status`);

    console.log('✅ Toggle status response:', res.data);

    return {
      success: true,
      message: res.data.message || 'Cập nhật trạng thái thành công',
      user: res.data.user || res.data.data,
    };
  } catch (error: any) {
    console.error('❌ Toggle status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái',
    };
  }
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

/**
 * Tạo user mới (Admin only)
 * POST /api/profiles/users
 */
export async function createUserByAdmin(
  payload: CreateUserPayload
): Promise<{ success: boolean; message?: string; user?: AdminUser }> {
  try {
    console.log('👤 Creating user by admin:', payload);

    const res = await api.post('/api/profiles/users', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role.toLowerCase(), // Chuẩn hóa role
      phone: payload.phone || '',
    });

    console.log('✅ Create user response:', res.data);

    if (res.status >= 200 && res.status < 300) {
      return {
        success: true,
        message: res.data.message || 'Tạo tài khoản thành công',
        user: res.data.user || res.data.data || res.data,
      };
    } else {
      return {
        success: false,
        message: res.data.message || 'Tạo tài khoản thất bại',
      };
    }
  } catch (error: any) {
    console.error('❌ Create user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản',
    };
  }
}

/**
 * Cập nhật thông tin user (Admin only)
 * PUT /api/profiles/users/:userId
 */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<{ success: boolean; message?: string; user?: AdminUser }> {
  try {
    console.log('✏️ Updating user:', { userId, payload });

    const res = await api.put(`/api/profiles/users/${userId}`, payload);

    console.log('✅ Update user response:', res.data);

    return {
      success: true,
      message: res.data.message || 'Cập nhật thông tin thành công',
      user: res.data.user || res.data.data || res.data,
    };
  } catch (error: any) {
    console.error('❌ Update user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin',
    };
  }
}

/**
 * Xoá user (Admin only)
 * DELETE /api/profiles/users/:id
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🗑️ Deleting user:', userId);

    const res = await api.delete(`/api/profiles/users/${userId}`);

    console.log('✅ Delete user response:', res.data);

    return {
      success: true,
      message: res.data.message || 'Xoá user thành công',
    };
  } catch (error: any) {
    console.error('❌ Delete user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi xoá user',
    };
  }
}

/**
 * Lấy danh sách chứng chỉ pending (Admin only)
 * GET /api/certificates/admin/pending
 */
export async function getPendingCertificates(params?: GetCertificatesParams): Promise<GetCertificatesResponse> {
  try {
    console.log('📋 Fetching pending certificates with params:', params);

    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `/api/certificates/admin/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await api.get(url);

    console.log('✅ Get certificates response:', res.data);

    const data = res.data;

    // Map response về format chuẩn
    const certificates = data.certificates || data.data || [];
    const total = data.total || data.count || certificates.length || 0;
    const limit = data.limit || data.pageSize || params?.limit || 10;
    const page = data.page || data.currentPage || params?.page || 1;
    
    return {
      certificates,
      total,
      page,
      limit,
      totalPages: data.totalPages || Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error('❌ Get certificates error:', error);
    console.error('Error response:', error.response?.data);
    
    // Return empty result nếu có lỗi
    return {
      certificates: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
}

/**
 * Lấy chi tiết chứng chỉ (Admin only)
 * GET /api/certificates/{id}
 */
export async function getCertificateDetail(certificateId: string): Promise<Certificate> {
  try {
    console.log('📋 Fetching certificate detail:', certificateId);
    
    const res = await api.get(`/api/certificates/${certificateId}`);
    
    console.log('✅ Get certificate detail response:', res.data);
    
    return res.data.data;
  } catch (error: any) {
    console.error('❌ Get certificate detail error:', error);
    throw error;
  }
}

/**
 * Duyệt/Từ chối chứng chỉ (Admin only)
 * PUT /api/certificates/{id}/review
 */
export async function reviewCertificate(certificateId: string, data: {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  try {
    console.log('📝 Reviewing certificate:', certificateId, data);
    
    const res = await api.put(`/api/certificates/${certificateId}/review`, data);
    
    console.log('✅ Review certificate response:', res.data);
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Review certificate error:', error);
    throw error;
  }
}

/**
 * Lấy danh sách caregiver profiles (Admin only)
 * GET /api/caregivers/profiles
 */
export async function getCaregiverProfiles(params?: GetCaregiverProfilesParams): Promise<GetCaregiverProfilesResponse> {
  try {
    console.log('👥 Fetching caregiver profiles with params:', params);

    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `/api/caregivers/profiles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await api.get(url);

    console.log('✅ Get caregiver profiles response:', res.data);

    const data = res.data;

    return {
      profiles: data.data || [],
      total: data.total || 0,
      currentPage: data.currentPage || params?.page || 1,
      totalPages: data.totalPages || 1,
    };
  } catch (error: any) {
    console.error('❌ Get caregiver profiles error:', error);
    console.error('Error response:', error.response?.data);
    
    return {
      profiles: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
    };
  }
}

/**
 * Lấy chi tiết caregiver profile (Admin only)
 * GET /api/caregivers/profile/{id}/admin
 */
export async function getCaregiverProfileDetail(profileId: string): Promise<{
  success: boolean;
  data?: {
    user?: {
      name: string;
      email: string;
    };
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    permanentAddress: string;
    temporaryAddress: string;
    idCardNumber: string;
    idCardFrontImage?: string;
    idCardBackImage?: string;
    yearsOfExperience: number;
    workHistory: string;
    education: string;
    bio: string;
    agreeToEthics: boolean;
    agreeToTerms: boolean;
    certificates: {
      name: string;
      issueDate: string;
      issuingOrganization: string;
      certificateType: string;
    }[];
  };
}> {
  try {
    console.log('👤 Fetching caregiver profile detail:', profileId);
    
    const res = await api.get(`/api/caregivers/profile/${profileId}/admin`);
    
    console.log('✅ Get caregiver profile detail response:', res.data);
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Get caregiver profile detail error:', error);
    throw error;
  }
}

/**
 * Approve/Reject caregiver profile (Admin only)
 * PUT /api/caregivers/profile/{id}/status
 */
export async function updateCaregiverProfileStatus(
  profileId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    console.log('📝 Updating caregiver profile status:', { profileId, status, rejectionReason });
    
    const res = await api.put(`/api/caregivers/profile/${profileId}/status`, {
      status,
      rejectionReason: rejectionReason || undefined
    });
    
    console.log('✅ Update caregiver profile status response:', res.data);
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Update caregiver profile status error:', error);
    throw error;
  }
}

// Dashboard
export interface UsersByRoleData {
  role: string;
  label: string;
  count: number;
  percentage: string;
}

export interface UsersByRoleResponse {
  success: boolean;
  data: {
    users: UsersByRoleData[];
    total: number;
  };
}

export async function getUsersByRole(): Promise<UsersByRoleResponse> {
  try {
    const res = await api.get('/api/dashboard/users/by-role');
    return res.data;
  } catch (error: any) {
    console.error('❌ Get users by role error:', error);
    throw error;
  }
}

export interface BookingStatistic {
  date: string;
  pending: number;
  confirmed: number;
  'in-progress': number;
  completed: number;
  cancelled: number;
  total: number;
  totalRevenue: number;
}

export interface BookingsStatisticsResponse {
  success: boolean;
  data: {
    period: string;
    status: string;
    startDate: string;
    endDate: string;
    bookings: BookingStatistic[];
  };
}

export async function getBookingsStatistics(params?: {
  period?: 'day' | 'week' | 'month';
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<BookingsStatisticsResponse> {
  try {
    const res = await api.get('/api/dashboard/bookings/statistics', { params });
    return res.data;
  } catch (error: any) {
    console.error('❌ Get bookings statistics error:', error);
    throw error;
  }
}

export interface UserStatisticsData {
  totalRegisteredUsers: number;
  totalUnverifiedUsers: number;
  totalCaregivers: number;
  totalCareSeekers: number;
  unverifiedCaregivers: number;
  unverifiedCareSeekers: number;
}

export interface UserStatisticsResponse {
  status: string;
  message: string;
  data: UserStatisticsData;
}

export async function getUserStatistics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<UserStatisticsResponse> {
  try {
    const res = await api.get('/api/v1/statistics/users', { params });
    return res.data;
  } catch (error: any) {
    console.error('❌ Get user statistics error:', error);
    throw error;
  }
}

export interface CaregiverStatisticsData {
  totalCaregivers: number;
  pendingVerificationCaregivers: number;
}

export interface CaregiverStatisticsResponse {
  status: string;
  message: string;
  data: CaregiverStatisticsData;
}

export async function getCaregiverStatistics(): Promise<CaregiverStatisticsResponse> {
  try {
    const res = await api.get('/api/v1/statistics/caregivers');
    return res.data;
  } catch (error: any) {
    console.error('❌ Get caregiver statistics error:', error);
    throw error;
  }
}

// Feedback Dashboard Statistics Types
export interface FeedbackOverview {
  targetType: string;
  totalFeedback: number;
  averageRating: number;
}

export interface DetailedCriteria {
  criteriaName: string;
  totalFeedback: number;
  averageRating: number;
}

export interface CaregiverFeedbackDetails {
  averageRating: number;
  totalFeedback: number;
  detailedCriteria: DetailedCriteria[];
}

export interface CareSeekerFeedbackDetails {
  totalFeedback: number;
  averageRating: number;
}

export interface ServiceDetails {
  caregiverDetails: CaregiverFeedbackDetails;
  careSeekerDetails: CareSeekerFeedbackDetails;
}

export interface TopCaregiver {
  caregiverId: string;
  caregiverName: string;
  caregiverEmail: string;
  overallRating: number;
  totalFeedback: number;
}

export interface FeedbackDashboardData {
  overview: FeedbackOverview[];
  serviceDetails: ServiceDetails;
  topCaregivers: TopCaregiver[];
}

export interface FeedbackDashboardResponse {
  status: string;
  message: string;
  data: FeedbackDashboardData;
}

/**
 * Get feedback dashboard statistics
 * GET /api/v1/statistics/feedback
 */
export async function getFeedbackDashboardStatistics(): Promise<FeedbackDashboardResponse> {
  try {
    const res = await api.get('/api/v1/statistics/feedback');
    return res.data;
  } catch (error: any) {
    console.error('❌ Get feedback dashboard statistics error:', error);
    throw error;
  }
}

/**
 * Get pending verification caregivers
 * GET /api/v1/verifications/caregivers/pending
 */
export async function getPendingVerificationCaregivers(): Promise<GetPendingCaregiversResponse> {
  try {
    const res = await api.get('/api/v1/verifications/caregivers/pending');
    return res.data;
  } catch (error: any) {
    console.error('❌ Get pending verification caregivers error:', error);
    throw error;
  }
}

/**
 * Approve or reject a qualification (certificate)
 * PUT /api/v1/verifications/qualifications/{qualificationId}
 */
export async function verifyQualification(
  qualificationId: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string
): Promise<GetPendingCaregiversResponse> {
  try {
    const res = await api.put(`/api/v1/verifications/qualifications/${qualificationId}`, {
      action,
      rejectionReason,
    });
    return res.data;
  } catch (error: any) {
    console.error('❌ Verify qualification error:', error);
    throw error;
  }
}

/**
 * Approve or reject a caregiver profile
 * PUT /api/v1/verifications/caregivers/{caregiverProfileId}
 */
export async function verifyCaregiverProfile(
  caregiverProfileId: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string
): Promise<GetPendingCaregiversResponse> {
  try {
    const res = await api.put(`/api/v1/verifications/caregivers/${caregiverProfileId}`, {
      action,
      rejectionReason,
    });
    return res.data;
  } catch (error: any) {
    console.error('❌ Verify caregiver profile error:', error);
    throw error;
  }
}
