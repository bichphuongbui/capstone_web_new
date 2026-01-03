import React from 'react';
import Header from '../components/layout/Header';
import HeroSection from '../components/home/HeroSection';
import Introduction from '../components/home/Introduction';
import Features from '../components/home/Features';
import BlogPreview from '../components/home/BlogPreview';
import Pricing from '../components/home/Pricing';
import FAQ from '../components/home/FAQ';
import Footer from '../components/layout/Footer';

// Trang chủ tổng hợp tất cả các sections
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header - Navigation menu */}
      <Header />
      
      {/* Hero Section - Phần đầu trang với tiêu đề chính */}
      <HeroSection />
      
      {/* Introduction - Giới thiệu về hệ thống */}
      <Introduction />
      
      {/* Features - Các tính năng chính */}
      <Features />
      
      {/* Blog Preview - Hiển thị các bài blog mới */}
      <BlogPreview />
      
      {/* Pricing - Bảng giá các gói dịch vụ */}
      <Pricing />
      
      {/* FAQ - Câu hỏi thường gặp */}
      <FAQ />
      
      {/* Footer - Thông tin liên hệ và footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
