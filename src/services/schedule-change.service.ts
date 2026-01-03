import axios from 'axios';

// Types cho Schedule Change Request
export interface ScheduleChangeRequest {
  id: string;
  careSeekerId: string;
  caregiverId: string;
  originalScheduleId: string;
  originalDateTime: string;
  proposedDateTime: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  caregiverResponse?: string;
  createdAt: string;
  updatedAt: string;
  // Additional info for display
  caregiverName?: string;
  caregiverAvatar?: string;
  careSeekerName?: string;
  careSeekerAvatar?: string;
  serviceTitle?: string;
}

export interface CreateScheduleChangeRequest {
  careSeekerId: string;
  caregiverId: string;
  originalScheduleId: string;
  originalDateTime: string;
  proposedDateTime: string;
  reason: string;
}

// Base URL cho MockAPI
const API_BASE_URL = 'https://68aed258b91dfcdd62ba657c.mockapi.io';

// Service để tạo đề nghị đổi lịch
export const createScheduleChangeRequest = async (data: CreateScheduleChangeRequest): Promise<ScheduleChangeRequest> => {
  try {
    const response = await axios.post<ScheduleChangeRequest>(`${API_BASE_URL}/schedule-change-requests`, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo đề nghị đổi lịch:', error);
    throw error;
  }
};

// Service để lấy danh sách đề nghị đổi lịch của Care Seeker
export const getScheduleChangeRequests = async (careSeekerId: string): Promise<ScheduleChangeRequest[]> => {
  try {
    const response = await axios.get<ScheduleChangeRequest[]>(`${API_BASE_URL}/schedule-change-requests`);
    return response.data.filter(request => request.careSeekerId === careSeekerId);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đề nghị đổi lịch:', error);
    return [];
  }
};

// Service để lấy đề nghị đổi lịch từ Caregiver (chờ Care Seeker phản hồi)
export const getPendingScheduleChangeRequests = async (careSeekerId: string): Promise<ScheduleChangeRequest[]> => {
  try {
    const response = await axios.get<ScheduleChangeRequest[]>(`${API_BASE_URL}/schedule-change-requests`);
    return response.data.filter(request => 
      request.careSeekerId === careSeekerId && request.status === 'pending'
    );
  } catch (error) {
    console.error('Lỗi khi lấy đề nghị đổi lịch chờ phản hồi:', error);
    return [];
  }
};

// Service để cập nhật trạng thái đề nghị đổi lịch (cho Care Seeker chấp nhận/từ chối)
export const updateScheduleChangeRequestStatus = async (
  requestId: string, 
  status: ScheduleChangeRequest['status']
): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/schedule-change-requests/${requestId}`, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đề nghị đổi lịch:', error);
    throw error;
  }
};

// Service để hủy đề nghị đổi lịch
export const cancelScheduleChangeRequest = async (requestId: string): Promise<void> => {
  try {
    await updateScheduleChangeRequestStatus(requestId, 'cancelled');
  } catch (error) {
    console.error('Lỗi khi hủy đề nghị đổi lịch:', error);
    throw error;
  }
};

// Service để Care Seeker chấp nhận đề nghị đổi lịch từ Caregiver
export const acceptScheduleChangeRequest = async (requestId: string): Promise<void> => {
  try {
    await updateScheduleChangeRequestStatus(requestId, 'accepted');
  } catch (error) {
    console.error('Lỗi khi chấp nhận đề nghị đổi lịch:', error);
    throw error;
  }
};

// Service để Care Seeker từ chối đề nghị đổi lịch từ Caregiver
export const rejectScheduleChangeRequest = async (requestId: string): Promise<void> => {
  try {
    await updateScheduleChangeRequestStatus(requestId, 'rejected');
  } catch (error) {
    console.error('Lỗi khi từ chối đề nghị đổi lịch:', error);
    throw error;
  }
};

// Utility functions
export const formatDateTime = (dateTime: string): { date: string; time: string } => {
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString('vi-VN'),
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };
};

export const getStatusColor = (status: ScheduleChangeRequest['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
    case 'accepted':
      return 'bg-green-100 text-green-800 ring-green-600/20';
    case 'rejected':
      return 'bg-red-100 text-red-800 ring-red-600/20';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    default:
      return 'bg-gray-100 text-gray-800 ring-gray-600/20';
  }
};

export const getStatusText = (status: ScheduleChangeRequest['status']): string => {
  switch (status) {
    case 'pending':
      return 'Chờ phản hồi';
    case 'accepted':
      return 'Đã chấp nhận';
    case 'rejected':
      return 'Đã từ chối';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};
