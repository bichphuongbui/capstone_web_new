import React from 'react';
import { Link } from 'react-router-dom';

// Component hiển thị các tính năng chính của hệ thống
const Features: React.FC = () => {
  const features = [
    {
      icon: '🩺',
      title: 'Giám sát sức khỏe thông minh',
      description: 'Theo dõi các chỉ số sinh tồn quan trọng như nhịp tim, huyết áp, đường huyết 24/7 với cảm biến IoT tiên tiến.'
    },
    {
      icon: '🚨',
      title: 'Cảnh báo khẩn cấp tức thời',
      description: 'Hệ thống AI phát hiện bất thường và gửi cảnh báo ngay lập tức đến gia đình và đội ngũ y tế.'
    },
    {
      icon: '💊',
      title: 'Quản lý thuốc thông minh',
      description: 'Nhắc nhở uống thuốc đúng giờ, theo dõi liều lượng và cảnh báo tương tác thuốc một cách tự động.'
    },
    {
      icon: '📊',
      title: 'Báo cáo sức khỏe chi tiết',
      description: 'Phân tích xu hướng sức khỏe, tạo báo cáo định kỳ và đưa ra khuyến nghị cá nhân hóa.'
    },
    {
      icon: '👥',
      title: 'Kết nối gia đình',
      description: 'Ứng dụng di động cho phép gia đình theo dõi tình trạng người thân mọi lúc, mọi nơi.'
    },
    {
      icon: '🎯',
      title: 'Chăm sóc cá nhân hóa',
      description: 'AI học hỏi thói quen và đưa ra lời khuyên chăm sóc sức khỏe phù hợp với từng cá nhân.'
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tính năng nổi bật
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá những tính năng tiên tiến giúp chăm sóc người cao tuổi một cách toàn diện và hiệu quả
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            to="/login" 
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
          >
            Xem tất cả tính năng
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
