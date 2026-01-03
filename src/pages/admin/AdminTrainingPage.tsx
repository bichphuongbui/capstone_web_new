import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiEdit2, FiTrash2, FiPlus, FiCalendar, FiSearch, FiEye, FiEyeOff } from 'react-icons/fi';
import { getCourses, Course as APICourse, deleteCourse, togglePublishCourse } from '../../services/course.service';
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
  content?: string; // For text content
  url?: string; // For video/file URLs
  size?: string; // For file size
}

export interface CourseLesson {
  id: string;
  title: string;
  duration?: string;
  content?: LessonContent[];
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
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration?: string;
  level?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  objectives?: string[];
  sections?: CourseSection[];
  resources?: CourseResource[];
  instructor?: CourseInstructor;
  createdAt: string; // ISO string
  isPublished?: boolean;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day = `${d.getDate()}`.padStart(2, '0');
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const AdminTrainingPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock initial data

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('--');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching courses...', { levelFilter, categoryFilter, searchQuery });
        
        const params: any = {};
        if (levelFilter && levelFilter !== '--') params.level = levelFilter;
        if (categoryFilter && categoryFilter.trim()) params.category = categoryFilter.trim();
        if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
        
        const result = await getCourses(params);
        
        console.log('📚 Courses result:', result);

        if (result.success && result.data) {
          // Map API courses to local format
          const mappedCourses: Course[] = result.data.map((apiCourse: APICourse) => ({
            id: apiCourse._id,
            title: apiCourse.title,
            description: apiCourse.description,
            thumbnail: apiCourse.thumbnail,
            duration: `${Math.floor(apiCourse.duration / 60)} giờ ${apiCourse.duration % 60} phút`,
            level: apiCourse.level as 'Cơ bản' | 'Trung cấp' | 'Nâng cao',
            objectives: [],
            sections: [],
            resources: [],
            instructor: {
              name: apiCourse.instructor.name,
              title: apiCourse.instructor.title,
              initials: apiCourse.instructor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            },
            createdAt: apiCourse.createdAt,
            isPublished: apiCourse.isPublished
          }));
          
          setCourses(mappedCourses);
        } else {
          setCourses([]);
        }
      } catch (error: any) {
        console.error('❌ Error fetching courses:', error);
        showNotification('error', 'Không thể tải danh sách khóa học');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [levelFilter, categoryFilter, searchQuery]);

  const openAdd = () => {
    navigate('/admin/training/new');
  };

  const openEdit = (course: Course) => {
    navigate(`/admin/training/${course.id}/edit`);
  };

  const confirmDelete = async (id: string) => {
    setConfirmDialog({
      show: true,
      title: 'Xóa khóa học',
      message: 'Bạn có chắc muốn xóa khóa học này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true);
          const result = await deleteCourse(id);
          showNotification('success', result.message || 'Xóa khóa học thành công');
          setCourses(prev => prev.filter(c => c.id !== id));
        } catch (error: any) {
          console.error('❌ Error deleting course:', error);
          showNotification('error', error.message || 'Không thể xóa khóa học');
        } finally {
          setLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleTogglePublish = async (e: React.MouseEvent, courseId: string, isPublished: boolean) => {
    e.stopPropagation();
    
    const action = isPublished ? 'gỡ xuất bản' : 'xuất bản';
    setConfirmDialog({
      show: true,
      title: isPublished ? 'Gỡ xuất bản khóa học' : 'Xuất bản khóa học',
      message: `Bạn có chắc muốn ${action} khóa học này?`,
      type: 'info',
      onConfirm: async () => {
        try {
          const result = await togglePublishCourse(courseId);
          
          if (result.success) {
            showNotification('success', result.message);
            setCourses(prev => prev.map(c => 
              c.id === courseId ? { ...c, isPublished: result.data.isPublished } : c
            ));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý khóa học</h1>
            <p className="text-gray-600">Thêm, chỉnh sửa và quản lý tài liệu đào tạo</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center px-6 py-3 rounded-xl font-medium text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#7CBCFF' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5AA5FF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CBCFF'}
          >
            <FiPlus className="mr-2" size={20} /> Thêm khóa học
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức độ
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
            >
              <option value="--">-- Tất cả --</option>
              <option value="Cơ bản">Cơ bản</option>
              <option value="Trung cấp">Trung cấp</option>
              <option value="Nâng cao">Nâng cao</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Nhập danh mục..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
            />
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên khóa học..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200" style={{ borderTopColor: '#7CBCFF' }}></div>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => navigate(`/admin/training/${course.id}`)}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-blue-100 hover:border-blue-300 transform hover:-translate-y-1"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/admin/training/${course.id}`); }}
          >
            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="relative w-full h-52 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{course.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-4">
                <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-full">
                  <FiCalendar className="mr-1.5" size={14} />
                  <span className="font-medium">{formatDate(course.createdAt)}</span>
                </div>
                {course.duration && (
                  <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-full">
                    <span className="mr-1.5">⏱</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                {course.level && (
                  <div className="flex items-center px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: '#7CBCFF', color: 'white' }}>
                   
                    <span>{course.level}</span>
                  </div>
                )}
              </div>
              
              {course.instructor && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#7CBCFF' }}>
                      {course.instructor.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{course.instructor.name}</p>
                      <p className="text-xs text-gray-500">{course.instructor.title}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/training/${course.id}`); }}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#7CBCFF' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5AA5FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CBCFF'}
                >
                  <FiBookOpen className="mr-2" size={16} /> Chi tiết
                </button>
                <button
                  onClick={(e) => handleTogglePublish(e, course.id, course.isPublished || false)}
                  className={`inline-flex items-center justify-center px-3 py-2.5 rounded-xl border-2 transition-all font-medium ${
                    course.isPublished 
                      ? 'border-yellow-400 text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                      : 'border-green-400 text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                  title={course.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                >
                  {course.isPublished ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(course); }}
                  className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border-2 border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all font-medium"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); confirmDelete(course.id); }}
                  className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border-2 border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-all font-medium"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl shadow-lg border border-blue-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7CBCFF20' }}>
              <FiBookOpen size={40} style={{ color: '#7CBCFF' }} />
            </div>
            <p className="text-gray-600 text-lg">Chưa có khóa học nào.</p>
            <p className="text-gray-500 text-sm mt-2">Nhấn nút "Thêm khóa học" để bắt đầu</p>
          </div>
        )}
      </div>
      )}

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

export default AdminTrainingPage;
