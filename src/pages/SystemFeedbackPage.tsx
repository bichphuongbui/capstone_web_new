import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feedback, submitSystemFeedback } from '../services/feedback.service';

const SystemFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Giao diện & Trải nghiệm (UI/UX)');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Vui lòng nhập tiêu đề';
    if (!category.trim()) e.category = 'Vui lòng chọn loại góp ý';
    if (!content.trim()) e.content = 'Vui lòng nhập nội dung chi tiết';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload: Feedback = {
      title: title.trim(),
      category,
      content: content.trim(),
      isAnonymous,
      createdAt: new Date().toISOString(),
    };
    await submitSystemFeedback(payload);
    alert('Cảm ơn bạn đã gửi góp ý!');
    setTitle(''); setCategory('Giao diện & Trải nghiệm (UI/UX)'); setContent(''); setIsAnonymous(false);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Góp ý hệ thống</h1>
          <p className="mt-1 text-sm text-gray-600">Chia sẻ ý kiến để chúng tôi cải thiện trải nghiệm của bạn</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-md p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-900">Tiêu đề góp ý <span className="text-red-600">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="VD: Cải thiện tốc độ tải trang"
            />
            {errors.title && <div className="mt-1 text-sm text-red-600">{errors.title}</div>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">Loại góp ý <span className="text-red-600">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm bg-white ${errors.category ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option>Giao diện & Trải nghiệm (UI/UX)</option>
              <option>Tính năng mới</option>
              <option>Hiệu suất hệ thống</option>
              <option>Lỗi / Bug</option>
              <option>Khác</option>
            </select>
            {errors.category && <div className="mt-1 text-sm text-red-600">{errors.category}</div>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">Nội dung chi tiết <span className="text-red-600">*</span></label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              className={`mt-2 w-full rounded-lg border px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.content ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Mô tả chi tiết vấn đề/ý tưởng của bạn để đội ngũ hiểu rõ hơn"
            />
            {errors.content && <div className="mt-1 text-sm text-red-600">{errors.content}</div>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900">Upload minh chứng (tùy chọn)</label>
            <input type="file" className="mt-2 block w-full text-sm text-gray-700" />
            <div className="mt-1 text-xs text-gray-500">(Chỉ là mô phỏng UI, chưa gửi file lên server)</div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Ẩn danh
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting} className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white ${submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>Gửi góp ý</button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-800 hover:bg-gray-50">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemFeedbackPage;


