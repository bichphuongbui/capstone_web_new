import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiMapPin, FiClock, FiUser, FiMail, FiPhone,  FiAward, FiShield, FiHeart } from 'react-icons/fi';

interface CertificateFile {
  id: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNote?: string;
}

interface CaregiverProfile {
  id: string;
  fullName: string;
  email: string;
  status: string;
  role: string;
  profile?: {
    personalInfo?: {
      dateOfBirth?: string;
      gender?: string;
      idNumber?: string;
      permanentAddress?: string;
      temporaryAddress?: string;
      phone?: string;
      idCardFront?: string;
      idCardBack?: string;
    };
    professionalInfo?: {
      yearsOfExperience?: number;
      previousWorkplace?: string;
      skills?: string;
      languages?: string[];
      certificates?: string;
      certificateFiles?: CertificateFile[];
      skillItems?: {
        id: string;
        name: string;
        description?: string;
        image?: string;
      }[];
      educationLevel?: string;
      graduationStatus?: string;
      graduationCertificate?: string;
    };
    legalDocuments?: {
      criminalRecord?: string;
      healthCertificate?: string;
      vaccinationCertificate?: string;
      workPermit?: string;
    };
    references?: {
      referenceName?: string;
      referencePhone?: string;
      referenceRelation?: string;
    };
    commitments?: {
      ethicalCommitment?: boolean;
      termsAgreement?: boolean;
    };
    additionalProfile?: {
      profilePhoto?: string;
      introductionVideo?: string;
      specialAbilities?: string;
      introduction?: string;
    };
  };
}

const CaregiverProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caregiver, setCaregiver] = useState<CaregiverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaregiver = async () => {
      if (!id) {
        setError('ID caregiver không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        // Mock data - trong thực tế sẽ gọi API
        const mockCaregivers = [
          {
            id: 'cg1',
            fullName: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            status: 'approved',
            role: 'caregiver',
            profile: {
              personalInfo: {
                dateOfBirth: '1985-03-15',
                gender: 'male',
                idNumber: '123456789',
                permanentAddress: '123 Đường ABC, Quận 1, TP.HCM',
                phone: '0123456789',
                idCardFront: 'https://via.placeholder.com/300x200?text=ID+Front',
                idCardBack: 'https://via.placeholder.com/300x200?text=ID+Back'
              },
              professionalInfo: {
                yearsOfExperience: 5,
                previousWorkplace: 'Bệnh viện Chợ Rẫy',
                skills: 'Chăm sóc người cao tuổi, Vật lý trị liệu, Dinh dưỡng',
                languages: ['Tiếng Việt', 'Tiếng Anh'],
                certificates: 'Chứng chỉ Y tá, Chứng chỉ Vật lý trị liệu',
                certificateFiles: [
                  {
                    id: 'cert1',
                    url: 'https://via.placeholder.com/400x300?text=Certificate+1',
                    status: 'approved' as 'approved',
                    uploadedAt: '2024-01-15T10:00:00Z',
                    approvedAt: '2024-01-16T10:00:00Z'
                  },
                  {
                    id: 'cert2',
                    url: 'https://via.placeholder.com/400x300?text=Certificate+2',
                    status: 'approved' as 'approved',
                    uploadedAt: '2024-01-20T10:00:00Z',
                    approvedAt: '2024-01-21T10:00:00Z'
                  }
                ],
                skillItems: [
                  { id: 'skill1', name: 'Chăm sóc người cao tuổi', description: 'Kinh nghiệm chăm sóc người già' },
                  { id: 'skill2', name: 'Vật lý trị liệu', description: 'Phục hồi chức năng' },
                  { id: 'skill3', name: 'Dinh dưỡng', description: 'Tư vấn dinh dưỡng cho người cao tuổi' }
                ],
                educationLevel: 'dai-hoc',
                graduationStatus: 'graduated'
              },
              legalDocuments: {
                criminalRecord: 'https://via.placeholder.com/400x300?text=Criminal+Record',
                healthCertificate: 'https://via.placeholder.com/400x300?text=Health+Certificate',
                vaccinationCertificate: 'https://via.placeholder.com/400x300?text=Vaccination'
              },
              references: {
                referenceName: 'Trần Thị B',
                referencePhone: '0987654321',
                referenceRelation: 'Đồng nghiệp cũ'
              },
              commitments: {
                ethicalCommitment: true,
                termsAgreement: true
              },
              additionalProfile: {
                profilePhoto: 'https://via.placeholder.com/200x200?text=Profile+Photo',
                introductionVideo: 'https://youtube.com/watch?v=example',
                specialAbilities: 'Có thể giao tiếp bằng ngôn ngữ ký hiệu',
                introduction: 'Tôi là một y tá có 5 năm kinh nghiệm chăm sóc người cao tuổi. Tôi cam kết mang đến dịch vụ chăm sóc tốt nhất với sự tận tâm và chuyên nghiệp.'
              }
            }
          }
        ];

        const foundCaregiver = mockCaregivers.find(cg => cg.id === id);
        if (foundCaregiver) {
          setCaregiver(foundCaregiver);
        } else {
          setError('Không tìm thấy thông tin caregiver');
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin caregiver:', error);
        setError('Không thể tải thông tin caregiver');
      } finally {
        setLoading(false);
      }
    };

    fetchCaregiver();
  }, [id]);

  const getAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderText = (gender: string): string => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return 'Chưa cung cấp';
    }
  };

  const getEducationLevel = (level: string): string => {
    switch (level) {
      case 'trung-cap': return 'Trung cấp';
      case 'cao-dang': return 'Cao đẳng';
      case 'dai-hoc': return 'Đại học';
      case 'sau-dai-hoc': return 'Sau đại học';
      default: return 'Chưa cung cấp';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !caregiver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin</h2>
          <p className="text-gray-600 mb-6">{error || 'Caregiver không tồn tại'}</p>
          <button
            onClick={() => navigate('/care-seeker/booking')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/care-seeker/booking')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                {caregiver.profile?.additionalProfile?.profilePhoto ? (
                  <img
                    src={caregiver.profile.additionalProfile.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <FiUser className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{caregiver.fullName}</h1>
                  <p className="text-gray-600 flex items-center">
                    <FiMail className="w-4 h-4 mr-2" />
                    {caregiver.email}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">(103 đánh giá)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                280.000 ₫/giờ
              </div>
              <div className="text-sm text-gray-500">Giá dịch vụ</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin cá nhân
              </h2>
              {caregiver.profile?.personalInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tuổi</label>
                    <p className="text-gray-900">
                      {caregiver.profile.personalInfo.dateOfBirth 
                        ? `${getAge(caregiver.profile.personalInfo.dateOfBirth)} tuổi` 
                        : 'Chưa cung cấp'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Giới tính</label>
                    <p className="text-gray-900">
                      {getGenderText(caregiver.profile.personalInfo.gender || '')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Số điện thoại</label>
                    <p className="text-gray-900 flex items-center">
                      <FiPhone className="w-4 h-4 mr-2" />
                      {caregiver.profile.personalInfo.phone || 'Chưa cung cấp'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Địa chỉ</label>
                    <p className="text-gray-900 flex items-center">
                      <FiMapPin className="w-4 h-4 mr-2" />
                      {caregiver.profile.personalInfo.permanentAddress || 'Chưa cung cấp'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Chưa cung cấp thông tin cá nhân</p>
              )}
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiAward className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin nghề nghiệp
              </h2>
              {caregiver.profile?.professionalInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Kinh nghiệm</label>
                      <p className="text-gray-900 flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        {caregiver.profile.professionalInfo.yearsOfExperience || 0} năm
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Nơi làm việc</label>
                      <p className="text-gray-900">
                        {caregiver.profile.professionalInfo.previousWorkplace || 'Chưa cung cấp'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Học vấn</label>
                    <p className="text-gray-900">
                      {getEducationLevel(caregiver.profile.professionalInfo.educationLevel || '')}
                      {caregiver.profile.professionalInfo.graduationStatus === 'graduated' && ' (Đã tốt nghiệp)'}
                    </p>
                  </div>

                  {caregiver.profile.professionalInfo.skillItems && caregiver.profile.professionalInfo.skillItems.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Kỹ năng chuyên môn</label>
                      <div className="flex flex-wrap gap-2">
                        {caregiver.profile.professionalInfo.skillItems.map((skill) => (
                          <span
                            key={skill.id}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {caregiver.profile.professionalInfo.languages && caregiver.profile.professionalInfo.languages.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Ngôn ngữ</label>
                      <div className="flex flex-wrap gap-2">
                        {caregiver.profile.professionalInfo.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Chưa cung cấp thông tin nghề nghiệp</p>
              )}
            </div>

            {/* Introduction */}
            {caregiver.profile?.additionalProfile?.introduction && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiHeart className="w-5 h-5 mr-2 text-blue-600" />
                  Giới thiệu
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {caregiver.profile.additionalProfile.introduction}
                </p>
              </div>
            )}

            {/* Certificates */}
            {caregiver.profile?.professionalInfo?.certificateFiles && 
             caregiver.profile.professionalInfo.certificateFiles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiShield className="w-5 h-5 mr-2 text-blue-600" />
                  Chứng chỉ & Bằng cấp
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(caregiver.profile.professionalInfo.certificateFiles as CertificateFile[]).map((certificate) => (
                    <div key={certificate.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Đã duyệt
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(certificate.approvedAt || certificate.uploadedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <img
                        src={certificate.url}
                        alt={`Certificate ${certificate.id}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin nhanh</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Có sẵn
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kinh nghiệm</span>
                  <span className="font-medium">
                    {caregiver.profile?.professionalInfo?.yearsOfExperience || 0} năm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Đánh giá</span>
                  <div className="flex items-center">
                    <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">4.8</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giá dịch vụ</span>
                  <span className="font-bold text-blue-600">280.000 ₫/giờ</span>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Khung giờ có sẵn</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Thứ 2 - Thứ 6: 08:00 - 18:00</span>
                </div>
                <div className="flex items-center text-sm">
                  <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Thứ 7: 08:00 - 12:00</span>
                </div>
                <div className="flex items-center text-sm">
                  <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Chủ nhật: Nghỉ</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/care-seeker/booking?caregiver=${caregiver.id}`)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Đặt lịch ngay
                </button>
                <button
                  onClick={() => navigate(`/care-seeker/chat?caregiver=${caregiver.id}`)}
                  className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Nhắn tin
                </button>
              </div>
            </div>

            {/* References */}
            {caregiver.profile?.references && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Người tham chiếu</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tên: </span>
                    <span className="text-sm text-gray-900">{caregiver.profile.references.referenceName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">SĐT: </span>
                    <span className="text-sm text-gray-900">{caregiver.profile.references.referencePhone}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Quan hệ: </span>
                    <span className="text-sm text-gray-900">{caregiver.profile.references.referenceRelation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverProfilePage;
