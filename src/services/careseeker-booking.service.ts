import axios from 'axios';

// Types cho Booking của Care Seeker
export interface CareSeekerBooking {
  id: string;
  careSeekerId: string;
  caregiverId: string;
  serviceType: 'home-care' | 'video-call';
  title: string;
  description: string;
  scheduledDateTime: string;
  duration: number; // in minutes
  address?: string; // for home-care
  notes?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rejected';
  price: number;
  createdAt: string;
  updatedAt: string;
  // Additional info for display
  caregiverName?: string;
  caregiverAvatar?: string;
  caregiverSpecialty?: string;
  caregiverRating?: number;
  elderlyPersonName?: string;
  elderlyPersonAge?: number;
  elderlyPersonRelationship?: string;
}

export interface CreateCareSeekerBookingRequest {
  careSeekerId: string;
  caregiverId: string;
  serviceType: 'home-care' | 'video-call';
  title: string;
  description: string;
  scheduledDateTime: string;
  duration: number;
  address?: string;
  notes?: string;
  price: number;
  elderlyPersonName: string;
  elderlyPersonAge: number;
  elderlyPersonRelationship: string;
}

export interface Caregiver {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  experience: string;
  experienceYears: number; // Thêm field này để tính toán
  pricePerHour: number;
  hourlyRate: number; // Alias cho pricePerHour để tương thích
  reviewCount: number; // Thêm field này
  isAvailable: boolean;
  availableTimes: string[];
}

// Base URL cho MockAPI
const API_BASE_URL = 'https://68aed258b91dfcdd62ba657c.mockapi.io';

// Mock data cho caregivers
const mockCaregivers: Caregiver[] = [
  {
    id: 'cg1',
    name: 'Nguyễn Thị Lan Anh',
    avatar: '👩‍⚕️',
    specialty: 'Chăm sóc tổng quát',
    rating: 4.8,
    experience: '5 năm kinh nghiệm',
    experienceYears: 5,
    pricePerHour: 250000,
    hourlyRate: 250000,
    reviewCount: 128,
    isAvailable: true,
    availableTimes: ['08:00-12:00', '14:00-18:00', '19:00-22:00']
  },
  {
    id: 'cg2',
    name: 'Trần Văn Minh',
    avatar: '👨‍⚕️',
    specialty: 'Vật lý trị liệu',
    rating: 4.9,
    experience: '7 năm kinh nghiệm',
    experienceYears: 7,
    pricePerHour: 300000,
    hourlyRate: 300000,
    reviewCount: 95,
    isAvailable: true,
    availableTimes: ['09:00-12:00', '15:00-18:00']
  },
  {
    id: 'cg3',
    name: 'Lê Thị Hương',
    avatar: '👩‍🍳',
    specialty: 'Dinh dưỡng',
    rating: 4.7,
    experience: '4 năm kinh nghiệm',
    experienceYears: 4,
    pricePerHour: 200000,
    hourlyRate: 200000,
    reviewCount: 76,
    isAvailable: true,
    availableTimes: ['08:00-11:00', '14:00-17:00']
  },
  {
    id: 'cg4',
    name: 'Phạm Văn Đức',
    avatar: '👨‍⚕️',
    specialty: 'Y tá',
    rating: 4.6,
    experience: '6 năm kinh nghiệm',
    experienceYears: 6,
    pricePerHour: 280000,
    hourlyRate: 280000,
    reviewCount: 112,
    isAvailable: true,
    availableTimes: ['07:00-12:00', '13:00-18:00']
  },
  {
    id: 'cg5',
    name: 'Hoàng Thị Mai',
    avatar: '👩‍⚕️',
    specialty: 'Chăm sóc tổng quát',
    rating: 4.5,
    experience: '3 năm kinh nghiệm',
    experienceYears: 3,
    pricePerHour: 220000,
    hourlyRate: 220000,
    reviewCount: 89,
    isAvailable: true,
    availableTimes: ['08:00-12:00', '14:00-18:00']
  },
  {
    id: 'cg6',
    name: 'Vũ Văn Hùng',
    avatar: '👨‍⚕️',
    specialty: 'Vật lý trị liệu',
    rating: 4.9,
    experience: '8 năm kinh nghiệm',
    experienceYears: 8,
    pricePerHour: 350000,
    hourlyRate: 350000,
    reviewCount: 156,
    isAvailable: true,
    availableTimes: ['09:00-12:00', '15:00-18:00', '19:00-21:00']
  },
  {
    id: 'cg7',
    name: 'Đặng Thị Linh',
    avatar: '👩‍⚕️',
    specialty: 'Y tá',
    rating: 4.8,
    experience: '5 năm kinh nghiệm',
    experienceYears: 5,
    pricePerHour: 260000,
    hourlyRate: 260000,
    reviewCount: 103,
    isAvailable: true,
    availableTimes: ['08:00-12:00', '14:00-18:00']
  },
  {
    id: 'cg8',
    name: 'Bùi Văn Tài',
    avatar: '👨‍⚕️',
    specialty: 'Dinh dưỡng',
    rating: 4.4,
    experience: '4 năm kinh nghiệm',
    experienceYears: 4,
    pricePerHour: 180000,
    hourlyRate: 180000,
    reviewCount: 67,
    isAvailable: true,
    availableTimes: ['09:00-12:00', '15:00-18:00']
  }
];

