import React from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';

type CourseResource = {
  id: string;
  type: 'pdf' | 'video' | 'doc' | 'link';
  title: string;
  size?: string;
  url?: string;
};

type CourseSection = {
  id: string;
  title: string;
  lessons: { id: string; title: string; duration?: string }[];
};

type Instructor = {
  name: string;
  title: string;
  initials: string;
};

type TrainingCourse = {
  id: string;
  title: string;
  description: string;
  fileCount: number;
  duration?: string;
  level?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  objectives?: string[];
  sections?: CourseSection[];
  resources?: CourseResource[];
  instructor?: Instructor;
};

const buildFallbackCourse = (id: string): TrainingCourse => ({
  id,
  title: 'Khoá học chăm sóc tiêu chuẩn',
  description:
    'Khoá học cung cấp kiến thức trọng tâm và các tình huống thực tế giúp caregiver nâng cao kỹ năng chăm sóc người cao tuổi một cách an toàn và hiệu quả.',
  fileCount: 10,
  duration: '3 giờ 30 phút',
  level: 'Cơ bản',
  objectives: [
    'Nắm vững nguyên tắc an toàn khi hỗ trợ sinh hoạt hằng ngày',
    'Thực hành giao tiếp trấn an và tôn trọng người cao tuổi',
    'Nhận biết sớm dấu hiệu rủi ro và cách xử lý ban đầu',
  ],
  sections: [
    {
      id: 'sec-1',
      title: 'Tổng quan & an toàn',
      lessons: [
        { id: 'l-1', title: 'Giới thiệu vai trò caregiver', duration: '10m' },
        { id: 'l-2', title: 'Nguyên tắc an toàn tại nhà', duration: '18m' },
      ],
    },
    {
      id: 'sec-2',
      title: 'Giao tiếp & đồng hành',
      lessons: [
        { id: 'l-3', title: 'Kỹ thuật giao tiếp trấn an', duration: '22m' },
        { id: 'l-4', title: 'Xử lý tình huống căng thẳng', duration: '15m' },
      ],
    },
  ],
  resources: [
    { id: 'r-1', type: 'pdf', title: 'Checklist an toàn trong nhà', size: '1.2MB' },
    { id: 'r-2', type: 'video', title: 'Kỹ thuật di chuyển an toàn', size: '8:24' },
    { id: 'r-3', type: 'link', title: 'Hướng dẫn dinh dưỡng người cao tuổi', url: 'https://example.com' },
  ],
  instructor: { name: 'BS. Nguyễn Minh Anh', title: 'Chuyên gia Lão khoa', initials: 'MA' },
});

const iconForType = (type: CourseResource['type']) => {
  switch (type) {
    case 'pdf':
      return '📄';
    case 'video':
      return '🎬';
    case 'doc':
      return '📝';
    case 'link':
      return '🔗';
    default:
      return '📁';
  }
};

const MetaItem: React.FC<{ icon: string; label: string; value?: string | number }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between py-2 text-sm">
    <div className="flex items-center gap-2 text-gray-600">
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </div>
    <span className="font-medium text-gray-900">{value ?? '—'}</span>
  </div>
);

const CourseDetailPage: React.FC = () => {
  const { state } = useLocation() as { state?: { course?: TrainingCourse } };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const baseCourse = state?.course ?? buildFallbackCourse(id || 'course');
  const course: TrainingCourse = {
    ...buildFallbackCourse(baseCourse.id),
    ...baseCourse,
  };

  const firstLessonId = course.sections && course.sections[0] && course.sections[0].lessons[0]
    ? course.sections[0].lessons[0].id
    : 'l-1';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link to="/care-giver/training" className="text-blue-600 hover:underline">← Quay lại danh sách</Link>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{course.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                    {course.duration && (
                      <span className="inline-flex items-center gap-1"><span aria-hidden>⏱</span>{course.duration}</span>
                    )}
                    <span className="inline-flex items-center gap-1"><span aria-hidden>📁</span>{course.fileCount} tài liệu</span>
                    {course.level && (
                      <span className="inline-flex items-center gap-1"><span aria-hidden>🎯</span>{course.level}</span>
                    )}
                  </div>
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  type="button"
                  onClick={() => navigate(`/care-giver/training/${course.id}/lesson/${firstLessonId}`)}
                >
                  Vào bài học
                </button>
              </div>

              <p className="mt-4 text-gray-700 leading-7">{course.description}</p>
            </div>

            {course.objectives && course.objectives.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Bạn sẽ học được</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {course.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="mt-1" aria-hidden>✅</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.sections && course.sections.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Nội dung khoá học</h2>
                <div className="mt-4 space-y-5">
                  {course.sections.map((sec) => (
                    <div key={sec.id} className="rounded-xl border border-gray-100">
                      <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 rounded-t-xl flex items-center justify-between">
                        <div className="font-medium text-gray-900">{sec.title}</div>
                        <div className="text-sm text-gray-600">{sec.lessons.length} bài</div>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {sec.lessons.map((l) => (
                          <li key={l.id}>
                            <Link
                              to={`/care-giver/training/${course.id}/lesson/${l.id}`}
                              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            >
                              <span className="flex items-center gap-3 text-gray-800">
                                <span aria-hidden>▶</span>
                                <span>{l.title}</span>
                              </span>
                              {l.duration && <span className="text-sm text-gray-600">{l.duration}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.resources && course.resources.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Tài liệu đính kèm</h2>
                <ul className="mt-4 divide-y divide-gray-100">
                  {course.resources.map((r) => (
                    <li key={r.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg" aria-hidden>{iconForType(r.type)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{r.title}</div>
                          <div className="text-sm text-gray-600">{r.size ?? r.type.toUpperCase()}</div>
                        </div>
                      </div>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Mở
                        </a>
                      ) : (
                        <button type="button" className="text-blue-600 hover:underline text-sm">Tải</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Thông tin khoá học</h3>
              <div className="mt-2 divide-y divide-gray-100">
                <MetaItem icon="⏱" label="Thời lượng" value={course.duration} />
                <MetaItem icon="📁" label="Số tài liệu" value={course.fileCount} />
                <MetaItem icon="🎯" label="Trình độ" value={course.level ?? 'Cơ bản'} />
              </div>
            </div>

            {course.instructor && (
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">Giảng viên</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {course.instructor.initials}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course.instructor.name}</div>
                    <div className="text-sm text-gray-600">{course.instructor.title}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  Chuyên gia với nhiều năm kinh nghiệm trong lĩnh vực lão khoa và chăm sóc người cao tuổi.
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Hỗ trợ</h3>
              <p className="mt-2 text-sm text-gray-700">Gặp vấn đề khi học? Liên hệ hỗ trợ để được giúp đỡ kịp thời.</p>
              <a href="#" className="mt-3 inline-flex text-sm text-blue-600 hover:underline">Liên hệ hỗ trợ</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;


