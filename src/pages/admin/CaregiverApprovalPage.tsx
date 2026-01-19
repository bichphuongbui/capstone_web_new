import React, { useEffect, useState } from 'react';
import { getPendingVerificationCaregivers, PendingCaregiver, verifyQualification, verifyCaregiverProfile } from '../../services/admin.service';

const CaregiverApprovalPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [caregivers, setCaregivers] = useState<PendingCaregiver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCaregiver, setSelectedCaregiver] = useState<PendingCaregiver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingQualId, setProcessingQualId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingQualId, setRejectingQualId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmingQualId, setConfirmingQualId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showProfileRejectModal, setShowProfileRejectModal] = useState(false);
  const [profileRejectionReason, setProfileRejectionReason] = useState('');
  const [showProfileConfirmDialog, setShowProfileConfirmDialog] = useState(false);
  const [processingProfile, setProcessingProfile] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: 'success' as 'success' | 'error', message: '' });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type, message: '' });
    }, 3000);
  };

  const hideNotification = () => {
    setNotification({ show: false, type: 'success', message: '' });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingVerificationCaregivers();
      setCaregivers(response.data);
    } catch (e) {
      setError('Không thể tải danh sách người chăm sóc chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetail = (caregiver: PendingCaregiver) => {
    setSelectedCaregiver(caregiver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaregiver(null);
  };

  const handleApproveQualification = async (qualificationId: string) => {
    setConfirmingQualId(qualificationId);
    setShowConfirmDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!confirmingQualId) return;
    setShowConfirmDialog(false);
    
    setProcessingQualId(confirmingQualId);
    try {
      const response = await verifyQualification(confirmingQualId, 'APPROVE');
      // Update the caregiver data with the new response
      if (selectedCaregiver && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const updatedCaregiver = response.data[0];
        setSelectedCaregiver(updatedCaregiver);
        // Also update in the list
        setCaregivers(prev => prev.map(c => 
          c.caregiverProfileId === updatedCaregiver.caregiverProfileId ? updatedCaregiver : c
        ));
      }
      // Refresh the list from server
      await fetchData();
      setSuccessMessage('Duyệt chứng chỉ thành công!');
      setShowSuccessDialog(true);
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi duyệt chứng chỉ');
      setShowErrorDialog(true);
    } finally {
      setProcessingQualId(null);
      setConfirmingQualId(null);
    }
  };

  const handleRejectQualification = (qualificationId: string) => {
    setRejectingQualId(qualificationId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingQualId) return;
    if (!rejectionReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do từ chối');
      setShowErrorDialog(true);
      return;
    }

    setProcessingQualId(rejectingQualId);
    try {
      const response = await verifyQualification(rejectingQualId, 'REJECT', rejectionReason);
      // Update the caregiver data with the new response
      if (selectedCaregiver && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const updatedCaregiver = response.data[0];
        setSelectedCaregiver(updatedCaregiver);
        // Also update in the list
        setCaregivers(prev => prev.map(c => 
          c.caregiverProfileId === updatedCaregiver.caregiverProfileId ? updatedCaregiver : c
        ));
      }
      // Refresh the list from server
      await fetchData();
      setSuccessMessage('Từ chối chứng chỉ thành công!');
      setShowSuccessDialog(true);
      setShowRejectModal(false);
      setRejectingQualId(null);
      setRejectionReason('');
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi từ chối chứng chỉ');
      setShowErrorDialog(true);
    } finally {
      setProcessingQualId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Bị từ chối</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Không xác định</span>;
    }
  };

  const handleApproveProfile = () => {
    setShowProfileConfirmDialog(true);
  };

  const handleRejectProfile = () => {
    setProfileRejectionReason('');
    setShowProfileRejectModal(true);
  };

  const handleConfirmApproveProfile = async () => {
    if (!selectedCaregiver) return;
    setShowProfileConfirmDialog(false);
    setProcessingProfile(true);

    try {
      const response = await verifyCaregiverProfile(selectedCaregiver.caregiverProfileId, 'APPROVE');
      // Update the caregiver data
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const updatedCaregiver = response.data[0];
        setSelectedCaregiver(updatedCaregiver);
        setCaregivers(prev => prev.map(c => 
          c.caregiverProfileId === updatedCaregiver.caregiverProfileId ? updatedCaregiver : c
        ));
      }
      // Refresh the list from server
      await fetchData();
      setSuccessMessage('Duyệt hồ sơ người chăm sóc thành công!');
      setShowSuccessDialog(true);
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi duyệt hồ sơ');
      setShowErrorDialog(true);
    } finally {
      setProcessingProfile(false);
    }
  };

  const handleConfirmRejectProfile = async () => {
    if (!selectedCaregiver) return;
    if (!profileRejectionReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do từ chối');
      setShowErrorDialog(true);
      return;
    }

    setProcessingProfile(true);
    try {
      const response = await verifyCaregiverProfile(selectedCaregiver.caregiverProfileId, 'REJECT', profileRejectionReason);
      // Update the caregiver data
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const updatedCaregiver = response.data[0];
        setSelectedCaregiver(updatedCaregiver);
        setCaregivers(prev => prev.map(c => 
          c.caregiverProfileId === updatedCaregiver.caregiverProfileId ? updatedCaregiver : c
        ));
      }
      // Refresh the list from server
      await fetchData();
      setSuccessMessage('Từ chối hồ sơ người chăm sóc thành công!');
      setShowSuccessDialog(true);
      setShowProfileRejectModal(false);
      setProfileRejectionReason('');
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi từ chối hồ sơ');
      setShowErrorDialog(true);
    } finally {
      setProcessingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button onClick={() => fetchData()} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center gap-2 animate-slide-in`}>
          <span>{notification.message}</span>
          <button onClick={hideNotification} className="ml-4 font-bold">×</button>
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Duyệt Người Chăm Sóc</h1>
              <p className="mt-1 text-gray-600">Quản lý và duyệt hồ sơ đăng ký của người chăm sóc</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng hồ sơ</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{caregivers.length}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(112, 193, 241, 0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
                  <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {caregivers.filter(c => c.status === 'PENDING').length}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-amber-600">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cần xem chứng chỉ</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {caregivers.filter(c => c.isNeededReviewCertificate).length}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-red-600">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#70C1F1] focus:border-transparent"
          />
        </div>

      {caregivers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg mt-4">Chưa có người chăm sóc nào chờ duyệt</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {caregivers
            .filter(caregiver => {
              if (!searchKeyword) return true;
              const keyword = searchKeyword.toLowerCase();
              return (
                caregiver.fullName.toLowerCase().includes(keyword) ||
                caregiver.email.toLowerCase().includes(keyword) ||
                caregiver.phoneNumber?.toLowerCase().includes(keyword)
              );
            })
            .map(caregiver => (
            <div
              key={caregiver.caregiverProfileId}
              className="relative rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col group"
              onClick={() => handleViewDetail(caregiver)}
              style={{
                boxShadow: '0 2px 8px rgba(141, 179, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(141, 179, 255, 0.12)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(141, 179, 255, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(141, 179, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(141, 179, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(141, 179, 255, 0.12)';
              }}
            >
              {/* Header with Avatar */}
              <div className="relative px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #8DB3FF 0%, #6B9FFF 100%)' }}>
                {caregiver.isNeededReviewCertificate && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-amber-600">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] font-extrabold text-amber-700 tracking-wider">CẦN XEM</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  {caregiver.avatarUrl ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={caregiver.avatarUrl}
                        alt={caregiver.fullName}
                        className="h-[72px] w-[72px] rounded-2xl object-cover border-[3px] border-white shadow-xl"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-[3px] border-white shadow-sm"></div>
                    </div>
                  ) : (
                    <div className="h-[72px] w-[72px] rounded-2xl bg-white/20 backdrop-blur-sm border-[3px] border-white flex items-center justify-center shadow-xl flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-white">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold text-white truncate mb-1.5 tracking-tight">{caregiver.fullName}</h3>
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm">
                        <span className="text-xs font-bold text-white">{caregiver.age} tuổi</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm">
                        <span className="text-xs font-bold text-white">{caregiver.gender === 'MALE' ? 'Nam' : caregiver.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white px-5 py-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8DB3FF]/10 to-[#6B9FFF]/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "#8DB3FF" }}>
                        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 truncate">{caregiver.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8DB3FF]/10 to-[#6B9FFF]/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "#8DB3FF" }}>
                        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{caregiver.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="px-5">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>

              {/* Profile Info */}
              <div className="px-5 py-4 flex-1 bg-gradient-to-b from-white to-gray-50/30">
                <div className="space-y-3">
                  {caregiver.profileData.years_experience && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8DB3FF]/10 to-[#6B9FFF]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "#8DB3FF" }}>
                          <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                          <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">
                        <span className="font-bold text-gray-900">{caregiver.profileData.years_experience} năm</span> kinh nghiệm
                      </span>
                    </div>
                  )}
                  {caregiver.location.service_radius_km && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8DB3FF]/10 to-[#6B9FFF]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: "#8DB3FF" }}>
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">
                        Phục vụ <span className="font-bold text-gray-900">{caregiver.location.service_radius_km}km</span>
                      </span>
                    </div>
                  )}
                  {caregiver.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed pt-1 pl-12">{caregiver.bio}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-white flex items-center justify-between gap-3">
                <div className="flex-shrink-0">
                  {getStatusBadge(caregiver.status)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(caregiver);
                  }}
                  className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all duration-300 flex-shrink-0 shadow-md hover:shadow-lg transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #8DB3FF 0%, #6B9FFF 100%)',
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết */}
      {isModalOpen && selectedCaregiver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col overflow-hidden" style={{ height: '90vh' }}>
            {/* Header */}
            <div className="flex-shrink-0 px-8 py-5 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #8DB3FF 0%, #6B9FFF 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Thông tin chi tiết</h2>
                  <p className="text-xs text-white/90">Hồ sơ người chăm sóc</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Thông tin cơ bản */}
              <div className="bg-gradient-to-br from-[#8DB3FF]/5 to-[#6B9FFF]/5 rounded-2xl p-6 border border-[#8DB3FF]/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Thông tin cơ bản</h3>
                </div>
                <div className="flex items-start gap-6">
                  {selectedCaregiver.avatarUrl && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={selectedCaregiver.avatarUrl}
                        alt={selectedCaregiver.fullName}
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-xl border-4 border-white shadow-md"></div>
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Họ và tên</p>
                      <p className="font-bold text-gray-900">{selectedCaregiver.fullName}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-gray-800 text-sm truncate">{selectedCaregiver.email}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Số điện thoại</p>
                      <p className="font-bold text-gray-900">{selectedCaregiver.phoneNumber}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Ngày sinh</p>
                      <p className="font-semibold text-gray-800 text-sm">{new Date(selectedCaregiver.birthDate).toLocaleDateString('vi-VN')} ({selectedCaregiver.age} tuổi)</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Giới tính</p>
                      <p className="font-bold text-gray-900">
                        {selectedCaregiver.gender === 'MALE' ? 'Nam' : selectedCaregiver.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(selectedCaregiver.status)}</div>
                    </div>
                  </div>
                </div>
                {selectedCaregiver.bio && (
                  <div className="mt-5 bg-white/70 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Giới thiệu</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedCaregiver.bio}</p>
                  </div>
                )}
              </div>

              {/* Địa chỉ */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Địa chỉ</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">{selectedCaregiver.location.address}</p>
                  </div>
                  {selectedCaregiver.location.service_radius_km && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Bán kính phục vụ</p>
                      <p className="font-bold text-gray-900">{selectedCaregiver.location.service_radius_km} km</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin nghề nghiệp */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                      <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                      <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Thông tin nghề nghiệp</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedCaregiver.profileData.years_experience && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Số năm kinh nghiệm</p>
                      <p className="font-bold text-gray-900">{selectedCaregiver.profileData.years_experience} năm</p>
                    </div>
                  )}
                  {selectedCaregiver.profileData.experience && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Kinh nghiệm</p>
                      <p className="font-semibold text-gray-800">{selectedCaregiver.profileData.experience}</p>
                    </div>
                  )}
                  {selectedCaregiver.profileData.max_hours_per_week && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Số giờ tối đa/tuần</p>
                      <p className="font-bold text-gray-900">{selectedCaregiver.profileData.max_hours_per_week} giờ</p>
                    </div>
                  )}
                  {selectedCaregiver.profileData.certifications && selectedCaregiver.profileData.certifications.length > 0 && (
                    <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Chứng chỉ</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCaregiver.profileData.certifications.map((cert, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCaregiver.profileData.specializations && selectedCaregiver.profileData.specializations.length > 0 && (
                    <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Chuyên môn</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCaregiver.profileData.specializations.map((spec, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CCCD/Căn cước công dân */}
              {(selectedCaregiver.profileData.citizen_id || selectedCaregiver.profileData.citizen_id_front_image_url || selectedCaregiver.profileData.citizen_id_back_image_url) && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                        <path fillRule="evenodd" d="M1 6a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H4a3 3 0 01-3-3V6zm4 1.5a2 2 0 114 0 2 2 0 01-4 0zm2 3a4 4 0 00-3.665 2.395.75.75 0 00.416 1A8.98 8.98 0 007 14c1.347 0 2.632-.296 3.78-.831a.75.75 0 00.415-1.003A4.001 4.001 0 007 10.5zm5-3.75a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zm0 6.5a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zm.75-4a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Căn cước công dân</h3>
                  </div>
                  {selectedCaregiver.profileData.citizen_id && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Số CCCD</p>
                      <p className="font-bold text-gray-900">{selectedCaregiver.profileData.citizen_id}</p>
                    </div>
                  )}
                  {(selectedCaregiver.profileData.citizen_id_front_image_url || selectedCaregiver.profileData.citizen_id_back_image_url) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCaregiver.profileData.citizen_id_front_image_url && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Mặt trước</p>
                          <a 
                            href={selectedCaregiver.profileData.citizen_id_front_image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block relative group"
                          >
                            <img 
                              src={selectedCaregiver.profileData.citizen_id_front_image_url} 
                              alt="CCCD mặt trước" 
                              className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 hover:border-[#8DB3FF] transition-all duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </a>
                        </div>
                      )}
                      {selectedCaregiver.profileData.citizen_id_back_image_url && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Mặt sau</p>
                          <a 
                            href={selectedCaregiver.profileData.citizen_id_back_image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block relative group"
                          >
                            <img 
                              src={selectedCaregiver.profileData.citizen_id_back_image_url} 
                              alt="CCCD mặt sau" 
                              className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 hover:border-[#8DB3FF] transition-all duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sở thích người cao tuổi */}
              {selectedCaregiver.profileData.preferences && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sở thích chăm sóc</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCaregiver.profileData.preferences.elderly_age_preference && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Độ tuổi ưa thích</p>
                        <p className="font-bold text-gray-900">
                          {selectedCaregiver.profileData.preferences.elderly_age_preference.min_age} - {selectedCaregiver.profileData.preferences.elderly_age_preference.max_age} tuổi
                        </p>
                      </div>
                    )}
                    {selectedCaregiver.profileData.preferences.preferred_health_status && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Tình trạng sức khỏe</p>
                        <p className="font-semibold text-gray-800">{selectedCaregiver.profileData.preferences.preferred_health_status}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lịch trống */}
              {selectedCaregiver.profileData.free_schedule && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                        <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM10 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H10zM9.25 14a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V14zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12zM11.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75V12zM12 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H12zM13.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H14a.75.75 0 01-.75-.75V10zM14 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H14z" />
                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Lịch làm việc</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
                    <p className="font-bold text-gray-900">
                      {selectedCaregiver.profileData.free_schedule.available_all_time ? 'Có thể làm việc mọi lúc' : 'Có lịch cụ thể'}
                    </p>
                  </div>
                  {selectedCaregiver.profileData.free_schedule.booked_slots && selectedCaregiver.profileData.free_schedule.booked_slots.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Các khung giờ đã đặt</p>
                      <div className="space-y-2">
                        {selectedCaregiver.profileData.free_schedule.booked_slots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-[#8DB3FF]/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#8DB3FF]"></div>
                            <span className="font-semibold text-gray-900 text-sm">{slot.date}</span>
                            <span className="text-gray-600 text-sm">{slot.start_time} - {slot.end_time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bằng cấp chứng chỉ */}
              {selectedCaregiver.qualifications && selectedCaregiver.qualifications.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Bằng cấp & Chứng chỉ</h3>
                    </div>
                    {selectedCaregiver.isNeededReviewCertificate && (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Cần xem xét
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {selectedCaregiver.qualifications.map((qual) => (
                      <div key={qual.qualificationId} className="bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#8DB3FF]">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">{qual.qualificationTypeName}</h4>
                              {qual.status === 'PENDING' && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 rounded-lg text-xs font-semibold shadow-sm mt-1">
                                  Chờ duyệt
                                </span>
                              )}
                              {qual.status === 'APPROVED' && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-green-400 to-emerald-400 text-green-900 rounded-lg text-xs font-semibold shadow-sm mt-1">
                                  ✓ Đã duyệt
                                </span>
                              )}
                              {qual.status === 'REJECTED' && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-red-400 to-rose-400 text-red-900 rounded-lg text-xs font-semibold shadow-sm mt-1">
                                  ✕ Bị từ chối
                                </span>
                              )}
                            </div>
                          </div>
                          {qual.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveQualification(qual.qualificationId)}
                                disabled={processingQualId === qual.qualificationId}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                              >
                                {processingQualId === qual.qualificationId ? 'Đang xử lý...' : 'Duyệt'}
                              </button>
                              <button
                                onClick={() => handleRejectQualification(qual.qualificationId)}
                                disabled={processingQualId === qual.qualificationId}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Số chứng chỉ</p>
                          <p className="font-semibold text-gray-900">{qual.certificateNumber}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Tổ chức cấp</p>
                            <p className="font-semibold text-gray-900 text-sm">{qual.issuingOrganization}</p>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Ngày cấp</p>
                            <p className="font-semibold text-gray-900 text-sm">{new Date(qual.issueDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Ngày hết hạn</p>
                            <p className="font-semibold text-gray-900 text-sm">{new Date(qual.expiryDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          {qual.isVerified && (
                            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">Xác thực</p>
                              <p className="font-semibold text-green-600 text-sm flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                                Đã xác thực
                              </p>
                            </div>
                          )}
                        </div>
                        {qual.notes && (
                          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Ghi chú</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{qual.notes}</p>
                          </div>
                        )}
                        {qual.certificateUrl && (
                          <div>
                            <a
                              href={qual.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8DB3FF] to-[#6B9FFF] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm font-semibold"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
                              </svg>
                              Xem chứng chỉ
                            </a>
                          </div>
                        )}
                        {qual.rejectionReason && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
                            <p className="text-sm text-red-800 flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                              </svg>
                              <span><strong className="font-bold">Lý do từ chối:</strong> {qual.rejectionReason}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 px-8 py-5 flex justify-end gap-3 border-t border-gray-100 bg-white">
              {selectedCaregiver && selectedCaregiver.status === 'PENDING' && (
                <>
                  <button
                    onClick={handleApproveProfile}
                    disabled={processingProfile}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                  >
                    {processingProfile ? 'Đang xử lý...' : 'Duyệt hồ sơ'}
                  </button>
                  <button
                    onClick={handleRejectProfile}
                    disabled={processingProfile}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                  >
                    Từ chối hồ sơ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Lý do từ chối chứng chỉ</h3>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingQualId(null);
                  setRejectionReason('');
                }}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Rejection Modal */}
      {showProfileRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Lý do từ chối hồ sơ</h3>
            </div>
            <textarea
              value={profileRejectionReason}
              onChange={(e) => setProfileRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối hồ sơ..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowProfileRejectModal(false);
                  setProfileRejectionReason('');
                }}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRejectProfile}
                disabled={!profileRejectionReason.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận duyệt chứng chỉ</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">Bạn có chắc chắn muốn duyệt chứng chỉ này?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmingQualId(null);
                }}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 bg-gradient-to-r from-[#8DB3FF] to-[#6B9FFF] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Confirm Approve Dialog */}
      {showProfileConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8DB3FF] to-[#6B9FFF] flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận duyệt hồ sơ</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">Bạn có chắc chắn muốn duyệt hồ sơ người chăm sóc này?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowProfileConfirmDialog(false)}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApproveProfile}
                className="px-5 py-2.5 bg-gradient-to-r from-[#8DB3FF] to-[#6B9FFF] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Thành công</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{successMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessDialog(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Lỗi</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorDialog(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #8DB3FF;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B9FFF;
        }
      `}</style>
      </div>
    </div>
  );
};

export default CaregiverApprovalPage;
