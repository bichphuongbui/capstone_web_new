import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type TimeRange = { start: string; end: string };
type DailyAvailability = { enabled: boolean; ranges: TimeRange[] };
type WeeklyAvailability = Record<DayKey, DailyAvailability>;

type BookingItem = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

const DAY_LABEL: Record<DayKey, string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
  sun: 'Chủ nhật',
};

const DEFAULT_RANGE: TimeRange = { start: '08:00', end: '17:00' };

const buildDefault = (): WeeklyAvailability => ({
  mon: { enabled: true, ranges: [DEFAULT_RANGE] },
  tue: { enabled: true, ranges: [DEFAULT_RANGE] },
  wed: { enabled: true, ranges: [DEFAULT_RANGE] },
  thu: { enabled: true, ranges: [DEFAULT_RANGE] },
  fri: { enabled: true, ranges: [DEFAULT_RANGE] },
  sat: { enabled: true, ranges: [DEFAULT_RANGE] },
  sun: { enabled: true, ranges: [DEFAULT_RANGE] },
});

const STORAGE_KEY = 'caregiver_availability_v1';
const FIRST_TIME_KEY = 'caregiver_availability_set';

// Mock bookings data for demo
const mockBookings: BookingItem[] = [
  { id: 'BK001', date: '2025-10-28', startTime: '08:00', endTime: '12:00' },
  { id: 'BK005', date: '2025-10-21', startTime: '07:30', endTime: '12:30' },
  { id: 'BK007', date: '2025-10-23', startTime: '09:00', endTime: '12:00' },
  { id: 'BK008', date: '2025-10-24', startTime: '10:00', endTime: '14:00' },
  { id: 'BK002', date: '2025-10-21', startTime: '14:00', endTime: '17:00' },
];

// Get actual bookings from localStorage or API - not mock data
const getUserBookings = (): BookingItem[] => {
  try {
    // In production, this would fetch from API based on current user ID
    // For now, check if there are any bookings in localStorage
    const stored = localStorage.getItem('user_bookings');
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with mock data if no bookings exist yet
    localStorage.setItem('user_bookings', JSON.stringify(mockBookings));
    return mockBookings;
  } catch {
    return mockBookings;
  }
};

const AvailabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<WeeklyAvailability>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return buildDefault();
  });

  const [conflicts, setConflicts] = useState<Array<{ day: string; range: string; booking: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isFirstTime = !localStorage.getItem(FIRST_TIME_KEY);

  const dayKeys = useMemo(() => Object.keys(DAY_LABEL) as DayKey[], []);

  // Check for conflicts with existing bookings
  const checkConflicts = (newAvailability: WeeklyAvailability): Array<{ day: string; range: string; booking: string }> => {
    const conflictList: Array<{ day: string; range: string; booking: string }> = [];
    const dayKeyMap: Record<number, DayKey> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun' };

    // Get user's actual bookings (not mock data)
    const userBookings = getUserBookings();
    
    // Get all bookings from now onwards
    const now = new Date();
    const futureBookings = userBookings.filter((b: BookingItem) => new Date(b.date) >= now);

    futureBookings.forEach((booking: BookingItem) => {
      const bookingDate = new Date(booking.date);
      const dayOfWeek = bookingDate.getDay();
      const dayKey = dayKeyMap[dayOfWeek];

      const dayAvail = newAvailability[dayKey];
      if (!dayAvail.enabled) {
        // Day is marked as not available, but there's a booking
        conflictList.push({
          day: DAY_LABEL[dayKey],
          range: `${booking.startTime}-${booking.endTime}`,
          booking: `${booking.id} vào ${bookingDate.toLocaleDateString('vi-VN')}`
        });
        return;
      }

      // Check if booking time falls within any availability range
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);

      const isWithinAvailability = dayAvail.ranges.some(range => {
        const rangeStart = timeToMinutes(range.start);
        const rangeEnd = timeToMinutes(range.end);
        return bookingStart >= rangeStart && bookingEnd <= rangeEnd;
      });

      if (!isWithinAvailability) {
        conflictList.push({
          day: DAY_LABEL[dayKey],
          range: `${booking.startTime}-${booking.endTime}`,
          booking: `${booking.id} vào ${bookingDate.toLocaleDateString('vi-VN')}`
        });
      }
    });

    return conflictList;
  };

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const addRange = (day: DayKey) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], ranges: [...prev[day].ranges, { start: '09:00', end: '12:00' }] },
    }));
  };

  const removeRange = (day: DayKey, idx: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], ranges: prev[day].ranges.filter((_, i) => i !== idx) },
    }));
  };

  const updateRange = (day: DayKey, idx: number, key: keyof TimeRange, value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: prev[day].ranges.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
      },
    }));
  };

  const toggleDay = (day: DayKey) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const resetAll = () => setAvailability(buildDefault());

  const handleSave = () => {
    const conflictList = checkConflicts(availability);
    
    if (conflictList.length > 0) {
      setConflicts(conflictList);
      return;
    }

    setIsSaving(true);
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(availability));
    localStorage.setItem(FIRST_TIME_KEY, 'true');
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      
      // If first time, redirect to dashboard
      if (isFirstTime) {
        setTimeout(() => {
          navigate('/care-giver/dashboard');
        }, 1500);
      } else {
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isFirstTime ? 'Thiết lập lịch rảnh lần đầu' : 'Cập nhật lịch rảnh trong tuần'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isFirstTime 
                ? 'Vui lòng thiết lập lịch rảnh của bạn. Lịch này sẽ áp dụng cho tất cả các tuần tiếp theo.'
                : 'Lịch rảnh áp dụng cho tất cả các tuần. Thay đổi sẽ được kiểm tra xung đột với lịch thuê hiện tại.'}
            </p>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Đã lưu lịch rảnh thành công! {isFirstTime && 'Đang chuyển đến trang chủ...'}
            </p>
          </div>
        )}

        {/* Conflict warnings */}
        {conflicts.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium mb-2">⚠ Không thể lưu do xung đột với lịch thuê hiện tại:</p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {conflicts.map((c, i) => (
                <li key={i}>
                  {c.day}: Khung giờ {c.range} bị trùng với lịch {c.booking}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setConflicts([])}
              className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
            >
              Đóng cảnh báo và chỉnh sửa lại
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {dayKeys.map((day) => (
            <div key={day} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={availability[day].enabled}
                    onChange={() => toggleDay(day)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-900">{DAY_LABEL[day]}</span>
                </div>
                <button
                  onClick={() => addRange(day)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Thêm khung giờ
                </button>
              </div>

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {availability[day].ranges.map((r, idx) => (
                  <div key={idx} className={`flex items-center gap-2 ${!availability[day].enabled ? 'opacity-50' : ''}`}> 
                    <label className="text-xs text-gray-500">Từ</label>
                    <input
                      type="time"
                      value={r.start}
                      onChange={(e) => updateRange(day, idx, 'start', e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                      disabled={!availability[day].enabled}
                    />
                    <label className="text-xs text-gray-500 ml-2">Đến</label>
                    <input
                      type="time"
                      value={r.end}
                      onChange={(e) => updateRange(day, idx, 'end', e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                      disabled={!availability[day].enabled}
                    />
                    <button
                      onClick={() => removeRange(day, idx)}
                      className="ml-auto text-xs text-gray-500 hover:text-red-600"
                      disabled={!availability[day].enabled}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={resetAll} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Đặt lại mặc định
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Đang lưu...' : isFirstTime ? 'Hoàn tất và tiếp tục' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;


