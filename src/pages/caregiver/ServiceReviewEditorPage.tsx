import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ServiceReviewEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || 'BK000';

  const existingRating = useMemo(() => {
    const v = localStorage.getItem(`service_review_${bookingId}`);
    if (!v) return null;
    try {
      return JSON.parse(v) as { rating: number; comment: string; createdAt: string };
    } catch {
      return null;
    }
  }, [bookingId]);

  const [rating, setRating] = useState<number>(existingRating?.rating ?? 5);
  const [comment, setComment] = useState<string>(existingRating?.comment ?? '');
  const [error, setError] = useState<string>('');

  const isEditing = !!existingRating;

  const save = () => {
    if (!comment.trim()) {
      setError('Vui lòng nhập nhận xét');
      return;
    }
    const payload = { rating, comment: comment.trim(), createdAt: existingRating?.createdAt || new Date().toISOString() };
    localStorage.setItem(`service_review_${bookingId}`, JSON.stringify(payload));
    alert(isEditing ? 'Đã lưu chỉnh sửa đánh giá' : 'Đã lưu đánh giá');
    navigate('/care-giver/bookings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{isEditing ? 'Xem/Sửa đánh giá dịch vụ' : 'Đánh giá dịch vụ'}</h1>
          <p className="mt-1 text-sm text-gray-600">Booking #{bookingId}</p>
        </div>

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
              placeholder="Đánh giá careseeker, chất lượng phối hợp..."
            />
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-black"
            >
              {isEditing ? 'Lưu' : 'Lưu đánh giá'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-800 hover:bg-gray-50">Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceReviewEditorPage;


