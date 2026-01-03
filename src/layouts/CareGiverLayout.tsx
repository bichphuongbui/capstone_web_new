import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUser,  
  FiCalendar, 
  FiBookOpen,  
  FiDollarSign, 
  FiFileText, 
  FiMenu, 
  FiX, 
  FiLogOut,
  FiAward,
  FiMessageCircle,
  FiClock,
  FiStar,
  // FiVideo,
  FiAlertTriangle
} from 'react-icons/fi';
import Footer from '../components/layout/Footer';

interface CareGiverLayoutProps {
  children?: React.ReactNode;
}

const CareGiverLayout: React.FC<CareGiverLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/care-giver' },
    { icon: FiUser, label: 'Hồ sơ chuyên môn', path: '/care-giver/profile' },
    { icon: FiAward, label: 'Chứng chỉ & Kỹ năng', path: '/care-giver/certificates' },
    { icon: FiCalendar, label: 'Quản lý lịch làm việc', path: '/care-giver/schedule' },
    { icon: FiBookOpen, label: 'Quản lý yêu cầu đặt lịch', path: '/care-giver/bookings' },
    { icon: FiClock, label: 'Yêu cầu Video Call', path: '/care-giver/video-requests' },
    { icon: FiStar, label: 'Đánh giá từ Care Seeker', path: '/care-giver/reviews' },
    { icon: FiMessageCircle, label: 'Trò chuyện', path: '/care-giver/chat' },
    { icon: FiAlertTriangle, label: 'Khiếu nại', path: '/care-giver/complaint' },
    { icon: FiDollarSign, label: 'Rút tiền & thanh toán', path: '/care-giver/withdraw' },
    { icon: FiFileText, label: 'Truy cập tài liệu đào tạo', path: '/care-giver/training' },
    { icon: FiFileText, label: 'Góp ý hệ thống', path: '/feedback/system' },
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    // Xoá toàn bộ khoá liên quan tới phiên để tránh dính giữa các vai trò
    try {
      localStorage.removeItem('current_user');
      localStorage.removeItem('userId');
    } catch {}
    try { window.dispatchEvent(new Event('auth:changed')); } catch {}
    // Chuyển về trang login
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-16'
        } lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              {sidebarOpen && (
                <h1 className="text-lg font-bold text-gray-900">CareGiver</h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {sidebarOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </button>
            </div>

            {/* Sidebar Menu */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuClick(item.path)}
                  className={`flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors ${
                    location.pathname === item.path 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  {sidebarOpen && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </button>
              ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex w-full items-center rounded-lg px-3 py-3 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                  <FiLogOut className="h-5 w-5" />
                </div>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">Đăng xuất</span>
                )}
              </button>
            {/* Sidebar Footer */}
            <div className="border-t border-gray-200 p-4">
              {/* Logout Button */}
              
              
              {sidebarOpen && (
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">CareGiver v1.0</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CareGiverLayout;
