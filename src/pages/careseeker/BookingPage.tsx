import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiStar, FiSearch, FiX, FiEye } from 'react-icons/fi';
import { 
  getCaregivers, 
  createCareSeekerBooking, 
  getCareSeekerBookings,
  Caregiver, 
  CareSeekerBooking,
  formatDateTime,
  getStatusColor,
  getStatusText,
  getServiceTypeText,
  getServiceTypeIcon
} from '../../services/careseeker-booking.service';
import { getFamilyMembers, FamilyMember } from '../../services/family.service';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'book' | 'my-bookings'>('book');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [myBookings, setMyBookings] = useState<CareSeekerBooking[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Form states for booking
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // QR Payment states
  const [, setQrCodeData] = useState<string | null>(null);
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [, setIsPaymentProcessing] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [bookingForm, setBookingForm] = useState({
    serviceType: 'home-care' as 'home-care',
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 2,
    address: '',
    notes: '',
    selectedFamilyMemberId: '',
    paymentMethod: 'cash' as 'cash' | 'qr'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [caregiversData, bookingsData, familyData] = await Promise.all([
        getCaregivers(),
        getCareSeekerBookings('current-user-id'), // Replace with actual user ID
        getFamilyMembers()
      ]);
      setCaregivers(caregiversData);
      setMyBookings(bookingsData);
      setFamilyMembers(familyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCaregivers = caregivers.filter(caregiver => {
    const matchesSearch = caregiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caregiver.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || caregiver.specialty === selectedSpecialty;
    const matchesPrice = priceRange === 'all' || 
      (priceRange === 'low' && caregiver.pricePerHour <= 200000) ||
      (priceRange === 'medium' && caregiver.pricePerHour > 200000 && caregiver.pricePerHour <= 300000) ||
      (priceRange === 'high' && caregiver.pricePerHour > 300000);
    
    return matchesSearch && matchesSpecialty && matchesPrice;
  });

  const specialties = Array.from(new Set(caregivers.map(cg => cg.specialty)));

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaregiver) return;

    // Kiểm tra thanh toán QR Code
    if (bookingForm.paymentMethod === 'qr' && !isPaymentCompleted) {
      alert('Vui lòng hoàn thành thanh toán QR Code trước khi đặt lịch!');
      return;
    }

    // Kiểm tra đã chọn người được chăm sóc
    if (!bookingForm.selectedFamilyMemberId) {
      alert('Vui lòng chọn người được chăm sóc!');
      return;
    }

    try {
      const selectedFamilyMember = familyMembers.find(fm => fm.id === bookingForm.selectedFamilyMemberId);
      if (!selectedFamilyMember) {
        alert('Không tìm thấy thông tin người được chăm sóc!');
        return;
      }

      const scheduledDateTime = `${bookingForm.scheduledDate}T${bookingForm.scheduledTime}:00`;
      const totalPrice = selectedCaregiver.pricePerHour * bookingForm.duration;

      await createCareSeekerBooking({
        careSeekerId: 'current-user-id', // Replace with actual user ID
        caregiverId: selectedCaregiver.id,
        serviceType: bookingForm.serviceType,
        title: bookingForm.title,
        description: bookingForm.description,
        scheduledDateTime,
        duration: bookingForm.duration * 60, // Convert to minutes
        address: bookingForm.address,
        notes: bookingForm.notes,
        price: totalPrice,
        elderlyPersonName: selectedFamilyMember.name,
        elderlyPersonAge: selectedFamilyMember.age,
        elderlyPersonRelationship: selectedFamilyMember.relationship
      });

      const paymentMessage = bookingForm.paymentMethod === 'qr' 
        ? 'Đặt lịch thành công! Thanh toán đã được xác nhận.' 
        : 'Đặt lịch thành công! Vui lòng thanh toán bằng tiền mặt khi hoàn thành dịch vụ.';
      
      alert(paymentMessage);
      setShowBookingForm(false);
      setSelectedCaregiver(null);
      resetBookingForm();
      loadData(); // Reload bookings
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // QR Payment functions
  const handleGenerateQR = () => {
    if (selectedCaregiver) {
      const totalAmount = selectedCaregiver.pricePerHour * bookingForm.duration;
      const qrData = {
        amount: totalAmount,
        account: '1234567890',
        bank: 'ABC Bank',
        content: `Booking ${familyMembers.find(fm => fm.id === bookingForm.selectedFamilyMemberId)?.name || ''} - ${bookingForm.scheduledDate}`,
        bookingId: `BK${Date.now()}`
      };
      
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
    
    setTimeout(() => {
      setIsPaymentProcessing(false);
      setPaymentStatus('completed');
      setIsPaymentCompleted(true);
      
      alert('Thanh toán thành công! Booking đã được xác nhận.');
    }, 3000);
  };

  const handlePaymentRetry = () => {
    setPaymentStatus('pending');
    setIsPaymentCompleted(false);
    setIsPaymentProcessing(false);
  };

  const resetBookingForm = () => {
    setBookingForm({
      serviceType: 'home-care' as 'home-care',
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 2,
      address: '',
      notes: '',
      selectedFamilyMemberId: '',
      paymentMethod: 'cash' as 'cash' | 'qr'
    });
    // Reset QR payment states
    setQrCodeData(null);
    setIsQrGenerated(false);
    setIsPaymentProcessing(false);
    setIsPaymentCompleted(false);
    setPaymentStatus('pending');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Đặt lịch chăm sóc</h1>
          <p className="mt-1 text-gray-600">Tìm và đặt lịch với các chuyên gia chăm sóc sức khỏe</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('book')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'book'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiCalendar className="inline mr-2" />
                Đặt lịch mới
              </button>
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiClock className="inline mr-2" />
                Lịch của tôi ({myBookings.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'book' ? (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tên chuyên gia hoặc chuyên môn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chuyên môn</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả chuyên môn</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức giá</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả mức giá</option>
                    <option value="low">Dưới 200k/giờ</option>
                    <option value="medium">200k - 300k/giờ</option>
                    <option value="high">Trên 300k/giờ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Caregivers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCaregivers.map(caregiver => (
                <div key={caregiver.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                        {caregiver.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{caregiver.name}</h3>
                        <p className="text-sm text-gray-600">{caregiver.specialty}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(caregiver.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {caregiver.rating} ({caregiver.reviewCount} đánh giá)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="mr-2" />
                        {caregiver.experience}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="mr-2" />
                        Có sẵn: {caregiver.availableTimes.join(', ')}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(caregiver.pricePerHour)}/giờ
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/care-seeker/caregiver/${caregiver.id}`)}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                            title="Xem profile"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCaregiver(caregiver);
                              setShowBookingForm(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Đặt lịch
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCaregivers.length === 0 && (
              <div className="text-center py-12">
                <FiUser className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy chuyên gia</h3>
                <p className="mt-1 text-sm text-gray-500">Thử thay đổi bộ lọc để tìm thêm kết quả.</p>
              </div>
            )}
          </div>
        ) : (
          /* My Bookings Tab */
          <div className="space-y-4">
            {myBookings.length === 0 ? (
              <div className="text-center py-12">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có lịch đặt nào</h3>
                <p className="mt-1 text-sm text-gray-500">Bắt đầu đặt lịch với các chuyên gia chăm sóc.</p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đặt lịch ngay
                </button>
              </div>
            ) : (
              myBookings.map(booking => {
                const { date, time } = formatDateTime(booking.scheduledDateTime);
                return (
                  <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getServiceTypeIcon(booking.serviceType)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
                            <p className="text-sm text-gray-600">{getServiceTypeText(booking.serviceType)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <FiUser className="mr-2" />
                            <span>Chuyên gia: {booking.caregiverName || 'Đang cập nhật'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiCalendar className="mr-2" />
                            <span>Ngày: {date}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiClock className="mr-2" />
                            <span>Giờ: {time}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span>Thời lượng: {booking.duration / 60} giờ</span>
                          </div>
                          {booking.address && (
                            <div className="flex items-center text-gray-600 md:col-span-2">
                              <FiMapPin className="mr-2" />
                              <span>Địa chỉ: {booking.address}</span>
                            </div>
                          )}
                        </div>
                        
                        {booking.description && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600">{booking.description}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                        <div className="mt-2 text-lg font-semibold text-gray-900">
                          {formatPrice(booking.price)}
                        </div>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => {
                              // Handle cancel booking
                              if (confirm('Bạn có chắc muốn hủy lịch này?')) {
                                // Implement cancel logic
                                console.log('Cancel booking:', booking.id);
                              }
                            }}
                            className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            Hủy lịch
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && selectedCaregiver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Đặt lịch với {selectedCaregiver.name}</h2>
                  <button
                    onClick={() => {
                      setShowBookingForm(false);
                      resetBookingForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-600">{selectedCaregiver.specialty} • {formatPrice(selectedCaregiver.pricePerHour)}/giờ</p>
              </div>
              
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại dịch vụ</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      Chăm sóc tại nhà
                    </div>
                    <input
                      type="hidden"
                      value="home-care"
                      onChange={(e) => setBookingForm({...bookingForm, serviceType: e.target.value as 'home-care'})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                    <input
                      type="text"
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: Chăm sóc bà ngoại"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
                  <textarea
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mô tả nhu cầu chăm sóc cụ thể..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
                    <input
                      type="date"
                      value={bookingForm.scheduledDate}
                      onChange={(e) => setBookingForm({...bookingForm, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giờ</label>
                    <input
                      type="time"
                      value={bookingForm.scheduledTime}
                      onChange={(e) => setBookingForm({...bookingForm, scheduledTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng (giờ)</label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) => setBookingForm({...bookingForm, duration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>1 giờ</option>
                      <option value={2}>2 giờ</option>
                      <option value={3}>3 giờ</option>
                      <option value={4}>4 giờ</option>
                      <option value={6}>6 giờ</option>
                      <option value={8}>8 giờ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                  <input
                    type="text"
                    value={bookingForm.address}
                    onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Địa chỉ nhà..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Người được chăm sóc *</label>
                  <select
                    value={bookingForm.selectedFamilyMemberId}
                    onChange={(e) => setBookingForm({...bookingForm, selectedFamilyMemberId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Chọn người được chăm sóc</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.avatar} {member.name} ({member.age} tuổi - {member.relationship})
                      </option>
                    ))}
                  </select>
                  {familyMembers.length === 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Bạn chưa có thành viên gia đình nào. 
                        <button 
                          type="button"
                          onClick={() => navigate('/care-seeker/family')}
                          className="text-blue-600 hover:text-blue-800 underline ml-1"
                        >
                          Thêm thành viên gia đình
                        </button>
                      </p>
                    </div>
                  )}
                </div>

                {/* Hiển thị thông tin chi tiết của người được chăm sóc đã chọn */}
                {bookingForm.selectedFamilyMemberId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Thông tin người được chăm sóc</h4>
                    {(() => {
                      const selectedMember = familyMembers.find(fm => fm.id === bookingForm.selectedFamilyMemberId);
                      if (!selectedMember) return null;
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-2xl">{selectedMember.avatar}</div>
                              <div>
                                <h5 className="font-medium text-gray-900">{selectedMember.name}</h5>
                                <p className="text-sm text-gray-600">{selectedMember.age} tuổi - {selectedMember.relationship}</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p><strong>Chiều cao:</strong> {selectedMember.height}</p>
                              <p><strong>Cân nặng:</strong> {selectedMember.weight}</p>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              <p><strong>Huyết áp:</strong> {selectedMember.bloodPressure}</p>
                              <p><strong>Đường huyết:</strong> {selectedMember.bloodSugar}</p>
                              <p><strong>Nhịp tim:</strong> {selectedMember.heartRate}</p>
                            </div>
                            {selectedMember.medicalConditions.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">Tình trạng sức khỏe:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedMember.medicalConditions.map((condition, index) => (
                                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                      {condition}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedMember.allergies.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">Dị ứng:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedMember.allergies.map((allergy, index) => (
                                    <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                      {allergy}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú thêm</label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Thông tin bổ sung về tình trạng sức khỏe, yêu cầu đặc biệt..."
                  />
                </div>

                {/* Phương thức thanh toán */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) => setBookingForm({...bookingForm, paymentMethod: e.target.value as 'cash' | 'qr'})}
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
                          <div className="text-sm text-gray-500">Thanh toán khi hoàn thành dịch vụ</div>
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
                        onChange={(e) => setBookingForm({...bookingForm, paymentMethod: e.target.value as 'cash' | 'qr'})}
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
                          <div className="text-sm text-gray-500">Thanh toán trước khi bắt đầu</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Thông tin thanh toán QR Code */}
                {bookingForm.paymentMethod === 'qr' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
                            Nhấn nút bên dưới để tạo mã QR cho giao dịch {formatPrice(selectedCaregiver.pricePerHour * bookingForm.duration)}
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
                                Quét mã QR bằng ứng dụng ngân hàng để thanh toán {formatPrice(selectedCaregiver.pricePerHour * bookingForm.duration)}
                              </p>
                              <div className="text-xs text-gray-500 mb-3">
                                <p>Ngân hàng: ABC Bank</p>
                                <p>Tài khoản: 1234567890</p>
                                <p>Nội dung: Booking {familyMembers.find(fm => fm.id === bookingForm.selectedFamilyMemberId)?.name || ''} - {bookingForm.scheduledDate}</p>
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

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tổng cộng:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(selectedCaregiver.pricePerHour * bookingForm.duration)}
                    </span>
                  </div>
                  {bookingForm.paymentMethod === 'cash' && (
                    <div className="mt-2 text-xs text-gray-500">
                      💰 Thanh toán bằng tiền mặt khi hoàn thành dịch vụ
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingForm(false);
                      resetBookingForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Đặt lịch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;