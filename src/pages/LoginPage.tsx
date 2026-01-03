import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { loginUser } from '../services/users.service';

// Interface cho form data
interface LoginFormData {
  email: string;
  password: string;
}

// Interface cho validation errors
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Component trang đăng nhập
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Xóa lỗi general khi người dùng thay đổi input
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: undefined
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Kiểm tra email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Kiểm tra mật khẩu
    if (!formData.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Gọi API đăng nhập
      const user = await loginUser(formData.email.toLowerCase().trim(), formData.password);
      
      if (user) {
        // Đăng nhập thành công: chuẩn hoá role, đồng bộ storage và phát sự kiện
        const normalizedRole = (() => {
          const value = (user.role || '').toString().trim().toLowerCase();
          if (['care seeker', 'care-seeker', 'careseeker', 'seeker'].includes(value)) return 'Care Seeker';
          if (['caregiver', 'care giver', 'care-giver'].includes(value)) return 'Caregiver';
          if (['admin', 'administrator'].includes(value)) return 'Admin';
          return 'Guest';
        })();

        const unifiedUser = { ...user, role: normalizedRole };

        try {
          // Xoá phiên cũ tránh dính phiên
          localStorage.removeItem('current_user');
          localStorage.removeItem('userId');
        } catch {}

        localStorage.setItem('current_user', JSON.stringify(unifiedUser));
        if (unifiedUser.id) {
          localStorage.setItem('userId', unifiedUser.id);
        }

        // Thông báo cho toàn app biết đã thay đổi phiên
        try { 
          window.dispatchEvent(new Event('auth:changed')); 
          console.log('Auth changed event dispatched');
        } catch (error) {
          console.error('Error dispatching auth:changed event:', error);
        }

        console.log('Login successful - User data:', unifiedUser);
        console.log('Login - User role:', unifiedUser.role);
        console.log('Login - User status:', (unifiedUser as any).status);

        // Nếu caregiver vẫn đang pending thì điều hướng tới trang chờ duyệt
        if (unifiedUser.role === 'Caregiver' && (unifiedUser as any).status === 'pending') {
          console.log('Redirecting caregiver to pending approval page');
          navigate('/care-giver/pending-approval', { replace: true });
        } else if (unifiedUser.role === 'Caregiver' && (unifiedUser as any).status === 'rejected') {
          console.log('Redirecting caregiver to rejected page');
          navigate('/care-giver/rejected', { replace: true });
        } else if (unifiedUser.role === 'Caregiver') {
          console.log('Redirecting caregiver to dashboard');
          navigate('/care-giver', { replace: true });
        } else if (unifiedUser.role === 'Care Seeker') {
          console.log('Redirecting care seeker to dashboard');
          navigate('/care-seeker', { replace: true });
        } else if (unifiedUser.role === 'Admin') {
          console.log('Redirecting admin to dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.log('Redirecting to home page');
          navigate('/', { replace: true });
        }
      } else {
        // Đăng nhập thất bại
        setErrors({
          general: 'Email hoặc mật khẩu không đúng'
        });
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setErrors({
        general: 'Có lỗi xảy ra. Vui lòng thử lại.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng nhập
            </h1>
            <p className="text-lg text-gray-600">
              Chào mừng bạn quay trở lại
            </p>
          </div>

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-800 font-medium">{errors.general}</span>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Mật khẩu */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 text-lg font-semibold rounded-lg transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200'
                  } text-white`}
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </div>
            </form>

            {/* Navigation links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate('/')}
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay về trang chủ
                </button>

                <button
                  onClick={() => navigate('/forgot-password')}
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Quên mật khẩu
                </button>
                
                <div className="text-center">
                  <span className="text-gray-600">Chưa có tài khoản? </span>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Bằng việc đăng nhập, bạn đồng ý với{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Chính sách bảo mật
              </a>{' '}
              của chúng tôi.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
