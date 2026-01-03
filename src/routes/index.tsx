import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import BlogListPage from '../pages/BlogListPage';
import BlogDetailPage from '../pages/BlogDetailPage';
import PricingPage from '../pages/PricingPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import AdminTrainingPage from '../pages/admin/AdminTrainingPage';
import CourseFilesPage from '../pages/admin/CourseFilesPage';
import CourseFormPage from '../pages/admin/CourseFormPage';
import AdminCourseDetailPage from '../pages/admin/AdminCourseDetailPage';
import AdminLessonViewerPage from '../pages/admin/AdminLessonViewerPage';
import AdminLayout from '../layouts/AdminLayout';
import CareSeekerLayout from '../layouts/CareSeekerLayout';
import CareGiverLayout from '../layouts/CareGiverLayout';
import { User } from '../services/users.service';
import CareSeekerDashboardPage from '../pages/careseeker/CareSeekerDashboardPage';
import FamilyPage from '../pages/careseeker/FamilyPage';
import BookingPage from '../pages/careseeker/BookingPage';
import CareSeekerChatPage from '../pages/careseeker/ChatPage';
import CareSeekerCaregiverProfilePage from '../pages/careseeker/CaregiverProfilePage';
import CareGiverDashboardPage from '../pages/caregiver/CareGiverDashboardPage';
import UploadCredentialsPage from '../pages/caregiver/UploadCredentialsPage';
import PendingApprovalPage from '../pages/caregiver/PendingApprovalPage';
import CaregiverApprovalPage from '../pages/admin/CaregiverApprovalPage';
import CaregiverDetailPage from '../pages/admin/CaregiverDetailPage';
import CertificateApprovalPage from '../pages/admin/CertificateApprovalPage';
import AdminReviewManagementPage from '../pages/admin/AdminReviewManagementPage';
import AdminDisputeManagementPage from '../pages/admin/AdminDisputeManagementPage';
import AdminCaregiverWalletPage from '../pages/admin/AdminCaregiverWalletPage';
import ServicePackageManagementPage from '../pages/admin/ServicePackageManagementPage';
import RejectedPage from '../pages/caregiver/RejectedPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import CaregiverProfilePage from '../pages/caregiver/CaregiverProfilePage';
import CaregiverTrainingPage from '../pages/caregiver/CaregiverTrainingPage';
import CourseDetailPage from '../pages/caregiver/CourseDetailPage';
import BookingRequestPage from '../pages/caregiver/BookingRequestPage';
import BookingDetailPage from '../pages/caregiver/BookingDetailPage';
import BookingReportPage from '../pages/caregiver/BookingReportPage';
import WithdrawPage from '../pages/caregiver/WithdrawPage';
import SchedulePage from '../pages/caregiver/SchedulePage';
import CaregiverCertificatesSkillsPage from '../pages/caregiver/CaregiverCertificatesSkillsPage';
import ChatPage from '../pages/caregiver/ChatPage';
import AvailabilityPage from '../pages/caregiver/AvailabilityPage';
import CaregiverReviewPage from '../pages/caregiver/CaregiverReviewPage';
import VideoRequestPage from '../pages/caregiver/VideoRequestPage';
import VideoCallPage from '../pages/caregiver/VideoCallPage';
import CallFeedbackPage from '../pages/caregiver/CallFeedbackPage';
import SystemFeedbackPage from '../pages/SystemFeedbackPage';
import ComplaintPage from '../pages/caregiver/ComplaintPage';
import ComplaintReviewPage from '../pages/caregiver/ComplaintReviewPage';
import ServiceReviewEditorPage from '../pages/caregiver/ServiceReviewEditorPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import UserDetailPage from '../pages/admin/UserDetailPage';

// Types cho user role
type UserRole = 'Care Seeker' | 'Caregiver' | 'Admin' | 'Guest';

// Chuẩn hoá role để tránh lỗi sai chính tả/viết hoa/viết thường
const normalizeRole = (role?: string): UserRole => {
  const value = (role || '').toString().trim().toLowerCase();
  if (['care seeker', 'care-seeker', 'careseeker', 'seeker'].includes(value)) return 'Care Seeker';
  if (['caregiver', 'care giver', 'care-giver'].includes(value)) return 'Caregiver';
  if (['admin', 'administrator'].includes(value)) return 'Admin';
  return 'Guest';
};

