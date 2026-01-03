import React, { useEffect, useMemo, useState } from 'react';
import { getPendingCertificates, getCertificateDetail, reviewCertificate, Certificate } from '../../services/admin.service';
import Notification from '../../components/Notification';
import ConfirmDialog from '../../components/ConfirmDialog';

const CertificateApprovalPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [preview, setPreview] = useState<Certificate | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingCertId, setRejectingCertId] = useState<string | null>(null);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingCertificates({
        page,
        limit: itemsPerPage,
      });
      
      console.log('📥 Certificates data:', response);
      
      setCertificates(response.certificates || []);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (e) {
      console.error('Error fetching certificates:', e);
      setError('Không thể tải danh sách chứng chỉ đang chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(currentPage); 
  }, [currentPage]);

  const loadCertificateDetail = async (cert: Certificate) => {
    setPreview(cert); // Hiện modal ngay
    setLoadingDetail(true);
    try {
      const detail = await getCertificateDetail(cert._id);
      setPreview(detail); // Update với data đầy đủ
    } catch (e) {
      console.error('Error loading certificate detail:', e);
      // Vẫn giữ modal mở với data cũ
    } finally {
      setLoadingDetail(false);
    }
  };

  const pendingItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return certificates;
    }
    
    const term = searchTerm.toLowerCase();
    return certificates.filter(cert => {
      const userName = cert.caregiver?.name?.toLowerCase() || cert.userName?.toLowerCase() || '';
      const userEmail = cert.caregiver?.email?.toLowerCase() || cert.userEmail?.toLowerCase() || '';
      const certName = (cert.name || cert.certificateName || '').toLowerCase();
      const certType = cert.certificateType?.toLowerCase() || '';
      const organization = cert.issuingOrganization?.toLowerCase() || '';
      
      return userName.includes(term) ||
             userEmail.includes(term) ||
             certName.includes(term) ||
             certType.includes(term) ||
             organization.includes(term);
    });
  }, [certificates, searchTerm]);

  const updateCertificateStatus = async (
    certId: string,
    status: 'approved' | 'rejected',
    adminNote?: string
  ) => {
    try {
      setProcessing(certId);
      
      // Gọi API review certificate
      await reviewCertificate(certId, {
        status,
        rejectionReason: status === 'rejected' ? adminNote : undefined
      });
      
      setNotification({
        show: true,
        type: 'success',
        message: `${status === 'approved' ? 'Duyệt' : 'Từ chối'} chứng chỉ thành công!`
      });
      
      await fetchData(currentPage);
    } catch (e: any) {
      console.error('Update certificate status failed:', e);
      setNotification({
        show: true,
        type: 'error',
        message: `Không thể cập nhật trạng thái chứng chỉ: ${e?.response?.data?.message || e?.message || 'Lỗi không xác định'}`
      });
    } finally {
      setProcessing(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7CA4FF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách chứng chỉ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => fetchData(currentPage)}
            className="mt-4 px-6 py-2 bg-[#7CA4FF] text-white rounded-lg hover:bg-[#6B94EF] transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Duyệt chứng chỉ người chăm sóc</h1>
          <p className="text-gray-600">Quản lý và phê duyệt chứng chỉ của các người chăm sóc</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, chứng chỉ, loại hoặc tổ chức..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CA4FF] focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              Tìm thấy <span className="font-semibold text-[#7CA4FF]">{pendingItems.length}</span> kết quả
            </p>
          )}
        </div>

        {pendingItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">Không có chứng chỉ nào đang chờ duyệt.</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người chăm sóc</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chứng chỉ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingItems.map((cert) => (
                      <tr key={cert._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cert.caregiver?.name || cert.userName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{cert.caregiver?.email || cert.userEmail || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{cert.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{cert.issuingOrganization}</div>
                          <div className="text-xs text-gray-400">
                            Ngày cấp: {new Date(cert.issueDate).toLocaleDateString('vi-VN')}
                            {(cert.expiryDate || cert.expirationDate) && ` • Hết hạn: ${new Date(cert.expirationDate || cert.expiryDate!).toLocaleDateString('vi-VN')}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(cert.certificateUrl || cert.certificateImage) ? (
                            <img
                              src={cert.certificateUrl || cert.certificateImage}
                              alt="certificate"
                              className="h-16 w-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 shadow-sm"
                              onClick={() => loadCertificateDetail(cert)}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(cert.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {cert.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => updateCertificateStatus(cert._id, 'approved')}
                                disabled={processing === cert._id}
                                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                              >
                                ✓ Duyệt
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingCertId(cert._id);
                                  setRejectionReason('');
                                  setShowRejectionModal(true);
                                }}
                                disabled={processing === cert._id}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                              >
                                ✕ Từ chối
                              </button>
                            </>
                          ) : (
                            <span className={`px-4 py-2 rounded-lg font-semibold ${
                              cert.status === 'approved' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {cert.status === 'approved' ? '✓ Đã duyệt' : '✕ Đã từ chối'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, total)}</span> trong tổng số{' '}
                  <span className="font-medium">{total}</span> chứng chỉ
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === index + 1
                          ? 'bg-[#7CA4FF] text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Preview Modal */}
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setPreview(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[98vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#7CA4FF] to-[#6B94EF] px-8 py-6 text-white">
                <button 
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors" 
                  onClick={() => setPreview(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
                <h2 className="text-2xl font-bold mb-2">{preview.name || 'N/A'}</h2>
                <p className="text-white/90 text-sm">{preview.issuingOrganization}</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{preview.caregiver?.name || preview.userName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{preview.caregiver?.email || preview.userEmail}</span>
                  </div>
                  {preview.caregiverProfile?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{preview.caregiverProfile.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto max-h-[calc(98vh-180px)]">
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ảnh chứng chỉ</h3>
                      <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center min-h-[500px] max-h-[700px] border-2 border-gray-200">
                        {(preview.certificateUrl || preview.certificateImage) ? (
                          <img 
                            src={preview.certificateUrl || preview.certificateImage} 
                            alt="certificate" 
                            className="max-h-[650px] max-w-full w-auto rounded-lg shadow-xl object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-400">Không có ảnh</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Section */}
                    {loadingDetail ? (
                      <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#7CA4FF] border-t-transparent mx-auto mb-4"></div>
                          <p className="text-gray-600 font-medium">Đang tải thông tin chi tiết...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Thông tin chi tiết</h3>
                          <div className="flex items-center gap-3">
                            {preview.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => setShowConfirmApprove(true)}
                                  disabled={processing === preview._id}
                                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => setShowRejectionModal(true)}
                                  disabled={processing === preview._id}
                                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Từ chối
                                </button>
                              </>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-2 ${
                                preview.status === 'approved' 
                                  ? 'bg-green-100 text-green-700 border border-green-300' 
                                  : 'bg-red-100 text-red-700 border border-red-300'
                              }`}>
                              {preview.status === 'approved' ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Đã duyệt
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Đã từ chối
                                </>
                              )}
                            </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Certificate Info */}
                        <div className="bg-blue-50 rounded-xl p-5 space-y-4 border border-blue-100">
                          <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Chứng chỉ</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tổ chức cấp</p>
                              <p className="text-sm font-medium text-gray-900">{preview.issuingOrganization}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Loại chứng chỉ</p>
                              <p className="text-sm font-medium text-gray-900">{preview.certificateType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ngày cấp</p>
                              <p className="text-sm font-medium text-gray-900">{new Date(preview.issueDate).toLocaleDateString('vi-VN')}</p>
                            </div>
                            {(preview.expiryDate || preview.expirationDate) && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Ngày hết hạn</p>
                                <p className="text-sm font-medium text-gray-900">{new Date(preview.expirationDate || preview.expiryDate!).toLocaleDateString('vi-VN')}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ngày nộp</p>
                              <p className="text-sm font-medium text-gray-900">{new Date(preview.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Review Info */}
                        {preview.reviewedBy && (
                          <div className="bg-green-50 rounded-xl p-5 space-y-3 border border-green-100">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Thông tin duyệt</h4>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Người duyệt</p>
                              <p className="text-sm font-medium text-gray-900">{preview.reviewedBy.name}</p>
                              <p className="text-xs text-gray-500">{preview.reviewedBy.email}</p>
                            </div>
                            {preview.reviewedAt && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Ngày duyệt</p>
                                <p className="text-sm font-medium text-gray-900">{new Date(preview.reviewedAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {preview.rejectionReason && (
                          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                            <h4 className="font-semibold text-red-900 text-sm uppercase tracking-wide mb-2">Lý do từ chối</h4>
                            <p className="text-sm text-red-800">{preview.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setShowRejectionModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">Lý do từ chối</h3>
                <p className="text-red-100 text-sm mt-1">Vui lòng nhập lý do từ chối chứng chỉ này</p>
              </div>
              <div className="p-6">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (tùy chọn)..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none resize-none"
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (preview) {
                      updateCertificateStatus(preview._id, 'rejected', rejectionReason || undefined);
                      setPreview(null);
                      setShowRejectionModal(false);
                      setRejectionReason('');
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold shadow-lg"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Approve Dialog */}
        {showConfirmApprove && preview && (
          <ConfirmDialog
            type="info"
            title="Xác nhận duyệt chứng chỉ"
            message={`Bạn có chắc chắn muốn duyệt chứng chỉ "${preview.name}" của ${preview.caregiver?.name || 'người chăm sóc này'} không?`}
            confirmText="Duyệt"
            cancelText="Hủy"
            onConfirm={() => {
              updateCertificateStatus(preview._id, 'approved');
              setPreview(null);
              setShowConfirmApprove(false);
            }}
            onCancel={() => setShowConfirmApprove(false)}
          />
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Từ chối chứng chỉ</h3>
                  <p className="text-gray-600 text-sm">Vui lòng nhập lý do từ chối để caregiver có thể sửa lại</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do từ chối <span className="text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all resize-none"
                  rows={4}
                  placeholder="VD: Chứng chỉ không rõ ràng, vui lòng chụp lại..."
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Mẹo: Chi tiết càng rõ, caregiver càng dễ sửa chữa
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setRejectingCertId(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (rejectingCertId) {
                      updateCertificateStatus(rejectingCertId, 'rejected', rejectionReason.trim() || undefined);
                    }
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setRejectingCertId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transition-all"
                >
                  Từ chối
                </button>
              </div>
            </div>
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
      </div>
    </div>
  );
};

export default CertificateApprovalPage;


