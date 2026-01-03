import React, { useMemo, useState } from 'react';

type ReviewCategory = 'Video' | 'Service' | 'System' | 'Complaint';
type ReviewItem = {
  id: string;
  category: ReviewCategory;
  // Related entity identifiers (optional depending on category)
  videoId?: string;
  serviceId?: string;
  complaintId?: string;
  // Appointment identifier for Video/Service/Complaint
  appointmentId?: string;
  rating: number; // 1-5
  comment: string;
  createdByName: string;
  createdByRole: 'Care Seeker' | 'Caregiver';
  createdAt: string; // ISO or readable string
};

const CATEGORY_META: Record<ReviewCategory, { color: string }> = {
  Video: { color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  Service: { color: 'bg-green-50 text-green-700 ring-green-600/20' },
  System: { color: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  Complaint: { color: 'bg-red-50 text-red-700 ring-red-600/20' },
};

const TABS: ReviewCategory[] = ['Video', 'Service', 'System', 'Complaint'];
const TAB_LABEL_VI: Record<ReviewCategory, string> = {
  Video: 'Video',
  Service: 'Dịch vụ',
  System: 'Hệ thống',
  Complaint: 'Khiếu nại',
};

const initialMock: ReviewItem[] = [
  // From Care Seeker
  { id: 'R001', category: 'Video', videoId: 'VID-1023', appointmentId: 'BK001', rating: 5, comment: 'Video hướng dẫn rất chi tiết và dễ hiểu.', createdByName: 'Nguyễn Minh', createdByRole: 'Care Seeker', createdAt: '2025-09-15 13:00' },
  { id: 'R002', category: 'Service', serviceId: 'SRV-7761', appointmentId: 'BK002', rating: 4, comment: 'Dịch vụ tốt, caregiver đúng giờ và tận tâm.', createdByName: 'Trần Thị B', createdByRole: 'Care Seeker', createdAt: '2025-09-16 10:20' },
  { id: 'R003', category: 'System', rating: 3, comment: 'App thỉnh thoảng bị chậm khi tải lịch hẹn.', createdByName: 'Lê Văn C', createdByRole: 'Care Seeker', createdAt: '2025-09-17 08:45' },
  { id: 'R004', category: 'Complaint', complaintId: 'CMP-3344', appointmentId: 'BK003', rating: 2, comment: 'Một số tính năng khó dùng, đề nghị cải thiện UX.', createdByName: 'Phạm Thu D', createdByRole: 'Care Seeker', createdAt: '2025-09-18 19:30' },
  { id: 'R005', category: 'Service', serviceId: 'SRV-8890', appointmentId: 'BK004', rating: 5, comment: 'Rất hài lòng với sự nhiệt tình của caregiver.', createdByName: 'Bùi Gia E', createdByRole: 'Care Seeker', createdAt: '2025-09-19 11:05' },
  // My reviews (I rated service/system, etc.)
  { id: 'R101', category: 'Service', serviceId: 'SRV-7761', appointmentId: 'BK002', rating: 4, comment: 'Phối hợp với gia đình thuận lợi, cần rõ thêm yêu cầu.', createdByName: 'Tôi (Caregiver)', createdByRole: 'Caregiver', createdAt: '2025-09-18 08:20' },
  { id: 'R102', category: 'System', rating: 3, comment: 'Muốn có tính năng xem lịch rảnh trực quan hơn.', createdByName: 'Tôi (Caregiver)', createdByRole: 'Caregiver', createdAt: '2025-09-20 17:45' },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <div className="text-amber-500">
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i}>{i < value ? '★' : '☆'}</span>
    ))}
  </div>
);

const CaregiverReviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReviewCategory>('Service');
  const [data, setData] = useState<ReviewItem[]>(initialMock);
  const [ratingFilter, setRatingFilter] = useState<'All' | 1 | 2 | 3 | 4 | 5>('All');
  const [query, setQuery] = useState('');

  // Modal state
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [error, setError] = useState<string>('');

  const filtered = useMemo(() => {
    const byTab = data.filter((r) => r.category === activeTab);
    const byRating = ratingFilter === 'All' ? byTab : byTab.filter((r) => r.rating === ratingFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byRating;
    return byRating.filter((r) => r.createdByName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q));
  }, [data, activeTab, ratingFilter, query]);

  const openEdit = (row: ReviewItem) => {
    if (row.createdByRole !== 'Caregiver') return; // only my reviews editable
    setEditing(row);
    setEditRating(row.rating);
    setEditComment(row.comment);
    setError('');
  };

  const saveEdit = () => {
    if (!editing) return;
    const rating = clamp(Math.round(editRating), 1, 5);
    if (!editComment.trim()) {
      setError('Comment không được rỗng');
      return;
    }
    setData((prev) => prev.map((r) => (r.id === editing.id ? { ...r, rating, comment: editComment.trim() } : r)));
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý đánh giá</h1>
            <p className="mt-1 text-sm text-gray-600">Xem tổng hợp và chỉnh sửa đánh giá liên quan.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ring-1 ${
                  active ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {TAB_LABEL_VI[tab]}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <select
            value={ratingFilter as any}
            onChange={(e) => setRatingFilter(e.target.value === 'All' ? 'All' : (parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white"
          >
            <option value="All">Tất cả rating</option>
            {[5,4,3,2,1].map((r) => (
              <option key={r} value={r}>{r} sao</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc nội dung..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        {/* My Reviews (editable) */}
        <div className="mt-6 rounded-xl bg-white shadow border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Đánh giá của tôi</div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {activeTab !== 'System' && (<th className="px-4 py-3 text-left">ID của lịch hẹn</th>)}
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Comment</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.filter(r => r.createdByRole === 'Caregiver').map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  {activeTab !== 'System' && (
                    <td className="px-4 py-3 text-gray-800">
                      <span className="text-xs rounded bg-gray-50 text-gray-800 ring-1 ring-gray-200 px-2 py-1">{r.appointmentId ?? r.videoId ?? r.serviceId ?? r.complaintId ?? '—'}</span>
                    </td>
                  )}
                  <td className="px-4 py-3"><Stars value={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-800 max-w-[480px] truncate" title={r.comment}>{r.comment}</td>
                  <td className="px-4 py-3 text-gray-600">{r.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(r)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-50">Sửa</button>
                  </td>
                </tr>
              ))}
              {filtered.filter(r => r.createdByRole === 'Caregiver').length === 0 && (
                <tr>
                  <td colSpan={activeTab !== 'System' ? 5 : 4} className="px-4 py-6 text-center text-gray-500">Không có đánh giá.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* From Care Seeker (read-only) */}
        {activeTab !== 'System' && (
        <div className="mt-6 rounded-xl bg-white shadow border border-gray-100 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Đánh giá từ Khách Hàng</div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">ID của lịch hẹn</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Comment</th>
                <th className="px-4 py-3 text-left">Người tạo</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.filter(r => r.createdByRole === 'Care Seeker').map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${CATEGORY_META[r.category].color}`}>{TAB_LABEL_VI[r.category]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    <span className="text-xs rounded bg-gray-50 text-gray-800 ring-1 ring-gray-200 px-2 py-1">{r.appointmentId ?? r.videoId ?? r.serviceId ?? r.complaintId ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3"><Stars value={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-800 max-w-[480px] truncate" title={r.comment}>{r.comment}</td>
                  <td className="px-4 py-3 text-gray-800">{r.createdByName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.createdAt}</td>
                </tr>
              ))}
              {filtered.filter(r => r.createdByRole === 'Care Seeker').length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Không có đánh giá.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chi tiết đánh giá</h3>
                <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">×</button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Category</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${CATEGORY_META[editing.category].color}`}>{editing.category}</span>
                    </div>
                  </div>
                  {editing.category !== 'System' && (
                    <div>
                      <div className="text-xs text-gray-500">ID của lịch hẹn</div>
                      <div className="mt-1 text-sm text-gray-800">{editing.appointmentId ?? editing.videoId ?? editing.serviceId ?? editing.complaintId ?? '—'}</div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500">Rating</label>
                    <select
                      value={editRating}
                      onChange={(e) => setEditRating(clamp(parseInt(e.target.value, 10) || 1, 1, 5))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {[1,2,3,4,5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Comment</label>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Người tạo</div>
                    <div className="mt-1 text-sm text-gray-800">{editing.createdByName} • {editing.createdByRole}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">CreatedAt</div>
                    <div className="mt-1 text-sm text-gray-800">{editing.createdAt}</div>
                  </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50">Hủy</button>
                <button onClick={saveEdit} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaregiverReviewPage;


