import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const BookingReportPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [actualDuration, setActualDuration] = useState('');
  const [healthStatus, setHealthStatus] = useState('Bình thường');
  const [healthNote, setHealthNote] = useState('');
  const [abnormal, setAbnormal] = useState<{ [k: string]: boolean }>({});
  const [abnormalOther, setAbnormalOther] = useState('');
  const [meals, setMeals] = useState<{ [k: string]: boolean }>({});
  const [medTaken, setMedTaken] = useState(false);
  const [medTime, setMedTime] = useState('');
  const [medDose, setMedDose] = useState('');
  const [hygiene, setHygiene] = useState<{ [k: string]: boolean }>({});
  const [exercise, setExercise] = useState(false);
  const [companionship, setCompanionship] = useState(false);
  const [specialTasks, setSpecialTasks] = useState('');
  const [careLog, setCareLog] = useState('');
  const [incident, setIncident] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [confirm, setConfirm] = useState(false);

  const isViewOnly = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === '1';

  const header = useMemo(() => ({
    bookingCode: bookingId,
    careSeekerName: 'Họ tên mẫu',
    startTime: '2025-09-20 08:00',
    endTime: '2025-09-20 12:00',
    caregiverName: 'Caregiver A',
    location: 'Q.1, TP.HCM',
  }), [bookingId]);

  // Mock existing report data for view mode
  const getMockReportById = (id?: string) => {
    if (!id) return null as any;
    if (id === 'BK003') {
      return {
        actualDuration: '3',
        healthStatus: 'Bình thường',
        healthNote: 'Sức khoẻ ổn, đi lại chậm.',
        abnormal: { },
        abnormalOther: '',
        meals: { Sáng: true, Trưa: true },
        medTaken: true,
        medTime: '09:00',
        medDose: '1 viên',
        hygiene: { 'Rửa mặt': true, 'Thay đồ': true },
        exercise: true,
        companionship: true,
        specialTasks: 'Kiểm tra huyết áp định kỳ',
        careLog: 'Lịch hẹn diễn ra thuận lợi, bệnh nhân hợp tác tốt.',
        incident: '',
        suggestion: 'Duy trì chế độ ăn nhạt và vận động nhẹ mỗi ngày.',
      };
    }
    return null as any;
  };

  useEffect(() => {
    if (isViewOnly) {
      const data = getMockReportById(bookingId);
      if (data) {
        setActualDuration(data.actualDuration);
        setHealthStatus(data.healthStatus);
        setHealthNote(data.healthNote);
        setAbnormal(data.abnormal || {});
        setAbnormalOther(data.abnormalOther || '');
        setMeals(data.meals || {});
        setMedTaken(!!data.medTaken);
        setMedTime(data.medTime || '');
        setMedDose(data.medDose || '');
        setHygiene(data.hygiene || {});
        setExercise(!!data.exercise);
        setCompanionship(!!data.companionship);
        setSpecialTasks(data.specialTasks || '');
        setCareLog(data.careLog || '');
        setIncident(data.incident || '');
        setSuggestion(data.suggestion || '');
      }
    }
  }, [isViewOnly, bookingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm) {
      alert('Vui lòng xác nhận thông tin trước khi gửi.');
      return;
    }
    if (!actualDuration) {
      alert('Vui lòng nhập thời lượng thực tế.');
      return;
    }
    const payload = {
      bookingId,
      actualDuration,
      healthStatus,
      healthNote,
      abnormal: { ...abnormal, other: abnormalOther },
      activities: {
        meals,
        medication: { taken: medTaken, time: medTime, dose: medDose },
        hygiene,
        exercise,
        companionship,
        specialTasks,
      },
      careLog,
      incident,
      suggestion,
      filesCount: files.length,
    };
    console.log('Submit report payload:', payload);
    navigate(`/care-giver/bookings/${bookingId}?reported=1`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={`/care-giver/bookings/${bookingId}`} className="text-blue-600 hover:underline">← Quay lại chi tiết</Link>
        <div className="mt-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">{isViewOnly ? 'Xem báo cáo' : 'Báo cáo kết thúc lịch hẹn chăm sóc'}</h1>
            <p className="mt-1 text-sm text-gray-600">Mã đơn #{bookingId}</p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Thông tin lịch hẹn chăm sóc</h2>
              <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Mã lịch hẹn (ID)</div>
                  <div className="font-medium text-gray-900">{header.bookingCode}</div>
                </div>
                <div>
                  <div className="text-gray-500">Họ tên người được chăm sóc</div>
                  <div className="font-medium text-gray-900">{header.careSeekerName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày & giờ lịch hẹn</div>
                  <div className="font-medium text-gray-900">{header.startTime} – {header.endTime}</div>
                </div>
                <div>
                  <div className="text-gray-500">Caregiver thực hiện</div>
                  <div className="font-medium text-gray-900">{header.caregiverName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Địa điểm</div>
                  <div className="font-medium text-gray-900">{header.location}</div>
                </div>
                <div>
                  <label className="text-gray-900 font-medium">Thời lượng thực tế (giờ)</label>
                  <input type="number" min="0" step="0.5" value={actualDuration} onChange={(e) => setActualDuration(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: 4" readOnly={isViewOnly} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Tình trạng người được chăm sóc</h2>
              <div className="mt-3 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-900">Sức khỏe tổng quát</label>
                  <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isViewOnly}>
                    <option>Tốt</option>
                    <option>Bình thường</option>
                    <option>Có vấn đề</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-900">Ghi chú chi tiết</label>
                  <textarea value={healthNote} onChange={(e) => setHealthNote(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: hơi mệt, cần nghỉ ngơi thêm" readOnly={isViewOnly} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-900">Dấu hiệu bất thường</div>
                <div className="mt-2 grid sm:grid-cols-3 gap-2 text-sm">
                  {['Sốt','Đau','Khó thở','Té ngã'].map((k) => (
                    <label key={k} className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={!!abnormal[k]} onChange={(e) => setAbnormal({ ...abnormal, [k]: e.target.checked })} disabled={isViewOnly} />
                      <span>{k}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-sm">Khác:</label>
                  <input value={abnormalOther} onChange={(e) => setAbnormalOther(e.target.value)} className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mô tả ngắn" readOnly={isViewOnly} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Các hoạt động đã thực hiện</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Hỗ trợ ăn uống</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {['Sáng','Trưa','Chiều','Tối'].map((k) => (
                      <label key={k} className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!meals[k]} onChange={(e) => setMeals({ ...meals, [k]: e.target.checked })} disabled={isViewOnly} />
                        <span>{k}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Hỗ trợ uống thuốc</div>
                  <label className="mt-2 inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={medTaken} onChange={(e) => setMedTaken(e.target.checked)} disabled={isViewOnly} />
                    <span>Có uống thuốc</span>
                  </label>
                  <div className="mt-2 grid sm:grid-cols-2 gap-3">
                    <input value={medTime} onChange={(e) => setMedTime(e.target.value)} placeholder="Giờ uống" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly={isViewOnly} />
                    <input value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="Liều lượng" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly={isViewOnly} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Vệ sinh cá nhân</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {['Rửa mặt','Tắm','Thay đồ','Thay bỉm'].map((k) => (
                      <label key={k} className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!hygiene[k]} onChange={(e) => setHygiene({ ...hygiene, [k]: e.target.checked })} disabled={isViewOnly} />
                        <span>{k}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={exercise} onChange={(e) => setExercise(e.target.checked)} disabled={isViewOnly} />
                  <span>Vận động / tập luyện</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={companionship} onChange={(e) => setCompanionship(e.target.checked)} disabled={isViewOnly} />
                  <span>Trò chuyện, đồng hành</span>
                </label>
                <div>
                  <label className="text-sm text-gray-900">Các công việc đặc biệt</label>
                  <input value={specialTasks} onChange={(e) => setSpecialTasks(e.target.value)} placeholder="Mô tả" className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly={isViewOnly} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">Nhật ký lịch hẹn chăm sóc</label>
              <textarea value={careLog} onChange={(e) => setCareLog(e.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ghi ngắn gọn những gì đã diễn ra" readOnly={isViewOnly} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Sự cố xảy ra</label>
                <textarea value={incident} onChange={(e) => setIncident(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly={isViewOnly} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Đề xuất</label>
                <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" readOnly={isViewOnly} />
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Upload file (optional)</h2>
              <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="mt-2 block w-full text-sm" disabled={isViewOnly} />
              <p className="mt-1 text-xs text-gray-500">Tùy chọn. Chỉ upload nếu cần</p>
            </div>

            {isViewOnly ? (
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Đóng</button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
                  <span>Tôi xác nhận toàn bộ thông tin là đúng</span>
                </label>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Gửi báo cáo</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingReportPage;


