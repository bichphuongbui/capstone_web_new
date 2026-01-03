import React from 'react';
import { Link } from 'react-router-dom';

// Đồng bộ với PricingPage: dùng đơn giá tham khảo và 3 gói minh hoạ theo giờ/ngày
const Pricing: React.FC = () => {
  const UNIT_PRICE = 100000; // VNĐ/giờ
  const formatCurrency = (value: number) =>
    value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

  const pricingPlans = [
    {
      name: 'Gói Cơ bản',
      hoursPerDay: 2,
      days: 30,
      description: 'Ước tính cho nhu cầu chăm sóc nhẹ nhàng hằng ngày',
      features: [
        '2 giờ mỗi ngày · 30 ngày',
        'Giờ linh hoạt theo thỏa thuận',
        'Chi phí thực tế do hai bên thống nhất'
      ],
      popular: false,
      cta: 'Tùy chỉnh trên bảng giá'
    },
    {
      name: 'Gói Tiêu chuẩn',
      hoursPerDay: 4,
      days: 30,
      description: 'Phổ biến cho theo dõi và hỗ trợ thường xuyên',
      features: [
        '4 giờ mỗi ngày · 30 ngày',
        'Linh hoạt lịch hẹn sáng/chiều',
        'Chi phí thực tế do hai bên thống nhất'
      ],
      popular: true,
      cta: 'Tùy chỉnh trên bảng giá'
    },
    {
      name: 'Gói Toàn thời gian',
      hoursPerDay: 8,
      days: 30,
      description: 'Phù hợp chăm sóc chuyên sâu & theo dõi sát sao',
      features: [
        '8 giờ mỗi ngày · 30 ngày',
        'Có thể chia 2 lịch hẹn',
        'Chi phí thực tế do hai bên thống nhất'
      ],
      popular: false,
      cta: 'Tùy chỉnh trên bảng giá'
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ước tính chi phí nhanh
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Lựa chọn gói dịch vụ phù hợp với nhu cầu và ngân sách của gia đình bạn
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => {
            const estimated = plan.hoursPerDay * plan.days * UNIT_PRICE;
            return (
            <div key={index} className={`relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-8 ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Phổ biến nhất
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">{formatCurrency(estimated)}</span>
                  <span className="text-gray-600"> / {plan.days} ngày</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/pricing" className={`block text-center w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                plan.popular 
                  ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}>
                {plan.cta}
              </Link>
            </div>
          );})}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Muốn tự ước tính chi phí theo nhu cầu thực tế? Hãy dùng công cụ tính ở trang bảng giá.
          </p>
          <a href="/pricing" className="inline-block border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Xem bảng giá chi tiết
          </a>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
