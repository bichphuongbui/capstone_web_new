import { api } from './api';

/**
 * Upload video lên Cloudinary thông qua backend
 * @param file Video file (mp4, mov, avi, mkv, wmv, flv, webm) - Max 100MB
 * @returns URL của video đã upload trên Cloudinary
 */
export const uploadVideo = async (file: File): Promise<string> => {
  try {
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      throw new Error('Video quá lớn. Kích thước tối đa là 100MB');
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 
                        'video/x-ms-wmv', 'video/x-flv', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Định dạng video không hợp lệ. Chỉ chấp nhận: mp4, mov, avi, mkv, wmv, flv, webm');
    }

    const formData = new FormData();
    formData.append('video', file);

    console.log('🎥 Uploading video:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const response = await api.post('/api/courses/admin/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200 || response.status === 201) {
      const url = response.data?.url || response.data?.data?.url || response.data?.videoUrl;
      console.log('✅ Video uploaded successfully:', url);
      return url;
    }

    throw new Error(response.data?.message || 'Upload video thất bại');
  } catch (error: any) {
    console.error('❌ Upload video error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Không thể upload video');
  }
};

/**
 * Upload image lên server (dùng endpoint khác nếu có)
 * @param file Image file
 * @returns URL của image đã upload
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Validate file size (max 5MB for images)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('Ảnh quá lớn. Kích thước tối đa là 5MB');
    }

    const formData = new FormData();
    formData.append('image', file);

    console.log('🖼️ Uploading image:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Có thể thay đổi endpoint này nếu backend có endpoint riêng cho image
    const response = await api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200 || response.status === 201) {
      const url = response.data?.url || response.data?.data?.url;
      console.log('✅ Image uploaded successfully:', url);
      return url;
    }

    throw new Error(response.data?.message || 'Upload ảnh thất bại');
  } catch (error: any) {
    console.error('❌ Upload image error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Không thể upload ảnh');
  }
};

/**
 * Upload file (tự động detect loại file)
 * @param file File cần upload
 * @param type Loại file: 'image' | 'video'
 * @returns URL của file đã upload
 */
export const uploadFile = async (file: File, type: 'image' | 'video'): Promise<string> => {
  if (type === 'video') {
    return uploadVideo(file);
  } else {
    return uploadImage(file);
  }
};