// Hook để lấy thông tin user hiện tại (phản ứng theo sự kiện đăng nhập/đăng xuất)
const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Đọc user từ localStorage an toàn
  const readUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('current_user');
      if (!storedUser) return null;
      return JSON.parse(storedUser) as User;
    } catch (error) {
      console.error('Error parsing current user:', error);
      return null;
    }
  };

  // Fetch user data từ API để đảm bảo data fresh
  const fetchUserFromAPI = async (userId: string) => {
    try {
      const response = await fetch(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        // Update localStorage với data mới
        localStorage.setItem('current_user', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user from API:', error);
    }
    return null;
  };

  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = readUserFromStorage();
      if (storedUser && storedUser.id) {
        // Set user ngay lập tức từ localStorage để tránh delay
        setUser(storedUser);
        setLoading(false);
        
        // Fetch fresh data từ API trong background
        const freshUser = await fetchUserFromAPI(storedUser.id);
        if (freshUser) {
          setUser(freshUser);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    initializeUser();

    // Lắng nghe thay đổi từ các tab hoặc từ các hành động login/logout
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'current_user' || e.key === 'userId') {
        const storedUser = readUserFromStorage();
        if (storedUser && storedUser.id) {
          // Set user ngay lập tức từ localStorage
          setUser(storedUser);
          // Fetch fresh data trong background
          fetchUserFromAPI(storedUser.id).then(freshUser => {
            if (freshUser) {
              setUser(freshUser);
            }
          });
        } else {
          setUser(null);
        }
      }
    };

    const handleAuthChange = () => {
      const storedUser = readUserFromStorage();
      if (storedUser && storedUser.id) {
        // Set user ngay lập tức từ localStorage
        setUser(storedUser);
        // Fetch fresh data trong background
        fetchUserFromAPI(storedUser.id).then(freshUser => {
          if (freshUser) {
            setUser(freshUser);
          }
        });
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:changed', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:changed', handleAuthChange as EventListener);
    };
  }, []);

  return { user, loading };
};

// Placeholder components cho các trang chưa có

const FAQPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Câu hỏi thường gặp
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Trang này sẽ được phát triển sau
        </p>
      </div>
    </div>
  </div>
);






// Component redirect cho dashboard chung
const DashboardRedirect: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('DashboardRedirect - User data:', user);
  console.log('DashboardRedirect - User role:', user.role);
  console.log('DashboardRedirect - User status:', (user as any).status);

  // Nếu caregiver đang pending, luôn đưa tới trang chờ duyệt
  if (normalizeRole(user.role) === 'Caregiver' && (user as any).status === 'pending') {
    console.log('Redirecting to pending approval page');
    return <Navigate to="/care-giver/pending-approval" replace />;
  }

  // Nếu caregiver bị reject, đưa tới trang rejected
  if (normalizeRole(user.role) === 'Caregiver' && (user as any).status === 'rejected') {
    console.log('Redirecting to rejected page');
    return <Navigate to="/care-giver/rejected" replace />;
  }

  console.log('Redirecting to normal dashboard');
  switch (normalizeRole(user.role)) {
    case 'Care Seeker':
      return <Navigate to="/care-seeker" replace />;
    case 'Caregiver':
      return <Navigate to="/care-giver" replace />;
    case 'Admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Component bảo vệ route
interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  user, 
  allowedRoles = [],
  requireAuth = true 
}) => {
  // Nếu yêu cầu đăng nhập nhưng không có user
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có user nhưng không có quyền truy cập
  if (user && allowedRoles.length > 0 && !allowedRoles.map(normalizeRole).includes(normalizeRole(user.role))) {
    return <Navigate to="/" replace />;
  }

  // Nếu không yêu cầu đăng nhập hoặc user đã có quyền
  return <>{children}</>;
};

