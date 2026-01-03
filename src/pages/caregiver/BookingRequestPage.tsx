import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type BookingStatus = 'pending' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'complaint';
type BookingType = 'instant' | 'scheduled';
type VideoStatus = 'pending' | 'accepted' | 'rejected';
type ComplaintTag = 'reviewing' | 'awaiting_more_info' | 'resolved' | 'refunded' | 'rejected';

type Booking = {
  id: string;
  elderlyName: string;
  address: string;
  startTime: string; // ISO or human
  endTime?: string;
  hours: number;
  price: number; // per hour or total demo
  status: BookingStatus;
  notes?: string;
  service?: string;
  type: BookingType;
  videoRequest?: boolean;
  videoStatus?: VideoStatus;
  complaintTag?: ComplaintTag;
};

const mockBookings: Booking[] = [
  // ===== ĐẶT NGAY (INSTANT) - Thông tin đầy đủ ngay =====
  // Chờ xác nhận
  { id: 'BK001', elderlyName: 'Cụ Nguyễn Văn A', address: 'Q.1, TP.HCM', startTime: '2025-10-28 08:00', hours: 4, price: 120000, status: 'pending', notes: 'Hỗ trợ ăn uống và đi lại', service: 'Chăm sóc theo giờ', type: 'instant' },
  { id: 'BK010', elderlyName: 'Bà Phạm Thị K', address: 'Q.9, TP.HCM', startTime: '2025-10-27 10:00', hours: 3, price: 110000, status: 'pending', notes: 'Tắm rửa và vệ sinh cá nhân', service: 'Chăm sóc cá nhân', type: 'instant' },
  // Đang thực hiện
  { id: 'BK002', elderlyName: 'Bà Trần Thị B', address: 'Q.3, TP.HCM', startTime: '2025-10-21 14:00', hours: 3, price: 110000, status: 'in_progress', notes: 'Giám sát uống thuốc', service: 'Theo dõi thuốc', type: 'instant' },
  // Hoàn thành
  { id: 'BK003', elderlyName: 'Ông Lê Văn C', address: 'Q.5, TP.HCM', startTime: '2025-10-18 09:00', endTime: '2025-10-18 12:00', hours: 3, price: 100000, status: 'completed', notes: 'Vệ sinh cá nhân', service: 'Chăm sóc cá nhân', type: 'instant' },
  // Đã hủy
  { id: 'BK004', elderlyName: 'Cụ Phạm Văn D', address: 'Q.7, TP.HCM', startTime: '2025-10-17 13:00', hours: 2, price: 120000, status: 'cancelled', notes: 'Khách huỷ do bận', service: 'Đi lại an toàn', type: 'instant' },
  // Khiếu nại
  { id: 'BK009', elderlyName: 'Ông Phan Văn I', address: 'Q.8, TP.HCM', startTime: '2025-10-15 08:00', endTime: '2025-10-15 11:00', hours: 3, price: 120000, status: 'complaint', complaintTag: 'resolved', notes: 'Hoàn tất dịch vụ nhưng phát sinh tranh chấp', service: 'Chăm sóc theo giờ', type: 'instant' },

  // ===== ĐẶT TRƯỚC (SCHEDULED) - Có yêu cầu video call trước =====
  // Chờ thực hiện (đã chấp nhận video)
  { id: 'BK007', elderlyName: 'Cụ Hoàng Văn G', address: 'Q.4, TP.HCM', startTime: '2025-10-23 09:00', hours: 3, price: 120000, status: 'waiting', notes: 'Hỗ trợ tập thể dục - Đã video call tư vấn', service: 'Vận động trị liệu', type: 'scheduled', videoRequest: true, videoStatus: 'accepted' },
  { id: 'BK012', elderlyName: 'Bà Lê Thị M', address: 'Q.12, TP.HCM', startTime: '2025-10-25 10:00', hours: 4, price: 125000, status: 'waiting', notes: 'Chăm sóc bệnh Alzheimer - Video call đã hoàn tất', service: 'Chăm sóc đặc biệt', type: 'scheduled', videoRequest: true, videoStatus: 'accepted' },
  // Từ chối video call
  { id: 'BK008', elderlyName: 'Bà Lý Thị H', address: 'Q.6, TP.HCM', startTime: '2025-10-24 10:30', hours: 4, price: 110000, status: 'waiting', notes: 'Chăm sóc vết thương - Video call bị từ chối', service: 'Chăm sóc vết thương', type: 'scheduled', videoRequest: true, videoStatus: 'rejected' },
  // Hoàn thành (có video call)
  { id: 'BK006', elderlyName: 'Cụ Võ Văn F', address: 'Q.2, TP.HCM', startTime: '2025-10-16 08:00', endTime: '2025-10-16 12:00', hours: 4, price: 120000, status: 'completed', notes: 'Theo dõi đường huyết - Đã video call trước đó', service: 'Theo dõi sức khỏe', type: 'scheduled', videoRequest: true, videoStatus: 'accepted' },
];

