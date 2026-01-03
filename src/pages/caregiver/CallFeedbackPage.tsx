import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Lightweight star icon (to avoid external deps)
const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled, className }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CallFeedbackPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock caregiver name (later from route/state)
  const caregiverName = useMemo(() => 'Nguyễn Văn A', []);

  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
 

  const submit = () => {
    alert('Cảm ơn bạn đã đánh giá!');
    navigate('/care-giver');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Đánh giá cuộc gọi</h1>
          <p className="mt-1 text-sm text-gray-600">Hãy cho chúng tôi biết trải nghiệm của bạn sau cuộc gọi video</p>
        </div>

        <div className="rounded-xl bg-white shadow-md border border-gray-100 p-6 space-y-6">
          {/* Caregiver info */}
          <div>
            <div className="text-xs text-gray-500">Tên người thuê</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">{caregiverName}</div>
          </div>

          {/* Rating */}
          <div>
            <div className="text-sm font-medium text-gray-900">Đánh giá sao</div>
            <div className="mt-2 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const idx = i + 1;
                const active = (hover || rating) >= idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setHover(idx)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(idx)}
                    className={`p-1 rounded transition ${active ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                    aria-label={`Rate ${idx}`}
                  >
                    <StarIcon filled={active} className="w-8 h-8" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback textarea */}
          <div>
            <label className="text-sm font-medium text-gray-900">Phản hồi chi tiết</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bạn có thể mô tả thêm về chất lượng cuộc gọi, thái độ, kiến thức chuyên môn..."
            />
          </div>

          

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={submit} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-white text-sm font-semibold hover:bg-emerald-700">Gửi đánh giá</button>
            <button onClick={() => navigate('/care-giver')} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-800 hover:bg-gray-50">Bỏ qua</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallFeedbackPage;


