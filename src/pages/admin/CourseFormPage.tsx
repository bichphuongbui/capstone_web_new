import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiMinus, FiArrowLeft, FiImage, FiUpload, FiSave, FiBookOpen, FiLayers, FiTarget, FiVideo, FiEdit3, FiUser } from 'react-icons/fi';
import { createCourseWithFull, CreateCourseWithFullPayload, CreateCourseInstructor, updateCourseWithFull, UpdateCourseWithFullPayload, uploadVideo, getCourseById, getLessonById } from '../../services/course.service';
import Notification from '../../components/Notification';

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
  content?: string; // For text content (HTML)
  url?: string; // For video/file URLs
  size?: string; // For file size
  file?: File; // For uploaded files
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  learningObjectives?: string[];
  content?: LessonContent[];
  videoUrl?: string; // URL của video sau khi upload
}

export interface CourseSection {
  id: string;
  title: string;
  description?: string;
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
  duration?: string;
  level?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao' | string;
  objectives?: string[];
  sections?: CourseSection[];
  modules?: any[]; // Backend modules structure
  resources?: CourseResource[];
  instructor?: CourseInstructor;
  thumbnail?: string;
  category?: string;
  createdAt: string; // ISO string
}

const CourseFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const isEditing = !!courseId;

  /* Mock initial data for editing - UNUSED
  const initialCourses: Course[] = useMemo(() => ([
    { 
      id: '1', 
      title: 'Kỹ năng chăm sóc người cao tuổi', 
      description: 'Các nguyên tắc chăm sóc cơ bản và nâng cao cho người cao tuổi, bao gồm dinh dưỡng, vận động và giao tiếp.',
      duration: '4 giờ',
      level: 'Cơ bản',
      objectives: [
        'Nắm vững nguyên tắc an toàn khi hỗ trợ sinh hoạt hằng ngày',
        'Thực hành giao tiếp trấn an và tôn trọng người cao tuổi',
        'Nhận biết sớm dấu hiệu rủi ro và cách xử lý ban đầu'
      ],
      sections: [
        {
          id: 'sec-1',
          title: 'Tổng quan & an toàn',
          lessons: [
            { 
              id: 'l-1', 
              title: 'Giới thiệu vai trò caregiver', 
              duration: '10m',
              content: [
                {
                  id: 'c-1',
                  type: 'text',
                  title: 'Định nghĩa caregiver',
                  content: 'Caregiver là người chăm sóc, hỗ trợ người cao tuổi trong các hoạt động sinh hoạt hàng ngày...'
                },
                {
                  id: 'c-2',
                  type: 'video',
                  title: 'Video giới thiệu',
                  url: 'https://example.com/video1.mp4',
                  size: '5:30'
                }
              ]
            },
            { 
              id: 'l-2', 
              title: 'Nguyên tắc an toàn tại nhà', 
              duration: '18m',
              content: [
                {
                  id: 'c-3',
                  type: 'text',
                  title: 'Các nguyên tắc cơ bản',
                  content: 'Luôn đảm bảo môi trường sống an toàn, loại bỏ các vật cản, đảm bảo ánh sáng đầy đủ...'
                },
                {
                  id: 'c-4',
                  type: 'file',
                  title: 'Checklist an toàn',
                  url: 'https://example.com/checklist.pdf',
                  size: '2.1MB'
                }
              ]
            }
          ]
        }
      ],
      resources: [
        { id: 'r-1', type: 'pdf', title: 'Checklist an toàn trong nhà', size: '1.2MB' },
        { id: 'r-2', type: 'video', title: 'Kỹ thuật di chuyển an toàn', size: '8:24' }
      ],
      instructor: { name: 'BS. Nguyễn Minh Anh', title: 'Chuyên gia Lão khoa', initials: 'MA' },
      createdAt: new Date().toISOString() 
    }
  ]), []); */

  const [form, setForm] = useState<{
    title: string;
    description: string;
    thumbnail: string;
    thumbnailFile: File | null;
    duration: string;
    level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao' | '';
    category: string;
    sections: CourseSection[];
    instructor: CourseInstructor & { avatarFile?: File | null };
    resourceFiles?: File[];
  }>({
    title: '',
    description: '',
    thumbnail: '',
    thumbnailFile: null,
    duration: '',
    level: '',
    category: '',
    sections: [],
    instructor: { name: '', title: '', initials: '', avatarFile: null },
    resourceFiles: []
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
  };

  // Load course data when editing
  useEffect(() => {
    const loadCourseData = async () => {
      if (!isEditing || !courseId) return;
      
      try {
        setLoading(true);
        console.log('📖 Loading course data for editing:', courseId);
        
        const result = await getCourseById(courseId);
        
        if (result.success && result.data) {
          const course = result.data;
          console.log('📚 Course loaded:', course);
          console.log('🔍 Course modules:', course.modules);
          
          if (course.modules && course.modules.length > 0) {
            console.log('🔍 First module:', course.modules[0]);
            if (course.modules[0].lessons && course.modules[0].lessons.length > 0) {
              console.log('🔍 First lesson BEFORE mapping:', course.modules[0].lessons[0]);
            }
          }
          
          // Map backend data to form structure
          const mappedSections: CourseSection[] = await Promise.all(
            course.modules?.map(async (module: any) => ({
              id: module._id,
              title: module.title,
              description: module.description,
              lessons: await Promise.all(
                module.lessons?.map(async (lesson: any, lIndex: number) => {
                  console.log(`📚 Fetching full lesson data for: ${lesson.title}`);
                  
                  try {
                    // Gọi API getLessonById để lấy đầy đủ thông tin lesson
                    const lessonDetail = await getLessonById(lesson._id);
                    const fullLesson = lessonDetail.data.lesson;
                    
                    console.log(`✅ Full lesson loaded:`, {
                      title: fullLesson.title,
                      description: fullLesson.description,
                      content: fullLesson.content,
                      videoUrl: fullLesson.videoUrl,
                      learningObjectives: fullLesson.learningObjectives,
                      duration: fullLesson.duration
                    });
                    
                    return {
                      id: fullLesson._id,
                      title: fullLesson.title,
                      description: fullLesson.description || '',
                      duration: fullLesson.duration?.toString() || '1800',
                      learningObjectives: fullLesson.learningObjectives || [],
                      videoUrl: fullLesson.videoUrl,
                      content: [
                        {
                          id: `text-${lIndex}`,
                          type: 'text' as const,
                          title: 'Nội dung bài học',
                          content: fullLesson.content || ''
                        },
                        ...(fullLesson.videoUrl ? [{
                          id: `video-${lIndex}`,
                          type: 'video' as const,
                          title: 'Video bài học',
                          url: fullLesson.videoUrl
                        }] : [])
                      ]
                    };
                  } catch (error) {
                    console.error(`❌ Error loading lesson ${lesson.title}:`, error);
                    // Fallback to basic lesson data if API fails
                    return {
                      id: lesson._id,
                      title: lesson.title,
                      description: lesson.description || '',
                      duration: lesson.duration?.toString() || '1800',
                      learningObjectives: lesson.learningObjectives || [],
                      videoUrl: lesson.videoUrl,
                      content: [
                        {
                          id: `text-${lIndex}`,
                          type: 'text' as const,
                          title: 'Nội dung bài học',
                          content: lesson.content || ''
                        },
                        ...(lesson.videoUrl ? [{
                          id: `video-${lIndex}`,
                          type: 'video' as const,
                          title: 'Video bài học',
                          url: lesson.videoUrl
                        }] : [])
                      ]
                    };
                  }
                }) || []
              )
            })) || []
          );
          
          console.log('📋 Mapped sections:', mappedSections);
          
          setForm({
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail || '',
            thumbnailFile: null,
            duration: course.duration?.toString() || '',
            level: (course.level as 'Cơ bản' | 'Trung cấp' | 'Nâng cao' | '') || '',
            category: course.category || '',
            sections: mappedSections,
            instructor: {
              name: course.instructor?.name || '',
              title: course.instructor?.title || '',
              initials: course.instructor?.name?.split(' ').map(n => n[0]).join('') || '',
              avatar: course.instructor?.avatar,
              avatarFile: null
            },
            resourceFiles: []
          });
          
          console.log('✅ Form populated with course data');
          console.log('📝 Form sections after set:', mappedSections.length, 'sections');
          
          // Debug first lesson
          if (mappedSections.length > 0 && mappedSections[0].lessons.length > 0) {
            const firstLesson = mappedSections[0].lessons[0];
            console.log('🔍 First lesson in form:', {
              title: firstLesson.title,
              description: firstLesson.description,
              content: firstLesson.content,
              learningObjectives: firstLesson.learningObjectives,
              videoUrl: firstLesson.videoUrl
            });
          }
        }
      } catch (error: any) {
        console.error('❌ Error loading course:', error);
        showNotification('error', 'Không thể tải dữ liệu khóa học');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();
  }, [courseId, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tự động tính tổng thời lượng khóa học (tính bằng giây)
  const totalDurationInSeconds = useMemo(() => {
    return form.sections.reduce((total, section) => {
      const sectionTotal = section.lessons.reduce((lessonTotal, lesson) => {
        const duration = parseInt(lesson.duration || '0') || 0;
        return lessonTotal + duration;
      }, 0);
      return total + sectionTotal;
    }, 0);
  }, [form.sections]);

  // Format thời lượng thành giờ:phút
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0 phút';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ`;
    } else {
      return `${minutes} phút`;
    }
  };

  // Helper functions for form management
  const addSection = () => {
    const newSection: CourseSection = {
      id: `sec-${Date.now()}`,
      title: '',
      lessons: []
    };
    setForm(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const updateSection = (index: number, field: keyof CourseSection, value: any) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const removeSection = (index: number) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const addLesson = (sectionIndex: number) => {
    const newLesson: CourseLesson = {
      id: `lesson-${Date.now()}`,
      title: '',
      duration: '',
      content: []
    };
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, lessons: [...section.lessons, newLesson] }
          : section
      )
    }));
  };

  const updateLesson = (sectionIndex: number, lessonIndex: number, field: keyof CourseLesson, value: any) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              lessons: section.lessons.map((lesson, j) => 
                j === lessonIndex ? { ...lesson, [field]: value } : lesson
              )
            }
          : section
      )
    }));
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, lessons: section.lessons.filter((_, j) => j !== lessonIndex) }
          : section
      )
    }));
  };

  // File upload handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.level || !form.category) {
      showNotification('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!form.instructor.name || !form.instructor.title) {
      showNotification('error', 'Vui lòng điền đầy đủ thông tin giảng viên');
      return;
    }

    if (form.sections.length === 0) {
      showNotification('error', 'Vui lòng thêm ít nhất 1 module');
      return;
    }

    // Validate modules and lessons
    for (let i = 0; i < form.sections.length; i++) {
      const section = form.sections[i];
      if (!section.title || section.title.trim() === '') {
        showNotification('error', `Module ${i + 1}: Vui lòng nhập tên module`);
        return;
      }
      
      if (section.lessons.length === 0) {
        showNotification('error', `Module "${section.title}": Vui lòng thêm ít nhất 1 bài học`);
        return;
      }

      for (let j = 0; j < section.lessons.length; j++) {
        const lesson = section.lessons[j];
        if (!lesson.title || lesson.title.trim() === '') {
          showNotification('error', `Module "${section.title}" - Bài ${j + 1}: Vui lòng nhập tên bài học`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      
      // Không cần upload thumbnail trước - Backend sẽ xử lý
      // Chỉ cần truyền file vào API create/update

      // Upload video files cho từng lesson
      const uploadedSections = await Promise.all(
        form.sections.map(async (section, sIndex) => {
          const uploadedLessons = await Promise.all(
            section.lessons.map(async (lesson, lIndex) => {
              const videoContent = lesson.content?.find(c => c.type === 'video');
              let videoUrl = videoContent?.url;

              console.log(`\n🔍 Processing Module ${sIndex + 1}, Lesson ${lIndex + 1}: "${lesson.title}"`);
              console.log(`   - Has video content:`, !!videoContent);
              console.log(`   - Video content.url:`, videoContent?.url);
              console.log(`   - Video content.file:`, videoContent?.file?.name);

              // Nếu có file video, upload lên server
              if (videoContent?.file) {
                try {
                  console.log(`📤 Uploading video for Module ${sIndex + 1}, Lesson ${lIndex + 1}...`);
                  console.log(`   - File name: ${videoContent.file.name}`);
                  console.log(`   - File size: ${(videoContent.file.size / 1024 / 1024).toFixed(2)} MB`);
                  
                  // Sử dụng API upload video chuyên dụng
                  const uploadResult = await uploadVideo(videoContent.file);
                  videoUrl = uploadResult.data.videoUrl; // Fix: data.videoUrl thay vì data.url
                  
                  console.log('✅ Video uploaded successfully!');
                  console.log(`   - URL: ${videoUrl}`);
                } catch (error: any) {
                  console.error(`❌ Failed to upload video for lesson "${lesson.title}":`, error);
                  showNotification('warning', `Không thể upload video cho bài "${lesson.title}": ${error.message}`);
                  videoUrl = undefined; // Bỏ qua video này
                }
              }
              // Nếu là blob URL, bỏ qua (chỉ dùng URL thật)
              else if (videoUrl?.startsWith('blob:')) {
                console.log('⚠️ Blob URL detected, will be ignored');
                videoUrl = undefined;
              }

              const result = {
                ...lesson,
                videoUrl: videoUrl?.trim()
              };
              
              console.log(`✓ Lesson processed, final videoUrl:`, result.videoUrl);
              return result;
            })
          );
          return {
            ...section,
            lessons: uploadedLessons
          };
        })
      );
      
      // Transform data to API format với uploaded URLs
      const instructorData: CreateCourseInstructor = {
        name: form.instructor.name.trim(),
        title: form.instructor.title.trim(),
        // Chỉ gửi avatar URL nếu không upload file mới
        ...(form.instructor.avatar && !form.instructor.avatarFile ? { avatar: form.instructor.avatar } : {})
      };

      const payload: CreateCourseWithFullPayload = {
        title: form.title.trim(),
        description: form.description.trim() || form.title,
        level: form.level,
        category: form.category.trim(),
        instructor: instructorData,
        tags: [], // Có thể thêm form field cho tags nếu cần
        modules: uploadedSections.map((section, sIndex) => ({
          title: section.title.trim(),
          description: section.description?.trim() || section.title.trim(),
          order: sIndex + 1,
          lessons: section.lessons.map((lesson, lIndex) => {
            const textContent = lesson.content?.find(c => c.type === 'text')?.content?.trim() || '';
            const videoUrl = lesson.videoUrl?.trim() || undefined;
            
            console.log(`📝 Lesson ${lIndex + 1}: "${lesson.title}"`);
            console.log(`   - videoUrl from lesson.videoUrl:`, videoUrl);
            console.log(`   - content length:`, textContent.length);
            
            return {
              title: lesson.title.trim(),
              description: lesson.description?.trim() || lesson.title.trim(),
              content: textContent,
              videoUrl: videoUrl,
              duration: parseInt(lesson.duration || '1800') || 1800,
              order: lIndex + 1,
              learningObjectives: lesson.learningObjectives?.filter(obj => obj.trim()) || undefined
            };
          })
        }))
      };

      console.log('📤 Sending course data:', JSON.stringify(payload, null, 2));
      if (form.thumbnailFile) {
        console.log('🖼️ Thumbnail file:', form.thumbnailFile.name);
      }
      if (form.instructor.avatarFile) {
        console.log('👤 Instructor avatar file:', form.instructor.avatarFile.name);
      }
      
      let result;
      if (isEditing && courseId) {
        // Update existing course
        const updatePayload: UpdateCourseWithFullPayload = {
          ...payload,
          modules: uploadedSections.map((section, sIndex) => ({
            _id: section.id?.startsWith('sec-') ? undefined : section.id, // Chỉ gửi _id nếu là ID thật từ backend
            title: section.title.trim(),
            description: section.description?.trim() || section.title.trim(),
            order: sIndex + 1,
            lessons: section.lessons.map((lesson, lIndex) => {
              const textContent = lesson.content?.find(c => c.type === 'text')?.content?.trim() || '';
              const videoUrl = lesson.videoUrl?.trim() || undefined;
              
              console.log(`📝 Update Lesson ${lIndex + 1}: "${lesson.title}"`);
              console.log(`   - videoUrl:`, videoUrl);
              
              return {
                _id: lesson.id?.startsWith('lesson-') ? undefined : lesson.id, // Chỉ gửi _id nếu là ID thật từ backend
                title: lesson.title.trim(),
                description: lesson.description?.trim() || lesson.title.trim(),
                content: textContent,
                videoUrl: videoUrl,
                duration: parseInt(lesson.duration || '1800') || 1800,
                order: lIndex + 1,
                learningObjectives: lesson.learningObjectives?.filter(obj => obj.trim()) || undefined
              };
            })
          }))
        };
        result = await updateCourseWithFull(
          courseId, 
          updatePayload, 
          form.thumbnailFile,
          form.instructor.avatarFile,
          form.resourceFiles
        );
      } else {
        // Create new course
        result = await createCourseWithFull(
          payload, 
          form.thumbnailFile, 
          form.instructor.avatarFile,
          form.resourceFiles
        );
      }
      
      if (result.success) {
        showNotification('success', result.message || (isEditing ? 'Cập nhật khóa học thành công!' : 'Tạo khóa học thành công!'));
        setTimeout(() => navigate('/admin/training'), 2000);
      }
    } catch (error: any) {
      console.error('❌ Error saving course:', error);
      console.error('❌ Error response:', error.response?.data);
      showNotification('error', error.response?.data?.message || error.message || (isEditing ? 'Không thể cập nhật khóa học' : 'Không thể tạo khóa học'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/admin/training')}
              className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-[#7CBCFF] bg-white border border-gray-200 rounded-xl hover:border-[#7CBCFF] transition-all shadow-sm hover:shadow-md"
            >
              <FiArrowLeft className="mr-2" />
              Quay lại
            </button>
          </div>
          <div className="bg-gradient-to-r from-[#7CBCFF] to-[#5EAEF5] rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl font-bold text-white mb-2">
              {isEditing ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
            </h1>
            <p className="text-blue-50 text-lg">
              {isEditing ? 'Cập nhật thông tin khóa học của bạn' : 'Xây dựng khóa học với đầy đủ nội dung và bài giảng'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7CBCFF] to-[#5EAEF5] rounded-xl flex items-center justify-center">
                <FiBookOpen className="text-white text-xl w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Thông tin cơ bản</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên khóa học *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                  placeholder="VD: Kỹ năng chăm sóc người cao tuổi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả khóa học</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all min-h-[120px]"
                  placeholder="Mô tả chi tiết về nội dung, lợi ích và đối tượng học viên..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh thumbnail</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl px-4 py-8 text-center hover:border-[#7CBCFF] hover:bg-blue-50/50 transition-all">
                      <FiImage className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Click để chọn ảnh</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setForm(prev => ({ 
                            ...prev, 
                            thumbnailFile: file,
                            thumbnail: URL.createObjectURL(file)
                          }));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {form.thumbnail && (
                    <div className="relative group">
                      <img src={form.thumbnail} alt="Thumbnail" className="w-48 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md" />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, thumbnail: '', thumbnailFile: null }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thời lượng 
                    <span className="text-xs text-gray-500 ml-2">(Tự động tính)</span>
                  </label>
                  <input
                    value={formatDuration(totalDurationInSeconds)}
                    readOnly
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="Tự động tính từ các bài học"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tổng: {totalDurationInSeconds} giây ({form.sections.reduce((sum, s) => sum + s.lessons.length, 0)} bài học)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trình độ *</label>
                  <select
                    value={form.level}
                    onChange={e => setForm(prev => ({ ...prev, level: e.target.value as any }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                    required
                  >
                    <option value="">Chọn trình độ</option>
                    <option value="Cơ bản">🌱 Cơ bản</option>
                    <option value="Trung cấp">📈 Trung cấp</option>
                    <option value="Nâng cao">🚀 Nâng cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục *</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                    placeholder="VD: Sức khỏe"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Content - Sections and Lessons */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7CBCFF] to-[#5EAEF5] rounded-xl flex items-center justify-center">
                  <FiLayers className="text-white text-xl w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Nội dung khóa học</h2>
              </div>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#7CBCFF] to-[#5EAEF5] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium"
              >
                <FiPlus className="mr-2" /> Thêm Module
              </button>
            </div>
            
            <div className="space-y-6">
              {form.sections.map((section, sectionIndex) => (
                <div key={section.id} className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 hover:border-[#7CBCFF] transition-all">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-[#7CBCFF] text-white rounded-lg font-bold text-sm">
                        {sectionIndex + 1}
                      </span>
                      <input
                        value={section.title}
                        onChange={e => updateSection(sectionIndex, 'title', e.target.value)}
                        className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all font-semibold bg-white"
                        placeholder="Tên module"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <FiMinus className="w-5 h-5" />
                      </button>
                    </div>
                    <textarea
                      value={section.description || ''}
                      onChange={e => updateSection(sectionIndex, 'description', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all bg-white"
                      placeholder="Mô tả module này..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="ml-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#7CBCFF] rounded-full"></span>
                        Bài học
                      </span>
                      <button
                        type="button"
                        onClick={() => addLesson(sectionIndex)}
                        className="inline-flex items-center px-4 py-2 text-sm bg-white border-2 border-[#7CBCFF] text-[#7CBCFF] rounded-xl hover:bg-[#7CBCFF] hover:text-white transition-all font-medium"
                      >
                        <FiPlus className="mr-2" /> Thêm bài
                      </button>
                    </div>
                    
                    {section.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#7CBCFF]/50 hover:shadow-md transition-all">
                        <div className="space-y-4 mb-5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#7CBCFF]/20 to-[#5EAEF5]/20 text-[#7CBCFF] rounded-lg font-bold text-sm">
                              {lessonIndex + 1}
                            </span>
                            <input
                              value={lesson.title}
                              onChange={e => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all font-medium"
                              placeholder="Tên bài học"
                            />
                            <input
                              value={lesson.duration || ''}
                              onChange={e => updateLesson(sectionIndex, lessonIndex, 'duration', e.target.value)}
                              className="w-32 border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                              placeholder="1800 (giây)"
                              type="number"
                            />
                            <button
                              type="button"
                              onClick={() => removeLesson(sectionIndex, lessonIndex)}
                              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={lesson.description || ''}
                            onChange={e => updateLesson(sectionIndex, lessonIndex, 'description', e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                            placeholder="Mô tả bài học này..."
                            rows={2}
                          />
                          
                          {/* Learning Objectives */}
                          <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <FiTarget className="w-4 h-4 text-[#7CBCFF]" />
                                Mục tiêu học tập
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentObjectives = lesson.learningObjectives || [];
                                  updateLesson(sectionIndex, lessonIndex, 'learningObjectives', [...currentObjectives, '']);
                                }}
                                className="text-xs text-[#7CBCFF] hover:text-[#5EAEF5] font-medium"
                              >
                                + Thêm mục tiêu
                              </button>
                            </div>
                            {lesson.learningObjectives && lesson.learningObjectives.map((obj, objIndex) => (
                              <div key={objIndex} className="flex gap-2">
                                <input
                                  value={obj}
                                  onChange={e => {
                                    const newObjectives = [...(lesson.learningObjectives || [])];
                                    newObjectives[objIndex] = e.target.value;
                                    updateLesson(sectionIndex, lessonIndex, 'learningObjectives', newObjectives);
                                  }}
                                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7CBCFF] focus:ring-2 focus:ring-[#7CBCFF]/10 bg-white"
                                  placeholder="Học viên có thể..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newObjectives = (lesson.learningObjectives || []).filter((_, i) => i !== objIndex);
                                    updateLesson(sectionIndex, lessonIndex, 'learningObjectives', newObjectives);
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <FiMinus className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Video & Content */}
                        <div className="mt-5 space-y-5">
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl">
                            <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <FiVideo className="w-5 h-5 text-purple-600" />
                              Video bài học
                            </label>
                            
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={lesson.content?.find(c => c.type === 'video')?.url || ''}
                                onChange={e => {
                                  const videoContent = lesson.content?.find(c => c.type === 'video') || 
                                    { id: `video-${Date.now()}`, type: 'video', title: 'Video' };
                                  const textContent = lesson.content?.find(c => c.type === 'text');
                                  const newContent = [
                                    { ...videoContent, url: e.target.value },
                                    ...(textContent ? [textContent] : [])
                                  ];
                                  updateLesson(sectionIndex, lessonIndex, 'content', newContent);
                                }}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 bg-white"
                                placeholder="https://www.youtube.com/watch?v=..."
                              />

                              <div className="text-center text-xs text-gray-400 font-medium">- HOẶC -</div>
                              
                              <label className="block cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 text-center hover:border-[#7CBCFF] hover:bg-blue-50/30 transition-all">
                                  <FiUpload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600 font-medium">Upload video từ máy</p>
                                </div>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const videoContent = lesson.content?.find(c => c.type === 'video') || 
                                        { id: `video-${Date.now()}`, type: 'video', title: 'Video' };
                                      const textContent = lesson.content?.find(c => c.type === 'text');
                                      const newContent = [
                                        { ...videoContent, file: file, url: URL.createObjectURL(file) },
                                        ...(textContent ? [textContent] : [])
                                      ];
                                      updateLesson(sectionIndex, lessonIndex, 'content', newContent);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {lesson.content?.find(c => c.type === 'video')?.url && (
                                <div className="relative group mt-3">
                                  <video 
                                    src={lesson.content.find(c => c.type === 'video')?.url} 
                                    className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 shadow-md" 
                                    controls 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const textContent = lesson.content?.find(c => c.type === 'text');
                                      updateLesson(sectionIndex, lessonIndex, 'content', textContent ? [textContent] : []);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                                  >
                                    <FiMinus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-5 rounded-xl">
                            <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <FiEdit3 className="w-5 h-5 text-green-600" />
                              Nội dung bài học
                            </label>
                            <textarea
                              value={lesson.content?.find(c => c.type === 'text')?.content || ''}
                              onChange={(e) => {
                                const textContent = lesson.content?.find(c => c.type === 'text') || 
                                  { id: `text-${Date.now()}`, type: 'text', title: 'Content' };
                                const videoContent = lesson.content?.find(c => c.type === 'video');
                                const updatedContent = [
                                  ...(videoContent ? [videoContent] : []),
                                  { ...textContent, content: e.target.value }
                                ];
                                updateLesson(sectionIndex, lessonIndex, 'content', updatedContent);
                              }}
                              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 bg-white font-mono text-sm"
                              style={{ whiteSpace: 'pre-wrap' }}
                              placeholder="Nhập nội dung chi tiết bài học..."
                              rows={10}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7CBCFF] to-[#5EAEF5] rounded-xl flex items-center justify-center">
                <FiUser className="text-white text-xl w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Thông tin giảng viên</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar giảng viên</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#7CBCFF] hover:bg-blue-50/30 transition-all">
                      <FiImage className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Upload</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setForm(prev => ({ 
                            ...prev, 
                            instructor: { 
                              ...prev.instructor, 
                              avatar: URL.createObjectURL(file),
                              avatarFile: file
                            }
                          }));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {form.instructor.avatar && (
                    <div className="relative group">
                      <img src={form.instructor.avatar} alt="Avatar" className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md" />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          instructor: { ...prev.instructor, avatar: undefined, avatarFile: null }
                        }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên giảng viên</label>
                  <input
                    value={form.instructor.name}
                    onChange={e => setForm(prev => ({ 
                      ...prev, 
                      instructor: { ...prev.instructor, name: e.target.value }
                    }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                    placeholder="VD: ThS. Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chức vụ</label>
                  <input
                    value={form.instructor.title}
                    onChange={e => setForm(prev => ({ 
                      ...prev, 
                      instructor: { ...prev.instructor, title: e.target.value }
                    }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#7CBCFF] focus:ring-4 focus:ring-[#7CBCFF]/10 transition-all"
                    placeholder="VD: Chuyên gia Y tế"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button 
              type="button" 
              onClick={() => navigate('/admin/training')} 
              className="px-8 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-[#7CBCFF] to-[#5EAEF5] text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  <span>{isEditing ? 'Cập nhật khóa học' : 'Tạo khóa học'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
};

export default CourseFormPage;
