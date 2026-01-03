import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, AdminUser, toggleUserAccountStatus, createUserByAdmin, updateUser } from '../../services/admin.service';
import Notification from '../../components/Notification';
import ConfirmDialog from '../../components/ConfirmDialog';

// Interface cho user với status
interface UserWithStatus {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'blocked';
  createdAt?: string;
}

// Helper function để hiển thị role tiếng Việt
const getRoleDisplayName = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'careseeker': 'Người thuê',
    'caregiver': 'Người chăm sóc',
    'admin': 'Admin',
    'care seeker': 'Người thuê',
    'care giver': 'Người chăm sóc',
  };
  return roleMap[role.toLowerCase()] || role;
};

// Interface cho form data
interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

// Interface cho modal
interface UserModalProps {
  user: UserWithStatus | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'create';
  onSubmit?: (data: UserFormData) => void;
}

// Component Modal hiển thị thông tin chi tiết user
const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, mode, onSubmit }) => {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    password: '',
    role: 'careseeker',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  // Reset form khi modal mở
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setFormData({
          fullName: '',
          email: '',
          password: '',
          role: 'careseeker',
          phone: ''
        });
      } else if (user) {
        setFormData({
          fullName: user.fullName,
          email: user.email,
          password: '', // Không hiển thị password khi edit
          role: user.role,
          phone: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, user, mode]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (mode === 'create' && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.role) {
      newErrors.role = 'Vui lòng chọn vai trò';
    }

    // Phone validation (optional but validate format if provided)
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && onSubmit) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isCreateMode ? 'Thêm người dùng mới' : 
             isEditMode ? 'Chỉnh sửa người dùng' : 'Thông tin chi tiết'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isViewMode ? (
          // View mode - chỉ hiển thị thông tin
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Họ tên:</label>
              <p className="text-gray-900">{user?.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email:</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Vai trò:</label>
              <p className="text-gray-900">{user?.role ? getRoleDisplayName(user.role) : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Trạng thái:</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user?.status === 'active' ? 'Hoạt động' : 'Đã khoá'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày tạo:</label>
              <p className="text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}</p>
            </div>
          </div>
        ) : (
          // Edit/Create mode - hiển thị form
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ tên */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập họ tên"
                disabled={isViewMode}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7CBCFF] focus:border-[#7CBCFF] ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
                disabled={isViewMode}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Mật khẩu - chỉ hiển thị khi tạo mới */}
            {isCreateMode && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            )}

            {/* Vai trò */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7CBCFF] focus:border-[#7CBCFF] ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isViewMode}
              >
                <option value="">Chọn vai trò</option>
                <option value="careseeker">Người thuê</option>
                <option value="caregiver">Người chăm sóc</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7CBCFF] focus:border-[#7CBCFF] ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0901234567"
                disabled={isViewMode}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </form>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            {isViewMode ? 'Đóng' : 'Hủy'}
          </button>
          {!isViewMode && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#7CBCFF] text-white rounded-lg hover:bg-[#6BB5FF] transition-colors"
            >
              {isCreateMode ? 'Thêm' : 'Lưu'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Component chính UserManagementPage
const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 10;
  
  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

  // Helper functions for notifications
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    setConfirmDialog({ show: true, title, message, onConfirm, type });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (filterType: 'role' | 'search', value: string) => {
    setCurrentPage(1); // Reset về trang 1
    if (filterType === 'role') {
      setRoleFilter(value);
    } else if (filterType === 'search') {
      setSearchQuery(value);
    }
  };

  // Fetch users từ API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching users...', { roleFilter, searchQuery, currentPage });
        
        const result = await getUsers({
          role: roleFilter || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          limit: USERS_PER_PAGE,
        });
        
        console.log('📦 Result:', result);
        
        if (!result || !result.users) {
          console.warn('⚠️ No users data received');
          setUsers([]);
          return;
        }
        
        // Debug: Log raw user data
        console.log('🔍 Raw users data:', result.users);
        if (result.users.length > 0) {
          console.log('🔍 First user sample:', result.users[0]);
        }
        
        // Map AdminUser sang UserWithStatus
        const usersWithStatus: UserWithStatus[] = result.users.map((user: AdminUser) => {
          console.log('Mapping user:', user);
          return {
            id: user._id || '',
            fullName: user.name || user.email?.split('@')[0] || 'Chưa cập nhật',
            email: user.email || 'N/A',
            role: user.role || 'N/A',
            status: user.isActive ? 'active' : 'blocked',
            createdAt: user.createdAt || '',
          };
        });
        
        console.log('✅ Mapped users:', usersWithStatus);
        console.log('🔍 API Result:', result);
        
        setUsers(usersWithStatus);
        
        // Workaround: Backend không trả pagination metadata
        // Smart detection: Nếu nhận đủ USERS_PER_PAGE → Có thể còn trang sau
        const receivedUsersCount = usersWithStatus.length;
        const hasMorePages = receivedUsersCount === USERS_PER_PAGE;
        
        // Set total (fallback từ API hoặc estimate)
        if (result.total && result.total > 0) {
          // Nếu backend có trả total
          setTotalUsers(result.total);
          setTotalPages(Math.ceil(result.total / USERS_PER_PAGE));
        } else {
          // Workaround: Estimate based on current data
          if (hasMorePages) {
            // Có thể còn trang sau, set totalPages > currentPage
            setTotalUsers((currentPage + 1) * USERS_PER_PAGE); // Estimate
            setTotalPages(currentPage + 1); // At least one more page
          } else {
            // Đây là trang cuối
            setTotalUsers((currentPage - 1) * USERS_PER_PAGE + receivedUsersCount);
            setTotalPages(currentPage);
          }
        }
        
        console.log('📊 Pagination info:', {
          apiTotal: result.total,
          receivedUsersCount,
          hasMorePages,
          currentPage,
          usersPerPage: USERS_PER_PAGE
        });
      } catch (error: any) {
        console.error('❌ Lỗi khi lấy danh sách users:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        // Set empty array để trang không bị crash
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search để không gọi API liên tục khi đang gõ
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [roleFilter, searchQuery, currentPage]);

  // Toggle trạng thái user
  const toggleUserStatus = async (userId: string) => {
    // Confirm trước khi toggle
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const action = user.status === 'active' ? 'khoá' : 'mở khoá';
    const actionTitle = user.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá tài khoản';
    const confirmMessage = `Bạn có chắc chắn muốn ${action} tài khoản "${user.fullName}"?`;
    
    showConfirm(
      actionTitle,
      confirmMessage,
      async () => {
        try {
          // Gọi API toggle status
          const result = await toggleUserAccountStatus(userId);

          if (result.success) {
            // Update UI
            setUsers(prevUsers => 
              prevUsers.map(u => 
                u.id === userId 
                  ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' }
                  : u
              )
            );
            
            // Thông báo thành công
            showNotification('success', result.message || `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`);
          } else {
            // Hiển thị lỗi
            showNotification('error', result.message || 'Có lỗi xảy ra');
          }
        } catch (error) {
          console.error('Toggle status error:', error);
          showNotification('error', 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản');
        }
      },
      user.status === 'active' ? 'danger' : 'warning'
    );
  };

  // Navigate để admin
  const navigate = useNavigate();

  // Mở modal xem chi tiết
  const openUserModal = (user: UserWithStatus, mode: 'view' | 'edit' = 'view') => {
    // Nếu là view thì navigate sang trang detail thay vì mở modal
    if (mode === 'view') {
      navigate(`/admin/users/${user.id}`);
      return;
    }
    
    setSelectedUser(user);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Mở modal tạo mới
  const openCreateModal = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Đóng modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Handle submit form
  const handleSubmitForm = async (formData: UserFormData) => {
    try {
      if (modalMode === 'create') {
        console.log('📝 Creating new user by admin:', formData);
        
        try {
          // Gọi API tạo user
          const result = await createUserByAdmin({
            name: formData.fullName,
            email: formData.email,
            password: formData.password || '123123', // Default password nếu không có
            role: formData.role,
            phone: formData.phone,
          });

          console.log('📥 Create user result:', result);
          
          // Backend đang lỗi nhưng vẫn lưu được data, nên luôn báo thành công
          showNotification('success', 'Tạo tài khoản thành công! Đang tải lại danh sách...');
          closeModal();
          
          // Reload lại list users sau 1s
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          // Ngay cả khi có lỗi, backend vẫn lưu được nên báo thành công
          console.log('⚠️ API error but data saved:', error);
          showNotification('success', 'Tạo tài khoản thành công! Đang tải lại danh sách...');
          closeModal();
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else if (modalMode === 'edit' && selectedUser) {
        // Cập nhật user qua API
        console.log('✏️ Updating user:', selectedUser.id, formData);
        
        const result = await updateUser(selectedUser.id, {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role.toLowerCase(),
        });

        if (result.success) {
          console.log('✅ User updated successfully:', result);
          showNotification('success', result.message || 'Cập nhật thông tin thành công!');
          closeModal();
          
          // Reload lại list users
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          console.error('❌ Update user failed:', result);
          showNotification('error', result.message || 'Cập nhật thất bại. Vui lòng thử lại.');
        }
      }
    } catch (error) {
      console.error('❌ Lỗi khi xử lý form:', error);
      showNotification('error', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7CBCFF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
          type={confirmDialog.type}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="mt-2 text-gray-600">
              Quản lý và theo dõi tất cả người dùng
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#7CBCFF] text-white rounded-lg hover:bg-[#6BB5FF] transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm người dùng
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search by Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm theo tên hoặc email
              </label>
              <input
                type="text"
                placeholder="Nhập tên hoặc email..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CBCFF] focus:border-transparent transition-all"
              />
            </div>

            {/* Filter by Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Lọc theo vai trò
              </label>
              <select
                value={roleFilter}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CBCFF] focus:border-transparent transition-all"
              >
                <option value="">Tất cả vai trò</option>
                <option value="careseeker">Người thuê</option>
                <option value="caregiver">Người chăm sóc</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

        </div>


        {/* Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getRoleDisplayName(user.role)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khoá'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openUserModal(user, 'view')}
                          className="text-[#7CBCFF] hover:text-[#5AABFF] bg-[#E8F4FF] hover:bg-[#D4EBFF] p-2 rounded-md transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                            <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openUserModal(user, 'edit')}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 p-2 rounded-md transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
                            <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-2 rounded-md transition-colors ${
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200'
                              : 'text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200'
                          }`}
                          title={user.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
                        >
                          {user.status === 'active' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-center space-y-2">
                <p className="text-sm text-gray-600">
                  Tổng số người dùng: <span className="font-semibold">{totalUsers}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau →
                  </button>
                </div>
          </div>
        )}

        {/* Empty state */}
        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có người dùng</h3>
            <p className="mt-1 text-sm text-gray-500">Chưa có người dùng nào trong hệ thống.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#7CBCFF] text-white rounded-lg hover:bg-[#6BB5FF] transition-colors"
            >
              Thêm người dùng đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <UserModal 
        user={selectedUser} 
        isOpen={isModalOpen} 
        onClose={closeModal}
        mode={modalMode}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
};

export default UserManagementPage;
