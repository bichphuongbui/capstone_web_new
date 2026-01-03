import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiStar, FiX, FiMapPin, FiPhone, FiMail, FiAward, FiClock as FiTimeIcon } from 'react-icons/fi';

// Mock data types
interface Caregiver {
  id: number;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  experience: string;
  location: string;
  phone: string;
  email: string;
  certifications: string[];
  languages: string[];
  hourlyRate: number;
  description: string;
  availability: string;
}


interface Booking {
  id: number;
  caregiver: {
    name: string;
    avatar: string;
    specialty: string;
    rating?: number;
    reviewCount?: number;
  };
  elderlyPerson: {
    name: string;
    age: number;
    relationship: string;
    avatar: string;
  };
  date: string;
  time: string;
  duration: string;
  status: 'completed' | 'active' | 'upcoming';
  type: string;
  notes?: string;
  rating?: number;
  review?: string;
  canReview?: boolean;
  completedDate?: string;
  totalAmount?: number;
  patientName?: string;
}

type TaskType = 'fixed' | 'flexible' | 'optional';

interface CareTask {
  type: TaskType;
  name: string;
  description?: string;
  days?: string[]; // Ngày trong tuần mà task áp dụng
  startTime?: string; // Giờ bắt đầu nếu có
  endTime?: string; // Giờ kết thúc nếu có (HH:mm)
  completed?: boolean;
}


const CareSeekerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingCaregiver, setSelectedBookingCaregiver] = useState<Caregiver | null>(null);
  const [selectedBookingFamilyMember, setSelectedBookingFamilyMember] = useState<any>(null);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review: ''
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCaregiverForChat, setSelectedCaregiverForChat] = useState<any>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: number, sender: 'user' | 'caregiver', message: string, timestamp: string}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    duration: '4',
    type: '',
    notes: '',
    paymentMethod: 'cash'
  });
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CareTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    type: 'fixed' as TaskType,
    name: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [, setQrCodeData] = useState<string | null>(null);
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [, setIsPaymentProcessing] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing current user:', error);
    }
    return null;
  };

  const [, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState("Người dùng");

  // Load user data after component mounts
  React.useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setUserName(user?.fullName || user?.name || user?.username || "Người dùng");
  }, []);

  // Mock statistics data

  // Mock bookings data - sắp xếp từ mới nhất đến cũ nhất
  const bookings: Booking[] = [
    // Completed bookings - chưa đánh giá (có thể đánh giá) - MỚI NHẤT
    {
      id: 6,
      caregiver: { name: 'Phạm Thu Hà', avatar: '👩‍⚕️', specialty: 'Chăm sóc sức khỏe', rating: 4.7, reviewCount: 12 },
      elderlyPerson: { name: 'Nguyễn Văn Bố', age: 72, relationship: 'Bố', avatar: '👨‍🦳' },
      date: '22/01/2024',
      time: '09:00 - 13:00',
      duration: '4 giờ',
      status: 'completed',
      type: 'Chăm sóc sức khỏe',
      notes: 'Theo dõi huyết áp và đường huyết',
      canReview: true,
      completedDate: '22/01/2024'
    },
    {
      id: 7,
      caregiver: { name: 'Nguyễn Thị Lan', avatar: '👩‍⚕️', specialty: 'Dinh dưỡng', rating: 4.8, reviewCount: 8 },
      elderlyPerson: { name: 'Trần Thị Mẹ', age: 68, relationship: 'Mẹ', avatar: '👩‍🦳' },
      date: '21/01/2024',
      time: '10:00 - 12:00',
      duration: '2 giờ',
      status: 'completed',
      type: 'Tư vấn dinh dưỡng',
      notes: 'Hướng dẫn chế độ ăn uống phù hợp',
      canReview: true,
      completedDate: '21/01/2024'
    },
    {
      id: 8,
      caregiver: { name: 'Võ Minh Tuấn', avatar: '👨‍⚕️', specialty: 'Vật lý trị liệu', rating: 4.9, reviewCount: 15 },
      elderlyPerson: { name: 'Nguyễn Văn Bố', age: 72, relationship: 'Bố', avatar: '👨‍🦳' },
      date: '20/01/2024',
      time: '15:00 - 17:00',
      duration: '2 giờ',
      status: 'completed',
      type: 'Phục hồi chức năng',
      notes: 'Tập luyện phục hồi sau tai biến',
      canReview: true,
      completedDate: '20/01/2024'
    },
    // Completed bookings - đã đánh giá - CŨ HƠN
    {
      id: 1,
      caregiver: { name: 'Trần Thị Mai', avatar: '👩‍⚕️', specialty: 'Chăm sóc người cao tuổi', rating: 4.8, reviewCount: 20 },
      elderlyPerson: { name: 'Nguyễn Văn Bố', age: 72, relationship: 'Bố', avatar: '👨‍🦳' },
      date: '15/01/2024',
      time: '08:00 - 12:00',
      duration: '4 giờ',
      status: 'completed',
      type: 'Chăm sóc tại nhà',
      notes: 'Bệnh nhân hợp tác tốt, uống thuốc đúng giờ',
      rating: 5,
      review: 'Rất hài lòng với dịch vụ chăm sóc',
      canReview: false,
      completedDate: '15/01/2024'
    },
    {
      id: 2,
      caregiver: { name: 'Lê Văn Hùng', avatar: '👨‍⚕️', specialty: 'Vật lý trị liệu', rating: 4.9, reviewCount: 18 },
      elderlyPerson: { name: 'Trần Thị Mẹ', age: 68, relationship: 'Mẹ', avatar: '👩‍🦳' },
      date: '12/01/2024',
      time: '14:00 - 16:00',
      duration: '2 giờ',
      status: 'completed',
      type: 'Vật lý trị liệu',
      notes: 'Tập luyện nhẹ nhàng, cải thiện vận động',
      rating: 4,
      review: 'Chuyên nghiệp và tận tâm',
      canReview: false,
      completedDate: '12/01/2024'
    },
    {
      id: 9,
      caregiver: { name: 'Lê Thị Hoa', avatar: '👩‍⚕️', specialty: 'Chăm sóc người cao tuổi', rating: 4.7, reviewCount: 10 },
      elderlyPerson: { name: 'Trần Thị Mẹ', age: 68, relationship: 'Mẹ', avatar: '👩‍🦳' },
      date: '10/01/2024',
      time: '08:00 - 12:00',
      duration: '4 giờ',
      status: 'completed',
      type: 'Chăm sóc tại nhà',
      notes: 'Chăm sóc toàn diện, theo dõi sức khỏe',
      rating: 5,
      review: 'Rất tận tâm và chuyên nghiệp',
      canReview: false,
      completedDate: '10/01/2024'
    },
    {
      id: 10,
      caregiver: { name: 'Phạm Văn Đức', avatar: '👨‍⚕️', specialty: 'Vật lý trị liệu', rating: 4.6, reviewCount: 7 },
      elderlyPerson: { name: 'Nguyễn Văn Bố', age: 72, relationship: 'Bố', avatar: '👨‍🦳' },
      date: '08/01/2024',
      time: '14:00 - 16:00',
      duration: '2 giờ',
      status: 'completed',
      type: 'Phục hồi chức năng',
      notes: 'Tập luyện phục hồi sau phẫu thuật',
      rating: 4,
      review: 'Hướng dẫn rất chi tiết và dễ hiểu',
      canReview: false,
      completedDate: '08/01/2024'
    },
    // Active bookings
    {
      id: 3,
      caregiver: { name: 'Phạm Thu Hà', avatar: '👩‍⚕️', specialty: 'Chăm sóc sức khỏe' },
      elderlyPerson: { name: 'Nguyễn Văn Bố', age: 72, relationship: 'Bố', avatar: '👨‍🦳' },
      date: 'Hôm nay',
      time: '09:00 - 17:00',
      duration: '8 giờ',
      status: 'active',
      type: 'Chăm sóc toàn diện',
      notes: 'Đang theo dõi huyết áp và đường huyết'
    },
    // Upcoming bookings
    {
      id: 4,
      caregiver: { name: 'Trần Thị Mai', avatar: '👩‍⚕️', specialty: 'Chăm sóc người cao tuổi' },
      elderlyPerson: { name: 'Trần Thị Mẹ', age: 68, relationship: 'Mẹ', avatar: '👩‍🦳' },
      date: '25/01/2024',
      time: '10:00 - 14:00',
      duration: '4 giờ',
      status: 'upcoming',
      type: 'Khám sức khỏe định kỳ',
      notes: 'Chuẩn bị cho lịch khám bệnh'
    },
    {
      id: 5,
      caregiver: { name: 'Lê Văn Hùng', avatar: '👨‍⚕️', specialty: 'Vật lý trị liệu' },
      elderlyPerson: { name: 'Nguyễn Văn Bố', age: 72, relationship: 'Bố', avatar: '👨‍🦳' },
      date: '28/01/2024',
      time: '15:00 - 17:00',
      duration: '2 giờ',
      status: 'upcoming',
      type: 'Tập luyện phục hồi',
      notes: 'Tập luyện sau phẫu thuật'
    }
  ];

  // Mock caregivers data

  // Mock family members data






  const renderStars = (rating: number | undefined) => {
    const ratingValue = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`h-4 w-4 ${i < Math.floor(ratingValue) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Hàm mở modal chi tiết caregiver

  // Hàm đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaregiver(null);
  };

  // Format tiền tệ
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };



  const handleViewBookings = (bookingType: string) => {
    setSelectedBookingType(bookingType);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedBookingType(null);
  };


  const handleCloseBookingForm = () => {
    setIsBookingFormOpen(false);
    setSelectedBookingCaregiver(null);
    setSelectedBookingFamilyMember(null);
    setBookingForm({
      date: '',
      time: '',
      duration: '4',
      type: '',
      notes: '',
      paymentMethod: 'cash'
    });
    setTasks([]);
    setQrCodeData(null);
    setIsQrGenerated(false);
    setIsPaymentProcessing(false);
    setIsPaymentCompleted(false);
    setPaymentStatus('pending');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra thanh toán QR Code
    if (bookingForm.paymentMethod === 'qr' && !isPaymentCompleted) {
      alert('Vui lòng hoàn thành thanh toán QR Code trước khi đặt lịch!');
      return;
    }
    
    // TODO: Implement actual booking submission
    const paymentMethodText = bookingForm.paymentMethod === 'cash' 
      ? 'Tiền mặt (thanh toán khi hoàn thành)' 
      : bookingForm.paymentMethod === 'transfer' 
        ? 'Chuyển khoản (thanh toán trước)'
        : 'QR Code (đã thanh toán)';
    const totalAmount = selectedBookingCaregiver ? (selectedBookingCaregiver.hourlyRate * parseInt(bookingForm.duration)).toLocaleString('vi-VN') : '0';
    
    let tasksText = '';
    if (tasks.length > 0) {
      tasksText = '\n\nNhiệm vụ chăm sóc:\n';
      tasks.forEach((task, index) => {
        const typeText = task.type === 'fixed' ? 'Cố định' : task.type === 'flexible' ? 'Linh hoạt' : 'Tùy chọn';
        const timeText = task.startTime ? ` (${task.startTime}${task.endTime ? ` - ${task.endTime}` : ''})` : '';
        tasksText += `${index + 1}. ${task.name} [${typeText}]${timeText}\n`;
      });
    }
    
    let paymentInfo = '';
    if (bookingForm.paymentMethod === 'qr' && isPaymentCompleted) {
      paymentInfo = '\n\nThông tin thanh toán:\n- Mã giao dịch: TXN' + Date.now().toString().slice(-8) + '\n- Thời gian: ' + new Date().toLocaleString('vi-VN');
    }
    
    alert(`Đặt lịch thành công!\n\nCaregiver: ${selectedBookingCaregiver?.name}\nThành viên: ${selectedBookingFamilyMember?.name}\nNgày: ${bookingForm.date}\nGiờ: ${bookingForm.time}\nThời lượng: ${bookingForm.duration} giờ\nTổng tiền: ${totalAmount} VNĐ\nPhương thức: ${paymentMethodText}${tasksText}${paymentInfo}`);
    handleCloseBookingForm();
  };

  const handleOpenReview = (booking: Booking) => {
    setSelectedBookingForReview(booking);
    setReviewForm({
      rating: booking.rating || 5,
      review: booking.review || ''
    });
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedBookingForReview(null);
    setReviewForm({
      rating: 5,
      review: ''
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call with random success/failure
    const isSuccess = Math.random() > 0.2; // 80% success rate for demo
    
    if (isSuccess) {
      // Success case
      setShowSuccessPopup(true);
      handleCloseReviewModal();
      
      // Auto hide success popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } else {
      // Error case - simulate server errors
      const errorMessages = [
        'Lỗi kết nối server. Vui lòng thử lại sau.',
        'Timeout. Server không phản hồi.',
        'Lỗi xác thực. Vui lòng đăng nhập lại.',
        'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        'Server đang bảo trì. Vui lòng thử lại sau ít phút.'
      ];
      
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      setErrorMessage(randomError);
      setShowErrorPopup(true);
      
      // Auto hide error popup after 5 seconds
      setTimeout(() => {
        setShowErrorPopup(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleOpenChat = () => {
    // Navigate to chat page
    navigate('/care-seeker/chat');
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
    setSelectedCaregiverForChat(null);
    setChatMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'user' as const,
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
      
      // Simulate caregiver response after 2 seconds
      setTimeout(() => {
        const responses = [
          'Tôi hiểu rồi ạ. Sẽ chú ý điều đó.',
          'Vâng, tôi sẽ báo cáo lại tình hình.',
          'Cảm ơn anh/chị đã thông báo.',
          'Tôi sẽ ghi nhận và thực hiện ngay.',
          'Được rồi ạ, tôi sẽ cập nhật tình hình sau.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const caregiverMessage = {
          id: Date.now() + 1,
          sender: 'caregiver' as const,
          message: randomResponse,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, caregiverMessage]);
      }, 2000);
    }
  };

  const handleCallCaregiver = (caregiver: any) => {
    // Simulate call action
    alert(`Đang gọi ${caregiver.name}...\n\nSố điện thoại: 0901234567\n\n(Tính năng gọi video sẽ được tích hợp sau)`);
  };

  // Task management functions
  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      type: 'fixed',
      name: '',
      description: '',
      startTime: '',
      endTime: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: CareTask) => {
    setEditingTask(task);
    setTaskForm({
      type: task.type,
      name: task.name,
      description: task.description || '',
      startTime: task.startTime || '',
      endTime: task.endTime || ''
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name.trim()) return;

    const newTask: CareTask = {
      type: taskForm.type,
      name: taskForm.name.trim(),
      description: taskForm.description.trim() || undefined,
      startTime: taskForm.startTime || undefined,
      endTime: taskForm.endTime || undefined,
      completed: false
    };

    if (editingTask) {
      // Edit existing task
      const index = tasks.findIndex(t => t === editingTask);
      if (index !== -1) {
        setTasks(tasks.map((t, i) => i === index ? newTask : t));
      }
    } else {
      // Add new task
      setTasks([...tasks, newTask]);
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
    setTaskForm({
      type: 'fixed',
      name: '',
      description: '',
      startTime: '',
      endTime: ''
    });
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setTaskForm({
      type: 'fixed',
      name: '',
      description: '',
      startTime: '',
      endTime: ''
    });
  };

  const handleGenerateQR = () => {
    if (selectedBookingCaregiver) {
      const totalAmount = selectedBookingCaregiver.hourlyRate * parseInt(bookingForm.duration);
      const qrData = {
        amount: totalAmount,
        account: '1234567890',
        bank: 'ABC Bank',
        content: `Booking ${selectedBookingFamilyMember?.name} - ${bookingForm.date}`,
        bookingId: `BK${Date.now()}`
      };
      
      // Tạo QR data string (trong thực tế sẽ là URL hoặc data để tạo QR)
      const qrString = `bank://transfer?account=${qrData.account}&amount=${qrData.amount}&content=${encodeURIComponent(qrData.content)}`;
      setQrCodeData(qrString);
      setIsQrGenerated(true);
      setPaymentStatus('pending');
      setIsPaymentCompleted(false);
    }
  };

  const handlePaymentConfirm = () => {
    setIsPaymentProcessing(true);
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setIsPaymentProcessing(false);
      setPaymentStatus('completed');
      setIsPaymentCompleted(true);
      
      // Show success message
      alert('Thanh toán thành công! Booking đã được xác nhận.');
    }, 3000);
  };

  const handlePaymentRetry = () => {
    setPaymentStatus('pending');
    setIsPaymentCompleted(false);
    setIsPaymentProcessing(false);
  };







  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng, {userName}!
        </h1>
        <p className="text-lg text-gray-600">
          Dưới đây là thông tin tổng quan về tình trạng chăm sóc của bạn
        </p>
      </div>


      {/* Recent Bookings - Hiển thị trực tiếp thay vì chỉ thống kê */}
      <div className="space-y-6">
        {/* Bookings đang diễn ra */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiClock className="h-5 w-5 mr-2 text-blue-600" />
              Đang diễn ra
            </h2>
            <button
              onClick={() => handleViewBookings('active')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {bookings.filter(booking => booking.status === 'active').slice(0, 2).map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      {booking.caregiver.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{booking.caregiver.name}</h3>
                      <p className="text-sm text-gray-600">{booking.caregiver.specialty}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {renderStars(booking.caregiver.rating ?? 0)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {booking.caregiver.rating} ({booking.caregiver.reviewCount} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{booking.date}</p>
                    <p className="text-sm text-gray-600">{booking.time}</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mt-1">
                      Đang diễn ra
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>👴 {booking.elderlyPerson.name}</span>
                    <span>⏱️ {booking.duration} giờ</span>
                    <span>💰 {formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => handleOpenChat()}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Nhắn tin"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {bookings.filter(booking => booking.status === 'active').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FiClock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Không có booking nào đang diễn ra</p>
              </div>
            )}
          </div>
        </div>

        {/* Bookings sắp tới */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiCalendar className="h-5 w-5 mr-2 text-green-600" />
              Sắp tới
            </h2>
            <button
              onClick={() => handleViewBookings('upcoming')}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {bookings.filter(booking => booking.status === 'upcoming').slice(0, 2).map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">
                      {booking.caregiver.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{booking.caregiver.name}</h3>
                      <p className="text-sm text-gray-600">{booking.caregiver.specialty}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {renderStars(booking.caregiver.rating)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {booking.caregiver.rating} ({booking.caregiver.reviewCount} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{booking.date}</p>
                    <p className="text-sm text-gray-600">{booking.time}</p>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-1">
                      Sắp tới
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>👴 {booking.patientName}</span>
                    <span>⏱️ {booking.duration} giờ</span>
                    <span>💰 {formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => handleOpenChat()}
                    className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Nhắn tin"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {bookings.filter(booking => booking.status === 'upcoming').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FiCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Không có booking nào sắp tới</p>
              </div>
            )}
          </div>
        </div>

        {/* Bookings đã hoàn thành */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiStar className="h-5 w-5 mr-2 text-purple-600" />
              Đã hoàn thành
            </h2>
            <button
              onClick={() => handleViewBookings('completed')}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {bookings.filter(booking => booking.status === 'completed').slice(0, 2).map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                      {booking.caregiver.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{booking.caregiver.name}</h3>
                      <p className="text-sm text-gray-600">{booking.caregiver.specialty}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {renderStars(booking.caregiver.rating)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {booking.caregiver.rating} ({booking.caregiver.reviewCount} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{booking.date}</p>
                    <p className="text-sm text-gray-600">{booking.time}</p>
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full mt-1">
                      Đã hoàn thành
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>👴 {booking.patientName}</span>
                    <span>⏱️ {booking.duration} giờ</span>
                    <span>💰 {formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenChat()}
                      className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
                      title="Nhắn tin"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenReview(booking)}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full hover:bg-yellow-200 transition-colors"
                    >
                      Đánh giá
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {bookings.filter(booking => booking.status === 'completed').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FiStar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có booking nào đã hoàn thành</p>
              </div>
            )}
          </div>
        </div>
      </div>




      {/* Modal chi tiết Caregiver */}
      {isModalOpen && selectedCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Thông tin chi tiết</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
                </div>

            {/* Content Modal */}
            <div className="p-6 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="flex items-start space-x-4">
                <div className="text-6xl">{selectedCaregiver.avatar}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCaregiver.name}</h3>
                  <p className="text-lg text-blue-600 font-medium mb-2">{selectedCaregiver.specialty}</p>
                  <div className="flex items-center mb-2">
                    {renderStars(selectedCaregiver.rating)}
                    <span className="ml-2 text-lg font-medium text-gray-700">{selectedCaregiver.rating}</span>
                    <span className="ml-2 text-sm text-gray-500">({selectedCaregiver.experience})</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCaregiver.hourlyRate)}/giờ</p>
                </div>
              </div>

              {/* Thông tin liên hệ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{selectedCaregiver.location}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiPhone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{selectedCaregiver.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiMail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{selectedCaregiver.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiTimeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{selectedCaregiver.availability}</span>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Giới thiệu</h4>
                <p className="text-gray-700 leading-relaxed">{selectedCaregiver.description}</p>
              </div>

              {/* Chứng chỉ */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FiAward className="h-5 w-5 mr-2 text-yellow-500" />
                  Chứng chỉ & Bằng cấp
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCaregiver.certifications.map((cert, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ngôn ngữ */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Ngôn ngữ</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCaregiver.languages.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Đặt lịch ngay
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal chi tiết Bookings */}
      {isBookingModalOpen && selectedBookingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedBookingType === 'completed' && 'Lịch sử đặt lịch'}
                {selectedBookingType === 'active' && 'Booking đang diễn ra'}
                {selectedBookingType === 'upcoming' && 'Booking sắp tới'}
        </h2>
              <button
                onClick={handleCloseBookingModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
                </div>

            {/* Content Modal */}
            <div className="p-6">
              <div className="space-y-4">
                {bookings
                  .filter(booking => booking.status === selectedBookingType)
                  .map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                <div className="flex-1">
                          {/* Thông tin người già */}
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-2xl">{booking.elderlyPerson.avatar}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{booking.elderlyPerson.name}</h3>
                              <p className="text-sm text-gray-600">{booking.elderlyPerson.age} tuổi - {booking.elderlyPerson.relationship}</p>
                </div>
              </div>

                          {/* Thông tin caregiver */}
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-xl">{booking.caregiver.avatar}</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{booking.caregiver.name}</h4>
                                {booking.canReview && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full animate-pulse">
                                    ⭐ Có thể đánh giá
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{booking.caregiver.specialty}</p>
                            </div>
                            {/* Nút chat tròn */}
                            <button
                              onClick={() => handleOpenChat()}
                              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                              title="Nhắn tin"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                          </div>

                          {/* Chi tiết booking */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Ngày</p>
                              <p className="font-medium text-gray-900">{booking.date}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Thời gian</p>
                              <p className="font-medium text-gray-900">{booking.time}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Loại dịch vụ</p>
                              <p className="font-medium text-gray-900">{booking.type}</p>
                            </div>
                          </div>

                          {/* Ghi chú */}
                          {booking.notes && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-500">Ghi chú</p>
                              <p className="text-sm text-gray-700">{booking.notes}</p>
                            </div>
                          )}

                          {/* Đánh giá (chỉ cho completed) */}
                          {booking.status === 'completed' && booking.rating && (
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-500">Đánh giá:</p>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <FiStar
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < booking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm font-medium text-gray-700">{booking.rating}/5</span>
        </div>
      </div>
                          )}

                          {/* Review (chỉ cho completed) */}
                          {booking.status === 'completed' && booking.review && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">Nhận xét</p>
                              <p className="text-sm text-gray-700 italic">"{booking.review}"</p>
                            </div>
                          )}

                          {/* Nút đánh giá cho booking có thể đánh giá */}
                          {booking.status === 'completed' && booking.canReview && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleOpenReview(booking)}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                              >
                                ⭐ Đánh giá ngay
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {booking.status === 'completed' ? 'Hoàn thành' :
                             booking.status === 'active' ? 'Đang diễn ra' :
                             'Sắp tới'}
                          </span>
                </div>
              </div>
            </div>
          ))}
              </div>

              {bookings.filter(booking => booking.status === selectedBookingType).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có booking nào</p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseBookingModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
        </div>
        </div>
      )}

      {/* Modal đặt lịch */}
      {isBookingFormOpen && selectedBookingCaregiver && selectedBookingFamilyMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Đặt lịch chăm sóc</h2>
              <button
                onClick={handleCloseBookingForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6">
              {/* Thông tin booking */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{selectedBookingCaregiver.avatar}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedBookingCaregiver.name}</h3>
                    <p className="text-sm text-gray-600">{selectedBookingCaregiver.specialty}</p>
                    <div className="flex items-center mt-1">
                      {renderStars(selectedBookingCaregiver.rating)}
                      <span className="ml-2 text-sm text-gray-600">{selectedBookingCaregiver.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-4">
                  <div className="text-2xl">{selectedBookingFamilyMember.avatar}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedBookingFamilyMember.name}</h4>
                    <p className="text-sm text-gray-600">{selectedBookingFamilyMember.age} tuổi - {selectedBookingFamilyMember.relationship}</p>
                  </div>
                </div>
              </div>

              {/* Form đặt lịch */}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày chăm sóc</label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng (giờ)</label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) => setBookingForm({...bookingForm, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="2">2 giờ</option>
                      <option value="4">4 giờ</option>
                      <option value="6">6 giờ</option>
                      <option value="8">8 giờ</option>
                      <option value="12">12 giờ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại dịch vụ</label>
                    <input
                      type="text"
                      value={bookingForm.type}
                      onChange={(e) => setBookingForm({...bookingForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ: Chăm sóc tại nhà, Vật lý trị liệu..."
                      required
                    />
                  </div>
                </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú thêm</label>
                   <textarea
                     value={bookingForm.notes}
                     onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     rows={3}
                     placeholder="Mô tả chi tiết về nhu cầu chăm sóc..."
                   />
                 </div>

                 {/* Tasks Section */}
                 <div>
                   <div className="flex items-center justify-between mb-3">
                     <label className="block text-sm font-medium text-gray-700">Nhiệm vụ chăm sóc</label>
                     <button
                       type="button"
                       onClick={handleAddTask}
                       className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                     >
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                       Thêm nhiệm vụ
                     </button>
                   </div>
                   
                   {tasks.length > 0 ? (
                     <div className="space-y-2 max-h-60 overflow-y-auto">
                       {tasks.map((task, index) => (
                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                           <div className="flex-1">
                             <div className="flex items-center space-x-2">
                               <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                 task.type === 'fixed' ? 'bg-red-100 text-red-800' :
                                 task.type === 'flexible' ? 'bg-yellow-100 text-yellow-800' :
                                 'bg-green-100 text-green-800'
                               }`}>
                                 {task.type === 'fixed' ? 'Cố định' :
                                  task.type === 'flexible' ? 'Linh hoạt' : 'Tùy chọn'}
                               </span>
                               <span className="font-medium text-gray-900">{task.name}</span>
                             </div>
                             {task.description && (
                               <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                             )}
                             {task.startTime && (
                               <p className="text-xs text-gray-500 mt-1">
                                 {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
                               </p>
                             )}
                           </div>
                           <div className="flex items-center space-x-2">
                             <button
                               type="button"
                               onClick={() => handleEditTask(task)}
                               className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                               title="Sửa"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                               </svg>
                             </button>
                             <button
                               type="button"
                               onClick={() => handleDeleteTask(index)}
                               className="p-1 text-red-600 hover:bg-red-100 rounded"
                               title="Xóa"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-4 text-gray-500 text-sm">
                       Chưa có nhiệm vụ nào. Nhấn "Thêm nhiệm vụ" để bắt đầu.
                     </div>
                   )}
                 </div>

                {/* Phương thức thanh toán */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      bookingForm.paymentMethod === 'cash' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={bookingForm.paymentMethod === 'cash'}
                        onChange={(e) => setBookingForm({...bookingForm, paymentMethod: e.target.value})}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
                          {bookingForm.paymentMethod === 'cash' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Tiền mặt</div>
                          <div className="text-sm text-gray-500">Thanh toán khi hoàn thành</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      bookingForm.paymentMethod === 'transfer' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={bookingForm.paymentMethod === 'transfer'}
                        onChange={(e) => setBookingForm({...bookingForm, paymentMethod: e.target.value})}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
                          {bookingForm.paymentMethod === 'transfer' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Chuyển khoản</div>
                          <div className="text-sm text-gray-500">Thanh toán trước khi bắt đầu</div>
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      bookingForm.paymentMethod === 'qr' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qr"
                        checked={bookingForm.paymentMethod === 'qr'}
                        onChange={(e) => setBookingForm({...bookingForm, paymentMethod: e.target.value})}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
                          {bookingForm.paymentMethod === 'qr' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">QR Code</div>
                          <div className="text-sm text-gray-500">Quét mã thanh toán</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Thông tin giá */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Giá dịch vụ:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {selectedBookingCaregiver.hourlyRate.toLocaleString('vi-VN')} VNĐ/giờ
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Tổng cộng ({bookingForm.duration} giờ):</span>
                    <span className="text-xl font-bold text-blue-600">
                      {(selectedBookingCaregiver.hourlyRate * parseInt(bookingForm.duration)).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  {bookingForm.paymentMethod === 'transfer' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm text-yellow-800 font-medium">Thanh toán chuyển khoản</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Số tài khoản: 1234567890 - Ngân hàng ABC
                      </p>
                      <p className="text-xs text-yellow-700">
                        Nội dung: Booking {selectedBookingFamilyMember?.name} - {bookingForm.date}
                      </p>
                    </div>
                  )}

                  {bookingForm.paymentMethod === 'qr' && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-green-800 font-medium">Thanh toán QR Code</span>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300 text-center">
                        {!isQrGenerated ? (
                          <>
                            <div className="w-32 h-32 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            </div>
                            <p className="text-sm text-green-700 font-medium mb-2">Tạo mã QR để thanh toán</p>
                            <p className="text-xs text-green-600 mb-3">
                              Nhấn nút bên dưới để tạo mã QR cho giao dịch {(selectedBookingCaregiver.hourlyRate * parseInt(bookingForm.duration)).toLocaleString('vi-VN')} VNĐ
                            </p>
                            <button 
                              type="button"
                              onClick={handleGenerateQR}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Tạo mã QR
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-lg border-2 border-green-200 flex items-center justify-center">
                              <div className="w-28 h-28 bg-black rounded grid grid-cols-8 gap-0.5 p-1">
                                {/* Mock QR Code pattern */}
                                {Array.from({ length: 64 }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-full h-full ${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {/* Payment Status */}
                            {paymentStatus === 'pending' && (
                              <>
                                <p className="text-sm text-green-700 font-medium mb-2">Mã QR đã được tạo</p>
                                <p className="text-xs text-green-600 mb-2">
                                  Quét mã QR bằng ứng dụng ngân hàng để thanh toán {(selectedBookingCaregiver.hourlyRate * parseInt(bookingForm.duration)).toLocaleString('vi-VN')} VNĐ
                                </p>
                                <div className="text-xs text-gray-500 mb-3">
                                  <p>Ngân hàng: ABC Bank</p>
                                  <p>Tài khoản: 1234567890</p>
                                  <p>Nội dung: Booking {selectedBookingFamilyMember?.name} - {bookingForm.date}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    type="button"
                                    onClick={() => setIsQrGenerated(false)}
                                    className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors"
                                  >
                                    Tạo lại
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={handlePaymentConfirm}
                                    className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                                  >
                                    Đã thanh toán
                                  </button>
                                </div>
                              </>
                            )}

                            {paymentStatus === 'processing' && (
                              <>
                                <div className="flex items-center justify-center mb-3">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                </div>
                                <p className="text-sm text-green-700 font-medium mb-2">Đang xử lý thanh toán...</p>
                                <p className="text-xs text-green-600">
                                  Vui lòng chờ trong giây lát
                                </p>
                              </>
                            )}

                            {paymentStatus === 'completed' && (
                              <>
                                <div className="flex items-center justify-center mb-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-sm text-green-700 font-medium mb-2">Thanh toán thành công!</p>
                                <p className="text-xs text-green-600 mb-3">
                                  Booking đã được xác nhận và sẽ được xử lý
                                </p>
                                <div className="text-xs text-gray-500 mb-3">
                                  <p>Mã giao dịch: TXN{Date.now().toString().slice(-8)}</p>
                                  <p>Thời gian: {new Date().toLocaleString('vi-VN')}</p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setIsQrGenerated(false);
                                    setPaymentStatus('pending');
                                    setIsPaymentCompleted(false);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                >
                                  Tạo giao dịch mới
                                </button>
                              </>
                            )}

                            {paymentStatus === 'failed' && (
                              <>
                                <div className="flex items-center justify-center mb-3">
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-sm text-red-700 font-medium mb-2">Thanh toán thất bại</p>
                                <p className="text-xs text-red-600 mb-3">
                                  Có lỗi xảy ra trong quá trình xử lý thanh toán
                                </p>
                                <div className="flex space-x-2">
                                  <button 
                                    type="button"
                                    onClick={handlePaymentRetry}
                                    className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                                  >
                                    Thử lại
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setIsQrGenerated(false)}
                                    className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors"
                                  >
                                    Tạo lại QR
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseBookingForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleBookingSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Xác nhận đặt lịch
              </button>
            </div>
        </div>
        </div>
      )}

      {/* Modal đánh giá */}
      {isReviewModalOpen && selectedBookingForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Đánh giá dịch vụ</h2>
              <button
                onClick={handleCloseReviewModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6">
              {/* Thông tin booking */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{selectedBookingForReview.caregiver.avatar}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedBookingForReview.caregiver.name}</h3>
                    <p className="text-sm text-gray-600">{selectedBookingForReview.caregiver.specialty}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-4">
                  <div className="text-2xl">{selectedBookingForReview.elderlyPerson.avatar}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedBookingForReview.elderlyPerson.name}</h4>
                    <p className="text-sm text-gray-600">{selectedBookingForReview.elderlyPerson.age} tuổi - {selectedBookingForReview.elderlyPerson.relationship}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Ngày hoàn thành</p>
                    <p className="font-medium text-gray-900">{selectedBookingForReview.completedDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Thời lượng</p>
                    <p className="font-medium text-gray-900">{selectedBookingForReview.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Loại dịch vụ</p>
                    <p className="font-medium text-gray-900">{selectedBookingForReview.type}</p>
                  </div>
                </div>
              </div>

              {/* Form đánh giá */}
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Đánh giá sao</label>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, rating: i + 1})}
                        className="text-3xl transition-colors"
                      >
                        <FiStar
                          className={`${
                            i < reviewForm.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-lg font-medium text-gray-700">
                      {reviewForm.rating}/5 sao
                    </span>
                  </div>
                </div>

                {/* Review text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét chi tiết</label>
                  <textarea
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm({...reviewForm, review: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ chăm sóc..."
                  />
                </div>

                {/* Rating descriptions */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Gợi ý đánh giá:</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>⭐ Rất tệ - Không hài lòng</p>
                    <p>⭐⭐ Tệ - Cần cải thiện nhiều</p>
                    <p>⭐⭐⭐ Bình thường - Ổn</p>
                    <p>⭐⭐⭐⭐ Tốt - Hài lòng</p>
                    <p>⭐⭐⭐⭐⭐ Xuất sắc - Rất hài lòng</p>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseReviewModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReviewSubmit}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Đánh giá thành công!</h4>
              <p className="text-sm opacity-90">Cảm ơn bạn đã đánh giá dịch vụ chăm sóc.</p>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="flex-shrink-0 ml-2 text-white hover:text-green-200 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm">
              <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                </div>
                <div className="flex-1">
                <h4 className="font-semibold mb-1">Đánh giá thất bại!</h4>
                <p className="text-sm opacity-90 mb-3">{errorMessage}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowErrorPopup(false);
                      setErrorMessage('');
                      // Thử lại đánh giá
                      handleReviewSubmit(new Event('submit') as any);
                    }}
                    className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded hover:bg-opacity-30 transition-colors"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={() => setShowErrorPopup(false)}
                    className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded hover:bg-opacity-30 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowErrorPopup(false)}
                className="flex-shrink-0 text-white hover:text-red-200 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Task Modal */}
       {isTaskModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
             {/* Header Modal */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h2 className="text-xl font-bold text-gray-900">
                 {editingTask ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
               </h2>
               <button
                 onClick={handleCloseTaskModal}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <FiX className="h-5 w-5 text-gray-500" />
               </button>
             </div>

             {/* Content Modal */}
             <div className="p-6">
               <form onSubmit={handleTaskSubmit} className="space-y-4">
                 {/* Task Type */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Loại nhiệm vụ</label>
                   <div className="grid grid-cols-3 gap-2">
                     <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                       taskForm.type === 'fixed' 
                         ? 'border-red-500 bg-red-50' 
                         : 'border-gray-200 hover:bg-gray-50'
                     }`}>
                       <input
                         type="radio"
                         name="taskType"
                         value="fixed"
                         checked={taskForm.type === 'fixed'}
                         onChange={(e) => setTaskForm({...taskForm, type: e.target.value as TaskType})}
                         className="sr-only"
                       />
                       <div className="text-center w-full">
                         <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                         <div className="text-xs font-medium text-gray-900">Cố định</div>
                         <div className="text-xs text-gray-500">Bắt buộc đúng giờ</div>
                       </div>
                     </label>
                     
                     <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                       taskForm.type === 'flexible' 
                         ? 'border-yellow-500 bg-yellow-50' 
                         : 'border-gray-200 hover:bg-gray-50'
                     }`}>
                       <input
                         type="radio"
                         name="taskType"
                         value="flexible"
                         checked={taskForm.type === 'flexible'}
                         onChange={(e) => setTaskForm({...taskForm, type: e.target.value as TaskType})}
                         className="sr-only"
                       />
                       <div className="text-center w-full">
                         <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                         <div className="text-xs font-medium text-gray-900">Linh hoạt</div>
                         <div className="text-xs text-gray-500">Trong thời gian</div>
                       </div>
                     </label>
                     
                     <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                       taskForm.type === 'optional' 
                         ? 'border-green-500 bg-green-50' 
                         : 'border-gray-200 hover:bg-gray-50'
                     }`}>
                       <input
                         type="radio"
                         name="taskType"
                         value="optional"
                         checked={taskForm.type === 'optional'}
                         onChange={(e) => setTaskForm({...taskForm, type: e.target.value as TaskType})}
                         className="sr-only"
                       />
                       <div className="text-center w-full">
                         <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                         <div className="text-xs font-medium text-gray-900">Tùy chọn</div>
                         <div className="text-xs text-gray-500">Nếu có thời gian</div>
                       </div>
                     </label>
                   </div>
                 </div>

                 {/* Task Name */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tên nhiệm vụ</label>
                   <input
                     type="text"
                     value={taskForm.name}
                     onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Ví dụ: Uống thuốc huyết áp"
                     required
                   />
                 </div>

                 {/* Task Description */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                   <textarea
                     value={taskForm.description}
                     onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     rows={2}
                     placeholder="Mô tả chi tiết nhiệm vụ..."
                   />
                 </div>

                 {/* Time (only for fixed and flexible tasks) */}
                 {taskForm.type !== 'optional' && (
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Giờ bắt đầu</label>
                       <input
                         type="time"
                         value={taskForm.startTime}
                         onChange={(e) => setTaskForm({...taskForm, startTime: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Giờ kết thúc</label>
                       <input
                         type="time"
                         value={taskForm.endTime}
                         onChange={(e) => setTaskForm({...taskForm, endTime: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       />
                     </div>
                   </div>
                 )}

                 {/* Info Box */}
                 <div className={`p-3 rounded-lg text-sm ${
                   taskForm.type === 'fixed' ? 'bg-red-50 text-red-700' :
                   taskForm.type === 'flexible' ? 'bg-yellow-50 text-yellow-700' :
                   'bg-green-50 text-green-700'
                 }`}>
                   {taskForm.type === 'fixed' && 'Nhiệm vụ cố định: Phải thực hiện đúng giờ đã định, không được bỏ qua.'}
                   {taskForm.type === 'flexible' && 'Nhiệm vụ linh hoạt: Có thể thực hiện trong khoảng thời gian đã định, nhưng bắt buộc phải hoàn thành.'}
                   {taskForm.type === 'optional' && 'Nhiệm vụ tùy chọn: Chỉ thực hiện khi còn thời gian, không bắt buộc.'}
                 </div>
               </form>
             </div>

             {/* Footer Modal */}
             <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
               <button
                 onClick={handleCloseTaskModal}
                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
               >
                 Hủy
               </button>
               <button
                 onClick={handleTaskSubmit}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 {editingTask ? 'Cập nhật' : 'Thêm nhiệm vụ'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Chat Modal */}
       {isChatModalOpen && selectedCaregiverForChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full h-[600px] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{selectedCaregiverForChat.avatar}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCaregiverForChat.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCaregiverForChat.specialty}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Nút gọi */}
                <button
                  onClick={() => handleCallCaregiver(selectedCaregiverForChat)}
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                  title="Gọi video"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={handleCloseChatModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
              </div>
            </div>
          ))}
        </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
      </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareSeekerDashboardPage;