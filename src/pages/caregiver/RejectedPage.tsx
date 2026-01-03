import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Footer from '../../components/layout/Footer';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  status: string;
  role: string;
  rejectionReason?: string;
}

const RejectedPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
        const user = response.data;
        
        // Check if user is rejected caregiver
        if (user.status === 'rejected' && user.role === 'Caregiver') {
          setUserData(user);
        } else {
          // Redirect to appropriate dashboard based on status and role
          if (user.role === 'Caregiver') {
            if (user.status === 'approved') {
              navigate('/care-giver');
            } else if (user.status === 'pending') {
              navigate('/care-giver/pending-approval');
            } else {
              navigate('/care-giver/upload-credentials');
            }
          } else if (user.role === 'CareSeeker') {
            navigate('/care-seeker');
          } else if (user.role === 'Admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        alert('Có lỗi xảy ra khi tải thông tin người dùng.');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    // For now, we'll just show an alert
    alert('Liên hệ hỗ trợ: support@caregiver.com hoặc hotline: 1900-xxxx');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            {/* Warning Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
              <svg
                className="h-8 w-8 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Hồ sơ của bạn đã bị từ chối
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Rất tiếc, hồ sơ đăng ký của bạn không đáp ứng yêu cầu. Vui lòng liên hệ quản trị viên để biết thêm thông tin hoặc chỉnh sửa lại thông tin hồ sơ nếu cần.
            </p>

            {/* User Information */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-orange-900 mb-3">Thông tin hồ sơ</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Họ và tên:</span>
                  <span className="font-medium text-gray-900">{userData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{userData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-medium text-red-600">Bị từ chối</span>
                </div>
              </div>
            </div>

            {/* Rejection Reason (if available) */}
            {userData.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <h4 className="font-semibold text-red-900 mb-2">Lý do từ chối:</h4>
                <p className="text-red-800 text-sm">{userData.rejectionReason}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">💡 Gợi ý:</span> Bạn có thể chỉnh sửa lại hồ sơ và gửi lại để admin xét duyệt lần nữa.
                </p>
              </div>
              
              <button
                onClick={() => navigate('/care-giver/upload-credentials')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Chỉnh sửa hồ sơ
              </button>
              
              <button
                onClick={handleContactSupport}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Liên hệ hỗ trợ
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Quay về trang chủ
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ qua email: support@caregiver.com
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RejectedPage;
