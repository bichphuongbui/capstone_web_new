import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Complaint, submitComplaint } from '../../services/complaint.service';

const ComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || 'BK000';

  const bookingInfo = useMemo(() => ({
    id: bookingId,
    careseekerName: 'Nguyễn Văn A',
    time: '2025-09-20 08:00',
    service: 'Chăm sóc tại nhà - theo giờ',
  }), [bookingId]);

  const [reason, setReason] = useState('Không hợp tác');
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [sendToAdmin, setSendToAdmin] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!reason) e.reason = 'Vui lòng chọn lý do';
    if (!content.trim()) e.content = 'Vui lòng nhập nội dung chi tiết';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload: Complaint = {
      bookingId: bookingInfo.id,
      caregiverId: 'CG001',
      careseekerId: 'CS001',
      reason,
      content: content.trim(),
      fileUrl,
      sendToAdmin,
      createdAt: new Date().toISOString(),
    };
    await submitComplaint(payload);
    // Persist booking status to complaint and default tag to reviewing
    localStorage.setItem(`booking_status_${bookingInfo.id}`, 'complaint');
    localStorage.setItem(`complaint_tag_${bookingInfo.id}`, 'reviewing');
    alert('Khiếu nại đã được gửi thành công. Admin sẽ xem xét.');
    navigate('/care-giver/bookings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Khiếu nại Care Seeker</h1>
          <p className="mt-1 text-sm text-gray-600">Gửi khiếu nại liên quan đến lịch hẹn</p>
        </div>

        {/* Booking info */}
        <div className="mt-6 rounded-xl bg-white shadow border border-gray-100 p-5">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Mã booking</div>
              <div className="font-medium text-gray-900">#{bookingInfo.id}</div>
            </div>
            <div>
              <div className="text-gray-500">Tên Người thuê</div>
              <div className="font-medium text-gray-900">{bookingInfo.careseekerName}</div>
            </div>
            <div>
              <div className="text-gray-500">Thời gian</div>
              <div className="font-medium text-gray-900">{bookingInfo.time}</div>
            </div>
            <div>
              <div className="text-gray-500">Dịch vụ</div>
              <div className="font-medium text-gray-900">{bookingInfo.service}</div>
            </div>
          </div>
        </div>

        {/* Complaint form */}
        <form onSubmit={onSubmit} className="mt-6 rounded-xl bg-white shadow border border-gray-100 p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-900">Lý do khiếu nại <span className="text-red-600">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm bg-white ${errors.reason ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option>Không hợp tác</option>
              <option>Hành vi không phù hợp</option>
              <option>Không thanh toán đúng thỏa thuận</option>
              <option>Khác</option>
            </select>
            {errors.reason && <div className="mt-1 text-sm text-red-600">{errors.reason}</div>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">Nội dung chi tiết <span className="text-red-600">*</span></label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className={`mt-2 w-full rounded-lg border px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.content ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Mô tả chi tiết tình huống, bằng chứng, thời điểm..."
            />
            {errors.content && <div className="mt-1 text-sm text-red-600">{errors.content}</div>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">Tải lên bằng chứng (tùy chọn)</label>
            <input type="file" onChange={(e) => setFileUrl(e.target.files?.[0]?.name)} className="mt-2 block w-full text-sm text-gray-700" />
            {fileUrl && <div className="mt-1 text-xs text-gray-500">Đã chọn: {fileUrl}</div>}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input type="checkbox" checked={sendToAdmin} onChange={(e) => setSendToAdmin(e.target.checked)} /> Gửi kèm báo cáo cho Admin
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting} className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white ${submitting ? 'bg-rose-400' : 'bg-rose-600 hover:bg-rose-700'}`}>Gửi khiếu nại</button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-800 hover:bg-gray-50">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintPage;


