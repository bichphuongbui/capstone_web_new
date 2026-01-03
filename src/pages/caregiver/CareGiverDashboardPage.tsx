import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiCheckCircle, FiMessageCircle, FiFileText, FiBookOpen, FiAlertTriangle, FiBell, FiChevronRight } from 'react-icons/fi';

const CareGiverDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Lấy thông tin user từ localStorage và làm tươi từ API
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(true);

  useEffect(() => {
    // Small delay to ensure localStorage is updated after redirect from availability page
    const checkAvailability = setTimeout(() => {
      const availabilitySet = localStorage.getItem('caregiver_availability_set');
      if (!availabilitySet) {
        // Redirect to availability setup page
        navigate('/care-giver/availability');
        return;
      }
      setCheckingAvailability(false);
    }, 100);

    return () => clearTimeout(checkAvailability);
  }, [navigate]);

  useEffect(() => {
    // Don't load user data until availability check is done
    if (checkingAvailability) return;

    const readUser = () => {
      try {
        const stored = localStorage.getItem('current_user');
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        console.error('Error parsing current user:', e);
        return null;
      }
    };

    const fetchFresh = async (userId: string) => {
      try {
        const res = await fetch(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('current_user', JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.error('Error fetching user by id:', e);
      }
      return null;
    };

    const init = async () => {
      const stored = readUser();
      if (stored?.id) {
        const fresh = await fetchFresh(stored.id);
        setCurrentUser(fresh || stored);
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    };
    init();
  }, [checkingAvailability]);

  const caregiverName = useMemo(() => {
    return currentUser?.fullName || currentUser?.name || currentUser?.username || "Người chăm sóc";
  }, [currentUser]);

  const profileStatus: 'approved' | 'pending' | 'rejected' | 'incomplete' = useMemo(() => {
    const status = (currentUser?.status || '').toString().toLowerCase();
    if (['approved', 'active'].includes(status)) return 'approved';
    if (['pending', 'awaiting', 'verifying'].includes(status)) return 'pending';
    if (['rejected', 'declined'].includes(status)) return 'rejected';
    return 'incomplete';
  }, [currentUser]);
  
  // Lịch làm việc (mock) với ngày cụ thể (YYYY-MM-DD)
  const today = useMemo(() => new Date(), []);
  const formatISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Mock schedule events aligned with BookingDetailPage data
  const scheduleEvents = [
    {
      id: 2,
      bookingId: 'BK002', // Maps to "Bà Trần Thị B" - in_progress
      date: formatISODate(today),
      start: '14:00',
      end: '18:00',
      patientName: 'Bà Trần Thị B',
      service: 'Chăm sóc tại nhà - theo giờ',
      status: 'in-progress',
      location: 'Q.3, TP.HCM'
    },
    {
      id: 3,
      bookingId: 'BK007', // Maps to "Cụ Hoàng Văn G" - completed
      date: formatISODate(today),
      start: '09:00',
      end: '13:00',
      patientName: 'Cụ Hoàng Văn G',
      service: 'Chăm sóc tại nhà - theo giờ',
      status: 'completed',
      location: 'Q.4, TP.HCM'
    }
  ];

  // Xoá phần nhiệm vụ theo yêu cầu

  const trainingCourses = [
    {
      id: 1,
      name: "Kỹ năng chăm sóc người cao tuổi",
      duration: "2 giờ",
      level: "Cơ bản"
    },
    {
      id: 2,
      name: "Xử lý tình huống khẩn cấp",
      duration: "1.5 giờ",
      level: "Nâng cao"
    }
  ];



  // Fake metrics/messages/reports
  const metrics = useMemo(() => ({
    monthlyAppointments: 28,
    upcomingThisWeek: 5,
    averageRating: 4.8,
    totalReviews: 156,
  }), []);

  // Notifications for bell icon
  const notifications = useMemo(() => {
    const items: Array<{ id: number; type: 'profile' | 'report' | 'training'; message: string; action?: () => void; icon: React.ReactNode }>
      = [];
    if (profileStatus === 'incomplete') {
      items.push({ id: 1, type: 'profile', message: 'Hồ sơ chưa hoàn thiện. Bổ sung chứng chỉ để được duyệt.', action: () => navigate('/care-giver/certificates'), icon: <FiAlertTriangle className="h-4 w-4 text-yellow-600" /> });
    }
    if (profileStatus === 'pending') {
      items.push({ id: 2, type: 'profile', message: 'Hồ sơ đang chờ duyệt. Bạn sẽ được thông báo khi có kết quả.', icon: <FiAlertTriangle className="h-4 w-4 text-yellow-600" /> });
    }
    
    items.push({ id: 4, type: 'training', message: 'Có tài liệu đào tạo mới về xử lý khẩn cấp.', action: () => navigate('/care-giver/training'), icon: <FiBookOpen className="h-4 w-4 text-purple-600" /> });
    return items;
  }, [navigate, profileStatus]);

  // Today's appointments and task management
  const todayAppointments = useMemo(() => {
    return scheduleEvents.filter(event => event.date === formatISODate(today));
  }, [scheduleEvents, today]);



  // Week view data
  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  
  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);

  // Show loading while checking availability
  if (checkingAvailability) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting + Notification bell */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chào mừng bạn, {loadingUser ? '...' : caregiverName}
            </h1>
            <p className="text-gray-600 text-lg">
              Dưới đây là tổng quan về hoạt động chăm sóc của bạn
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
              >
                <FiBell className="h-6 w-6 text-blue-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-10">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Thông báo</h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-3">
                      {notifications.map(n => (
                        <div key={n.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            {n.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{n.message}</p>
                            {n.action && (
                              <button onClick={n.action} className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                                Xem chi tiết →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Số lịch hẹn tháng này</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.monthlyAppointments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiCalendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lịch hẹn sắp tới trong tuần</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.upcomingThisWeek}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiMessageCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đánh giá trung bình</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageRating}/5</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiFileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng số đánh giá</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalReviews}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Week schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FiCalendar className="h-5 w-5 mr-2 text-blue-600" />
            Lịch làm việc tuần này
          </h2>
          <button onClick={() => navigate('/care-giver/schedule')} className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
            Chi tiết <FiChevronRight className="ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayEvents = scheduleEvents.filter(e => e.date === formatISODate(day));
            const isToday = day.toDateString() === new Date().toDateString();
            const dayName = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index];
            
            return (
              <div key={index} className={`p-3 rounded-lg border ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                <div className="text-center">
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                    {dayName}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{dayEvents.length}</span> lịch hẹn
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FiClock className="h-5 w-5 mr-2 text-blue-600" />
            Lịch hẹn hôm nay
          </h2>
          <span className="text-gray-900 font-medium">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
        
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCalendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Không có cuộc hẹn nào hôm nay</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((appointment) => {
              return (
                <div key={appointment.id} className="relative border-l-4 border-l-blue-500 bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-gray-900">{appointment.patientName}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          appointment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          appointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {appointment.status === 'completed' ? 'Đã hoàn thành' :
                           appointment.status === 'in-progress' ? 'Đang thực hiện' :
                           appointment.status === 'pending' ? 'Chờ xác nhận' :
                           'Đã xác nhận'}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-900 mb-1">
                        <FiClock className="h-4 w-4 mr-2" />
                        <span className="text-sm">{appointment.start} - {appointment.end}</span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{appointment.service}</p>
                      <p className="text-sm text-gray-900">{appointment.location}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate(`/care-giver/bookings/${appointment.bookingId}`);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Removed Tasks section per request */}

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => navigate('/care-giver/schedule')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <FiCalendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Xem lịch làm việc</p>
                <p className="text-sm text-gray-600">Quản lý lịch hẹn sắp tới</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/care-giver/tasks')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <FiFileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gửi báo cáo</p>
                <p className="text-sm text-gray-600">Hoàn thành biên bản lịch hẹn</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/care-giver/bookings')} className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <FiClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Xem yêu cầu booking</p>
                <p className="text-sm text-gray-600">Nhận lịch hẹn phù hợp</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/care-giver/availability')} className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <FiCalendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Thiết lập lịch rảnh</p>
                <p className="text-sm text-gray-600">Cấu hình khung giờ rảnh trong tuần</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/care-giver/training')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <FiBookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Truy cập đào tạo</p>
                <p className="text-sm text-gray-600">Cập nhật kiến thức</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Training Suggestions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiBookOpen className="h-5 w-5 mr-2 text-purple-600" />
          Gợi ý đào tạo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainingCourses.map((course) => (
            <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{course.name}</h3>
                  <p className="text-sm text-gray-600">{course.duration} • {course.level}</p>
                </div>
                <button onClick={() => navigate('/care-giver/training')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Xem
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareGiverDashboardPage;
