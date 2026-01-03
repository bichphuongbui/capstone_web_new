import { api } from './api';

export interface CourseInstructor {
  name: string;
  title: string;
  avatar: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: CourseInstructor;
  level: string;
  duration: number;
  totalLessons: number;
  totalModules: number;
  enrollmentCount: number;
  isPublished: boolean;
  isActive: boolean;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  enrollment: any;
  isEnrolled: boolean;
  modules?: any[]; // Course modules with lessons
}

export interface GetCoursesParams {
  level?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetCoursesResponse {
  success: boolean;
  count: number;
  data: Course[];
}

/**
 * Lấy danh sách khóa học (yêu cầu đăng nhập)
 */
export const getCourses = async (params?: GetCoursesParams): Promise<GetCoursesResponse> => {
  try {
    const response = await api.get('/api/courses', { params });
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to fetch courses');
  } catch (error: any) {
    console.error('❌ Error fetching courses:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một khóa học
 */
export const getCourseById = async (courseId: string): Promise<{ success: boolean; data: Course }> => {
  try {
    const response = await api.get(`/api/courses/${courseId}`);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to fetch course details');
  } catch (error: any) {
    console.error('❌ Error fetching course details:', error);
    throw error;
  }
};

/**
 * Xuất bản/gỡ xuất bản khóa học (Admin)
 */
export const togglePublishCourse = async (courseId: string): Promise<{ success: boolean; message: string; data: Course }> => {
  try {
    const response = await api.patch(`/api/courses/admin/${courseId}/publish`);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to toggle course publish status');
  } catch (error: any) {
    console.error('❌ Error toggling course publish status:', error);
    throw error;
  }
};

/**
 * Tạo khóa học mới (admin only)
 */
export const createCourse = async (courseData: Partial<Course>): Promise<{ success: boolean; data: Course }> => {
  try {
    const response = await api.post('/api/courses', courseData);
    
    if (response.status === 201 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to create course');
  } catch (error: any) {
    console.error('❌ Error creating course:', error);
    throw error;
  }
};

/**
 * Cập nhật khóa học (admin only)
 */
export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<{ success: boolean; data: Course }> => {
  try {
    const response = await api.put(`/api/courses/${courseId}`, courseData);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to update course');
  } catch (error: any) {
    console.error('❌ Error updating course:', error);
    throw error;
  }
};

/**
 * Xóa khóa học (admin only)
 */
export const deleteCourse = async (courseId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🗑️ Deleting course:', courseId);
    const response = await api.delete(`/api/courses/admin/${courseId}`);
    
    if (response.status === 200 && response.data) {
      console.log('✅ Course deleted successfully');
      return response.data;
    }
    
    throw new Error('Failed to delete course');
  } catch (error: any) {
    console.error('❌ Error deleting course:', error);
    throw new Error(error.response?.data?.message || error.message || 'Không thể xóa khóa học');
  }
};

/**
 * Toggle trạng thái active của khóa học (admin only)
 */
export const toggleCourseStatus = async (courseId: string): Promise<{ success: boolean; data: Course }> => {
  try {
    const response = await api.patch(`/api/courses/${courseId}/toggle-status`);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to toggle course status');
  } catch (error: any) {
    console.error('❌ Error toggling course status:', error);
    throw error;
  }
};

/**
 * Publish/Unpublish khóa học (admin only)
 */
export const toggleCoursePublish = async (courseId: string): Promise<{ success: boolean; data: Course }> => {
  try {
    const response = await api.patch(`/api/courses/${courseId}/toggle-publish`);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to toggle course publish status');
  } catch (error: any) {
    console.error('❌ Error toggling course publish status:', error);
    throw error;
  }
};

/**
 * Upload video lên Cloudinary (Admin only)
 * @param videoFile - File video cần upload
 * @returns URL của video đã upload
 */
export const uploadVideo = async (videoFile: File): Promise<{ 
  success: boolean; 
  message: string;
  data: { 
    videoUrl: string;
    videoProvider: string;
    publicId: string;
    duration: number | null;
    size: number;
  } 
}> => {
  try {
    console.log('📹 Uploading video:', videoFile.name, `(${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const formData = new FormData();
    formData.append('video', videoFile);
    
    const response = await api.post('/api/courses/admin/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('✅ Video uploaded successfully:', response.data);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to upload video');
  } catch (error: any) {
    console.error('❌ Error uploading video:', error);
    console.error('❌ Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Không thể upload video');
  }
};

/**
 * Interface cho API create-full
 */
export interface CreateCourseLesson {
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  learningObjectives?: string[];
}

export interface CreateCourseModule {
  title: string;
  description: string;
  order: number;
  lessons: CreateCourseLesson[];
}

export interface CreateCourseInstructor {
  name: string;
  title: string;
  avatar?: string; // URL nếu không upload instructorAvatar file
}

export interface CreateCourseWithFullPayload {
  title: string;
  description: string;
  level: string;
  category: string;
  instructor: CreateCourseInstructor;
  tags?: string[];
  modules: CreateCourseModule[];
  isPublished?: boolean;
}

// Update interfaces - có _id để update existing items
export interface UpdateCourseLesson {
  _id?: string; // Nếu có _id: update, không có: tạo mới
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  learningObjectives?: string[];
}

export interface UpdateCourseModule {
  _id?: string; // Nếu có _id: update, không có: tạo mới
  title: string;
  description: string;
  order: number;
  lessons: UpdateCourseLesson[];
}

export interface UpdateCourseWithFullPayload {
  title: string;
  description: string;
  level: string;
  category?: string;
  thumbnail?: string;
  modules: UpdateCourseModule[];
}

/**
 * Tạo khóa học kèm modules và lessons trong 1 API (Admin)
 * Backend nhận FormData với thumbnail, instructorAvatar, resources và các JSON string fields
 */
export const createCourseWithFull = async (
  payload: CreateCourseWithFullPayload,
  thumbnailFile?: File | null,
  instructorAvatarFile?: File | null,
  resourceFiles?: File[]
): Promise<{ success: boolean; message: string; data: Course }> => {
  try {
    console.log('🚀 API Request:', '/api/courses/admin/create-full');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const formData = new FormData();
    
    // Append thumbnail file nếu có
    if (thumbnailFile) {
      console.log('🖼️ Thumbnail file:', thumbnailFile.name);
      formData.append('thumbnail', thumbnailFile);
    }
    
    // Append instructor avatar file nếu có
    if (instructorAvatarFile) {
      console.log('👤 Instructor avatar file:', instructorAvatarFile.name);
      formData.append('instructorAvatar', instructorAvatarFile);
    }
    
    // Append resource files nếu có (tối đa 50 files, mỗi file 20MB)
    if (resourceFiles && resourceFiles.length > 0) {
      console.log(`📚 Resource files: ${resourceFiles.length} files`);
      resourceFiles.forEach((file, index) => {
        console.log(`  - File ${index + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        formData.append('resources', file);
      });
    }
    
    // Append các fields dạng string
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('level', payload.level);
    formData.append('category', payload.category);
    
    // Instructor JSON string (không cần avatar nếu đã upload file)
    const instructorData: CreateCourseInstructor = {
      name: payload.instructor.name,
      title: payload.instructor.title,
      // Chỉ gửi avatar URL nếu không upload file
      ...(payload.instructor.avatar && !instructorAvatarFile ? { avatar: payload.instructor.avatar } : {})
    };
    formData.append('instructor', JSON.stringify(instructorData));
    
    // Tags JSON array string
    if (payload.tags && payload.tags.length > 0) {
      formData.append('tags', JSON.stringify(payload.tags));
    }
    
    // isPublished boolean
    if (payload.isPublished !== undefined) {
      formData.append('isPublished', payload.isPublished.toString());
    }
    
    // Modules JSON array string
    formData.append('modules', JSON.stringify(payload.modules));
    
    const response = await api.post('/api/courses/admin/create-full', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('✅ API Response:', response.status, response.data);
    
    if (response.status === 201 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to create course with modules');
  } catch (error: any) {
    console.error('❌ Error creating course with modules:', error);
    console.error('❌ Error response status:', error.response?.status);
    console.error('❌ Error response data:', error.response?.data);
    console.error('❌ Error message:', error.message);
    
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to create course');
    }
    
    throw error;
  }
};

/**
 * Cập nhật khóa học kèm modules và lessons trong 1 API (Admin)
 * - Nếu module/lesson có _id: update
 * - Nếu module/lesson không có _id: tạo mới
 * - Các module/lesson không có trong request sẽ bị xóa
 * Backend sẽ tự upload thumbnail, instructorAvatar và resources lên Cloudinary
 */
export const updateCourseWithFull = async (
  courseId: string,
  payload: UpdateCourseWithFullPayload,
  thumbnailFile?: File | null,
  instructorAvatarFile?: File | null,
  resourceFiles?: File[]
): Promise<{ success: boolean; message: string; data: Course }> => {
  try {
    console.log('🔄 API Request:', `/api/courses/admin/${courseId}/update-full`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    // Nếu có file, gửi qua FormData
    const hasFiles = thumbnailFile || instructorAvatarFile || (resourceFiles && resourceFiles.length > 0);
    
    let requestData: any;
    let headers: any = {};
    
    if (hasFiles) {
      const formData = new FormData();
      
      // Append thumbnail file nếu có
      if (thumbnailFile) {
        console.log('🖼️ Thumbnail file:', thumbnailFile.name);
        formData.append('thumbnail', thumbnailFile);
      }
      
      // Append instructor avatar file nếu có
      if (instructorAvatarFile) {
        console.log('👤 Instructor avatar file:', instructorAvatarFile.name);
        formData.append('instructorAvatar', instructorAvatarFile);
      }
      
      // Append resource files nếu có
      if (resourceFiles && resourceFiles.length > 0) {
        console.log(`📚 Resource files: ${resourceFiles.length} files`);
        resourceFiles.forEach((file, index) => {
          console.log(`  - File ${index + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          formData.append('resources', file);
        });
      }
      
      // Append payload as JSON string
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('level', payload.level);
      
      if (payload.category) {
        formData.append('category', payload.category);
      }
      
      if (payload.thumbnail) {
        formData.append('thumbnailUrl', payload.thumbnail);
      }
      
      formData.append('modules', JSON.stringify(payload.modules));
      
      requestData = formData;
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      requestData = payload;
    }
    
    const response = await api.put(`/api/courses/admin/${courseId}/update-full`, requestData, { headers });
    
    console.log('✅ API Response:', response.status, response.data);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to update course with modules');
  } catch (error: any) {
    console.error('❌ Error updating course with modules:', error);
    console.error('❌ Error response status:', error.response?.status);
    console.error('❌ Error response data:', error.response?.data);
    throw new Error(error.response?.data?.message || error.message || 'Không thể cập nhật khóa học');
  }
};

/**
 * Lấy chi tiết bài học
 */
export interface LessonModule {
  _id: string;
  course: {
    _id: string;
    title: string;
    isPublished: boolean;
  };
  title: string;
  order: number;
}

export interface Lesson {
  _id: string;
  module: LessonModule;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  learningObjectives: string[];
  order: number;
  isActive: boolean;
  resources: any[];
  createdAt: string;
  updatedAt: string;
}

export interface NextLesson {
  _id: string;
  title: string;
}

export interface GetLessonResponse {
  success: boolean;
  data: {
    lesson: Lesson;
    nextLesson?: NextLesson;
  };
}

export const getLessonById = async (lessonId: string): Promise<GetLessonResponse> => {
  try {
    const response = await api.get(`/api/courses/lesson/${lessonId}`);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to fetch lesson details');
  } catch (error: any) {
    console.error('❌ Error fetching lesson details:', error);
    throw error;
  }
};
