import React from 'react';
import { Link } from 'react-router-dom';

// Hero section với tiêu đề chính và call-to-action
const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-blue-100 py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Nền tảng Chăm sóc Người cao tuổi{' '}
          <span className="text-primary-600">ứng dụng AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Giải pháp toàn diện cho việc chăm sóc sức khỏe người cao tuổi với công nghệ AI tiên tiến, 
          mang đến sự an tâm cho gia đình và chất lượng cuộc sống tốt nhất cho người thân.
        </p>
        <div className="flex justify-center">
          <Link 
            to="/login" 
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block"
          >
            Khám phá ngay
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
            <div className="text-gray-600">Chuyên gia chăm sóc</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary-600 mb-2">AI</div>
            <div className="text-gray-600">Công nghệ thông minh</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary-600 mb-2">1000+</div>
            <div className="text-gray-600">Gia đình tin tưởng</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
