import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiBookOpen, FiClock, FiFileText, FiVideo  } from 'react-icons/fi';
import { getCourseById, deleteCourse, togglePublishCourse } from '../../services/course.service';
import Notification from '../../components/Notification';
import ConfirmDialog from '../../components/ConfirmDialog';

export interface CourseResource {
  id: string;
  type: 'pdf' | 'video' | 'doc' | 'link';
  title: string;
  size?: string;
  url?: string;
}

export interface LessonContent {
  id: string;
  type: 'text' | 'video' | 'file';
  title: string;
  content?: string;
  url?: string;
  size?: string;
  file?: File;
}

export interface CourseLesson {
  _id: string;
  title: string;
  duration: number;
  order: number;
  content?: LessonContent[];
}

export interface CourseModule {
  _id: string;
  course: string;
  title: string;
  description: string;
  order: number;
  totalLessons: number;
  totalDuration: number;
  isActive: boolean;
  lessons: CourseLesson[];
}

export interface CourseSection {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseInstructor {
  name: string;
  title: string;
  initials: string;
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration?: string;
  totalDuration?: number;
  level?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  objectives?: string[];
  sections?: CourseSection[];
  modules?: CourseModule[];
  resources?: CourseResource[];
  instructor?: CourseInstructor;
  category?: string;
  tags?: string[];
  totalLessons?: number;
  totalModules?: number;
  enrollmentCount?: number;
  isPublished?: boolean;
  isActive?: boolean;
  createdAt: string;
}

const AdminCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
  };

  // Fetch course details from API
  useEffect(() => {
    const fetchCourseDetail = async () => {
      if (!courseId) {
        navigate('/admin/training');
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Fetching course details for:', courseId);
        
        const result = await getCourseById(courseId);
        
        console.log('📚 Course detail result:', result);

        if (result.success && result.data) {
          const apiCourse = result.data;
          
          // Format duration helper
          const formatDuration = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0 && mins > 0) return `${hours} giờ ${mins} phút`;
            if (hours > 0) return `${hours} giờ`;
            return `${mins} phút`;
          };
          
          setCourse({
            id: apiCourse._id,
            title: apiCourse.title,
            description: apiCourse.description,
            thumbnail: apiCourse.thumbnail,
            duration: formatDuration(apiCourse.duration),
            totalDuration: apiCourse.duration,
            level: apiCourse.level as 'Cơ bản' | 'Trung cấp' | 'Nâng cao',
            category: apiCourse.category,
            tags: apiCourse.tags,
            totalLessons: apiCourse.totalLessons,
            totalModules: apiCourse.totalModules,
            enrollmentCount: apiCourse.enrollmentCount,
            isPublished: apiCourse.isPublished,
            isActive: apiCourse.isActive,
            modules: (apiCourse as any).modules || [],
            instructor: {
              name: apiCourse.instructor.name,
              title: apiCourse.instructor.title,
              avatar: apiCourse.instructor.avatar,
              initials: apiCourse.instructor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            },
            createdAt: apiCourse.createdAt
          });
        } else {
          showNotification('error', 'Không tìm thấy khóa học');
          navigate('/admin/training');
        }
      } catch (error: any) {
        console.error('❌ Error fetching course details:', error);
        showNotification('error', 'Không thể tải thông tin khóa học');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId, navigate]);

  const handleDelete = async () => {
    if (!course) return;
    
    setConfirmDialog({
      show: true,
      title: 'Xóa khóa học',
      message: 'Bạn có chắc muốn xóa khóa học này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteCourse(course.id);
          showNotification('success', 'Xóa khóa học thành công');
          setTimeout(() => navigate('/admin/training'), 1500);
        } catch (error: any) {
          console.error('❌ Error deleting course:', error);
          showNotification('error', 'Không thể xóa khóa học');
        } finally {
          setLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    
    const action = course.isPublished ? 'gỡ xuất bản' : 'xuất bản';
    setConfirmDialog({
      show: true,
      title: course.isPublished ? 'Gỡ xuất bản khóa học' : 'Xuất bản khóa học',
      message: `Bạn có chắc muốn ${action} khóa học này?`,
      type: 'info',
      onConfirm: async () => {
        try {
          const result = await togglePublishCourse(course.id);
          
          if (result.success) {
            showNotification('success', result.message);
            setCourse(prev => prev ? { ...prev, isPublished: result.data.isPublished } : null);
          }
        } catch (error: any) {
          console.error('❌ Error toggling publish status:', error);
          showNotification('error', `Không thể ${action} khóa học`);
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FiFileText className="w-4 h-4 text-red-600" />;
      case 'video': return <FiVideo className="w-4 h-4 text-purple-600" />;
      case 'doc': return <FiFileText className="w-4 h-4 text-blue-600" />;
      case 'link': return <FiBookOpen className="w-4 h-4 text-green-600" />;
      default: return <FiFileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy khóa học</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/admin/training')}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Quay lại
            </button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublish}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                  course.isPublished 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {course.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
              </button>
              <Link
                to={`/admin/training/${course.id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 className="mr-2" />
                Chỉnh sửa
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiTrash2 className="mr-2" />
                Xóa
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả khóa học</h2>
              <p className="text-gray-700 leading-7">{course.description}</p>
            </div>

            {/* Learning Objectives */}
            {course.objectives && course.objectives.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Những gì sẽ học được</h2>
                <ul className="space-y-3">
                  {course.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <span className="mt-1 text-green-600">✅</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course Content */}
            {course.modules && course.modules.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Nội dung khóa học</h2>
                <div className="space-y-6">
                  {course.modules.map((module) => (
                    <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{module.title}</h3>
                            {module.description && (
                              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">{module.totalLessons} bài</span>
                            <div className="text-xs text-gray-500">
                              {Math.floor(module.totalDuration / 60)}:{String(module.totalDuration % 60).padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-gray-200">
                        {module.lessons.map((lesson) => (
                          <Link
                            key={lesson._id}
                            to={`/admin/training/${course.id}/lesson/${lesson._id}`}
                            className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1 hover:text-blue-600">{lesson.title}</h4>
                                <div className="flex items-center text-sm text-gray-600">
                                  <FiClock className="mr-1" />
                                  <span>{Math.floor(lesson.duration / 60)} phút {lesson.duration % 60 > 0 ? `${lesson.duration % 60} giây` : ''}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {course.resources && course.resources.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tài liệu đính kèm</h2>
                <div className="space-y-3">
                  {course.resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getResourceIcon(resource.type)}
                        <div>
                          <div className="font-medium text-gray-900">{resource.title}</div>
                          <div className="text-sm text-gray-600">
                            {resource.type.toUpperCase()} • {resource.size}
                          </div>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Tải xuống
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khóa học</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Thời lượng</span>
                  <span className="font-medium">{course.duration || 'Chưa xác định'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trình độ</span>
                  <span className="font-medium">{course.level || 'Chưa xác định'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Số module</span>
                  <span className="font-medium">{course.modules?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Số bài học</span>
                  <span className="font-medium">{course.totalLessons || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructor */}
            {course.instructor && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Giảng viên</h3>
                <div className="flex items-center gap-3 mb-3">
                  {course.instructor.avatar ? (
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold" style={{ display: course.instructor.avatar ? 'none' : 'flex' }}>
                    {course.instructor.initials}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course.instructor.name}</div>
                    <div className="text-sm text-gray-600">{course.instructor.title}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog?.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText="OK"
          cancelText="Hủy"
        />
      )}
    </div>
  );
};

export default AdminCourseDetailPage;
