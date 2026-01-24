import React, { useState } from 'react';
import logoImage from '../../assets/logo.jpg';

// Header component với navigation menu responsive
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Danh sách các mục navigation
  const navigationItems = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Giới thiệu', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Bảng giá', href: '/pricing' },
    { name: 'Câu hỏi thường gặp', href: '/faq' },
    { name: 'Liên hệ', href: '/contact' }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo góc trái */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img 
                src={logoImage} 
                alt="AI Elderly Care" 
                className="h-10 w-auto"
              />
            </a>
          </div>

          {/* Navigation menu - Desktop */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </nav>

          {/* Auth buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/login"
              className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg transition-all duration-200"
            >
              Đăng nhập
            </a>
          </div>

          {/* Hamburger menu button - Mobile */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <svg
                className={`h-6 w-6 transform transition-transform duration-300 ${
                  isMobileMenuOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'max-h-96 opacity-100 visible'
            : 'max-h-0 opacity-0 invisible'
        } overflow-hidden bg-white border-t border-gray-200`}
      >
        <div className="px-4 pt-2 pb-3 space-y-1">
          {/* Navigation items - Mobile */}
          {navigationItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="block px-3 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </a>
          ))}
          
          {/* Auth buttons - Mobile */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <a
              href="/login"
              className="block mx-3 py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 border border-gray-300 rounded-lg text-base font-medium text-center transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Đăng nhập
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
