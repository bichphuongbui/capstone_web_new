import React, { useEffect, useState } from 'react';
import { getWalletOverview, WalletStats, CaregiverWallet, resetAllBalances } from '../../services/wallet.service';
import Notification from '../../components/Notification';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as XLSX from 'xlsx';

const AdminCaregiverWalletPage: React.FC = () => {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [wallets, setWallets] = useState<CaregiverWallet[]>([]);
  const [platformFee, setPlatformFee] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: 'success' as 'success' | 'error', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'earnings'>('balance');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await getWalletOverview();
      if (response.success) {
        setStats(response.data.stats);
        setWallets(response.data.wallets);
        setPlatformFee(response.data.platformFeePercentage);
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Không thể tải dữ liệu ví');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ ...notification, show: false }), 3000);
  };

  const exportToExcel = () => {
    if (filteredAndSortedWallets.length === 0) {
      showNotification('error', 'Không có dữ liệu để xuất');
      return;
    }

    const exportData = filteredAndSortedWallets.map((wallet, index) => ({
      'STT': index + 1,
      'Tên Caregiver': wallet.caregiver.name,
      'Email': wallet.caregiver.email,
      'Số điện thoại': wallet.caregiver.phone,
      'Số dư khả dụng (VNĐ)': wallet.availableBalance,
      'Tổng thu nhập (VNĐ)': wallet.totalEarnings,
      'Phí nền tảng (VNĐ)': wallet.totalPlatformFees,
      'Đang chờ (VNĐ)': wallet.pendingAmount,
      'Số giao dịch': wallet.transactions.length,
      'Cập nhật lần cuối': formatDate(wallet.lastUpdated)
    }));

    // Tạo worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Tự động điều chỉnh độ rộng cột
    const maxWidth = exportData.reduce((w, r) => Math.max(w, r['Tên Caregiver'].length), 10);
    worksheet['!cols'] = [
      { wch: 5 },   // STT
      { wch: Math.min(maxWidth + 2, 30) },  // Tên
      { wch: 35 },  // Email
      { wch: 15 },  // SĐT
      { wch: 20 },  // Số dư
      { wch: 20 },  // Thu nhập
      { wch: 20 },  // Phí
      { wch: 20 },  // Đang chờ
      { wch: 12 },  // Số GD
      { wch: 20 }   // Ngày
    ];

    // Thêm dòng tổng kết ở cuối
    const summaryRow = {
      'STT': '',
      'Tên Caregiver': 'TỔNG CỘNG',
      'Email': '',
      'Số điện thoại': '',
      'Số dư khả dụng (VNĐ)': filteredAndSortedWallets.reduce((sum, w) => sum + w.availableBalance, 0),
      'Tổng thu nhập (VNĐ)': filteredAndSortedWallets.reduce((sum, w) => sum + w.totalEarnings, 0),
      'Phí nền tảng (VNĐ)': filteredAndSortedWallets.reduce((sum, w) => sum + w.totalPlatformFees, 0),
      'Đang chờ (VNĐ)': filteredAndSortedWallets.reduce((sum, w) => sum + w.pendingAmount, 0),
      'Số giao dịch': filteredAndSortedWallets.reduce((sum, w) => sum + w.transactions.length, 0),
      'Cập nhật lần cuối': ''
    };
    XLSX.utils.sheet_add_json(worksheet, [summaryRow], { skipHeader: true, origin: -1 });

    // Tạo workbook và xuất file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thu nhập Caregiver');
    
    const fileName = `Bao_cao_thu_nhap_caregiver_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showNotification('success', `Đã xuất báo cáo ${filteredAndSortedWallets.length} caregiver`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResetAllSalaries = async () => {
    if (wallets.length === 0) {
      showNotification('error', 'Không có caregiver nào để reset');
      return;
    }
    
    setConfirmAction(() => async () => {
      try {
        setLoading(true);
        const response = await resetAllBalances();
        
        if (response.success) {
          showNotification('success', response.message || `Đã reset lương cho ${response.data.modifiedCount} caregiver`);
          // Reload data to reflect changes
          await loadWalletData();
        } else {
          showNotification('error', 'Không thể reset lương. Vui lòng thử lại!');
        }
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Lỗi khi reset lương. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const filteredAndSortedWallets = wallets
    .filter(wallet => 
      wallet.caregiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.caregiver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.caregiver.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.caregiver.name.localeCompare(b.caregiver.name);
        case 'balance':
          return b.availableBalance - a.availableBalance;
        case 'earnings':
          return b.totalEarnings - a.totalEarnings;
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedWallets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredWallets = filteredAndSortedWallets.slice(startIndex, endIndex);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto mb-4" style={{ borderTopColor: '#70C1F1' }}></div>
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thu nhập Caregiver</h1>
            <p className="text-gray-600">Theo dõi và quản lý ví thu nhập của tất cả caregiver</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetAllSalaries}
              disabled={loading || wallets.length === 0}
              className="inline-flex items-center px-4 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ backgroundColor: '#ef4444' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#dc2626')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#ef4444')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              Reset lương tất cả
            </button>
            <button
              onClick={exportToExcel}
              disabled={loading || filteredAndSortedWallets.length === 0}
              className="inline-flex items-center px-4 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ backgroundColor: '#6366f1' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4f46e5')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#6366f1')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              Xuất Excel
            </button>
            <button
              onClick={loadWalletData}
              className="inline-flex items-center px-4 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#7CBCFF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5AA5FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CBCFF'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7CBCFF' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng Caregiver</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCaregivers}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng Thu nhập</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7CBCFF' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Số dư Khả dụng</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAvailableBalance)}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Đang Chờ</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalPendingAmount)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Phí Nền tảng</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalPlatformFees)}</p>
              <p className="text-xs text-gray-500 mt-1">{platformFee}% mỗi giao dịch</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
            >
              <option value="balance">Số dư khả dụng</option>
              <option value="earnings">Tổng thu nhập</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200" style={{ borderTopColor: '#7CBCFF' }}></div>
        </div>
      )}

      {/* Wallets Grid */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-100" style={{ backgroundColor: '#7CBCFF20' }}>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Caregiver</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Liên hệ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Số dư Khả dụng</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Tổng Thu nhập</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Phí Nền tảng</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Đang Chờ</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Giao dịch</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWallets.length > 0 ? (
                  filteredWallets.map((wallet) => (
                    <tr key={wallet._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#7CBCFF' }}>
                            {wallet.caregiver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{wallet.caregiver.name}</div>
                            <div className="text-xs text-gray-500">ID: {wallet.caregiver._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{wallet.caregiver.email}</div>
                        <div className="text-xs text-gray-500">{wallet.caregiver.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-green-600">{formatCurrency(wallet.availableBalance)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold" style={{ color: '#7CBCFF' }}>{formatCurrency(wallet.totalEarnings)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-gray-600">{formatCurrency(wallet.totalPlatformFees)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-amber-600 font-medium">{formatCurrency(wallet.pendingAmount)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-gray-700 font-semibold text-sm">
                          {wallet.transactions.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs text-gray-500">{formatDate(wallet.lastUpdated)}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7CBCFF20' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10" style={{ color: '#7CBCFF' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-lg font-medium">Không tìm thấy caregiver nào</p>
                      <p className="text-gray-500 text-sm mt-1">Thử thay đổi bộ lọc tìm kiếm</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredAndSortedWallets.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}</span> đến <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredAndSortedWallets.length)}</span> trên tổng số <span className="font-semibold text-gray-900">{filteredAndSortedWallets.length}</span> caregiver
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium transition-all hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  style={{ color: currentPage === 1 ? '#9ca3af' : '#7CBCFF' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
                {pageNumbers.map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(Number(pageNum))}
                      className="px-4 py-2 rounded-xl border font-medium transition-all hover:shadow-md"
                      style={{
                        borderColor: currentPage === pageNum ? '#7CBCFF' : '#e5e7eb',
                        backgroundColor: currentPage === pageNum ? '#7CBCFF' : 'white',
                        color: currentPage === pageNum ? 'white' : '#4b5563'
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium transition-all hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  style={{ color: currentPage === totalPages ? '#9ca3af' : '#7CBCFF' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          title="Xác nhận Reset Lương"
          message={`Bạn có chắc muốn RESET LƯƠNG cho tất cả ${wallets.length} caregiver? Hành động này KHÔNG THỂ HOÀN TÁC!`}
          confirmText="OK"
          cancelText="Hủy"
          type="danger"
          onConfirm={() => {
            setShowConfirmDialog(false);
            if (confirmAction) confirmAction();
          }}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminCaregiverWalletPage;
