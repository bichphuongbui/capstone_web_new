import axios from 'axios';

// Type cho Blog
export interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  thumbnail: string;
}

// Base URL cho MockAPI
const API_BASE_URL = 'https://68aed258b91dfcdd62ba657c.mockapi.io';

// Service để lấy tất cả blogs
export const getAllBlogs = async (): Promise<Blog[]> => {
  try {
    const response = await axios.get<Blog[]>(`${API_BASE_URL}/blogs`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách blogs:', error);
    throw new Error('Không thể tải danh sách bài viết');
  }
};

// Service để lấy blog theo ID
export const getBlogById = async (id: string): Promise<Blog> => {
  try {
    const response = await axios.get<Blog>(`${API_BASE_URL}/blogs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy blog:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Bài viết không tồn tại');
    }
    throw new Error('Không thể tải bài viết');
  }
};
