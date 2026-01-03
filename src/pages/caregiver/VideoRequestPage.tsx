import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type VideoStatus = 'pending' | 'accepted' | 'rejected';

type VideoRequest = {
  id: string;
  customerName: string;
  bookingId: string; // e.g. BK001
  time: string; // ISO or readable
  note: string;
  status: VideoStatus;
  rejectionReason?: string;
};

const STATUS_META: Record<VideoStatus, { label: string; color: string; bar: string }> = {
  pending: { label: 'Chờ phản hồi', color: 'bg-amber-50 text-amber-700 ring-amber-600/20', bar: 'bg-amber-400' },
  accepted: { label: 'Đã chấp nhận', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', bar: 'bg-emerald-500' },
  rejected: { label: 'Đã từ chối', color: 'bg-red-50 text-red-700 ring-red-600/20', bar: 'bg-red-500' },
};

const TABS: { key: VideoStatus; title: string }[] = [
  { key: 'pending', title: 'Chờ phản hồi' },
  { key: 'accepted', title: 'Đã chấp nhận' },
  { key: 'rejected', title: 'Đã từ chối' },
];

const mockRequests: VideoRequest[] = [
  { id: 'VR001', customerName: 'Bà Nguyễn Thị E', bookingId: 'BK005', time: '2025-10-29 07:30', note: 'Yêu cầu video call trước để trao đổi chi tiết về dịch vụ đi chợ nấu ăn', status: 'pending' },
  { id: 'VR002', customerName: 'Cụ Trần Văn L', bookingId: 'BK011', time: '2025-10-30 08:30', note: 'Cần video call để đánh giá tình trạng sức khỏe trước khi đặt lịch chăm sóc sau phẫu thuật', status: 'pending' },
  { id: 'VR003', customerName: 'Cụ Võ Văn F', bookingId: 'BK006', time: '2025-10-16 08:00', note: 'Xác nhận trao đổi trước lịch', status: 'accepted' },
  { id: 'VR004', customerName: 'Bà Lý Thị H', bookingId: 'BK008', time: '2025-10-24 10:30', note: 'Cần video call để đánh giá tình trạng sức khỏe', status: 'rejected', rejectionReason: 'Không phù hợp thời gian, đang có lịch hẹn khác trong khung giờ này' },
];

const VideoRequestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VideoStatus>('pending');
  const [items, setItems] = useState<VideoRequest[]>(mockRequests);
  const navigate = useNavigate();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filtered = useMemo(() => items.filter(i => i.status === activeTab), [items, activeTab]);

  const updateStatus = (id: string, status: VideoStatus) => {
    setItems(prev => prev.map(v => {
      if (v.id === id) {
        try { localStorage.setItem(`video_status_${v.bookingId}`, status); } catch {}
        return { ...v, status };
      }
      return v;
    }));
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectingId || !rejectionReason.trim()) return;
    setItems(prev => prev.map(v => 
      v.id === rejectingId 
        ? { ...v, status: 'rejected', rejectionReason: rejectionReason.trim() } 
        : v
    ));
    try { 
      const item = items.find(v => v.id === rejectingId);
      if (item) {
        localStorage.setItem(`video_status_${item.bookingId}`, 'rejected');
        localStorage.setItem(`video_rejection_${item.bookingId}`, rejectionReason.trim());
      }
    } catch {}
    setShowRejectModal(false);
    setRejectingId(null);
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý yêu cầu Video Call</h1>
          <p className="mt-1 text-sm text-gray-600">Theo dõi và xử lý các yêu cầu gọi video từ khách hàng</p>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto">
          {TABS.map(t => {
            const active = t.key === activeTab;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm ring-1 ${active ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-200 hover:bg-gray-50'}`}
              >
                {t.title}
                {active && <span className="absolute -bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-900" aria-hidden></span>}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden cursor-pointer"
              onClick={() => {
                try {
                  localStorage.setItem(`vr_note_${r.bookingId}`, r.note || '');
                  localStorage.setItem(`video_status_${r.bookingId}`, r.status);
                } catch {}
                navigate(`/care-giver/bookings/${r.bookingId}`);
              }}
            >
              <div className={`h-1 w-full ${STATUS_META[r.status].bar}`} aria-hidden></div>
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium">#{r.bookingId}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden></span>
                    <span>{r.time}</span>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900 truncate">{r.customerName}</div>
                  <div className="mt-2 text-sm text-gray-700 line-clamp-2">{r.note}</div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${STATUS_META[r.status].color}`}>
                    {STATUS_META[r.status].label}
                  </span>
                  {r.status === 'accepted' && (
                    <div className="mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/care-giver/video-call'); }}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-700"
                      >
                        Vào phòng video
                      </button>
                    </div>
                  )}
                  {r.status === 'pending' && (
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openRejectModal(r.id); }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700">Từ chối</button>
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'accepted'); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">Chấp nhận</button>
                    </div>
                  )}
                  {r.status === 'rejected' && r.rejectionReason && (
                    <div className="mt-3 text-xs text-gray-700 text-left">
                      <div className="font-medium text-gray-900">Lý do từ chối:</div>
                      <div className="italic text-red-600">"{r.rejectionReason}"</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">Không có yêu cầu trong nhóm này.</div>
          )}
        </div>
      </div>

      {/* Modal từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Lý do từ chối yêu cầu video call</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-5 py-5">
              <label className="text-sm text-gray-700 font-medium">Vui lòng nhập lý do từ chối</label>
              <textarea 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                rows={4} 
                placeholder="Ví dụ: Không phù hợp thời gian, bận việc cá nhân..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              />
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50">Hủy</button>
              <button 
                onClick={confirmReject} 
                disabled={!rejectionReason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRequestPage;


