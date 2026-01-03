import React from 'react';
import { Link } from 'react-router-dom';

type TrainingCourse = {
  id: string;
  title: string;
  description: string;
  fileCount: number;
  duration?: string;
};

const mockCourses: TrainingCourse[] = [
  {
    id: 'basic-elderly-care',
    title: 'Chăm sóc người cao tuổi cơ bản',
    description:
      'Những kiến thức nền tảng về nhu cầu, dinh dưỡng, vận động và giao tiếp với người cao tuổi trong sinh hoạt hằng ngày.',
    fileCount: 12,
    duration: '4 giờ',
  },
  {
    id: 'mobility-and-safety',
    title: 'Hỗ trợ di chuyển & an toàn',
    description:
      'Kỹ thuật nâng đỡ, phòng ngừa té ngã, sử dụng dụng cụ hỗ trợ đúng cách nhằm đảm bảo an toàn cho người thân.',
    fileCount: 8,
    duration: '2.5 giờ',
  },
  {
    id: 'dementia-care',
    title: 'Chăm sóc người sa sút trí tuệ',
    description:
      'Phương pháp tương tác, trấn an, thiết lập môi trường sống phù hợp và xử lý tình huống thường gặp với người sa sút trí tuệ.',
    fileCount: 15,
    duration: '5 giờ',
  },
  {
    id: 'basic-first-aid',
    title: 'Sơ cứu cơ bản',
    description:
      'Nhận biết dấu hiệu nguy cấp, quy trình sơ cứu ban đầu và thời điểm cần liên hệ cơ sở y tế để hỗ trợ kịp thời.',
    fileCount: 10,
    duration: '3 giờ',
  },
];

const CaregiverTrainingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tài liệu đào tạo</h1>
          <p className="mt-2 text-gray-600">
            Tham khảo các khóa học chuyên môn để nâng cao kỹ năng chăm sóc người cao tuổi.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {course.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>📁</span>
                  {course.fileCount} tài liệu
                </span>
                {course.duration && (
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden>⏱</span>
                    {course.duration}
                  </span>
                )}
              </div>

              <div className="mt-5">
                <Link
                  to={`/care-giver/training/${course.id}`}
                  state={{ course }}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaregiverTrainingPage;