// Component chính quản lý routing
const AppRoutes: React.FC = () => {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes công khai */}
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/register" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <RegisterPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verify-email" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <VerifyEmailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <ForgotPasswordPage />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route 
          path="/reset-password" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <ResetPasswordPage />
            </ProtectedRoute>
          }
        />

       
        <Route 
          path="/dashboard" 
          element={<DashboardRedirect user={user} />} 
        />

        {/* CareSeeker routes với layout */}
         <Route 
           path="/care-seeker"
           element={
             <ProtectedRoute user={user} allowedRoles={['Care Seeker']}>
               <CareSeekerLayout>
                 <Outlet />
               </CareSeekerLayout>
             </ProtectedRoute>
           }
         >
           <Route index element={<CareSeekerDashboardPage />} />
           <Route path="family" element={<FamilyPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="chat" element={<CareSeekerChatPage />} />
            <Route path="caregiver/:id" element={<CareSeekerCaregiverProfilePage />} />
         </Route>

         {/* CareGiver routes với layout */}
         <Route 
           path="/care-giver"
           element={
             <ProtectedRoute user={user} allowedRoles={['Caregiver']}>
               <CareGiverLayout>
                 <Outlet />
               </CareGiverLayout>
             </ProtectedRoute>
           }
         >
                       <Route index element={<CareGiverDashboardPage />} />
          <Route path="profile" element={<CaregiverProfilePage />} />
          <Route path="certificates" element={<CaregiverCertificatesSkillsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="bookings" element={<BookingRequestPage />} />
          <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="bookings/:bookingId/report" element={<BookingReportPage />} />
          <Route path="chat" element={<ChatPage />} />
           <Route path="tasks" element={<div className="p-4">Theo dõi công việc</div>} />
           <Route path="payments" element={<div className="p-4">Rút tiền & thanh toán</div>} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="training" element={<CaregiverTrainingPage />} />
          <Route path="training/:id" element={<CourseDetailPage />} />
          <Route path="reviews" element={<CaregiverReviewPage />} />
          <Route path="video-requests" element={<VideoRequestPage />} />
          <Route path="video-call" element={<VideoCallPage />} />
          <Route path="complaint" element={<ComplaintPage />} />
          <Route path="complaint-review" element={<ComplaintReviewPage />} />
          <Route path="service-review" element={<ServiceReviewEditorPage />} />
         </Route>
        {/* Admin routes (nested under /admin) */}
        <Route 
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={['Admin']}>
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="training" element={<AdminTrainingPage />} />
          <Route path="training/new" element={<CourseFormPage />} />
          <Route path="training/:courseId" element={<AdminCourseDetailPage />} />
          <Route path="training/:courseId/lesson/:lessonId" element={<AdminLessonViewerPage />} />
          <Route path="training/:courseId/edit" element={<CourseFormPage />} />
          <Route path="training/:courseId/files" element={<CourseFilesPage />} />
          <Route path="caregiver-approval" element={<CaregiverApprovalPage />} />
          <Route path="certificate-approval" element={<CertificateApprovalPage />} />
          <Route path="caregivers/:id" element={<CaregiverDetailPage />} />
          <Route path="feedback" element={<AdminReviewManagementPage />} />
          <Route path="disputes" element={<AdminDisputeManagementPage />} />
          <Route path="caregiver-wallets" element={<AdminCaregiverWalletPage />} />
          <Route path="packages" element={<ServicePackageManagementPage />} />
          <Route path="blog" element={<div className="p-4">Blog</div>} />
          <Route path="faq" element={<div className="p-4">FAQ</div>} />
        </Route>
        {/* Caregiver call feedback */}
        <Route 
          path="/care-giver/call-feedback" 
          element={<CallFeedbackPage />} 
        />

        {/* Backward compatibility: old admin-dashboard path */}
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Public caregiver upload credentials route (accessible right after registration) */}
        <Route 
          path="/care-giver/upload-credentials" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <UploadCredentialsPage />
            </ProtectedRoute>
          } 
        />

        {/* Public caregiver pending approval page */}
        <Route 
          path="/care-giver/pending-approval" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <PendingApprovalPage />
            </ProtectedRoute>
          } 
        />

        {/* Public caregiver rejected page */}
        <Route 
          path="/care-giver/rejected" 
          element={
            <ProtectedRoute user={user} requireAuth={false}>
              <RejectedPage />
            </ProtectedRoute>
          } 
        />

        {/* 404 route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* System feedback page (public) */}
        <Route path="/feedback/system" element={<SystemFeedbackPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;