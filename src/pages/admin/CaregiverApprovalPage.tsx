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
      // Update the caregiver data with the new response - API returns single object in data
      if (selectedCaregiver && response.data) {
        const updatedCaregiver = response.data;
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
      // Update the caregiver data with the new response - API returns single object in data
      if (selectedCaregiver && response.data) {
        const updatedCaregiver = response.data;
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
      // Update the caregiver data - API returns single object in data
      if (response.data) {
        const updatedCaregiver = response.data;
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
      // Update the caregiver data - API returns single object in data
      if (response.data) {
        const updatedCaregiver = response.data;
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Duyệt Người chăm sóc</h1>
        <p className="text-gray-600">Danh sách người chăm sóc chờ xác minh ({caregivers.length})</p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
        <input
          type="text"
          placeholder="Tìm theo tên, email, số điện thoại..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CA4FF] focus:border-transparent"
        />
      </div>

      {caregivers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 text-lg">Chưa có người chăm sóc nào đăng ký.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
                  <tr key={caregiver.caregiverProfileId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {caregiver.avatarUrl && (
                          <img src={caregiver.avatarUrl} alt={caregiver.fullName} className="h-10 w-10 rounded-full mr-3 object-cover" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{caregiver.fullName}</div>
                          {caregiver.isNeededReviewCertificate && (
                            <span className="text-xs text-orange-600 font-medium">⚠ Cần xem chứng chỉ</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{caregiver.email}</div>
                      <div className="text-xs text-gray-500">{caregiver.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(caregiver.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetail(caregiver)}
                        className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-md transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {isModalOpen && selectedCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Thông tin chi tiết người chăm sóc</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                <div className="flex items-start space-x-4">
                  {selectedCaregiver.avatarUrl && (
                    <img
                      src={selectedCaregiver.avatarUrl}
                      alt={selectedCaregiver.fullName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Họ và tên</p>
                      <p className="font-medium">{selectedCaregiver.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedCaregiver.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium">{selectedCaregiver.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày sinh</p>
                      <p className="font-medium">{new Date(selectedCaregiver.birthDate).toLocaleDateString('vi-VN')} ({selectedCaregiver.age} tuổi)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Giới tính</p>
                      <p className="font-medium">
                        {selectedCaregiver.gender === 'MALE' ? 'Nam' : selectedCaregiver.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(selectedCaregiver.status)}</div>
                    </div>
                  </div>
                </div>
                {selectedCaregiver.bio && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Giới thiệu</p>
                    <p className="mt-1">{selectedCaregiver.bio}</p>
                  </div>
                )}
              </div>

              {/* Địa chỉ */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Địa chỉ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-medium">{selectedCaregiver.location.address}</p>
                  </div>
                  {selectedCaregiver.location.service_radius_km && (
                    <div>
                      <p className="text-sm text-gray-500">Bán kính phục vụ</p>
                      <p className="font-medium">{selectedCaregiver.location.service_radius_km} km</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin nghề nghiệp */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Thông tin nghề nghiệp</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedCaregiver.profileData.years_experience && (
                    <div>
                      <p className="text-sm text-gray-500">Số năm kinh nghiệm</p>
                      <p className="font-medium">{selectedCaregiver.profileData.years_experience} năm</p>
                    </div>
                  )}
                  {selectedCaregiver.profileData.experience && (
                    <div>
                      <p className="text-sm text-gray-500">Kinh nghiệm</p>
                      <p className="font-medium">{selectedCaregiver.profileData.experience}</p>
                    </div>
                  )}
                  {selectedCaregiver.profileData.max_hours_per_week && (
                    <div>
                      <p className="text-sm text-gray-500">Số giờ tối đa/tuần</p>
                      <p className="font-medium">{selectedCaregiver.profileData.max_hours_per_week} giờ</p>
                    </div>
                  )}
                  {selectedCaregiver.profileData.certifications && selectedCaregiver.profileData.certifications.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Chứng chỉ</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedCaregiver.profileData.certifications.map((cert, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCaregiver.profileData.specializations && selectedCaregiver.profileData.specializations.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Chuyên môn</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedCaregiver.profileData.specializations.map((spec, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sở thích người cao tuổi */}
              {selectedCaregiver.profileData.preferences && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Sở thích chăm sóc</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCaregiver.profileData.preferences.elderly_age_preference && (
                      <div>
                        <p className="text-sm text-gray-500">Độ tuổi ưa thích</p>
                        <p className="font-medium">
                          {selectedCaregiver.profileData.preferences.elderly_age_preference.min_age} - {selectedCaregiver.profileData.preferences.elderly_age_preference.max_age} tuổi
                        </p>
                      </div>
                    )}
                    {selectedCaregiver.profileData.preferences.preferred_health_status && (
                      <div>
                        <p className="text-sm text-gray-500">Tình trạng sức khỏe</p>
                        <p className="font-medium">{selectedCaregiver.profileData.preferences.preferred_health_status}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Lịch trống */}
              {selectedCaregiver.profileData.free_schedule && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Lịch làm việc</h3>
                  <div>
                    <p className="text-sm text-gray-500">Trạng thái</p>
                    <p className="font-medium">
                      {selectedCaregiver.profileData.free_schedule.available_all_time ? 'Có thể làm việc mọi lúc' : 'Có lịch cụ thể'}
                    </p>
                  </div>
                  {selectedCaregiver.profileData.free_schedule.booked_slots && selectedCaregiver.profileData.free_schedule.booked_slots.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Các khung giờ đã đặt</p>
                      <div className="space-y-2">
                        {selectedCaregiver.profileData.free_schedule.booked_slots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-4 text-sm">
                            <span className="font-medium">{slot.date}</span>
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bằng cấp chứng chỉ */}
              {selectedCaregiver.qualifications && selectedCaregiver.qualifications.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Bằng cấp & Chứng chỉ
                    {selectedCaregiver.isNeededReviewCertificate && (
                      <span className="text-sm text-orange-600 font-medium">⚠ Cần xem xét</span>
                    )}
                  </h3>
                  <div className="space-y-4">
                    {selectedCaregiver.qualifications.map((qual) => (
                      <div key={qual.qualificationId} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{qual.qualificationTypeName}</h4>
                            {qual.status === 'PENDING' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Chờ duyệt</span>
                            )}
                            {qual.status === 'APPROVED' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Đã duyệt</span>
                            )}
                            {qual.status === 'REJECTED' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Bị từ chối</span>
                            )}
                          </div>
                          {qual.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveQualification(qual.qualificationId)}
                                disabled={processingQualId === qual.qualificationId}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingQualId === qual.qualificationId ? 'Đang xử lý...' : 'Duyệt'}
                              </button>
                              <button
                                onClick={() => handleRejectQualification(qual.qualificationId)}
                                disabled={processingQualId === qual.qualificationId}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">Số chứng chỉ: {qual.certificateNumber}</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Tổ chức cấp</p>
                            <p className="font-medium">{qual.issuingOrganization}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Ngày cấp</p>
                            <p className="font-medium">{new Date(qual.issueDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Ngày hết hạn</p>
                            <p className="font-medium">{new Date(qual.expiryDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          {qual.isVerified && (
                            <div>
                              <p className="text-sm text-gray-500">Xác thực</p>
                              <p className="font-medium text-green-600">✓ Đã xác thực</p>
                            </div>
                          )}
                        </div>
                        {qual.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500">Ghi chú</p>
                            <p className="text-sm">{qual.notes}</p>
                          </div>
                        )}
                        {qual.certificateUrl && (
                          <div>
                            <a
                              href={qual.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              📄 Xem chứng chỉ
                            </a>
                          </div>
                        )}
                        {qual.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Lý do từ chối:</strong> {qual.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
             
              {selectedCaregiver && selectedCaregiver.status === 'PENDING' && (
                <>
                  <button
                    onClick={handleApproveProfile}
                    disabled={processingProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingProfile ? 'Đang xử lý...' : 'Duyệt'}
                  </button>
                  <button
                    onClick={handleRejectProfile}
                    disabled={processingProfile}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Từ chối
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Lý do từ chối chứng chỉ</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingQualId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Rejection Modal */}
      {showProfileRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Lý do từ chối hồ sơ</h3>
            <textarea
              value={profileRejectionReason}
              onChange={(e) => setProfileRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối hồ sơ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowProfileRejectModal(false);
                  setProfileRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRejectProfile}
                disabled={!profileRejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận duyệt chứng chỉ</h3>
            </div>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn duyệt chứng chỉ này?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmingQualId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Confirm Approve Dialog */}
      {showProfileConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận duyệt hồ sơ</h3>
            </div>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn duyệt hồ sơ người chăm sóc này?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowProfileConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApproveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Thành công</h3>
            </div>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessDialog(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Lỗi</h3>
            </div>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorDialog(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverApprovalPage;


