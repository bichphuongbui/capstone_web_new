import { api } from './api';

export interface ServiceTask {
  serviceTaskId?: string; // Optional for new tasks
  taskName: string;
  description: string;
  status?: string;
}

export interface Qualification {
  skills: string[];
  certificate_groups: string[][]; // Array of arrays for OR/AND logic
}

export interface ServicePackage {
  _id?: string; // For backward compatibility
  servicePackageId: string;
  packageName: string;
  description: string;
  durationHours: number;
  packageType: 'BASIC' | 'PROFESSIONAL' | 'ADVANCED';
  price: number;
  note: string | null;
  qualification: Qualification | string | null;
  status: 'ACTIVE' | 'INACTIVE';
  serviceTasks: ServiceTask[];
  totalCareServices: number;
  // Legacy fields for backward compatibility
  duration?: number;
  paymentCycle?: 'daily' | 'monthly' | 'hourly';
  services?: string[];
  customServices?: string[];
  notes?: string;
  isPopular?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetPackagesParams {
  packageType?: 'BASIC' | 'PROFESSIONAL' | 'ADVANCED' | 'basic' | 'professional' | 'premium';
  caregiverId?: string;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  limit?: number;
}

export interface GetPackagesResult {
  packages: ServicePackage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalPackages?: number;
  totalActivePackages?: number;
  totalBookings?: number;
  totalRevenue?: number;
}

/**
 * Lấy danh sách packages
 * GET /api/v1/service-packages
 */
export async function getPackages(params?: GetPackagesParams): Promise<GetPackagesResult> {
  try {
    console.log('Fetching packages with params:', params);

    const queryParams = new URLSearchParams();
    
    if (params?.packageType) {
      // Convert to uppercase if needed
      const type = params.packageType.toUpperCase();
      queryParams.append('packageType', type);
    }
    if (params?.caregiverId) queryParams.append('caregiverId', params.caregiverId);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `/api/v1/service-packages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await api.get(url);

    console.log(' Get packages response:', res.data);

    const responseData = res.data;
    const data = responseData.data || responseData;

    // Extract packages from the new API format
    const packages = data.packages || [];
    
    // Map packages to include backward compatibility
    const mappedPackages = packages.map((pkg: ServicePackage) => ({
      ...pkg,
      _id: pkg.servicePackageId,
      duration: pkg.durationHours,
      isActive: pkg.status === 'ACTIVE',
      services: pkg.serviceTasks?.map((task: ServiceTask) => task.taskName) || [],
      notes: pkg.note || '',
    }));

    return {
      packages: mappedPackages,
      total: data.totalPackages || packages.length,
      totalPackages: data.totalPackages,
      totalActivePackages: data.totalActivePackages,
      totalBookings: data.totalBookings,
      totalRevenue: data.totalRevenue,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil((data.totalPackages || packages.length) / (params?.limit || 10)),
    };
  } catch (error: any) {
    console.error(' Get packages error:', error);
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
  packageType: 'BASIC' | 'PROFESSIONAL' | 'ADVANCED' | 'basic' | 'professional' | 'premium';
  durationHours: number;
  note?: string;
  qualification?: Qualification | null;
  status?: 'ACTIVE' | 'INACTIVE';
  serviceTasks: ServiceTask[];
}

export interface UpdatePackagePayload {
  packageName?: string;
  description?: string;
  price?: number;
  packageType?: 'BASIC' | 'PROFESSIONAL' | 'ADVANCED';
  durationHours?: number;
  note?: string;
  qualification?: Qualification | null;
  status?: 'ACTIVE' | 'INACTIVE';
  serviceTasks?: ServiceTask[];
}

/**
 * Tạo package mới
 * POST /api/v1/service-packages
 */
export async function createPackage(payload: CreatePackagePayload): Promise<{ success: boolean; message?: string; package?: ServicePackage }> {
  try {
    console.log('Creating package:', payload);
    
    // Normalize packageType to uppercase
    const normalizedPayload = {
      ...payload,
      packageType: payload.packageType.toUpperCase() as 'BASIC' | 'PROFESSIONAL' | 'ADVANCED',
    };
    
    const res = await api.post('/api/v1/service-packages', normalizedPayload);
    console.log('Create package response:', res.data);
    
    const responseData = res.data;
    
    if (responseData.status === 'Success' && responseData.data) {
      const packageData = responseData.data;
      
      // Map response to ServicePackage format
      const mappedPackage: ServicePackage = {
        servicePackageId: packageData.servicePackageId,
        _id: packageData.servicePackageId,
        packageName: packageData.packageName,
        description: packageData.description,
        durationHours: packageData.durationHours,
        packageType: packageData.packageType,
        price: packageData.price,
        note: packageData.note,
        qualification: packageData.qualification,
        status: packageData.status,
        serviceTasks: packageData.serviceTasks,
        totalCareServices: packageData.totalCareServices,
        duration: packageData.durationHours,
        isActive: packageData.status === 'ACTIVE',
        services: packageData.serviceTasks?.map((task: ServiceTask) => task.taskName) || [],
        notes: packageData.note || '',
      };
      
      return {
        success: true,
        message: responseData.message || 'Tạo gói dịch vụ thành công',
        package: mappedPackage,
      };
    } else {
      return {
        success: false,
        message: responseData.message || 'Tạo gói dịch vụ thất bại',
      };
    }
  } catch (error: any) {
    console.error('Create package error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi tạo gói dịch vụ',
    };
  }
}

/**
 * Lấy package theo ID
 * GET /api/v1/public/service-package/:id
 */
export async function getPackageById(id: string): Promise<{ success: boolean; package?: ServicePackage; message?: string }> {
  try {
    console.log('Fetching package by ID:', id);
    const res = await api.get(`/api/v1/public/service-package/${id}`);
    console.log('Get package by ID response:', res.data);
    
    const responseData = res.data;
    const packageData = responseData.data;
    
    if (packageData) {
      // Map response to ServicePackage format
      const mappedPackage: ServicePackage = {
        servicePackageId: packageData.servicePackageId,
        _id: packageData.servicePackageId,
        packageName: packageData.packageName,
        description: packageData.description,
        durationHours: packageData.durationHours,
        packageType: packageData.packageType,
        price: packageData.price,
        note: packageData.note,
        qualification: packageData.qualification,
        status: packageData.status,
        serviceTasks: packageData.serviceTasks,
        totalCareServices: packageData.totalCareServices,
        // Backward compatibility fields
        duration: packageData.durationHours,
        isActive: packageData.status === 'ACTIVE',
        services: packageData.serviceTasks?.map((task: ServiceTask) => task.taskName) || [],
        notes: packageData.note || '',
      };
      
      return {
        success: true,
        package: mappedPackage,
      };
    }
    
    return {
      success: false,
      message: 'Không tìm thấy thông tin gói dịch vụ',
    };
  } catch (error: any) {
    console.error(' Get package by ID error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy thông tin gói dịch vụ',
    };
  }
}

/**
 * Cập nhật package
 * PUT /api/v1/service-packages/:id
 */
export async function updatePackage(id: string, payload: UpdatePackagePayload): Promise<{ success: boolean; message?: string; package?: ServicePackage }> {
  try {
    console.log('Updating package:', id, payload);
    
    // Normalize packageType to uppercase if provided
    const normalizedPayload = {
      ...payload,
      packageType: payload.packageType ? payload.packageType.toUpperCase() as 'BASIC' | 'PROFESSIONAL' | 'ADVANCED' : undefined,
    };
    
    const res = await api.put(`/api/v1/service-packages/${id}`, normalizedPayload);
    console.log('Update package response:', res.data);
    
    const responseData = res.data;
    
    if (responseData.status === 'Success' && responseData.data) {
      const packageData = responseData.data;
      
      // Khai báo biến để lưu dữ liệu gói dịch vụ sau khi map từ API response sang format UI cần.
      const mappedPackage: ServicePackage = {
        servicePackageId: packageData.servicePackageId,
        _id: packageData.servicePackageId,
        packageName: packageData.packageName,
        description: packageData.description,
        durationHours: packageData.durationHours,
        packageType: packageData.packageType,
        price: packageData.price,
        note: packageData.note,
        qualification: packageData.qualification,
        status: packageData.status,
        serviceTasks: packageData.serviceTasks,
        totalCareServices: packageData.totalCareServices,
        duration: packageData.durationHours,
        isActive: packageData.status === 'ACTIVE',
        services: packageData.serviceTasks?.map((task: ServiceTask) => task.taskName) || [],
        notes: packageData.note || '',
      };
      
      return {
        success: true,
        message: responseData.message || 'Cập nhật gói dịch vụ thành công',
        package: mappedPackage,
      };
    } else {
      return {
        success: false,
        message: responseData.message || 'Cập nhật gói dịch vụ thất bại',
      };
    }
  } catch (error: any) {
    console.error('Update package error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ',
    };
  }
}

/**
 * Toggle package active/block status
 * PUT /api/packages/:id/toggle=> thừa TỪ CODE CŨ
 */
export async function togglePackageStatus(id: string): Promise<{ success: boolean; message?: string; package?: ServicePackage }> {
  try {
    console.log('Toggling package status:', id);
    const res = await api.put(`/api/packages/${id}/toggle`);
    console.log('Toggle package status response:', res.data);
    
    return {
      success: true,
      message: res.data.message || 'Cập nhật trạng thái gói dịch vụ thành công',
      package: res.data.package || res.data.data,
    };
  } catch (error: any) {
    console.error('Toggle package status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái gói dịch vụ',
    };
  }
}

/**
 * Xoá package (soft delete)
 * DELETE /api/v1/service-packages/:id
 */
export async function deletePackage(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('Deleting package:', id);
    const res = await api.delete(`/api/v1/service-packages/${id}`);
    console.log('Delete package response:', res.data);
    
    return {
      success: true,
      message: res.data.message || 'Xoá gói dịch vụ thành công',
    };
  } catch (error: any) {
    console.error('Delete package error:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi xoá gói dịch vụ',
    };
  }
}

/**
 * Khôi phục package đã xóa (restore soft deleted)
 * PATCH /api/v1/service-packages/:id/restore
 */
export async function restorePackage(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('Restoring package:', id);
    const res = await api.patch(`/api/v1/service-packages/${id}/restore`);
    console.log('Restore package response:', res.data);
    
    return {
      success: true,
      message: res.data.message || 'Khôi phục gói dịch vụ thành công',
    };
  } catch (error: any) {
    console.error('Restore package error:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi khôi phục gói dịch vụ',
    };
  }
}

/**
 * Qualification Type Interface
 */
export interface QualificationType {
  qualificationTypeId: string;
  typeName: string;
  description: string;
  isActive: boolean;
}

/**
 * Lấy danh sách qualification types
 * GET /api/v1/public/qualification-types
 */
export async function getQualificationTypes(): Promise<{ success: boolean; data?: QualificationType[]; message?: string }> {
  try {
    console.log('📝 Fetching qualification types...');
    const res = await api.get('/api/v1/public/qualification-types');
    console.log('✅ Get qualification types response:', res.data);
    
    const responseData = res.data;
    
    if (responseData.status === 'Success' && responseData.data) {
      return {
        success: true,
        data: responseData.data,
      };
    } else {
      return {
        success: false,
        message: responseData.message || 'Không thể lấy danh sách chứng chỉ',
      };
    }
  } catch (error: any) {
    console.error('❌ Get qualification types error:', error);
    console.error('❌ Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách chứng chỉ',
    };
  }
}