import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, AdminUser, updateUser, UpdateUserPayload } from '../../services/admin.service';
import Notification from '../../components/Notification';
import ConfirmDialog from '../../components/ConfirmDialog';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    isActive: true,
    isEmailVerified: false,
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: '',
  });
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        setError('User ID không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('👤 Loading user:', userId);
        
        const userData = await getUserById(userId);
        
        if (userData) {
          console.log('✅ User data:', userData);
          setUser(userData);
          setEditForm({
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            role: userData.role,
            isActive: userData.isActive,
            isEmailVerified: userData.isEmailVerified || false,
          });
        } else {
          setError('Không tìm thấy người dùng');
        }
      } catch (err) {
        console.error('❌ Load user error:', err);
        setError('Có lỗi xảy ra khi tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      if (user) {
        setEditForm({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified || false,
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      setShowConfirmSave(false);
      
      const payload: UpdateUserPayload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role.toLowerCase(),
        isActive: editForm.isActive,
        isEmailVerified: editForm.isEmailVerified,
      };

      console.log('📤 Sending update request:', { userId, payload });
      const result = await updateUser(userId, payload);
      console.log('📥 Update result:', result);

      if (result.success) {
        showNotification('success', result.message || 'Cập nhật thông tin thành công!');
        setIsEditing(false);
        
        // Reload user data
        const updatedUser = await getUserById(userId);
        if (updatedUser) {
          setUser(updatedUser);
          setEditForm({
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone || '',
            role: updatedUser.role,
            isActive: updatedUser.isActive,
            isEmailVerified: updatedUser.isEmailVerified || false,
          });
        }
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra khi cập nhật');
      }
    } catch (err) {
      console.error('Save error:', err);
      showNotification('error', 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7CBCFF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Không tìm thấy người dùng'}</h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-4 px-6 py-2 bg-[#7CBCFF] text-white rounded-lg hover:bg-[#6BB5FF] transition-colors"
          >
            Quay lại danh sách
          </button>
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

      {/* Confirm Save Dialog */}
      {showConfirmSave && (
        <ConfirmDialog
          title="Xác nhận cập nhật"
          message="Bạn có chắc chắn muốn lưu các thay đổi này?"
          confirmText="Lưu thay đổi"
          cancelText="Hủy"
          type="info"
          onConfirm={handleSave}
          onCancel={() => setShowConfirmSave(false)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#7CBCFF] to-[#5AABFF] px-8 py-12">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-lg">
                    <svg className="w-12 h-12 text-[#7CBCFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <p className="text-blue-50 text-lg">{user.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User ID */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded">{user._id}</p>
              </div>

              {/* Name */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBCFF]"
                  />
                ) : (
                  <p className="text-gray-900">{user.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBCFF]"
                  />
                ) : (
                  <p className="text-gray-900">{user.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBCFF]"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <p className="text-gray-900">{user.phone || 'Chưa cập nhật'}</p>
                )}
              </div>

              {/* Role */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Vai trò</label>
                {isEditing ? (
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBCFF] capitalize"
                  >
                    <option value="careseeker">Care Seeker</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{user.role}</p>
                )}
              </div>

              {/* Created At */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                <p className="text-gray-900">{new Date(user.createdAt).toLocaleString('vi-VN')}</p>
              </div>

              {/* Updated At */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Cập nhật lần cuối</label>
                <p className="text-gray-900">{new Date(user.updatedAt).toLocaleString('vi-VN')}</p>
              </div>

              {/* Status */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Trạng thái tài khoản</label>
                {isEditing ? (
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBCFF]"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Đã khoá</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? '✓ Hoạt động' : '⊗ Đã khoá'}
                  </span>
                )}
              </div>

              {/* Email Verified */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Xác thực Email</label>
                {isEditing ? (
                  <select
                    value={editForm.isEmailVerified ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isEmailVerified: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBCFF]"
                  >
                    <option value="true">Đã xác thực</option>
                    <option value="false">Chưa xác thực</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.isEmailVerified 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isEmailVerified ? '✓ Đã xác thực' : '⊗ Chưa xác thực'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  disabled={isSaving}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowConfirmSave(true)}
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#7CA4FF] text-white rounded-lg hover:bg-[#6B94EF] transition-colors disabled:opacity-50 flex items-center shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={handleEditToggle}
                  className="px-6 py-2 bg-[#7CA4FF] text-white rounded-lg hover:bg-[#6B94EF] transition-colors flex items-center shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;

