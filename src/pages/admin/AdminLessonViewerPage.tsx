import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById, Lesson as APILesson, getCourseById } from '../../services/course.service';

const AdminLessonViewerPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  
  const [lesson, setLesson] = useState<APILesson | null>(null);
  const [nextLesson, setNextLesson] = useState<{ _id: string; title: string } | null>(null);
  const [prevLesson, setPrevLesson] = useState<{ _id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);

  // Check if URL is YouTube
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Check if URL is Vimeo
  const isVimeoUrl = (url: string) => {
    return url.includes('vimeo.com');
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  // Get Vimeo embed URL
  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/);
    return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : null;
  };

  // Fetch lesson details from API
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      
      try {
        setLoading(true);
        setError(null);
        setNextLesson(null); // Reset next lesson
        setPrevLesson(null); // Reset prev lesson
        console.log('🔍 Fetching lesson:', lessonId);
        
        const result = await getLessonById(lessonId);
        
        console.log('📖 Lesson result:', result);
        
        if (result.success && result.data.lesson) {
          const currentLesson = result.data.lesson;
          setLesson(currentLesson);
          
          // Nếu API trả về nextLesson thì dùng luôn
          if (result.data.nextLesson) {
            setNextLesson(result.data.nextLesson);
            console.log('📌 Next lesson from API:', result.data.nextLesson);
          }
          
          // Luôn tính toán nextLesson và prevLesson từ course modules
          console.log('⚙️ Calculating next/prev lesson from course modules...');
          try {
            const courseResult = await getCourseById(currentLesson.module.course._id);
            if (courseResult.success && courseResult.data.modules) {
              const modules = courseResult.data.modules;
              const currentModule = modules.find(m => m._id === currentLesson.module._id);
              
              if (currentModule) {
                // Tìm vị trí lesson hiện tại
                const currentLessonIndex = currentModule.lessons.findIndex((l: any) => l._id === lessonId);
                
                // Tính toán nextLesson nếu API không trả về
                if (!result.data.nextLesson) {
                  if (currentLessonIndex !== -1 && currentLessonIndex < currentModule.lessons.length - 1) {
                    // Còn lesson trong module hiện tại
                    const nextLessonInModule = currentModule.lessons[currentLessonIndex + 1];
                    setNextLesson({ _id: nextLessonInModule._id, title: nextLessonInModule.title });
                    console.log('✅ Found next lesson in same module:', nextLessonInModule.title);
                  } else {
                    // Hết module hiện tại, tìm module tiếp theo
                    const currentModuleIndex = modules.findIndex(m => m._id === currentLesson.module._id);
                    if (currentModuleIndex !== -1 && currentModuleIndex < modules.length - 1) {
                      const nextModule = modules[currentModuleIndex + 1];
                      if (nextModule.lessons && nextModule.lessons.length > 0) {
                        const firstLessonOfNextModule = nextModule.lessons[0];
                        setNextLesson({ _id: firstLessonOfNextModule._id, title: firstLessonOfNextModule.title });
                        console.log('✅ Found first lesson of next module:', firstLessonOfNextModule.title);
                      }
                    } else {
                      console.log('🏁 No more lessons - end of course');
                    }
                  }
                }
                
                // Tính toán prevLesson
                if (currentLessonIndex !== -1 && currentLessonIndex > 0) {
                  // Còn lesson trước trong module hiện tại
                  const prevLessonInModule = currentModule.lessons[currentLessonIndex - 1];
                  setPrevLesson({ _id: prevLessonInModule._id, title: prevLessonInModule.title });
                  console.log('✅ Found prev lesson in same module:', prevLessonInModule.title);
                } else if (currentLessonIndex === 0) {
                  // Lesson đầu tiên của module, tìm module trước
                  const currentModuleIndex = modules.findIndex(m => m._id === currentLesson.module._id);
                  if (currentModuleIndex > 0) {
                    const prevModule = modules[currentModuleIndex - 1];
                    if (prevModule.lessons && prevModule.lessons.length > 0) {
                      const lastLessonOfPrevModule = prevModule.lessons[prevModule.lessons.length - 1];
                      setPrevLesson({ _id: lastLessonOfPrevModule._id, title: lastLessonOfPrevModule.title });
                      console.log('✅ Found last lesson of prev module:', lastLessonOfPrevModule.title);
                    }
                  } else {
                    console.log('🏁 First lesson of course - no prev lesson');
                  }
                }
              }
            }
          } catch (err) {
            console.error('❌ Error calculating next/prev lesson:', err);
          }
        }
      } catch (err: any) {
        console.error('❌ Error fetching lesson:', err);
        setError('Không thể tải bài học');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy bài học'}</p>
          <Link to={`/admin/training/${courseId}`} className="text-blue-600 hover:underline">
            ← Quay lại khóa học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4 text-sm">
          <Link
            to={`/admin/training/${lesson.module.course._id}`}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            ← Quay lại khóa học: {lesson.module.course.title}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="mb-4">
                <div className="text-sm text-blue-600 font-medium">{lesson.module.title}</div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{lesson.title}</h1>
                <div className="mt-2 text-sm text-gray-600">
                  Bài {lesson.order} • {formatDuration(lesson.duration)}
                </div>
              </div>

              {lesson.description && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-700">{lesson.description}</p>
                </div>
              )}

              {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Mục tiêu học tập:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {lesson.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5">
                {lesson.videoUrl ? (
                  <div className="mb-6">
                    {isYouTubeUrl(lesson.videoUrl) ? (
                      // YouTube embed
                      <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
                          src={getYouTubeEmbedUrl(lesson.videoUrl) || ''}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : isVimeoUrl(lesson.videoUrl) ? (
                      // Vimeo embed
                      <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
                          src={getVimeoEmbedUrl(lesson.videoUrl) || ''}
                          title={lesson.title}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      // Direct video file
                      <div>
                        {!videoError ? (
                          <video 
                            controls 
                            className="w-full rounded-lg border border-gray-200 bg-black"
                            onError={() => setVideoError(true)}
                            crossOrigin="anonymous"
                          >
                            <source src={lesson.videoUrl} type="video/mp4" />
                            <source src={lesson.videoUrl} type="video/webm" />
                            <source src={lesson.videoUrl} type="video/ogg" />
                            Trình duyệt của bạn không hỗ trợ video.
                          </video>
                        ) : (
                          <div className="bg-gray-100 rounded-lg border border-gray-200 p-8 text-center">
                            <div className="text-red-600 mb-2">
                              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Không thể tải video
                            </div>
                            <p className="text-sm text-gray-600 mb-3">Video có thể đã bị xóa hoặc không khả dụng</p>
                            <a 
                              href={lesson.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:underline"
                            >
                              Thử mở video trong tab mới
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {lesson.content && (
                  <article 
                    className="prose prose-sm sm:prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-6">
                {prevLesson && (
                  <Link 
                    to={`/admin/training/${courseId}/lesson/${prevLesson._id}`}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    ← Bài trước
                  </Link>
                )}
                <div className="flex-1"></div>
                {nextLesson && (
                  <Link 
                    to={`/admin/training/${courseId}/lesson/${nextLesson._id}`} 
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Bài tiếp theo →
                  </Link>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 rounded-t-2xl">
                Thông tin bài học
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <div className="text-gray-600">Khóa học</div>
                  <div className="font-medium text-gray-900">{lesson.module.course.title}</div>
                </div>
                <div>
                  <div className="text-gray-600">Module</div>
                  <div className="font-medium text-gray-900">{lesson.module.title}</div>
                </div>
                <div>
                  <div className="text-gray-600">Thời lượng</div>
                  <div className="font-medium text-gray-900">{formatDuration(lesson.duration)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Trạng thái</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    lesson.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {lesson.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminLessonViewerPage;