const STATUS_META: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  waiting: { label: 'Chờ thực hiện', color: 'bg-orange-50 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  in_progress: { label: 'Đang thực hiện', color: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  completed: { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },
  complaint: { label: 'Khiếu nại', color: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
};

const VIDEO_STATUS_META: Record<VideoStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận video call', color: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  accepted: { label: 'Đã chấp nhận video call', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  rejected: { label: 'Đã từ chối video call', color: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
};

const COMPLAINT_TAG_META: Record<ComplaintTag, { label: string; color: string }> = {
  reviewing: { label: 'Đang xem xét', color: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  awaiting_more_info: { label: 'Chờ bổ sung', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  resolved: { label: 'Đã giải quyết', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  rejected: { label: 'Đã từ chối', color: 'bg-red-50 text-red-700 ring-red-600/20' },
};

const TABS: { key: BookingStatus; title: string }[] = [
  { key: 'pending', title: 'Chờ xác nhận' },
  { key: 'waiting', title: 'Chờ thực hiện' },
  { key: 'in_progress', title: 'Đang thực hiện' },
  { key: 'completed', title: 'Đã hoàn thành' },
  { key: 'cancelled', title: 'Đã hủy' },
  { key: 'complaint', title: 'Khiếu nại' },
];

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const BookingRow: React.FC<{ b: Booking; onStatusChange: (id: string, newStatus: BookingStatus) => void }> = ({ b, onStatusChange }) => {
  const navigate = useNavigate();
  const meta = STATUS_META[b.status];
  const complaintTagKey = (b.status === 'complaint' ? (b.complaintTag || (localStorage.getItem(`complaint_tag_${b.id}`) as ComplaintTag | null) || undefined) : undefined);
  const serviceReviewed = !!localStorage.getItem(`service_review_${b.id}`);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md overflow-hidden cursor-pointer" onClick={() => navigate(`/care-giver/bookings/${b.id}`)}>
      <div className={`h-1 w-full ${
        b.status === 'pending' ? 'bg-amber-400' :
        b.status === 'waiting' ? 'bg-orange-500' :
        b.status === 'in_progress' ? 'bg-blue-500' :
        b.status === 'completed' ? 'bg-emerald-500' :
        b.status === 'complaint' ? 'bg-rose-500' : 'bg-gray-300'
      }`} aria-hidden></div>
      <div className="p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <span className="font-medium">#{b.id}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden></span>
            <span>{b.address}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden></span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
              b.type === 'instant' ? 'bg-teal-50 text-teal-700 ring-teal-600/20' : 'bg-purple-50 text-purple-700 ring-purple-600/20'
            }`}>
              {b.type === 'instant' ? '⚡ Đặt ngay' : '📅 Đặt trước'}
            </span>
            {b.type === 'scheduled' && b.videoRequest && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 bg-indigo-50 text-indigo-700 ring-indigo-600/20">
                📹 Video Call
              </span>
            )}
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-900 truncate">{b.elderlyName}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
            <span className="inline-flex items-center gap-1">🕒 <span>{b.startTime}</span></span>
            {b.endTime && <span className="inline-flex items-center gap-1">⏱ <span>{b.endTime}</span></span>}
          </div>
          {b.type === 'scheduled' && b.videoRequest && b.videoStatus && (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${VIDEO_STATUS_META[b.videoStatus].color}`}>
                {VIDEO_STATUS_META[b.videoStatus].label}
              </span>
            </div>
          )}
          {b.status === 'complaint' && complaintTagKey && (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs ring-1 ${COMPLAINT_TAG_META[complaintTagKey].color}`}>Khiếu nại: {COMPLAINT_TAG_META[complaintTagKey].label}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${meta.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden></span>
            {meta.label}
          </span>
          <div className="mt-2 text-xs text-gray-500">Tổng tạm tính</div>
          <div className="text-lg font-semibold text-gray-900">{currency(b.hours * b.price)}</div>
          <div className="mt-3 flex items-center justify-end gap-2">
            {b.status === 'completed' && (
              <>
                {/* <button
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/care-giver/complaint?bookingId=${b.id}`; }}
                >
                  Khiếu nại
                </button> */}
                <button
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/care-giver/service-review?bookingId=${b.id}`; }}
                >
                  {serviceReviewed ? 'Xem đánh giá' : 'Đánh giá'}
                </button>
              </>
            )}
            {b.status === 'pending' && (
              <>
                <button 
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(b.id, 'cancelled');
                  }}
                >
                  Từ chối
                </button>
                <button 
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(b.id, 'waiting');
                  }}
                >
                  Chấp nhận
                </button>
              </>
            )}
            {b.status === 'waiting' && (
              <>
                <button 
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(b.id, 'cancelled');
                  }}
                >
                  Hủy
                </button>
                <button 
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(b.id, 'in_progress');
                  }}
                >
                  Bắt đầu
                </button>
              </>
            )}
            {b.status === 'in_progress' && (
              <button 
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(b.id, 'completed');
                }}
              >
                Hoàn thành
              </button>
            )}
            {b.status === 'complaint' && complaintTagKey && (['resolved','refunded','rejected'].includes(complaintTagKey)) && (() => {
              const hasReviewed = localStorage.getItem(`complaint_review_comment_${b.id}`);
              return (
                <button
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/care-giver/complaint-review?bookingId=${b.id}`; }}
                >
                  {hasReviewed ? 'Xem đánh giá' : 'Đánh giá'}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingList: React.FC<{ data: Booking[]; onStatusChange: (id: string, newStatus: BookingStatus) => void }> = ({ data, onStatusChange }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
        Không có đơn nào trong trạng thái này.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {data.map((b) => (
        <BookingRow key={b.id} b={b} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
};

const BookingRequestPage: React.FC = () => {
  const [active, setActive] = useState<BookingStatus>('pending');
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [typeFilter, setTypeFilter] = useState<BookingType | 'all'>('all');

  // Sync from global active booking (if started elsewhere)
  useEffect(() => {
    const activeId = localStorage.getItem('booking_active');
    if (!activeId) return;
    setBookings(prev => prev.map(b => b.id === activeId ? { ...b, status: 'in_progress' } : b));
  }, []);

  // Initialize complaint tags from mock data to localStorage
  useEffect(() => {
    mockBookings.forEach(b => {
      if (b.status === 'complaint' && b.complaintTag) {
        localStorage.setItem(`booking_status_${b.id}`, 'complaint');
        localStorage.setItem(`complaint_tag_${b.id}`, b.complaintTag);
      }
    });
  }, []);

  // Apply persisted complaint status/tags after complaint submission
  useEffect(() => {
    setBookings(prev => prev.map(b => {
      const persisted = localStorage.getItem(`booking_status_${b.id}`) as BookingStatus | null;
      const tag = localStorage.getItem(`complaint_tag_${b.id}`) as ComplaintTag | null;
      if (persisted === 'complaint') {
        return { ...b, status: 'complaint', complaintTag: tag || 'reviewing' };
      }
      return b;
    }));
  }, []);

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    setBookings(prev => prev.map(booking => 
      booking.id === id ? { ...booking, status: newStatus } : booking
    ));
    // Update shared flag so Dashboard reflects immediately
    if (newStatus === 'in_progress') {
      localStorage.setItem('booking_active', id);
    } else if (newStatus === 'completed' || newStatus === 'cancelled') {
      const cur = localStorage.getItem('booking_active');
      if (cur === id) localStorage.removeItem('booking_active');
    }
  };

  const groups = useMemo(() => {
    const byType = typeFilter === 'all' ? bookings : bookings.filter(b => b.type === typeFilter);
    return {
      pending: byType.filter((b) => b.status === 'pending'),
      waiting: byType.filter((b) => b.status === 'waiting'),
      in_progress: byType.filter((b) => b.status === 'in_progress'),
      completed: byType.filter((b) => b.status === 'completed'),
      cancelled: byType.filter((b) => b.status === 'cancelled'),
      complaint: byType.filter((b) => b.status === 'complaint'),
    } as Record<BookingStatus, Booking[]>;
  }, [bookings, typeFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý yêu cầu đặt lịch</h1>
            <p className="mt-1 text-sm text-gray-600">Theo dõi và xử lý các yêu cầu lịch chăm sóc theo trạng thái.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Loại đặt lịch:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-800 shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">📋 Tất cả</option>
              <option value="instant">⚡ Đặt ngay</option>
              <option value="scheduled">📅 Đặt trước</option>
            </select>
          </div>
        </div>

        <div className="mt-6 sticky top-0 z-10 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
          <div className="flex gap-2 overflow-x-auto py-2">
            {TABS.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm ring-1 transition ${
                    isActive
                      ? 'bg-blue-600 text-white ring-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.title}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-gray-700'}`}>
                    {groups[t.key].length}
                  </span>
                  {isActive && <span className="absolute -bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-blue-600" aria-hidden></span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {active === 'pending' && <BookingList data={groups.pending} onStatusChange={handleStatusChange} />}
          {active === 'waiting' && <BookingList data={groups.waiting} onStatusChange={handleStatusChange} />}
          {active === 'in_progress' && <BookingList data={groups.in_progress} onStatusChange={handleStatusChange} />}
          {active === 'completed' && <BookingList data={groups.completed} onStatusChange={handleStatusChange} />}
          {active === 'cancelled' && <BookingList data={groups.cancelled} onStatusChange={handleStatusChange} />}
          {active === 'complaint' && <BookingList data={groups.complaint} onStatusChange={handleStatusChange} />}
        </div>
      </div>
    </div>
  );
};

export default BookingRequestPage;


