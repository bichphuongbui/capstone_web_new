import { api } from './api';

export interface ServicePackage {
  _id: string;
  packageName: string;
  description: string;
  price: number;
  packageType: 'basic' | 'professional' | 'premium';
  duration: number;
  paymentCycle: 'daily' | 'monthly' | 'hourly';
  services: string[];
  customServices?: string[];
  notes?: string;
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetPackagesParams {
  packageType?: 'basic' | 'professional' | 'premium';
  caregiverId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GetPackagesResult {
  packages: ServicePackage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lấy danh sách packages
 * GET /api/packages
 */
export async function getPackages(params?: GetPackagesParams): Promise<GetPackagesResult> {
  try {
    console.log('📦 Fetching packages with params:', params);

    const queryParams = new URLSearchParams();
    
    if (params?.packageType) queryParams.append('packageType', params.packageType);
    if (params?.caregiverId) queryParams.append('caregiverId', params.caregiverId);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `/api/packages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await api.get(url);

    console.log('✅ Get packages response:', res.data);

    const data = res.data;

    // Map response về format chuẩn
    return {
      packages: data.data || data.packages || [],
      total: data.total || (data.data?.length || 0),
      page: data.currentPage || data.page || 1,
      limit: data.limit || data.pageSize || 10,
      totalPages: data.totalPages || Math.ceil((data.total || 0) / (data.limit || 10)) || 1,
    };
  } catch (error: any) {
    console.error('❌ Get packages error:', error);
    console.error('Error response:', error.response?.data);
    
    // Return empty result nếu có lỗi
    return {
      packages: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
}

export interface CreatePackagePayload {
  packageName: string;
  description: string;
  price: number;
  packageType: 'basic' | 'professional' | 'premium';
  duration: number;
  paymentCycle: 'daily' | 'monthly' | 'hourly';
  services: string[];
  customServices?: string[];
  notes?: string;
  isPopular?: boolean;
}

/**
 * Tạo package mới
 * POST /api/packages
 */
export async function createPackage(payload: CreatePackagePayload): Promise<{ success: boolean; message?: string; package?: ServicePackage }> {
  try {
    console.log('📦 Creating package:', payload);
    const res = await api.post('/api/packages', payload);
    console.log('✅ Create package response:', res.data);
    
    if (res.status >= 200 && res.status < 300) {
      return {
        success: true,
        message: res.data.message || 'Tạo gói dịch vụ thành công',
        package: res.data.package || res.data.data,
      };
    } else {
      return {
        success: false,
        message: res.data.message || 'Tạo gói dịch vụ thất bại',
      };
    }
  } catch (error: any) {
    console.error('❌ Create package error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi tạo gói dịch vụ',
    };
  }
}

/**
 * Lấy package theo ID
 * GET /api/packages/:id
 */
export async function getPackageById(id: string): Promise<{ success: boolean; package?: ServicePackage; message?: string }> {
  try {
    console.log('📦 Fetching package by ID:', id);
    const res = await api.get(`/api/packages/${id}`);
    console.log('✅ Get package by ID response:', res.data);
    
    return {
      success: true,
      package: res.data.data || res.data.package || res.data,
    };
  } catch (error: any) {
    console.error('❌ Get package by ID error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy thông tin gói dịch vụ',
    };
  }
}

/**
 * Cập nhật package
 * PUT /api/packages/:id
 */
export async function updatePackage(id: string, payload: Partial<CreatePackagePayload>): Promise<{ success: boolean; message?: string; package?: ServicePackage }> {
  try {
    console.log('📦 Updating package:', id, payload);
    const res = await api.put(`/api/packages/${id}`, payload);
    console.log('✅ Update package response:', res.data);
    
    return {
      success: true,
      message: res.data.message || 'Cập nhật gói dịch vụ thành công',
      package: res.data.package || res.data.data,
    };
  } catch (error: any) {
    console.error('❌ Update package error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ',
    };
  }
}

/**
 * Toggle package active/block status
 * PUT /api/packages/:id/toggle
 */
export async function togglePackageStatus(id: string): Promise<{ success: boolean; message?: string; package?: ServicePackage }> {
  try {
    console.log('📦 Toggling package status:', id);
    const res = await api.put(`/api/packages/${id}/toggle`);
    console.log('✅ Toggle package status response:', res.data);
    
    return {
      success: true,
      message: res.data.message || 'Cập nhật trạng thái gói dịch vụ thành công',
      package: res.data.package || res.data.data,
    };
  } catch (error: any) {
    console.error('❌ Toggle package status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái gói dịch vụ',
    };
  }
}

/**
 * Xoá package
 * DELETE /api/packages/:id
 */
export async function deletePackage(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.delete(`/api/packages/${id}`);
    return {
      success: true,
      message: res.data.message || 'Xoá gói dịch vụ thành công',
    };
  } catch (error: any) {
    console.error('Delete package error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi xoá gói dịch vụ',
    };
  }
}