// Service để lấy danh sách caregivers
export const getCaregivers = async (): Promise<Caregiver[]> => {
  try {
    // Thử gọi API trước, nếu lỗi thì dùng mock data
    const response = await axios.get<Caregiver[]>(`${API_BASE_URL}/caregivers`);
    return response.data.length > 0 ? response.data : mockCaregivers;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách caregivers từ API, sử dụng mock data:', error);
    return mockCaregivers;
  }
};

// Service để tạo booking
export const createCareSeekerBooking = async (data: CreateCareSeekerBookingRequest): Promise<CareSeekerBooking> => {
  try {
    const response = await axios.post<CareSeekerBooking>(`${API_BASE_URL}/careseeker-bookings`, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo booking:', error);
    throw error;
  }
};

// Service để lấy danh sách bookings của Care Seeker
export const getCareSeekerBookings = async (careSeekerId: string): Promise<CareSeekerBooking[]> => {
  try {
    const response = await axios.get<CareSeekerBooking[]>(`${API_BASE_URL}/careseeker-bookings`);
    return response.data
      .filter(booking => booking.careSeekerId === careSeekerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bookings:', error);
    return [];
  }
};

// Service để hủy booking
export const cancelCareSeekerBooking = async (bookingId: string): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/careseeker-bookings/${bookingId}`, {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi hủy booking:', error);
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

export const getStatusColor = (status: CareSeekerBooking['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
    case 'confirmed':
      return 'bg-green-100 text-green-800 ring-green-600/20';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 ring-blue-600/20';
    case 'completed':
      return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    case 'cancelled':
      return 'bg-red-100 text-red-800 ring-red-600/20';
    case 'rejected':
      return 'bg-red-100 text-red-800 ring-red-600/20';
    default:
      return 'bg-gray-100 text-gray-800 ring-gray-600/20';
  }
};

export const getStatusText = (status: CareSeekerBooking['status']): string => {
  switch (status) {
    case 'pending':
      return 'Chờ xác nhận';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'in-progress':
      return 'Đang thực hiện';
    case 'completed':
      return 'Đã hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    case 'rejected':
      return 'Bị từ chối';
    default:
      return 'Không xác định';
  }
};

export const getServiceTypeText = (serviceType: CareSeekerBooking['serviceType']): string => {
  switch (serviceType) {
    case 'home-care':
      return 'Chăm sóc tại nhà';
    case 'video-call':
      return 'Tư vấn video call';
    default:
      return 'Không xác định';
  }
};

export const getServiceTypeIcon = (serviceType: CareSeekerBooking['serviceType']): string => {
  switch (serviceType) {
    case 'home-care':
      return '🏠';
    case 'video-call':
      return '📹';
    default:
      return '❓';
  }
};

