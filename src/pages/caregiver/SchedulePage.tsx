import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type BookingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

type BookingItem = {
  id: string;
  careSeekerName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  location: string;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday-based
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22; // exclusive
const HOUR_PIXEL = 64; // px height per hour row
const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type TimeRange = { start: string; end: string };
type DailyAvailability = { enabled: boolean; ranges: TimeRange[] };
type WeeklyAvailability = Record<DayKey, DailyAvailability>;
const AVAIL_STORAGE_KEY = 'caregiver_availability_v1';

// Mock bookings data for demo
const mockBookings: BookingItem[] = [
  { id: 'BK001', careSeekerName: 'Cụ Nguyễn Văn A', date: '2025-10-28', startTime: '08:00', endTime: '12:00', status: 'upcoming', location: 'Q.1, TP.HCM' },
  { id: 'BK005', careSeekerName: 'Bà Nguyễn Thị E', date: '2025-10-21', startTime: '07:30', endTime: '12:30', status: 'upcoming', location: 'Q.10, TP.HCM' },
  { id: 'BK007', careSeekerName: 'Cụ Hoàng Văn G', date: '2025-10-23', startTime: '09:00', endTime: '12:00', status: 'upcoming', location: 'Q.4, TP.HCM' },
  { id: 'BK008', careSeekerName: 'Bà Lý Thị H', date: '2025-10-24', startTime: '10:00', endTime: '14:00', status: 'upcoming', location: 'Q.6, TP.HCM' },
  { id: 'BK002', careSeekerName: 'Bà Trần Thị B', date: '2025-10-21', startTime: '14:00', endTime: '17:00', status: 'ongoing', location: 'Q.3, TP.HCM' },
  { id: 'BK003', careSeekerName: 'Ông Lê Văn C', date: '2025-10-18', startTime: '08:00', endTime: '10:00', status: 'completed', location: 'Q.5, TP.HCM' },
  { id: 'BK006', careSeekerName: 'Cụ Võ Văn F', date: '2025-10-16', startTime: '08:00', endTime: '12:00', status: 'completed', location: 'Q.2, TP.HCM' },
];

// Get user's actual bookings from localStorage or API
const getUserBookings = (): BookingItem[] => {
  try {
    const stored = localStorage.getItem('user_bookings');
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with mock data if no bookings exist
    localStorage.setItem('user_bookings', JSON.stringify(mockBookings));
    return mockBookings;
  } catch {
    return mockBookings;
  }
};

const statusStyles: Record<BookingStatus, string> = {
  upcoming: 'bg-blue-50 text-blue-800 border-blue-200',
  ongoing: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200 line-through',
};

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState<Date>(getStartOfWeek(new Date()));
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      return d;
    });
  }, [current]);

  // Load caregiver availability from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AVAIL_STORAGE_KEY);
      if (saved) setAvailability(JSON.parse(saved));
    } catch {}
  }, []);

  const bookingsByDate = useMemo(() => {
    const userBookings = getUserBookings();
    const map: Record<string, BookingItem[]> = {};
    for (const b of userBookings) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, []);

  const goWeek = (diff: number) => {
    const next = new Date(current);
    next.setDate(current.getDate() + diff * 7);
    setCurrent(getStartOfWeek(next));
  };

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    return `${fmt(start)} - ${fmt(end)}`;
  }, [weekDays]);

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map((n) => parseInt(n, 10));
    return h * 60 + (m || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lịch làm việc trong tuần</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => goWeek(-1)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">← Tuần trước</button>
            <div className="text-sm text-gray-700">{weekLabel}</div>
            <button onClick={() => goWeek(1)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">Tuần sau →</button>
            <button onClick={() => navigate('/care-giver/availability')} className="ml-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">Thiết lập lịch rảnh</button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header row */}
            <div className="grid" style={{ gridTemplateColumns: `64px repeat(7, minmax(0, 1fr))` }}>
              <div className="text-left text-xs font-semibold text-gray-600">Giờ</div>
              {weekDays.map((d, idx) => (
                <div key={idx} className="px-2 py-2 text-xs font-semibold text-gray-600">
                  {DAYS[idx]}
                  <div className="text-gray-500">{pad(d.getDate())}/{pad(d.getMonth() + 1)}</div>
                </div>
              ))}
            </div>

            {/* Body grid: time gutter + 7 day columns */}
            <div className="grid border-t border-gray-100" style={{ gridTemplateColumns: `64px repeat(7, minmax(0, 1fr))` }}>
              {/* Time gutter */}
              <div className="relative" style={{ height: (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PIXEL }}>
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }).map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t border-gray-100 text-[10px] text-gray-600" style={{ top: i * HOUR_PIXEL }}>
                    <div className="-mt-2">{pad(DAY_START_HOUR + i)}:00</div>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((d, idx) => {
                const key = formatYMD(d);
                const list = bookingsByDate[key] || [];
                const dayKey = (['mon','tue','wed','thu','fri','sat','sun'] as DayKey[])[idx];
                const dayAvail = availability?.[dayKey];
                return (
                  <div key={idx} className="relative border-l border-gray-100 bg-white" style={{ height: (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PIXEL }}>
                    {/* Hour lines */}
                    {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }).map((_, i) => (
                      <div key={i} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PIXEL }} />
                    ))}

                    {/* Availability blocks - show available time in green */}
                    {dayAvail?.enabled ? (
                      // Show available time ranges in green
                      dayAvail.ranges.map((r, i) => {
                        const [sh, sm] = r.start.split(':').map((n) => parseInt(n, 10));
                        const [eh, em] = r.end.split(':').map((n) => parseInt(n, 10));
                        const startMin = sh * 60 + (sm || 0);
                        const endMin = eh * 60 + (em || 0);
                        const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_PIXEL;
                        const height = Math.max(8, ((endMin - startMin) / 60) * HOUR_PIXEL);
                        return (
                          <div
                            key={i}
                            className="absolute left-1 right-1 rounded-md border border-dashed border-emerald-300 bg-emerald-50/50"
                            style={{ top, height }}
                            aria-hidden
                          />
                        );
                      })
                    ) : (
                      // If day is disabled, show entire day as unavailable (white/default)
                      <div className="absolute inset-0 bg-white" aria-hidden />
                    )}

                    {/* Events */}
                    {list.map((b) => {
                      const startMin = timeToMinutes(b.startTime);
                      const endMin = timeToMinutes(b.endTime);
                      const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_PIXEL;
                      const height = Math.max(24, ((endMin - startMin) / 60) * HOUR_PIXEL);
                      return (
                        <button
                          key={b.id}
                          onClick={() => navigate(`/care-giver/bookings/${b.id}`)}
                          title={`${b.careSeekerName} • ${b.startTime}-${b.endTime} • ${b.location}`}
                          className={`absolute left-2 right-2 rounded-lg border px-2 py-2 text-xs ${statusStyles[b.status]} hover:opacity-90 shadow-sm`}
                          style={{ top, height }}
                        >
                          <div className="font-semibold">{b.startTime} – {b.endTime}</div>
                          <div>{b.careSeekerName}</div>
                          <div className="truncate">{b.location}</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;


