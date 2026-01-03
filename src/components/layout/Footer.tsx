import React from 'react';

// Footer component với thông tin liên hệ và các liên kết quan trọng
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Thông tin công ty */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              Nền tảng Chăm sóc Người cao tuổi AI
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Chúng tôi cam kết mang đến giải pháp chăm sóc sức khỏe toàn diện và hiện đại nhất 
              cho người cao tuổi, giúp gia đình yên tâm và người thân có cuộc sống chất lượng.
            </p>
            <div className="flex space-x-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <span className="text-xl">📱</span>
              </div>
              <div className="bg-primary-600 p-2 rounded-lg">
                <span className="text-xl">💻</span>
              </div>
              <div className="bg-primary-600 p-2 rounded-lg">
                <span className="text-xl">🏥</span>
              </div>
            </div>
          </div>
          
          {/* Liên hệ */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-primary-400 mr-3">📧</span>
                <a href="mailto:support@eldercare-ai.vn" className="text-gray-300 hover:text-white transition-colors">
                  support@eldercare-ai.vn
                </a>
              </div>
              <div className="flex items-center">
                <span className="text-primary-400 mr-3">📞</span>
                <a href="tel:1900-123-456" className="text-gray-300 hover:text-white transition-colors">
                  1900 123 456
                </a>
              </div>
              <div className="flex items-center">
                <span className="text-primary-400 mr-3">🏢</span>
                <span className="text-gray-300">
                  123 Đường Công Nghệ, Quận 1<br />
                  TP. Hồ Chí Minh, Việt Nam
                </span>
              </div>
            </div>
          </div>
          
          {/* Dịch vụ */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Giám sát sức khỏe 24/7
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Cảnh báo khẩn cấp
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Quản lý thuốc
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Tư vấn y tế trực tuyến
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Báo cáo sức khỏe
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Thông tin hỗ trợ khẩn cấp */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="bg-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <div className="font-bold text-lg">Đường dây nóng khẩn cấp 24/7</div>
                <div className="text-xl font-bold">1900 911 911</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright và thông tin pháp lý */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Nền tảng Chăm sóc Người cao tuổi AI. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Chính sách bảo mật
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Hỗ trợ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
