import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type ComplaintTag = 'reviewing' | 'awaiting_more_info' | 'resolved' | 'refunded' | 'rejected';

const COMPLAINT_TAG_META: Record<ComplaintTag, { label: string; color: string }> = {
  reviewing: { label: 'Đang xem xét', color: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  awaiting_more_info: { label: 'Chờ bổ sung', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  resolved: { label: 'Đã giải quyết', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  rejected: { label: 'Đã từ chối', color: 'bg-red-50 text-red-700 ring-red-600/20' },
};

const ComplaintReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || 'BK000';
  const [rating, setRating] = useState<number>(() => {
    const saved = localStorage.getItem(`complaint_review_rating_${bookingId}`);
    return saved ? parseInt(saved, 10) || 5 : 5;
  });
  const [comment, setComment] = useState<string>(() => localStorage.getItem(`complaint_review_comment_${bookingId}`) || '');
  const [error, setError] = useState<string>('');

  const tag = (localStorage.getItem(`complaint_tag_${bookingId}`) as ComplaintTag | null) || 'reviewing';
  const canReview = ['resolved','refunded','rejected'].includes(tag);

  const save = () => {
    if (!comment.trim()) {
      setError('Vui lòng nhập nhận xét');
      return;
    }
    localStorage.setItem(`complaint_review_rating_${bookingId}`, String(rating));
    localStorage.setItem(`complaint_review_comment_${bookingId}`, comment.trim());
    alert('Đã lưu đánh giá khiếu nại');
    navigate('/care-giver/bookings');
  };

  const TagBadge = useMemo(() => (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs ring-1 ${COMPLAINT_TAG_META[tag].color}`}>
      {COMPLAINT_TAG_META[tag].label}
    </span>
  ), [tag]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Đánh giá xử lý khiếu nại</h1>
          <p className="mt-1 text-sm text-gray-600">Booking #{bookingId} • {TagBadge}</p>
        </div>

        {!canReview && (
          <div className="mt-6 rounded-xl bg-white border border-gray-100 p-5 text-sm text-gray-700">
            Trạng thái hiện tại là "{COMPLAINT_TAG_META[tag].label}". Bạn chỉ có thể đánh giá khi khiếu nại đã được xử lý xong (Đã giải quyết, Đã hoàn tiền hoặc Đã từ chối).
          </div>
        )}

        {canReview && (
          <div className="mt-6 rounded-xl bg-white shadow border border-gray-100 p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-900">Mức độ hài lòng</label>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value, 10) || 5)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              >
                {[5,4,3,2,1].map((n) => (
                  <option key={n} value={n}>{n} sao</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">Nhận xét</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                className="mt-2 w-full rounded-lg border px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-200"
                placeholder="Nội dung đánh giá..."
              />
              {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={save}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-black"
              >
                Lưu đánh giá
              </button>
              <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-800 hover:bg-gray-50">Hủy</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintReviewPage;


