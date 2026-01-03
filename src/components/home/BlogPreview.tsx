import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBlogs, Blog } from '../../services/blog.service';

// Component hiển thị preview của 3 bài blog mới nhất
const BlogPreview: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const data = await getAllBlogs();
        // Lấy 3 bài blog mới nhất
        setBlogs(data.slice(0, 3));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Helper function để format ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper function để tạo excerpt từ content
  const createExcerpt = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Blog & Tin tức
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cập nhật những thông tin mới nhất về chăm sóc sức khỏe người cao tuổi và công nghệ AI
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Blog & Tin tức
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Blog & Tin tức
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cập nhật những thông tin mới nhất về chăm sóc sức khỏe người cao tuổi và công nghệ AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <article key={blog.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-primary-100 text-primary-600 text-sm font-medium px-3 py-1 rounded-full">
                    Tin tức
                  </span>
                  <div className="text-4xl">📰</div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-primary-600 cursor-pointer transition-colors">
                  {blog.title}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {createExcerpt(blog.content)}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(blog.createdAt)}</span>
                  <span>{Math.ceil(blog.content.length / 500)} phút đọc</span>
                </div>
                
                <Link 
                  to={`/blog/${blog.id}`}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  Đọc thêm
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            to="/blog" 
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
          >
            Xem tất cả bài viết
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
