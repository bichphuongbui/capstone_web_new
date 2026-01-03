import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const PendingApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Hồ sơ đang chờ xét duyệt</h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã gửi thông tin. Quản trị viên sẽ xem xét hồ sơ của bạn trong thời gian sớm nhất.
          </p>
          <p className="text-gray-600">
            Khi hồ sơ được duyệt, bạn sẽ nhận thông báo và có thể bắt đầu sử dụng đầy đủ tính năng của người chăm sóc.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PendingApprovalPage;


