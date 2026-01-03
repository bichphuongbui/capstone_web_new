import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiMenu, FiX, FiLogOut, FiUserCheck, FiMessageCircle, FiBookOpen } from 'react-icons/fi';
import Footer from '../components/layout/Footer';

interface CareSeekerLayoutProps {
  children?: React.ReactNode;
}

const CareSeekerLayout: React.FC<CareSeekerLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/care-seeker' },
    { icon: FiUserCheck, label: 'Gia đình', path: '/care-seeker/family' },
    { icon: FiBookOpen, label: 'Đặt lịch', path: '/care-seeker/booking' },
    { icon: FiMessageCircle, label: 'Trò chuyện', path: '/care-seeker/chat' },
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
                <h1 className="text-lg font-bold text-gray-900">CareSeeker</h1>
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

            {/* Sidebar Footer */}
             {/* Logout Button */}
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
            <div className="border-t border-gray-200 p-4">
             
              
              {sidebarOpen && (
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">CareSeeker v1.0</p>
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
          <div className="p-6 pb-20">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CareSeekerLayout;
