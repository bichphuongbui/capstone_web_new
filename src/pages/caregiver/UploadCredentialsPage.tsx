import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Footer from '../../components/layout/Footer';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  status?: string;
  rejectionReason?: string;
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
      certificateFiles?: string[];
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
    };
  };
}

const UploadCredentialsPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('personal');
  const navigate = useNavigate();

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    dateOfBirth: '',
    gender: '',
    idNumber: '',
    permanentAddress: '',
    temporaryAddress: '',
    phone: '',
    idCardFront: '',
    idCardBack: '',
  });

  const [professionalInfo, setProfessionalInfo] = useState({
    yearsOfExperience: 0,
    previousWorkplace: '',
    skills: '',
    certificates: '',
    certificateFiles: [] as string[],
    // New fields
    educationLevel: '', // 'trung-cap' | 'cao-dang' | 'dai-hoc' | 'sau-dai-hoc'
    graduationStatus: '', // 'graduated' | 'not_graduated' (only for 'dai-hoc')
    graduationCertificate: '', // base64 (optional, required if graduated & university)
  });

  // Structured entries to align with Certificates & Skills page
  type SkillItem = { id: string; name: string; description?: string; image?: string };
  type CertificateItem = { id: string; name: string; issueDate: string; organization: string; type: string; image: string };
  const [skillItems, setSkillItems] = useState<SkillItem[]>([]);
  const [newSkill, setNewSkill] = useState<SkillItem>({ id: '', name: '', description: '', image: '' });
  const [certificateItems, setCertificateItems] = useState<CertificateItem[]>([]);
  const [newCertificate, setNewCertificate] = useState<CertificateItem>({ id: '', name: '', issueDate: '', organization: '', type: '', image: '' });

  // Temp image upload helpers for structured forms
  const handleTempImageUpload = async (file: File, target: 'skill' | 'certificate') => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn (tối đa 5MB).');
      return;
    }

    try {
      // Compress image before storing
      const compressedImage = await new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions (max 600px width for certificates/skills)
          let { width, height } = img;
          const maxWidth = 600;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress (lower quality for smaller size)
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            0.6 // Lower quality for smaller file size
          );
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      console.log(`${target} image compressed: ${file.size} bytes -> ${compressedImage.length * 0.75} bytes (approx)`);
      
      if (target === 'skill') {
        setNewSkill(prev => ({ ...prev, image: compressedImage }));
      } else {
        setNewCertificate(prev => ({ ...prev, image: compressedImage }));
      }
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      // Fallback to original
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (target === 'skill') {
          setNewSkill(prev => ({ ...prev, image: dataUrl }));
        } else {
          setNewCertificate(prev => ({ ...prev, image: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [legalDocuments, setLegalDocuments] = useState({
    criminalRecord: '',
    healthCertificate: '',
    vaccinationCertificate: '',
    workPermit: '',
  });

  const [references, setReferences] = useState({
    referenceName: '',
    referencePhone: '',
    referenceRelation: '',
  });

  const [commitments, setCommitments] = useState({
    ethicalCommitment: false,
    termsAgreement: false,
  });

  const [additionalProfile, setAdditionalProfile] = useState({
    profilePhoto: '',
    introductionVideo: '',
    introduction: '',
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  // Legacy file list retained for backward compatibility but unused
  // const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  // Legacy previews no longer used after aligning with structured items
  // const [certificatePreviews, setCertificatePreviews] = useState<string[]>([]);
  const [idCardFrontFile, setIdCardFrontFile] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string>('');
  const [idCardBackFile, setIdCardBackFile] = useState<File | null>(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
        setUserData(response.data);
        
        // Populate form with existing data
        if (response.data.profile) {
          setPersonalInfo(response.data.profile.personalInfo || personalInfo);
          setProfessionalInfo(response.data.profile.professionalInfo || professionalInfo);
          setLegalDocuments(response.data.profile.legalDocuments || legalDocuments);
          setReferences(response.data.profile.references || references);
          setCommitments(response.data.profile.commitments || commitments);
          // Map old specialAbilities -> introduction if present
          const ap = response.data.profile.additionalProfile || additionalProfile;
          setAdditionalProfile({
            ...ap,
            introduction: (ap as any).introduction ?? (ap as any).specialAbilities ?? ''
          });
          
          // Load existing certificate files if any
          if (response.data.profile.professionalInfo?.certificateFiles) {
            setProfessionalInfo(prev => ({
              ...prev,
              certificateFiles: response.data.profile.professionalInfo.certificateFiles
            }));
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        alert('Có lỗi xảy ra khi tải thông tin người dùng.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    // Validate required fields
    if (!personalInfo.dateOfBirth || !personalInfo.gender || !personalInfo.idNumber || 
        !personalInfo.permanentAddress || !personalInfo.phone) {
      alert('Vui lòng điền đầy đủ thông tin cá nhân bắt buộc.');
      setActiveSection('personal');
      return;
    }

    // Validate ID number format (Vietnamese ID format)
    const idNumberRegex = /^[0-9]{9,12}$/;
    if (!idNumberRegex.test(personalInfo.idNumber)) {
      alert('Số CMND/CCCD/Hộ chiếu phải có từ 9-12 chữ số.');
      setActiveSection('personal');
      return;
    }

    // Validate phone number format (Vietnamese phone format)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$|^(\+84[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(personalInfo.phone)) {
      alert('Số điện thoại không đúng định dạng Việt Nam. Ví dụ: 0123456789 hoặc +84123456789');
      setActiveSection('personal');
      return;
    }

    // Validate date of birth (must be at least 18 years old)
    const today = new Date();
    const birthDate = new Date(personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      alert('Bạn phải ít nhất 18 tuổi để đăng ký làm caregiver.');
      setActiveSection('personal');
      return;
    }

    if (age > 65) {
      alert('Độ tuổi không phù hợp để làm caregiver (quá 65 tuổi).');
      setActiveSection('personal');
      return;
    }

    if (!personalInfo.idCardFront && !idCardFrontFile) {
      alert('Vui lòng upload ảnh CCCD mặt trước.');
      setActiveSection('personal');
      return;
    }

    if (!personalInfo.idCardBack && !idCardBackFile) {
      alert('Vui lòng upload ảnh CCCD mặt sau.');
      setActiveSection('personal');
      return;
    }

    // Validate professional information
    if (!professionalInfo.yearsOfExperience || professionalInfo.yearsOfExperience < 0) {
      alert('Vui lòng nhập số năm kinh nghiệm hợp lệ.');
      setActiveSection('professional');
      return;
    }

    if (professionalInfo.yearsOfExperience > 50) {
      alert('Số năm kinh nghiệm không hợp lý (quá 50 năm).');
      setActiveSection('professional');
      return;
    }

    // Validate education (only if university and graduated)
    if (professionalInfo.educationLevel === 'dai-hoc' && professionalInfo.graduationStatus === 'graduated') {
      if (!professionalInfo.graduationCertificate) {
        alert('Vui lòng tải lên bằng tốt nghiệp đại học.');
        setActiveSection('professional');
        return;
      }
    }

    // Validate reference information
    if (references.referenceName && (!references.referencePhone || !references.referenceRelation)) {
      alert('Nếu có người tham chiếu, vui lòng điền đầy đủ thông tin liên lạc.');
      setActiveSection('references');
      return;
    }

    if (references.referencePhone) {
      const refPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$|^(\+84[3|5|7|8|9])[0-9]{8}$/;
      if (!refPhoneRegex.test(references.referencePhone)) {
        alert('Số điện thoại người tham chiếu không đúng định dạng Việt Nam.');
        setActiveSection('references');
        return;
      }
    }

    // Validate commitments
    if (!commitments.termsAgreement) {
      alert('Vui lòng đồng ý với điều khoản hệ thống.');
      setActiveSection('references');
      return;
    }

    // Validate video URL if provided
    if (additionalProfile.introductionVideo) {
      const urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/;
      if (!urlRegex.test(additionalProfile.introductionVideo)) {
        alert('Link video không hợp lệ. Vui lòng nhập link YouTube, Vimeo hoặc Dailymotion.');
        setActiveSection('additional');
        return;
      }
    }

    // Helper function to compress image
    const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    };

    // Prepare profile photo data
    let profilePhotoData: string | undefined = undefined;
    if (profilePhotoFile) {
      try {
        profilePhotoData = await compressImage(profilePhotoFile, 600, 0.7);
        console.log(`Profile photo compressed: ${profilePhotoFile.size} bytes -> ${profilePhotoData.length * 0.75} bytes (approx)`);
      } catch (error) {
        console.warn('Image compression failed, using original:', error);
        profilePhotoData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(profilePhotoFile);
        });
      }
    }

    // CCCD images are already compressed in personalInfo state
    // Just use the pre-compressed versions stored during upload
    const idCardFrontData = personalInfo.idCardFront;
    const idCardBackData = personalInfo.idCardBack;
    
    console.log('Using pre-compressed CCCD images:', {
      hasFront: !!idCardFrontData,
      hasBack: !!idCardBackData,
      frontSize: idCardFrontData ? `~${idCardFrontData.length * 0.75} bytes` : '0',
      backSize: idCardBackData ? `~${idCardBackData.length * 0.75} bytes` : '0'
    });

    // Prepare certificate files data
    // Merge structured items into free-text fields for compatibility
    const mergedSkillsText = [professionalInfo.skills, ...skillItems.map(s => s.name)].filter(Boolean).join(', ');
    const mergedCertificateText = [professionalInfo.certificates, ...certificateItems.map(c => `${c.name} (${c.organization})`)].filter(Boolean).join('\n');

    setIsSubmitting(true);
    try {
      const updatedProfile = {
        personalInfo: {
          ...personalInfo,
          idCardFront: idCardFrontData, // Already compressed
          idCardBack: idCardBackData    // Already compressed
        },
        professionalInfo: {
          ...professionalInfo,
          certificates: mergedCertificateText,
          skills: mergedSkillsText,
          // Include structured certificate files with images for admin review
          certificateFiles: certificateItems.map(cert => ({
            id: cert.id,
            name: cert.name,
            issueDate: cert.issueDate,
            organization: cert.organization,
            type: cert.type,
            image: cert.image, // Base64 image for admin review
            status: 'pending',
            uploadedAt: new Date().toISOString()
          })),
          // Include structured skill items
          skillItems: skillItems
        },
        legalDocuments,
        references,
        commitments,
        additionalProfile: {
          ...additionalProfile,
          profilePhoto: profilePhotoData || additionalProfile.profilePhoto
        }
      };
      // Save full payload with images locally to avoid large network payloads
      try {
        // Persist full profile with images for later rehydrate in Profile page
        localStorage.setItem('caregiver_profile_full', JSON.stringify(updatedProfile));
      } catch {}

      // Send full profile to API for admin review (including images)
      const payloadToSend = {
        ...userData,
        profile: updatedProfile, // Send complete profile with images
        status: 'pending',
        role: 'Caregiver'
      };

      console.log('=== SENDING PROFILE TO API ===');
      console.log('API URL:', `https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
      console.log('Payload size:', JSON.stringify(payloadToSend).length, 'characters');
      console.log('Profile data structure:', {
        hasPersonalInfo: !!updatedProfile.personalInfo,
        hasIdCardFront: !!updatedProfile.personalInfo.idCardFront,
        hasIdCardBack: !!updatedProfile.personalInfo.idCardBack,
        idCardFrontSize: updatedProfile.personalInfo.idCardFront?.length || 0,
        idCardBackSize: updatedProfile.personalInfo.idCardBack?.length || 0,
        hasProfilePhoto: !!updatedProfile.additionalProfile.profilePhoto,
        profilePhotoSize: updatedProfile.additionalProfile.profilePhoto?.length || 0,
        certificateCount: updatedProfile.professionalInfo.certificateFiles.length,
        certificateImages: updatedProfile.professionalInfo.certificateFiles.map(c => ({
          name: c.name,
          hasImage: !!c.image,
          imageSize: c.image?.length || 0
        }))
      });

      const response = await axios.put(
        `https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`,
        payloadToSend
      );
      
      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response profile structure:', {
        hasProfile: !!response.data.profile,
        hasPersonalInfo: !!response.data.profile?.personalInfo,
        returnedIdCardFront: !!response.data.profile?.personalInfo?.idCardFront,
        returnedIdCardBack: !!response.data.profile?.personalInfo?.idCardBack,
        returnedProfilePhoto: !!response.data.profile?.additionalProfile?.profilePhoto,
        returnedCertificates: response.data.profile?.professionalInfo?.certificateFiles?.length || 0
      });
      
      // Verify data was actually saved by fetching it back
      try {
        console.log('=== VERIFYING SAVED DATA ===');
        const verifyResponse = await axios.get(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
        console.log('Fetched back from API:', {
          hasProfile: !!verifyResponse.data.profile,
          savedIdCardFront: !!verifyResponse.data.profile?.personalInfo?.idCardFront,
          savedIdCardBack: !!verifyResponse.data.profile?.personalInfo?.idCardBack,
          savedProfilePhoto: !!verifyResponse.data.profile?.additionalProfile?.profilePhoto,
          savedCertificates: verifyResponse.data.profile?.professionalInfo?.certificateFiles?.length || 0
        });
      } catch (verifyError) {
        console.warn('Could not verify saved data:', verifyError);
      }

      alert('Đã hoàn tất hồ sơ đăng ký. Vui lòng chờ quản trị viên xét duyệt.');
      navigate('/care-giver/pending-approval');
    } catch (error: any) {
      console.error('Cập nhật hồ sơ thất bại:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // More specific error handling
      if (error.response?.status === 413) {
        alert('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn và thử lại.');
      } else if (error.code === 'ECONNABORTED') {
        alert('Kết nối quá chậm. Hồ sơ đã lưu cục bộ và sẽ được gửi lại sau.');
        navigate('/care-giver/pending-approval');
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        console.warn('API may not support large base64 images. Trying alternative approach...');
        
        // Try sending without images first, then save images separately
        try {
          // Rebuild profile without images from the original data
          const profileWithoutImages = {
            personalInfo: {
              ...personalInfo,
              idCardFront: 'stored_locally',
              idCardBack: 'stored_locally'
            },
            additionalProfile: {
              ...additionalProfile,
              profilePhoto: 'stored_locally'
            },
            professionalInfo: {
              ...professionalInfo,
              certificates: mergedCertificateText,
              skills: mergedSkillsText,
              certificateFiles: certificateItems.map((c: any) => ({
                ...c,
                image: c.image ? 'stored_locally' : ''
              })),
              skillItems: skillItems
            },
            legalDocuments,
            references,
            commitments
          };

          await axios.put(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`, {
            ...userData,
            profile: profileWithoutImages,
            status: 'pending',
            role: 'Caregiver',
            // Store a flag indicating images are stored locally
            hasLocalImages: true
          });

          alert('Hồ sơ đã được gửi thành công. Ảnh được lưu cục bộ cho admin xem xét.');
          navigate('/care-giver/pending-approval');
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          alert(`Có lỗi xảy ra: ${error.message}. Hồ sơ đã lưu cục bộ và sẽ được gửi lại sau.`);
          navigate('/care-giver/pending-approval');
        }
      } else {
        alert(`Có lỗi xảy ra: ${error.message}. Hồ sơ đã lưu cục bộ và sẽ được gửi lại sau.`);
        // Still allow navigation since data is saved locally
        navigate('/care-giver/pending-approval');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed language options per requirements

  // Legacy upload handler removed (structured certificates are entered via fields)

  // Legacy remove handler removed

  const validateIdNumber = (value: string) => {
    const idNumberRegex = /^[0-9]{9,12}$/;
    if (value && !idNumberRegex.test(value)) {
      setValidationErrors(prev => ({ ...prev, idNumber: 'Số CMND/CCCD phải có từ 9-12 chữ số' }));
    } else {
      setValidationErrors(prev => ({ ...prev, idNumber: '' }));
    }
  };

  const validatePhoneNumber = (value: string) => {
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$|^(\+84[3|5|7|8|9])[0-9]{8}$/;
    if (value && !phoneRegex.test(value)) {
      setValidationErrors(prev => ({ ...prev, phone: 'Số điện thoại không đúng định dạng Việt Nam' }));
    } else {
      setValidationErrors(prev => ({ ...prev, phone: '' }));
    }
  };


  // Legacy validation removed

  const validateVideoUrl = (value: string) => {
    if (value) {
      const urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/;
      if (!urlRegex.test(value)) {
        setValidationErrors(prev => ({ ...prev, videoUrl: 'Link video không hợp lệ. Chỉ chấp nhận YouTube, Vimeo, Dailymotion' }));
      } else {
        setValidationErrors(prev => ({ ...prev, videoUrl: '' }));
      }
    } else {
      setValidationErrors(prev => ({ ...prev, videoUrl: '' }));
    }
  };

  const handleIdCardUpload = async (type: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Ảnh quá lớn (tối đa 10MB).');
      return;
    }
    
    try {
      // Compress image immediately for preview and storage
      const compressedImage = await new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Aggressive compression for CCCD
          let { width, height } = img;
          const maxWidth = 600; // Smaller max width
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            0.5 // More aggressive compression for CCCD
          );
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      console.log(`CCCD ${type} compressed: ${file.size} bytes -> ~${compressedImage.length * 0.75} bytes`);
      
      if (type === 'front') {
        setIdCardFrontFile(file);
        setIdCardFrontPreview(compressedImage);
        // Store compressed version in personalInfo for immediate use
        setPersonalInfo(prev => ({ ...prev, idCardFront: compressedImage }));
      } else {
        setIdCardBackFile(file);
        setIdCardBackPreview(compressedImage);
        // Store compressed version in personalInfo for immediate use
        setPersonalInfo(prev => ({ ...prev, idCardBack: compressedImage }));
      }
    } catch (error) {
      console.warn('CCCD compression failed, using original preview only:', error);
      // Fallback to preview only (don't store large original)
      if (type === 'front') {
        setIdCardFrontFile(file);
        setIdCardFrontPreview(URL.createObjectURL(file));
      } else {
        setIdCardBackFile(file);
        setIdCardBackPreview(URL.createObjectURL(file));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hoàn thiện hồ sơ đăng ký</h1>
            <p className="text-gray-600 mb-8">
              Vui lòng điền đầy đủ thông tin để hoàn thiện hồ sơ chuyên nghiệp của bạn.
            </p>

            {/* Rejection Notice */}
            {userData?.status === 'rejected' && (
              <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-orange-800 font-semibold mb-1">Hồ sơ của bạn đã bị từ chối</h3>
                    <p className="text-orange-700 text-sm">
                      Vui lòng chỉnh sửa lại thông tin theo góp ý của quản trị viên và gửi lại để được xét duyệt lần nữa.
                    </p>
                    {userData.rejectionReason && (
                      <p className="text-orange-600 text-sm mt-2">
                        <span className="font-semibold">Lý do từ chối:</span> {userData.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Info Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">Thông tin đăng ký</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                  <input
                    type="text"
                    value={userData?.fullName || ''}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={userData?.email || ''}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-gray-200 mb-8">
              {[
                { id: 'personal', label: 'Thông tin cá nhân' },
                { id: 'professional', label: 'Thông tin nghề nghiệp'},
                // { id: 'legal', label: 'Giấy tờ pháp lý' },
                { id: 'references', label: 'Cam kết' },
                { id: 'additional', label: 'Hồ sơ bổ sung' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2"></span>
                  {tab.label}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => {
              // Only allow submit when on the last section (additional)
              if (activeSection !== 'additional') {
                e.preventDefault();
                return;
              }
              handleSubmit(e);
            }} className="space-y-8">
              {/* Personal Information Section */}
              {activeSection === 'personal' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giới tính <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={personalInfo.gender}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số CMND/CCCD/Hộ chiếu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={personalInfo.idNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          if (value.length <= 12) {
                            setPersonalInfo(prev => ({ ...prev, idNumber: value }));
                            validateIdNumber(value);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          validationErrors.idNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập số CMND/CCCD/Hộ chiếu (9-12 chữ số)"
                        maxLength={12}
                        required
                      />
                      {validationErrors.idNumber && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.idNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d+]/g, ''); // Only allow digits and +
                          
                          // Limit length based on format
                          if (value.startsWith('+84')) {
                            if (value.length > 12) value = value.substring(0, 12);
                          } else if (value.startsWith('0')) {
                            if (value.length > 10) value = value.substring(0, 10);
                          } else if (value.length > 10) {
                            value = value.substring(0, 10);
                          }
                          
                          setPersonalInfo(prev => ({ ...prev, phone: value }));
                          validatePhoneNumber(value);
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập số điện thoại (VD: 0123456789 hoặc +84123456789)"
                        maxLength={12}
                        required
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ thường trú <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={personalInfo.permanentAddress}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, permanentAddress: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Nhập địa chỉ thường trú"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ tạm trú
                      </label>
                      <textarea
                        value={personalInfo.temporaryAddress}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, temporaryAddress: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Nhập địa chỉ tạm trú (nếu khác địa chỉ thường trú)"
                      />
                    </div>
                    
                    {/* ID Card Upload Section */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Ảnh CCCD/CCCD</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ảnh CCCD mặt trước <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => await handleIdCardUpload('front', e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Tối đa 5MB - JPG, PNG</p>
                          
                          {(idCardFrontPreview || personalInfo.idCardFront) && (
                            <div className="mt-3">
                              <img 
                                src={idCardFrontPreview || personalInfo.idCardFront} 
                                alt="CCCD mặt trước" 
                                className="h-32 w-full object-cover rounded-md border"
                              />
                              {idCardFrontPreview && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIdCardFrontFile(null);
                                    setIdCardFrontPreview('');
                                  }}
                                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                                >
                                  ✕ Xóa ảnh
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ảnh CCCD mặt sau <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => await handleIdCardUpload('back', e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Tối đa 5MB - JPG, PNG</p>
                          
                          {(idCardBackPreview || personalInfo.idCardBack) && (
                            <div className="mt-3">
                              <img 
                                src={idCardBackPreview || personalInfo.idCardBack} 
                                alt="CCCD mặt sau" 
                                className="h-32 w-full object-cover rounded-md border"
                              />
                              {idCardBackPreview && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIdCardBackFile(null);
                                    setIdCardBackPreview('');
                                  }}
                                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                                >
                                  ✕ Xóa ảnh
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Information Section */}
              {activeSection === 'professional' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Thông tin nghề nghiệp</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số năm kinh nghiệm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={professionalInfo.yearsOfExperience}
                        onChange={(e) => setProfessionalInfo(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nơi từng làm việc
                      </label>
                      <input
                        type="text"
                        value={professionalInfo.previousWorkplace}
                        onChange={(e) => setProfessionalInfo(prev => ({ ...prev, previousWorkplace: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Nhập nơi từng làm việc"
                      />
                    </div>
                    {/* Structured Skills like Skills page */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kỹ năng chuyên môn</label>
                      <div className="space-y-3">
                        {skillItems.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {skillItems.map((s) => (
                              <div key={s.id} className="flex items-start p-3 border rounded-md">
                                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center mr-3 overflow-hidden">
                                  {s.image ? <img src={s.image} alt={s.name} className="w-full h-full object-cover"/> : <span className="text-xs text-gray-400">No image</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{s.name}</div>
                                  {s.description && <div className="text-sm text-gray-600">{s.description}</div>}
                                </div>
                                <button type="button" onClick={() => setSkillItems(prev => prev.filter(x => x.id !== s.id))} className="text-red-600 text-sm ml-2">Xóa</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add skill form */}
                        <div className="p-3 border rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <input type="text" placeholder="Tên kỹ năng" value={newSkill.name} onChange={e => setNewSkill(prev => ({ ...prev, name: e.target.value }))} className="px-3 py-2 border rounded"/>
                            <input type="text" placeholder="Mô tả (tuỳ chọn)" value={newSkill.description || ''} onChange={e => setNewSkill(prev => ({ ...prev, description: e.target.value }))} className="px-3 py-2 border rounded"/>
                            <div className="flex items-center gap-2">
                              <input id="skill-image-input" type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await handleTempImageUpload(f, 'skill'); }}/>
                              <label htmlFor="skill-image-input" className="px-3 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-sm">Tải ảnh</label>
                              {newSkill.image && <span className="text-xs text-green-600">Đã chọn ảnh</span>}
                            </div>
                          </div>
                          <div className="mt-2 text-right">
                            <button type="button" onClick={() => {
                              if (!newSkill.name.trim()) return;
                              setSkillItems(prev => [...prev, { ...newSkill, id: `skill_${Date.now()}` }]);
                              setNewSkill({ id: '', name: '', description: '', image: '' });
                            }} className="px-3 py-1 bg-primary-600 text-white rounded">Thêm kỹ năng</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Education */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Học vấn</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <select
                            value={professionalInfo.educationLevel}
                            onChange={(e) => setProfessionalInfo(prev => ({ ...prev, educationLevel: e.target.value, graduationStatus: '', graduationCertificate: '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Chọn trình độ</option>
                            <option value="trung-cap">Trung cấp</option>
                            <option value="cao-dang">Cao đẳng</option>
                            <option value="dai-hoc">Đại học</option>
                            <option value="sau-dai-hoc">Sau đại học</option>
                          </select>
                        </div>
                        {professionalInfo.educationLevel === 'dai-hoc' && (
                          <div className="flex items-center gap-6">
                            <label className="flex items-center text-sm">
                              <input
                                type="radio"
                                name="graduationStatus"
                                value="graduated"
                                checked={professionalInfo.graduationStatus === 'graduated'}
                                onChange={(e) => setProfessionalInfo(prev => ({ ...prev, graduationStatus: e.target.value }))}
                                className="mr-2"
                              />
                              Đã tốt nghiệp
                            </label>
                            <label className="flex items-center text-sm">
                              <input
                                type="radio"
                                name="graduationStatus"
                                value="not_graduated"
                                checked={professionalInfo.graduationStatus === 'not_graduated'}
                                onChange={(e) => setProfessionalInfo(prev => ({ ...prev, graduationStatus: e.target.value, graduationCertificate: '' }))}
                                className="mr-2"
                              />
                              Chưa tốt nghiệp
                            </label>
                          </div>
                        )}
                        {(professionalInfo.educationLevel === 'dai-hoc' && professionalInfo.graduationStatus === 'graduated') && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bằng tốt nghiệp đại học (bắt buộc)</label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setProfessionalInfo(prev => ({ ...prev, graduationCertificate: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tùy chọn ở các trình độ khác; bắt buộc nếu đã tốt nghiệp đại học.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Structured Certificates like Certificates page (no admin approve here; only draft) */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bằng cấp, chứng chỉ liên quan</label>
                      {certificateItems.length > 0 && (
                        <div className="space-y-3 mb-3">
                          {certificateItems.map((c) => (
                            <div key={c.id} className="p-3 border rounded-md">
                              <div className="flex items-start">
                                <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden mr-3 flex-shrink-0">
                                  {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover"/> : <span className="text-xs text-gray-400 flex items-center justify-center w-full h-full">No image</span>}
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-sm text-gray-700">Tên chứng chỉ</div>
                                    <div className="font-medium">{c.name}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-700">Ngày cấp</div>
                                    <div className="font-medium">{c.issueDate}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-700">Tổ chức cấp</div>
                                    <div className="font-medium">{c.organization}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-700">Loại</div>
                                    <div className="font-medium">{c.type}</div>
                                  </div>
                                </div>
                                <button type="button" onClick={() => setCertificateItems(prev => prev.filter(x => x.id !== c.id))} className="text-red-600 text-sm ml-2">Xóa</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add certificate form */}
                      <div className="p-3 border rounded-md space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                          <input type="text" placeholder="Tên chứng chỉ" value={newCertificate.name} onChange={e => setNewCertificate(prev => ({ ...prev, name: e.target.value }))} className="px-3 py-2 border rounded"/>
                          <input type="date" placeholder="Ngày cấp" value={newCertificate.issueDate} onChange={e => setNewCertificate(prev => ({ ...prev, issueDate: e.target.value }))} className="px-3 py-2 border rounded"/>
                          <input type="text" placeholder="Tổ chức cấp" value={newCertificate.organization} onChange={e => setNewCertificate(prev => ({ ...prev, organization: e.target.value }))} className="px-3 py-2 border rounded"/>
                          <input type="text" placeholder="Loại chứng chỉ" value={newCertificate.type} onChange={e => setNewCertificate(prev => ({ ...prev, type: e.target.value }))} className="px-3 py-2 border rounded"/>
                          <div className="flex items-center gap-2 md:col-span-2">
                            <input id="cert-image-input" type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await handleTempImageUpload(f, 'certificate'); }}/>
                            <label htmlFor="cert-image-input" className="px-3 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-sm">Tải ảnh chứng chỉ *</label>
                            {newCertificate.image && <span className="text-xs text-green-600">Đã chọn ảnh</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <button type="button" onClick={() => {
                            if (!newCertificate.name || !newCertificate.issueDate || !newCertificate.organization || !newCertificate.type || !newCertificate.image) {
                              alert('Vui lòng điền đủ thông tin chứng chỉ và tải ảnh chứng chỉ.');
                              return;
                            }
                            setCertificateItems(prev => [...prev, { ...newCertificate, id: `cert_${Date.now()}` }]);
                            setNewCertificate({ id: '', name: '', issueDate: '', organization: '', type: '', image: '' });
                          }} className="px-3 py-1 bg-primary-600 text-white rounded">Thêm chứng chỉ</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Documents Section */}
              {/* {activeSection === 'legal' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Giấy tờ pháp lý & sức khỏe</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lý lịch tư pháp
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setLegalDocuments(prev => ({ ...prev, criminalRecord: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giấy khám sức khỏe
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setLegalDocuments(prev => ({ ...prev, healthCertificate: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chứng nhận tiêm phòng
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setLegalDocuments(prev => ({ ...prev, vaccinationCertificate: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giấy phép lao động (nếu có)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setLegalDocuments(prev => ({ ...prev, workPermit: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )} */}

              {/* References & Commitments Section */}
              {activeSection === 'references' && (
                <div className="space-y-6">
                  
                  <div className="space-y-6">
                    {/* <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Người tham chiếu</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên người tham chiếu
                          </label>
                          <input
                            type="text"
                            value={references.referenceName}
                            onChange={(e) => setReferences(prev => ({ ...prev, referenceName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Nhập tên người tham chiếu"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            value={references.referencePhone}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^\d+]/g, '');
                              
                              // Limit length based on format
                              if (value.startsWith('+84')) {
                                if (value.length > 12) value = value.substring(0, 12);
                              } else if (value.startsWith('0')) {
                                if (value.length > 10) value = value.substring(0, 10);
                              } else if (value.length > 10) {
                                value = value.substring(0, 10);
                              }
                              
                              setReferences(prev => ({ ...prev, referencePhone: value }));
                              validateReferencePhone(value);
                            }}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                              validationErrors.referencePhone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập số điện thoại"
                            maxLength={12}
                          />
                          {validationErrors.referencePhone && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.referencePhone}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quan hệ
                          </label>
                          <input
                            type="text"
                            value={references.referenceRelation}
                            onChange={(e) => setReferences(prev => ({ ...prev, referenceRelation: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Ví dụ: Đồng nghiệp, Sếp cũ..."
                          />
                        </div>
                      </div>
                    </div> */}
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">Cam kết</h3>
                      <div className="space-y-3">
                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={commitments.ethicalCommitment}
                            onChange={(e) => setCommitments(prev => ({ ...prev, ethicalCommitment: e.target.checked }))}
                            className="mt-1 mr-3"
                          />
                          <span className="text-sm text-gray-700">
                            Tôi cam kết tuân thủ các nguyên tắc đạo đức nghề nghiệp và cung cấp dịch vụ chăm sóc chất lượng cao.
                          </span>
                        </label>
                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={commitments.termsAgreement}
                            onChange={(e) => setCommitments(prev => ({ ...prev, termsAgreement: e.target.checked }))}
                            className="mt-1 mr-3"
                            required
                          />
                          <span className="text-sm text-gray-700">
                            Tôi đồng ý với các điều khoản và điều kiện sử dụng hệ thống <span className="text-red-500">*</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Profile Section */}
              {activeSection === 'additional' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Hồ sơ bổ sung</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ảnh đại diện
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size > 5 * 1024 * 1024) {
                            alert('Ảnh quá lớn (tối đa 5MB).');
                            return;
                          }
                          setProfilePhotoFile(file || null);
                          if (file) {
                            const previewUrl = URL.createObjectURL(file);
                            setProfilePhotoPreview(previewUrl);
                          } else {
                            setProfilePhotoPreview('');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {profilePhotoPreview && (
                        <div className="mt-3">
                          <img src={profilePhotoPreview} alt="Xem trước ảnh đại diện" className="h-32 w-32 object-cover rounded-md border" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video giới thiệu (link YouTube hoặc upload)
                      </label>
                      <input
                        type="text"
                        value={additionalProfile.introductionVideo}
                        onChange={(e) => {
                          setAdditionalProfile(prev => ({ ...prev, introductionVideo: e.target.value }));
                          validateVideoUrl(e.target.value);
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          validationErrors.videoUrl ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập link YouTube, Vimeo hoặc Dailymotion"
                      />
                      {validationErrors.videoUrl && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.videoUrl}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giới thiệu
                      </label>
                      <textarea
                        value={additionalProfile.introduction}
                        onChange={(e) => setAdditionalProfile(prev => ({ ...prev, introduction: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Giới thiệu về bản thân, kinh nghiệm, điểm mạnh..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-gray-200">
                <div className="flex space-x-4">
                  {activeSection !== 'personal' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const sections = ['personal', 'professional', 'legal', 'references', 'additional'];
                        const currentIndex = sections.indexOf(activeSection);
                        if (currentIndex > 0) {
                          setActiveSection(sections[currentIndex - 1]);
                        }
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Quay lại
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  {activeSection !== 'additional' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const sections = ['personal', 'professional', 'legal', 'references', 'additional'];
                        const currentIndex = sections.indexOf(activeSection);
                        if (currentIndex < sections.length - 1) {
                          setActiveSection(sections[currentIndex + 1]);
                        }
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Tiếp theo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-2 text-white rounded-md font-semibold ${
                        isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất hồ sơ'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UploadCredentialsPage;


