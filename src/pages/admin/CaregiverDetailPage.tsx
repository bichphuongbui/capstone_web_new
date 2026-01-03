import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCaregiverProfileDetail, updateCaregiverProfileStatus } from '../../services/admin.service';
import ConfirmDialog from '../../components/ConfirmDialog';
import Notification from '../../components/Notification';

interface CaregiverDetail {
  user?: {
    name: string;
    email: string;
  };
  profileImage?: string;
  profileStatus?: 'pending' | 'approved' | 'rejected';
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  permanentAddress: string;
  temporaryAddress: string;
  idCardNumber: string;
  idCardFrontImage?: string;
  idCardBackImage?: string;
  yearsOfExperience: number;
  workHistory: string;
  education: string;
  bio: string;
  agreeToEthics: boolean;
  agreeToTerms: boolean;
  certificates: {
    name: string;
    issueDate: string;
    expirationDate?: string;
    issuingOrganization: string;
    certificateType: string;
    certificateImage?: string;
  }[];
}

const CaregiverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caregiver, setCaregiver] = useState<CaregiverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<{
    name: string;
    issueDate: string;
    expirationDate?: string;
    issuingOrganization: string;
    certificateType: string;
    certificateImage?: string;
  } | null>(null);
  const [selectedIdCardImage, setSelectedIdCardImage] = useState<{
    type: 'front' | 'back';
    url: string;
  } | null>(null);
  
  // State for approval/rejection
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchCaregiver = async () => {
      if (!id) {
        setError('ID người chăm sóc không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        const response = await getCaregiverProfileDetail(id);
        if (response.success && response.data) {
          setCaregiver(response.data);
        } else {
          setError('Không thể tải thông tin người chăm sóc');
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người chăm sóc:', error);
        setError('Không thể tải thông tin người chăm sóc');
      } finally {
        setLoading(false);
      }
    };

    fetchCaregiver();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    
    setProcessing(true);
    try {
      const response = await updateCaregiverProfileStatus(id, 'approved');
      if (response.success) {
        setNotification({
          show: true,
          type: 'success',
          message: 'Đã phê duyệt hồ sơ người chăm sóc thành công!'
        });
        setTimeout(() => {
          navigate('/admin/caregiver-approval');
        }, 2000);
      }
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể phê duyệt hồ sơ. Vui lòng thử lại!'
      });
    } finally {
      setProcessing(false);
      setShowApprovalDialog(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Vui lòng nhập lý do từ chối!'
      });
      return;
    }
    
    setProcessing(true);
    try {
      const response = await updateCaregiverProfileStatus(id, 'rejected', rejectionReason);
      if (response.success) {
        setNotification({
          show: true,
          type: 'success',
          message: 'Đã từ chối hồ sơ người chăm sóc!'
        });
        setTimeout(() => {
          navigate('/admin/caregiver-approval');
        }, 2000);
      }
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể từ chối hồ sơ. Vui lòng thử lại!'
      });
    } finally {
      setProcessing(false);
      setShowRejectionModal(false);
      setRejectionReason('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CA4FF]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/caregiver-approval')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không tìm thấy thông tin người chăm sóc</p>
        </div>
        <button
          onClick={() => navigate('/admin/caregiver-approval')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/caregiver-approval')}
            className="mb-4 px-4 py-2 text-gray-600 hover:text-[#70C1F1] transition-colors flex items-center gap-2 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Quay lại</span>
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {caregiver.profileImage ? (
                  <img
                    src={caregiver.profileImage}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-[#70C1F1]"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-[#70C1F1] to-[#5AB0E0] rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{caregiver.user?.name || 'Người chăm sóc'}</h1>
                  <p className="text-gray-500 mt-1">{caregiver.user?.email || 'Thông tin chi tiết và chứng chỉ nghề nghiệp'}</p>
                </div>
              </div>
              
              {/* Action Buttons - Only show for pending profiles */}
              {caregiver.profileStatus === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectionModal(true)}
                    disabled={processing}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Từ chối
                  </button>
                  <button
                    onClick={() => setShowApprovalDialog(true)}
                    disabled={processing}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Phê duyệt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cá nhân */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-[#70C1F1] to-[#5AB0E0] px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Số điện thoại</p>
                      <p className="text-gray-900 font-semibold">{caregiver.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Ngày sinh</p>
                      <p className="text-gray-900 font-semibold">{new Date(caregiver.dateOfBirth).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Giới tính</p>
                      <p className="text-gray-900 font-semibold">{caregiver.gender === 'Nam' ? 'Nam' : 'Nữ'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Số CMND/CCCD</p>
                      <p className="text-gray-900 font-semibold">{caregiver.idCardNumber}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Địa chỉ thường trú</p>
                      <p className="text-gray-900 font-semibold">{caregiver.permanentAddress}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Địa chỉ tạm trú</p>
                      <p className="text-gray-900 font-semibold">{caregiver.temporaryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hình ảnh CCCD */}
            {(caregiver.idCardFrontImage || caregiver.idCardBackImage) && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <h2 className="text-xl font-bold">Căn cước công dân</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caregiver.idCardFrontImage && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <p className="font-semibold text-gray-900">Mặt trước</p>
                        </div>
                        <div className="relative group cursor-pointer" onClick={() => setSelectedIdCardImage({ type: 'front', url: caregiver.idCardFrontImage! })}>
                          <img 
                            src={caregiver.idCardFrontImage} 
                            alt="CCCD mặt trước"
                            className="w-full h-64 object-cover rounded-xl border-2 border-gray-200 shadow-md transition-transform group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-4">
                            <p className="text-white text-sm font-medium">Click để xem chi tiết</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {caregiver.idCardBackImage && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <p className="font-semibold text-gray-900">Mặt sau</p>
                        </div>
                        <div className="relative group cursor-pointer" onClick={() => setSelectedIdCardImage({ type: 'back', url: caregiver.idCardBackImage! })}>
                          <img 
                            src={caregiver.idCardBackImage} 
                            alt="CCCD mặt sau"
                            className="w-full h-64 object-cover rounded-xl border-2 border-gray-200 shadow-md transition-transform group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-4">
                            <p className="text-white text-sm font-medium">Click để xem chi tiết</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin nghề nghiệp */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-xl font-bold">Thông tin nghề nghiệp</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kinh nghiệm làm việc</p>
                    <p className="text-2xl font-bold text-gray-900">{caregiver.yearsOfExperience} <span className="text-base font-normal text-gray-600">năm</span></p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Lịch sử công việc</p>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{caregiver.workHistory}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2"> Học vấn</p>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{caregiver.education}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2"> Giới thiệu bản thân</p>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{caregiver.bio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Chứng chỉ */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <h2 className="text-xl font-bold">Chứng chỉ</h2>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">{caregiver.certificates?.length || 0}</span>
                </div>
              </div>
              <div className="p-6">
                {caregiver.certificates && caregiver.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {caregiver.certificates.map((cert, index) => (
                      <div 
                        key={index} 
                        className="group relative overflow-hidden border-2 border-gray-200 rounded-xl p-4 hover:border-[#70C1F1] transition-all cursor-pointer hover:shadow-lg bg-gradient-to-br from-white to-blue-50"
                        onClick={() => setSelectedCertificate(cert)}
                      >
                        <div className="flex items-start gap-3">
                          {cert.certificateImage && (
                            <div className="relative">
                              <img 
                                src={cert.certificateImage} 
                                alt={cert.name}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 group-hover:border-[#70C1F1] transition-colors"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#70C1F1] transition-colors">{cert.name}</h3>
                            <p className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">{cert.certificateType}</span>
                            </p>
                            <p className="text-xs text-gray-500">{new Date(cert.issueDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#70C1F1] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Chưa có chứng chỉ nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cam kết */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl font-bold">Cam kết</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors" style={{
                  borderColor: caregiver.agreeToEthics ? '#10b981' : '#ef4444',
                  backgroundColor: caregiver.agreeToEthics ? '#d1fae5' : '#fee2e2'
                }}>
                  {caregiver.agreeToEthics ? (
                    <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="text-gray-900 font-medium">Cam kết đạo đức nghề nghiệp</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors" style={{
                  borderColor: caregiver.agreeToTerms ? '#10b981' : '#ef4444',
                  backgroundColor: caregiver.agreeToTerms ? '#d1fae5' : '#fee2e2'
                }}>
                  {caregiver.agreeToTerms ? (
                    <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="text-gray-900 font-medium">Đồng ý điều khoản sử dụng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Modal */}
        {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setSelectedCertificate(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[98vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#70C1F1] to-[#5AB0E0] px-8 py-6 text-white">
              <button 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-all hover:rotate-90" 
                onClick={() => setSelectedCertificate(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCertificate.name}</h2>
                  <p className="text-white/90 text-sm">{selectedCertificate.issuingOrganization}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(98vh-180px)]">
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Image Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#70C1F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Ảnh chứng chỉ</h3>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 flex items-center justify-center min-h-[500px] max-h-[700px] border-2 border-[#70C1F1]/30 shadow-inner">
                      {selectedCertificate.certificateImage ? (
                        <img 
                          src={selectedCertificate.certificateImage} 
                          alt="certificate" 
                          className="max-h-[650px] max-w-full w-auto rounded-xl shadow-2xl object-contain border-4 border-white"
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
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#70C1F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Thông tin chi tiết</h3>
                    </div>
                    
                    {/* Certificate Info */}
                    <div className="bg-gradient-to-br from-[#70C1F1]/10 to-cyan-50 rounded-2xl p-6 space-y-5 border-2 border-[#70C1F1]/30 shadow-sm">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#70C1F1]/30">
                        <svg className="w-5 h-5 text-[#70C1F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <h4 className="font-bold text-gray-900 uppercase tracking-wide">Thông tin chứng chỉ</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1 font-medium">Tổ chức cấp</p>
                              <p className="text-sm font-bold text-gray-900">{selectedCertificate.issuingOrganization}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#70C1F1] flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1 font-medium">Loại chứng chỉ</p>
                              <p className="text-sm font-bold text-gray-900">{selectedCertificate.certificateType}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-start gap-2">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Ngày cấp</p>
                                <p className="text-sm font-bold text-gray-900">{new Date(selectedCertificate.issueDate).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                          </div>
                          {selectedCertificate.expirationDate && (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1 font-medium">Ngày hết hạn</p>
                                  <p className="text-sm font-bold text-gray-900">{new Date(selectedCertificate.expirationDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ID Card Image Modal */}
        {selectedIdCardImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setSelectedIdCardImage(null)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Căn cước công dân - {selectedIdCardImage.type === 'front' ? 'Mặt trước' : 'Mặt sau'}
                </h3>
                <button
                  onClick={() => setSelectedIdCardImage(null)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 flex items-center justify-center bg-gray-50">
                <img
                  src={selectedIdCardImage.url}
                  alt={`CCCD ${selectedIdCardImage.type === 'front' ? 'mặt trước' : 'mặt sau'}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Approval Confirmation Dialog */}
        {showApprovalDialog && (
          <ConfirmDialog
            title="Phê duyệt hồ sơ"
            message="Bạn có chắc chắn muốn phê duyệt hồ sơ người chăm sóc này không?"
            confirmText="Phê duyệt"
            cancelText="Hủy"
            type="info"
            onConfirm={handleApprove}
            onCancel={() => setShowApprovalDialog(false)}
          />
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowRejectionModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in border-2 border-gray-300" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">Từ chối hồ sơ</h3>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Vui lòng nhập lý do từ chối hồ sơ người chăm sóc này:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors shadow-lg"
                  >
                    {processing ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
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

export default CaregiverDetailPage;
