import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCalendar, FiClock, FiUsers, FiFileText, FiMapPin, FiDollarSign } from 'react-icons/fi';

type BookingStatus = 'pending' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'complaint';
type BookingType = 'instant' | 'scheduled';

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  waiting: 'Chờ thực hiện',
  in_progress: 'Đang thực hiện',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
  complaint: 'Khiếu nại',
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  waiting: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  complaint: 'bg-red-50 text-red-700 ring-red-600/20',
};

type TaskType = 'fixed' | 'flexible' | 'optional';
type CareTask = {
  type: TaskType;
  name: string;
  description?: string;
  days?: string[]; // Ngày trong tuần mà task áp dụng
  startTime?: string; // Giờ bắt đầu nếu có
  endTime?: string; // Giờ kết thúc nếu có (HH:mm)
  date?: string; // Ngày cụ thể dạng YYYY-MM-DD (áp dụng cho lịch hẹn này)
  completed?: boolean;
};

// Mock booking fetch by id (replace with API later)
const getMockBookingById = (id: string) => {
  const base = {
    duration: '4 giờ',
    description:
      'Yêu cầu hỗ trợ ăn uống, theo dõi uống thuốc đúng giờ và hỗ trợ đi lại trong nhà. Ưu tiên ứng xử nhẹ nhàng, kiên nhẫn.',
    tasks: [
      // 1) Task cố định: đúng giờ/ngày phải thực hiện
      {
        type: 'fixed',
        name: 'Uống thuốc huyết áp',
        description: 'Nhắc và theo dõi uống thuốc theo chỉ định bác sĩ',
        days: ['Thứ 2'],
        date: '2025-10-21',
        startTime: '09:00',
        endTime: '09:10',
        completed: true,
      },
      {
        type: 'fixed',
        name: 'Vận động nhẹ',
        description: 'Hướng dẫn vận động khớp 15 phút',
        days: ['Thứ 2'],
        date: '2025-10-21',
        startTime: '10:30',
        endTime: '10:45',
        completed: false,
      },
      // 2) Task linh hoạt (to-do)
      {
        type: 'flexible',
        name: 'Trò chuyện',
        description: 'Giao tiếp ấm áp, hỏi thăm tinh thần 15–20 phút',
        days: ['Thứ 2'],
        date: '2025-10-21',
        startTime: '09:30',
        endTime: '09:50',
        completed: false,
      },
      {
        type: 'flexible',
        name: 'Dọn dẹp nhẹ',
        description: 'Sắp xếp chăn gối, lau bàn, đổ rác',
        days: ['Thứ 2'],
        date: '2025-10-21',
        startTime: '11:00',
        endTime: '11:20',
        completed: false,
      },
      // 3) Task tuỳ chọn (nếu còn thời gian)
      {
        type: 'optional',
        name: 'Đọc sách',
        description: 'Đọc báo/sách 10–15 phút nếu còn thời gian',
        days: ['Thứ 2'],
        date: '2025-10-21',
        startTime: undefined,
        completed: false,
      },
      {
        type: 'optional',
        name: 'Chuẩn bị trái cây',
        description: 'Gọt trái cây nhẹ làm bữa phụ',
        days: ['Thứ 2'],
        date: '2025-10-21',
        startTime: '11:45',
        endTime: '12:00',
        completed: false,
      },
    ] as CareTask[],
    recipient: {
      fullName: 'Cụ Nguyễn Văn A',
      age: 82,
      gender: 'Nam',
      healthStatus: 'Bệnh mãn tính, cần hỗ trợ đặc biệt',
      medicalNotes: 'Tăng huyết áp, tiểu đường; dị ứng penicillin',
      specialNeeds: 'Chế độ ăn nhạt, hỗ trợ đi lại, đồng hành tinh thần',
    },
    patientProfile: {
      overview: {
        dob: '1943-02-14',
        gender: 'Nam',
        phone: '0901 234 567',
        address: '123 Lê Lợi, P. Bến Thành, Q.1, TP.HCM',
        bloodGroup: 'O+',
        weightKg: 60,
        heightCm: 165,
      },
      conditions: {
        hypertension: 'Cao huyết áp – đang điều trị',
        diabetes: 'Tiểu đường – đang điều trị',
        special: 'Suy giảm trí nhớ nhẹ',
      },
      medications: [
        { name: 'Metformin', dose: '500mg', instruction: 'uống 2 lần/ngày' },
        { name: 'Lisinopril', dose: '10mg', instruction: 'uống 1 lần/ngày' },
      ],
      allergies: ['Hải sản'],
      adl: {
        eating: 'Cần hỗ trợ',
        bathing: 'Cần hỗ trợ',
        toileting: 'Cần hỗ trợ',
        mobility: 'Tự lập',
        dressing: 'Tự lập',
      },
      needs: ['Trò chuyện', 'Nhắc nhở', 'Chế độ ăn', 'Quản lý thuốc', 'Đồng hành'],
    },
    service: {
      internalId: 'CASE-0001',
      serviceType: 'Chăm sóc tại nhà - theo giờ',
      time: '2025-10-21 08:00 – 2025-10-21 12:00 (lịch hẹn cố định 8h–12h)',
      location: 'Q.1, TP.HCM',
      primaryContact: { name: 'Nguyễn Minh', phone: '0901 234 567', email: 'minh@example.com' },
      familyNotes: 'Không ăn mặn, hạn chế ra ngoài buổi tối',
    },
    // Thông tin dành cho đặt ngay (instant)
    jobInfo: {
      basic: {
        location: 'Q.1, TP.HCM',
        wagePerHour: 120000, // VND/h
      },
      workTime: {
        dayNeeded: '2025-10-21',
        timeSlot: 'Sáng' as 'Sáng' | 'Chiều' | 'Tối' | 'Đêm' | 'Khác',
      },
      rentType: 'Theo ngày' as 'Ngắn ngày (<7 ngày)' | 'Dài ngày (>7 ngày)' | 'Theo giờ' | 'Không thời hạn',
      period: {
        startDate: '2025-10-21',
        endDate: '2025-10-21',
      },
    },
    // Thông tin dành cho đặt trước (scheduled)
    appointment: {
      date: '2025-10-27',
      startTime: '14:00',
      durationHours: 2,
      participants: ['Con gái (Lan)', 'Con rể (Hùng)'],
      note: 'Trao đổi sơ bộ về nhu cầu chăm sóc và phân công thời gian.',
    },
    scheduleReminders: [
      { time: '09:00', title: 'Uống thuốc huyết áp' },
      { time: '10:30', title: 'Vận động nhẹ 15 phút' },
      { time: '11:45', title: 'Chuẩn bị bữa trưa' },
    ],
    careLog: [] as { time: string; note: string }[],
    billing: {
      unitPrice: 120000,
      hours: 4,
      paymentMethod: 'Tiền mặt',
      paymentStatus: 'Chưa thanh toán',
    },
  };

  const byId: Record<string, {
    careseekerName: string;
    startTime: string;
    address: string;
    status: BookingStatus;
    type: BookingType;
    reportSubmitted?: boolean;
    review?: { rated: boolean; rating?: number; comment?: string; date?: string };
    override?: Partial<typeof base>;
  }> = {
    BK001: { 
      careseekerName: 'Cụ Nguyễn Văn A', 
      startTime: '2025-10-28 08:00', 
      address: 'Q.1, TP.HCM', 
      status: 'pending', 
      type: 'instant',
      override: {
        recipient: { fullName: 'Cụ Nguyễn Văn A', age: 82, gender: 'Nam', healthStatus: 'Bệnh mãn tính', medicalNotes: 'Tăng huyết áp, tiểu đường', specialNeeds: 'Chế độ ăn nhạt' }
      }
    },
    BK010: { 
      careseekerName: 'Bà Phạm Thị K', 
      startTime: '2025-10-27 10:00', 
      address: 'Q.9, TP.HCM', 
      status: 'pending', 
      type: 'instant',
      override: {
        recipient: { fullName: 'Bà Phạm Thị K', age: 75, gender: 'Nữ', healthStatus: 'Cần hỗ trợ vệ sinh', medicalNotes: 'Viêm khớp', specialNeeds: 'Hỗ trợ tắm rửa' }
      }
    },
    BK002: { 
      careseekerName: 'Bà Trần Thị B', 
      startTime: '2025-10-21 14:00', 
      address: 'Q.3, TP.HCM', 
      status: 'in_progress', 
      type: 'instant',
      override: {
        recipient: { fullName: 'Bà Trần Thị B', age: 78, gender: 'Nữ', healthStatus: 'Ổn định', medicalNotes: 'Cao huyết áp', specialNeeds: 'Giám sát uống thuốc' }
      }
    },
    BK003: { 
      careseekerName: 'Ông Lê Văn C', 
      startTime: '2025-10-18 09:00', 
      address: 'Q.5, TP.HCM', 
      status: 'completed', 
      type: 'instant', 
      reportSubmitted: true, 
      review: { rated: true, rating: 5, comment: 'Caregiver rất tận tâm, đúng giờ và nhẹ nhàng.', date: '2025-10-18 13:00' },
      override: {
        recipient: { fullName: 'Ông Lê Văn C', age: 80, gender: 'Nam', healthStatus: 'Khỏe mạnh', medicalNotes: 'Không', specialNeeds: 'Vệ sinh cá nhân' }
      }
    },
    BK004: { 
      careseekerName: 'Cụ Phạm Văn D', 
      startTime: '2025-10-17 13:00', 
      address: 'Q.7, TP.HCM', 
      status: 'cancelled', 
      type: 'instant',
      override: {
        recipient: { fullName: 'Cụ Phạm Văn D', age: 85, gender: 'Nam', healthStatus: 'Yếu', medicalNotes: 'Tim mạch', specialNeeds: 'Đi lại an toàn' },
        tasks: []
      }
    },
    BK009: { 
      careseekerName: 'Ông Phan Văn I', 
      startTime: '2025-10-15 08:00', 
      address: 'Q.8, TP.HCM', 
      status: 'complaint', 
      type: 'instant',
      override: {
        recipient: { fullName: 'Ông Phan Văn I', age: 77, gender: 'Nam', healthStatus: 'Ổn định', medicalNotes: 'Tiểu đường', specialNeeds: 'Chăm sóc theo giờ' }
      }
    },
    // Scheduled bookings
    BK007: { 
      careseekerName: 'Cụ Hoàng Văn G', 
      startTime: '2025-10-23 09:00', 
      address: 'Q.4, TP.HCM', 
      status: 'waiting', 
      type: 'scheduled',
      override: {
        recipient: { fullName: 'Cụ Hoàng Văn G', age: 79, gender: 'Nam', healthStatus: 'Cần vận động', medicalNotes: 'Thoái hóa khớp', specialNeeds: 'Vận động trị liệu' },
        appointment: { date: '2025-10-22', startTime: '15:00', durationHours: 1, participants: ['Con trai'], note: 'Hỗ trợ tập thể dục nhẹ nhàng' },
        tasks: []
      }
    },
    BK012: { 
      careseekerName: 'Bà Lê Thị M', 
      startTime: '2025-10-25 10:00', 
      address: 'Q.12, TP.HCM', 
      status: 'waiting', 
      type: 'scheduled',
      override: {
        recipient: { fullName: 'Bà Lê Thị M', age: 81, gender: 'Nữ', healthStatus: 'Alzheimer giai đoạn đầu', medicalNotes: 'Suy giảm trí nhớ', specialNeeds: 'Chăm sóc đặc biệt' },
        appointment: { date: '2025-10-24', startTime: '14:00', durationHours: 1.5, participants: ['Con gái', 'Cháu nội'], note: 'Chăm sóc bệnh Alzheimer, cần kiên nhẫn và nhẹ nhàng' },
        tasks: []
      }
    },
    BK008: { 
      careseekerName: 'Bà Lý Thị H', 
      startTime: '2025-10-24 10:30', 
      address: 'Q.6, TP.HCM', 
      status: 'waiting', 
      type: 'scheduled',
      override: {
        recipient: { fullName: 'Bà Lý Thị H', age: 76, gender: 'Nữ', healthStatus: 'Có vết thương', medicalNotes: 'Loét chân', specialNeeds: 'Chăm sóc vết thương' },
        appointment: { date: '2025-10-23', startTime: '16:00', durationHours: 1, participants: ['Con rể'], note: 'Chăm sóc vết thương cần chuyên môn' },
        tasks: []
      }
    },
    BK006: { 
      careseekerName: 'Cụ Võ Văn F', 
      startTime: '2025-10-16 08:00', 
      address: 'Q.2, TP.HCM', 
      status: 'completed', 
      type: 'scheduled',
      override: {
        recipient: { fullName: 'Cụ Võ Văn F', age: 83, gender: 'Nam', healthStatus: 'Tiểu đường', medicalNotes: 'Đường huyết cao', specialNeeds: 'Theo dõi sức khỏe' },
        appointment: { date: '2025-10-15', startTime: '14:00', durationHours: 1, participants: ['Vợ'], note: 'Theo dõi đường huyết và chế độ ăn' },
        tasks: []
      },
      reportSubmitted: false, 
      review: { rated: false }
    },
  };

  const v = byId[id] ?? { careseekerName: 'Careseeker', startTime: '2025-10-28 08:00', address: '—', status: 'pending' as BookingStatus, type: 'instant' as BookingType };
  const merged = { id, ...base, ...v, ...(v.override || {}) } as { id: string } & typeof base & typeof v;
  return merged;
};

const BookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const booking = getMockBookingById(bookingId || 'BK');
  // Inject careseeker note from video request into appointment note if exists
  try {
    const extra = localStorage.getItem(`vr_note_${booking.id}`);
    if (extra && (booking as any).appointment) {
      (booking as any).appointment.note = extra;
    }
    const vstatus = localStorage.getItem(`video_status_${booking.id}`) as 'pending' | 'responded' | 'accepted' | 'rejected' | null;
    if (vstatus && (booking as any).appointment) {
      (booking as any).appointment.videoStatus = vstatus;
    }
  } catch {}

  // Tasks state with full info from careseeker
  const parseDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr || !timeStr) return undefined;
    const [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10));
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime()) || isNaN(hh) || isNaN(mm)) return undefined;
    d.setHours(hh, mm, 0, 0);
    return d;
  };

  const parseBookingTimeRange = (serviceTime: string) => {
    // Expect format like: '2025-10-21 08:00 – 2025-10-21 12:00 (...)'
    const match = serviceTime.match(/(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})\s*[–-]\s*(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})/);
    if (!match) return { start: undefined as Date | undefined, end: undefined as Date | undefined };
    const [, d1, t1, d2, t2] = match;
    const start = parseDateTime(d1, t1);
    const end = parseDateTime(d2, t2);
    return { start, end };
  };

  const isOverlap = (aStart?: Date, aEnd?: Date, bStart?: Date, bEnd?: Date) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return false;
    return aStart < bEnd && bStart < aEnd; // overlap if ranges intersect
  };

  const { start: bookingStart, end: bookingEnd } = parseBookingTimeRange(booking.service.time);

  const initialTasks: CareTask[] = useMemo(() => {
    const list = (booking as any).tasks as CareTask[] | undefined;
    if (!list || list.length === 0) return [];
    return list.map((t) => ({ ...t, completed: Boolean(t.completed) }));
  }, [booking]);

  const [tasks, setTasks] = useState<CareTask[]>(initialTasks);

  const toggleTask = (index: number) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t)));
  };
  const canToggle = booking.status === 'in_progress';
  const completedCount = (booking.status === 'in_progress')
    ? tasks.filter((t) => t.completed).length
    : 0;
  const totalCount = tasks.length || 1;

  const sections = useMemo(() => {
    const visible = tasks.filter((t) => {
      // Always show optional tasks; others must overlap the booking time range
      if (t.type === 'optional') return true;
      const taskStart = parseDateTime(t.date, t.startTime);
      const taskEnd = parseDateTime(t.date, t.endTime || t.startTime);
      return isOverlap(taskStart, taskEnd, bookingStart, bookingEnd);
    });
    const withIndex = visible.map((t) => ({ ...t, _idx: tasks.indexOf(t) }));
    const group = {
      fixed: withIndex.filter((t) => t.type === 'fixed'),
      flexible: withIndex.filter((t) => t.type === 'flexible'),
      optional: withIndex.filter((t) => t.type === 'optional'),
    } as Record<TaskType, (CareTask & { _idx: number })[]>;
    const meta: Record<TaskType, { title: string; hint?: string }> = {
      fixed: { title: 'Nhiệm vụ cố định', hint: 'Thực hiện đúng ngày/giờ đã định' },
      flexible: { title: 'Nhiệm vụ linh hoạt', hint: 'Không phải thói quen cố định, nhưng bắt buộc xong trong lịch hẹn; có ngày/giờ kèm theo' },
      optional: { title: 'Nhiệm vụ tuỳ chọn', hint: 'Làm nếu còn thời gian' },
    };
    return { group, meta };
  }, [tasks]);

  const renderTaskRow = (task: CareTask & { _idx: number }) => {
    const getWeekdayVi = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const d = new Date(`${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return undefined;
      const day = d.getDay(); // 0=Sun..6=Sat
      return day === 0 ? 'Chủ nhật' : `Thứ ${day + 1}`;
    };
    const right = canToggle ? (
      <span className={`text-xs ${task.completed ? 'text-emerald-700' : 'text-gray-400'}`}>{task.completed ? '✔' : ''}</span>
    ) : (
      <span className="text-xs text-gray-400">—</span>
    );
    const body = (
      <div className="w-full text-left">
        <div className={`flex items-center justify-between ${task.completed ? 'text-emerald-700' : 'text-gray-800'}`}>
          <span className="font-medium">{task.name}</span>
          {right}
        </div>
        {(task.description || task.days || task.startTime || task.date) && (
          <div className="mt-1 text-xs text-gray-600">
            {task.description && <div className="leading-5">{task.description}</div>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {task.days && task.days.length > 0 && !task.date && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500">Ngày:</span>
                  <span className="text-gray-700">{task.days.join(', ')}</span>
                </span>
              )}
              {/* Fixed: show weekday instead of date; keep time */}
              {task.type === 'fixed' && task.date && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500">Thứ:</span>
                  <span className="text-gray-700">{getWeekdayVi(task.date)}</span>
                </span>
              )}
              {/* Flexible: only show weekday (no time) */}
              {task.type === 'flexible' && task.date && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500">Thứ:</span>
                  <span className="text-gray-700">{getWeekdayVi(task.date)}</span>
                </span>
              )}
              {/* Optional: remove date and time completely */}
              {task.type !== 'optional' && task.type === 'fixed' && task.startTime && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500">Thời gian:</span>
                  <span className="text-gray-700">{task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
    if (canToggle) {
      return (
        <button
          type="button"
          onClick={() => toggleTask(task._idx)}
          className={`w-full rounded-lg border px-3 py-2 text-left ${task.completed ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          {body}
        </button>
      );
    }
    return (
      <div className="w-full rounded-lg border border-gray-200 px-3 py-2">{body}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/care-giver/bookings" className="text-blue-600 hover:underline">← Quay lại danh sách</Link>

        <div className="mt-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết lịch hẹn chăm sóc</h1>
              <div className="mt-1 text-sm text-gray-500">Mã đơn #{booking.id}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${STATUS_STYLE[booking.status]}`}>
                {STATUS_LABEL[booking.status]}
              </span>
              {booking.status === 'completed' && !booking.reportSubmitted && (
                <button
                  type="button"
                  onClick={() => navigate(`/care-giver/bookings/${booking.id}/report`)}
                  className="hidden sm:inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black"
                >
                  Gửi báo cáo nhanh
                </button>
              )}
              {booking.status === 'completed' && booking.reportSubmitted && (
                <button
                  type="button"
                  onClick={() => navigate(`/care-giver/bookings/${booking.id}/report?view=1`)}
                  className="hidden sm:inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Xem báo cáo
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Hồ sơ bệnh nhân - Thông tin cơ bản */}
            <div>
              <h2 className="text-base font-semibold text-gray-900">Thông tin người cần chăm sóc</h2>
              <div className="mt-4 rounded-xl border border-gray-100 p-4">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Họ tên</div>
                    <div className="font-medium text-gray-900">{booking.recipient.fullName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Tuổi</div>
                    <div className="font-medium text-gray-900">{booking.recipient.age} tuổi</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Giới tính</div>
                    <div className="font-medium text-gray-900">{booking.recipient.gender}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Tình trạng sức khỏe</div>
                    <div className="font-medium text-gray-900">{booking.recipient.healthStatus}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Ghi chú y tế</div>
                    <div className="font-medium text-gray-900">{booking.recipient.medicalNotes}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Nhu cầu đặc biệt</div>
                    <div className="font-medium text-gray-900">{booking.recipient.specialNeeds}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hồ sơ bệnh nhân chi tiết - Hiển thị cho cả instant và scheduled */}
            <div>
              <h2 className="text-base font-semibold text-gray-900">Hồ sơ bệnh nhân chi tiết</h2>
              <div className="mt-4 grid gap-5">
                {/* 1. Tổng quan đầy đủ */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900">1) Tổng quan</h3>
                  <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Ngày sinh</div>
                      <div className="font-medium text-gray-900">{new Date((booking as any).patientProfile.overview.dob).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">SĐT</div>
                      <div className="font-medium text-gray-900">{(booking as any).patientProfile.overview.phone}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-gray-500">Địa chỉ</div>
                      <div className="font-medium text-gray-900">{(booking as any).patientProfile.overview.address}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Nhóm máu</div>
                      <div className="font-medium text-gray-900">{(booking as any).patientProfile.overview.bloodGroup}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cân nặng / Chiều cao</div>
                      <div className="font-medium text-gray-900">{(booking as any).patientProfile.overview.weightKg} kg / {(booking as any).patientProfile.overview.heightCm} cm</div>
                    </div>
                  </div>
                </div>

                {/* 2. Bệnh nền & tình trạng đặc biệt */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900">2) Bệnh nền & tình trạng đặc biệt</h3>
                  <ul className="mt-3 list-disc pl-5 text-sm text-gray-800 space-y-1">
                    <li>{(booking as any).patientProfile.conditions.hypertension}</li>
                    <li>{(booking as any).patientProfile.conditions.diabetes}</li>
                    <li>Tình trạng đặc biệt: {(booking as any).patientProfile.conditions.special}</li>
                  </ul>
                </div>

                {/* 3. Thuốc & dị ứng */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900">3) Thuốc đang sử dụng & dị ứng</h3>
                  <div className="mt-3 grid gap-2 text-sm text-gray-800">
                    {((booking as any).patientProfile.medications as Array<{ name: string; dose: string; instruction: string }>).map((m, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden></span>
                        <div>{m.name} – {m.dose}, {m.instruction}</div>
                      </div>
                    ))}
                    <div className="mt-2 text-gray-700">
                      <span className="font-medium">Dị ứng:</span> {((booking as any).patientProfile.allergies as string[]).join(', ')}
                    </div>
                  </div>
                </div>

                {/* 4. Mức độ tự lập */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900">4) Mức độ tự lập</h3>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-gray-800">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-gray-500">Ăn uống</div>
                      <div className="font-medium">{(booking as any).patientProfile.adl.eating}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-gray-500">Tắm rửa</div>
                      <div className="font-medium">{(booking as any).patientProfile.adl.bathing}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-gray-500">Đi vệ sinh</div>
                      <div className="font-medium">{(booking as any).patientProfile.adl.toileting}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-gray-500">Di chuyển</div>
                      <div className="font-medium">{(booking as any).patientProfile.adl.mobility}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-gray-500">Mặc quần áo</div>
                      <div className="font-medium">{(booking as any).patientProfile.adl.dressing}</div>
                    </div>
                  </div>
                </div>

                {/* 5. Nhu cầu chăm sóc */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900">5) Nhu cầu chăm sóc cần thiết</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {((booking as any).patientProfile.needs as string[]).map((n: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Thông tin cuộc hẹn Video Call cho scheduled booking */}
            {booking.type === 'scheduled' && (booking as any).appointment && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FiCalendar className="text-primary-600" />
                  Thông tin cuộc hẹn Video Call
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <FiCalendar className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Ngày hẹn</div>
                      <div className="font-medium text-gray-900">{new Date((booking as any).appointment.date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Giờ bắt đầu</div>
                      <div className="font-medium text-gray-900">{(booking as any).appointment.startTime}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Giờ kết thúc</div>
                      <div className="font-medium text-gray-900">
                        {(() => {
                          const start = (booking as any).appointment.startTime;
                          const duration = (booking as any).appointment.durationHours;
                          if (!start || !duration) return '—';
                          const [hh, mm] = start.split(':').map(Number);
                          const endDate = new Date();
                          endDate.setHours(hh, mm, 0, 0);
                          endDate.setHours(endDate.getHours() + duration);
                          return endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiUsers className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Người tham gia</div>
                      <div className="font-medium text-gray-900">{((booking as any).appointment.participants as string[]).join(', ')}</div>
                    </div>
                  </div>
                  {(booking as any).appointment.note && (
                    <div className="sm:col-span-2 flex items-start gap-3">
                      <FiFileText className="mt-1 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Ghi chú</div>
                        <div className="font-medium text-gray-900">{(booking as any).appointment.note}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Thông tin công việc và nhiệm vụ cho instant booking */}
            {booking.type === 'instant' && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FiCalendar className="text-primary-600" />
                  Thông tin công việc
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <FiMapPin className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Vị trí làm việc</div>
                      <div className="font-medium text-gray-900">{(booking as any).jobInfo.basic.location}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiDollarSign className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Mức lương</div>
                      <div className="font-medium text-gray-900">{((booking as any).jobInfo.basic.wagePerHour as number).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} / giờ</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Khung thời gian làm</div>
                      <div className="font-medium text-gray-900">
                        {bookingStart ? bookingStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {' – '}
                        {bookingEnd ? bookingEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiCalendar className="mt-1 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Ngày cần chăm sóc</div>
                      <div className="font-medium text-gray-900">{new Date(booking.startTime.split(' ')[0]).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                </div>

                {/* Danh sách nhiệm vụ */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900">Danh sách nhiệm vụ</h3>

                {tasks.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Hoàn thành: {completedCount}/{totalCount}</span>
                    </div>
                  </div>
                )}

                {(['fixed','flexible','optional'] as TaskType[]).map((key) => {
                  const list = sections.group[key];
                  if (list.length === 0) return null;
                  const done = canToggle ? list.filter((t) => t.completed).length : 0;
                  const total = list.length || 1;
                  return (
                    <div key={key} className="mt-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{sections.meta[key].title}</h3>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Hoàn thành: {done}/{total}</span>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {list.map((task) => (
                          <li key={task._idx}>{renderTaskRow(task)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                    Chưa có nhiệm vụ được giao.
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Review from customer */}
            {booking.status === 'completed' && (
              <div>
                <h2 className="text-base font-semibold text-gray-900">Đánh giá từ khách hàng</h2>
                {booking.review && booking.review.rated ? (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < (booking.review?.rating || 0) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <p className="mt-2 text-gray-800">{booking.review?.comment}</p>
                    {booking.review?.date && (
                      <div className="mt-1 text-xs text-gray-500">{booking.review.date}</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                    Chưa có đánh giá.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;


