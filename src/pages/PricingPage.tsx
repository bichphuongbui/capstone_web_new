import React, { useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const UNIT_PRICE = 100000; // VNĐ / giờ

const formatCurrency = (value: number) =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const PricingPage: React.FC = () => {
  const [hoursPerDay, setHoursPerDay] = useState<number>(2);
  const [days, setDays] = useState<number>(30);

  const estimatedPrice = useMemo(() => {
    const safeHours = Math.min(24, Math.max(1, Number(hoursPerDay) || 0));
    const safeDays = Math.min(30, Math.max(1, Number(days) || 0));
    return safeHours * safeDays * UNIT_PRICE;
  }, [hoursPerDay, days]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Ước tính chi phí chăm sóc người cao tuổi
            </h1>
            <p className="text-lg text-gray-600">
              Chọn thời lượng chăm sóc để xem giá ước lượng. Việc thanh toán sẽ do bạn và người chăm sóc tự thỏa thuận.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số giờ chăm sóc mỗi ngày (1–24 giờ)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ngày chăm sóc (1–30 ngày)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
                />
              </div>
            </div>

            <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Đơn giá tham khảo</div>
                  <div className="text-base font-semibold text-gray-900">{formatCurrency(UNIT_PRICE)} / giờ</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Ước tính chi phí</div>
                  <div className="text-2xl md:text-3xl font-bold text-primary-700">
                    {formatCurrency(estimatedPrice)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{ label: 'Gói Cơ bản', h: 2 }, { label: 'Gói Tiêu chuẩn', h: 4 }, { label: 'Gói Toàn thời gian', h: 8 }].map((pkg) => (
                <div key={pkg.label} className="rounded-xl border border-gray-200 p-5 bg-white">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{pkg.label}</div>
                  <div className="text-sm text-gray-600 mb-4">{pkg.h}h/ngày · 30 ngày</div>
                  <div className="text-xl font-bold text-gray-900 mb-4">{formatCurrency(pkg.h * 30 * UNIT_PRICE)}</div>
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-200"
                    >
                      
                      <span>Áp dụng gói</span>
                    </Link>
                
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-sm text-gray-500">
              Lưu ý: Đây là chi phí tham khảo. Chi phí thực tế có thể thay đổi theo thỏa thuận giữa hai bên.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;


