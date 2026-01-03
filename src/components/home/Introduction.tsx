import React from 'react';

// Section giới thiệu hệ thống với thông tin tổng quan
const Introduction: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Giải pháp chăm sóc thông minh cho người cao tuổi
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Hệ thống của chúng tôi kết hợp công nghệ AI tiên tiến với kinh nghiệm chăm sóc sức khỏe 
              chuyên nghiệp để mang đến dịch vụ chăm sóc toàn diện, an toàn và hiệu quả cho người cao tuổi.
            </p>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Với đội ngũ chuyên gia giàu kinh nghiệm, công nghệ AI tiên tiến và hệ thống chăm sóc cá nhân hóa, 
              chúng tôi giúp gia đình yên tâm và người cao tuổi có cuộc sống chất lượng, độc lập hơn.
            </p>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">5000+</div>
                <div className="text-sm text-gray-500">Người dùng tin tưởng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">98%</div>
                <div className="text-sm text-gray-500">Mức độ hài lòng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">3+</div>
                <div className="text-sm text-gray-500">Năm kinh nghiệm</div>
              </div>
            </div>
          </div>
          <div className="lg:pl-8">
            <div className="bg-gradient-to-br from-primary-50 to-blue-100 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <div className="text-3xl mb-2">🏥</div>
                  <div className="text-sm font-medium text-gray-700">Y tế chuyên nghiệp</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-sm font-medium text-gray-700">AI thông minh</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <div className="text-3xl mb-2">📱</div>
                  <div className="text-sm font-medium text-gray-700">Ứng dụng di động</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <div className="text-3xl mb-2">💝</div>
                  <div className="text-sm font-medium text-gray-700">Chăm sóc tận tâm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduction;
