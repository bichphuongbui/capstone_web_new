import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { verifyEmail, resendVerificationCode } from '../services/auth.service';

interface LocationState {
  email?: string;
}

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as LocationState)?.email || '';

  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Nếu không có email, redirect về register
    if (!emailFromState) {
      const timer = setTimeout(() => {
        navigate('/register', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emailFromState, navigate]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ cho phép số
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Chỉ lấy ký tự cuối cùng
    setOtp(newOtp);
    setError('');

    // Tự động focus ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    // Focus vào ô cuối cùng đã điền
    const lastFilledIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const code = otp.join('');

    // Validate
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyEmail({
        email: email.trim(),
        verificationCode: code,
      });

      if (result.success) {
        setSuccess('Xác thực email thành công! Đang chuyển đến trang đăng nhập...');
        
        // Chuyển đến trang login sau 2 giây
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        setError(result.message || 'Mã xác thực không đúng hoặc đã hết hạn');
      }
    } catch (err) {
      console.error('Verify email error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;

    setIsResending(true);
    setError('');
    setResendMessage('');

    try {
      const result = await resendVerificationCode({ email: email.trim() });

      if (result.success) {
        setResendMessage('✓ Đã gửi lại mã xác thực! Vui lòng kiểm tra email.');
        // Xóa thông báo sau 5 giây
        setTimeout(() => setResendMessage(''), 5000);
      } else {
        setError(result.message || 'Không thể gửi lại mã xác thực');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Có lỗi xảy ra khi gửi lại mã');
    } finally {
      setIsResending(false);
    }
  };

  if (!emailFromState) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Không tìm thấy thông tin email
            </h2>
            <p className="text-gray-600 mb-4">
              Đang chuyển bạn về trang đăng ký...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 py-12 px-4">
        <div className="w-full max-w-5xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Illustration */}
            <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 p-12">
              <div className="text-center">
                {/* Robot Icon */}
                <div className="mb-8 relative">
                  <div className="w-64 h-64 mx-auto bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <svg className="w-40 h-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-300 rounded-full opacity-50 animate-pulse"></div>
                  <div className="absolute bottom-10 left-0 w-16 h-16 bg-orange-300 rounded-full opacity-50 animate-pulse delay-75"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Bảo mật tài khoản
                </h2>
                <p className="text-gray-600">
                  Xác thực email giúp bảo vệ tài khoản của bạn
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Xác thực tài khoản
                  </h1>
                  <p className="text-gray-600 mb-4">
                    Vui lòng nhập mã được gửi đến email của bạn
                  </p>
                  
                  {/* Email display */}
                  <div className="inline-flex items-center bg-orange-50 px-4 py-2 rounded-full">
                    <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{email}</span>
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-fadeIn">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800 font-medium">{success}</span>
                    </div>
                  </div>
                )}

                {/* Resend Message */}
                {resendMessage && (
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg animate-fadeIn">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-800 font-medium">{resendMessage}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800 font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* OTP Input */}
                <div>
                  <div className="flex justify-center gap-2 md:gap-3 mb-6" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-200 ${
                          digit
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white hover:border-orange-300'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                        disabled={isSubmitting || !!success}
                      />
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    Nhập mã gồm 6 chữ số
                  </p>
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !!success || otp.join('').length !== 6}
                  className={`w-full py-4 px-6 text-lg font-bold rounded-xl transition-all duration-300 transform ${
                    isSubmitting || success || otp.join('').length !== 6
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg hover:shadow-xl'
                  } text-white uppercase tracking-wider`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xác thực...
                    </span>
                  ) : success ? (
                    'Đã xác thực ✓'
                  ) : (
                    'Xác nhận'
                  )}
                </button>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isSubmitting || isResending || !!success}
                    className="text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {isResending && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isResending ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
                  </button>
                </div>

                {/* Back to sign up */}
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm">Quay lại đăng ký</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

          {/* Footer text */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Cần hỗ trợ? Liên hệ{' '}
            <a href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
              chăm sóc khách hàng
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;

