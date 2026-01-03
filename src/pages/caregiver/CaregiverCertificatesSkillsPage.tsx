import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiAward, FiStar, FiX, FiSave, FiCalendar, FiUser, FiImage, FiUpload } from 'react-icons/fi';

interface Certificate {
  id: number;
  name: string;
  issueDate: string;
  organization: string;
  type: string;
  image?: string;
  status?: 'approved' | 'pending' | 'rejected';
  adminNote?: string;
}

interface Skill {
  id: number;
  name: string;
  description?: string;
  image?: string;
}

interface CertificateFormData {
  name: string;
  issueDate: string;
  organization: string;
  type: string;
  image?: string;
}

interface SkillFormData {
  name: string;
  description: string;
  image?: string;
}

const CaregiverCertificatesSkillsPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pendingNotice, setPendingNotice] = useState<string>('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rejectionNotice, setRejectionNotice] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Modal states
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Form states
  const [certificateForm, setCertificateForm] = useState<CertificateFormData>({
    name: '',
    issueDate: '',
    organization: '',
    type: '',
    image: ''
  });

  const [skillForm, setSkillForm] = useState<SkillFormData>({
    name: '',
    description: '',
    image: ''
  });

  // Image preview states
  const [certificateImagePreview, setCertificateImagePreview] = useState<string>('');
  const [skillImagePreview, setSkillImagePreview] = useState<string>('');

  // External image upload (imgbb) if API key is configured
  const uploadImageIfPossible = async (dataUrl: string): Promise<string> => {
    try {
      const apiKey = (import.meta as any)?.env?.VITE_IMGBB_API_KEY as string | undefined;
      if (!apiKey) return '';
      const base64 = dataUrl.split(',')[1] || dataUrl;
      const formData = new FormData();
      formData.append('image', base64);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json?.data?.display_url) return json.data.display_url as string;
      return '';
    } catch {
      return '';
    }
  };

  // Recompress a data URL to stricter target
  const recompressDataUrl = async (dataUrl: string, maxWidth = 400, quality = 0.5): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img as HTMLImageElement;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  // Load user data on component mount and hydrate from user profile if available
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('Không tìm thấy userId. Vui lòng đăng nhập lại.');
        }

        const res = await axios.get(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
        const user = res.data;
          setCurrentUser(user);

        const prof = user?.profile?.professionalInfo || {};

        // Skills: prefer structured skillItems, else parse free-text skills
        const skillItems: any[] = Array.isArray((prof as any).skillItems) ? (prof as any).skillItems : [];
        if (skillItems.length > 0) {
          setSkills(
            skillItems.map((s: any, idx: number) => ({
              id: Number(s.id) || Date.now() + idx,
              name: s.name || '',
              description: s.description || '',
              image: s.image || ''
            }))
          );
        } else if (typeof prof.skills === 'string' && prof.skills.trim()) {
          setSkills(
            prof.skills
              .split(/\n|,|;/)
              .map((t: string) => t.trim())
              .filter(Boolean)
              .map((name: string, idx: number) => ({ id: Date.now() + idx, name }))
          );
        } else {
          setSkills([]);
        }

        // Certificates: handle both legacy (url only) and new detailed entries
        const certFiles: any[] = Array.isArray(prof.certificateFiles) ? (prof.certificateFiles as any[]) : [];
        const normalizedCertificates: Certificate[] = certFiles.map((c: any, idx: number) => {
          const image = c.image || c.url || '';
          const status = (c.status || 'approved') as 'approved' | 'pending' | 'rejected';
          // Backward-compatible field mapping
          const mappedName = c.name || c.title || c.certificateName || c.certName || 'Chứng chỉ';
          const mappedOrg = c.organization || c.org || c.issuer || c.organizationName || '—';
          const mappedIssueDate = c.issueDate || c.issuedAt || c.date || new Date().toISOString().slice(0, 10);
          const mappedType = c.type || c.category || 'Khác';
          return {
            id: Number(c.id) || Date.now() + idx,
            name: mappedName,
            issueDate: mappedIssueDate,
            organization: mappedOrg,
            type: mappedType,
            image,
            status,
            adminNote: c.adminNote || ''
          } as Certificate;
        });
        setCertificates(normalizedCertificates);

        if (normalizedCertificates.some(c => c.status === 'pending')) {
          setPendingNotice('Chứng chỉ của bạn đang chờ admin duyệt trước khi hiển thị.');
        } else {
          setPendingNotice('');
        }

        const rejectedCount = normalizedCertificates.filter(c => c.status === 'rejected').length;
        setRejectionNotice(rejectedCount > 0 ? `Có ${rejectedCount} chứng chỉ bị từ chối. Vui lòng upload lại chứng chỉ mới.` : '');
      } catch (error) {
        console.error('Error loading user data:', error);
        setCertificates([]);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Periodically refresh to reflect admin approval/rejection while user is on page
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await axios.get(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
        const prof = res.data?.profile?.professionalInfo || {};
        const certFiles: any[] = Array.isArray(prof.certificateFiles) ? (prof.certificateFiles as any[]) : [];
        const normalizedCertificates: Certificate[] = certFiles.map((c: any, idx: number) => ({
          id: Number(c.id) || Date.now() + idx,
          name: c.name || c.title || c.certificateName || c.certName || 'Chứng chỉ',
          issueDate: c.issueDate || c.issuedAt || c.date || new Date().toISOString().slice(0, 10),
          organization: c.organization || c.org || c.issuer || c.organizationName || '—',
          type: c.type || c.category || 'Khác',
          image: c.image || c.url || '',
          status: (c.status || 'approved') as any,
          adminNote: c.adminNote || ''
        }));
        setCertificates(normalizedCertificates);
        setPendingNotice(normalizedCertificates.some(c => c.status === 'pending') ? 'Chứng chỉ của bạn đang chờ admin duyệt trước khi hiển thị.' : '');
        const rejectedCount = normalizedCertificates.filter(c => c.status === 'rejected').length;
        setRejectionNotice(rejectedCount > 0 ? `Có ${rejectedCount} chứng chỉ bị từ chối. Vui lòng upload lại chứng chỉ mới.` : '');
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Image handling functions - robust reader-first approach with optional recompress
  const handleImageUpload = (file: File, type: 'certificate' | 'skill') => {
    const reader = new FileReader();
    reader.onerror = () => alert('Không thể đọc file ảnh. Vui lòng thử lại với ảnh khác.');
    reader.onload = async () => {
      try {
        const rawDataUrl = reader.result as string;
        // Try to recompress to keep size reasonable
        let dataUrl = rawDataUrl;
        try {
          dataUrl = await recompressDataUrl(rawDataUrl, 600, 0.6);
        } catch {}
        if (type === 'certificate') {
          setCertificateImagePreview(dataUrl);
          setCertificateForm(prev => ({ ...prev, image: dataUrl }));
        } else {
          setSkillImagePreview(dataUrl);
          setSkillForm(prev => ({ ...prev, image: dataUrl }));
        }
      } catch (e) {
        alert('Xử lý ảnh thất bại. Vui lòng thử lại.');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'certificate' | 'skill') => {
    if (type === 'certificate') {
      setCertificateImagePreview('');
      setCertificateForm(prev => ({ ...prev, image: '' }));
    } else {
      setSkillImagePreview('');
      setSkillForm(prev => ({ ...prev, image: '' }));
    }
  };

  // Certificate functions
  const openCertificateModal = (certificate?: Certificate) => {
    if (certificate) {
      setEditingCertificate(certificate);
      setCertificateForm({
        name: certificate.name,
        issueDate: certificate.issueDate,
        organization: certificate.organization,
        type: certificate.type,
        image: certificate.image || ''
      });
      setCertificateImagePreview(certificate.image || '');
    } else {
      setEditingCertificate(null);
      setCertificateForm({
        name: '',
        issueDate: '',
        organization: '',
        type: '',
        image: ''
      });
      setCertificateImagePreview('');
    }
    setShowCertificateModal(true);
  };

  const closeCertificateModal = () => {
    setShowCertificateModal(false);
    setEditingCertificate(null);
    setCertificateForm({ name: '', issueDate: '', organization: '', type: '', image: '' });
    setCertificateImagePreview('');
  };

  const saveCertificate = async () => {
    // Require image for certificates
    if (!certificateForm.image) {
      alert('Vui lòng tải ảnh chứng chỉ trước khi lưu.');
      return;
    }
    setLoading(true);
    try {
      let nextCertificates: Certificate[] = [];
      // Prefer external upload; else fallback to base64 with strict size cap
      let hostedUrl = '';
      if (certificateForm.image?.startsWith('data:')) {
        hostedUrl = await uploadImageIfPossible(certificateForm.image);
      }
      let imageToStore = hostedUrl || certificateForm.image || '';
      if (!hostedUrl) {
        // Approx byte size from base64 length
        const approxBytes = Math.floor((imageToStore.length * 3) / 4);
        if (approxBytes > 160_000) {
          // Recompress more aggressively to stay under MockAPI limits
          imageToStore = await recompressDataUrl(imageToStore, 400, 0.5);
        }
        const finalBytes = Math.floor((imageToStore.length * 3) / 4);
        if (finalBytes > 200_000) {
          alert('Ảnh chứng chỉ vẫn quá lớn sau khi nén. Vui lòng chọn ảnh nhỏ hơn (≤ 200KB).');
          return;
        }
      }
      if (editingCertificate) {
        nextCertificates = certificates.map(cert =>
          cert.id === editingCertificate.id
            ? { ...cert, ...certificateForm, image: imageToStore, status: 'pending' as const }
            : cert
        );
      } else {
        const newCertificate: Certificate = {
          id: Date.now(),
          ...certificateForm,
          image: imageToStore,
          status: 'pending'
        };
        nextCertificates = [...certificates, newCertificate];
      }
      setCertificates(nextCertificates);
      // Show pending notice immediately
      if (nextCertificates.some(c => c.status === 'pending')) {
        setPendingNotice('Chứng chỉ của bạn đang chờ admin duyệt trước khi hiển thị.');
      }

      // Persist to API with minimal PATCH payload; fallback gracefully
      const userId = currentUser?.id || localStorage.getItem('userId');
      if (userId) {
        const mergedCertificateFiles = nextCertificates.map((c) => ({
          id: String(c.id),
          name: c.name,
          issueDate: c.issueDate,
          organization: c.organization,
          type: c.type,
          url: c.image,
          status: c.status || 'pending',
          uploadedAt: new Date().toISOString(),
          adminNote: c.adminNote || ''
        }));

        const minimalPayload = {
          profile: {
            professionalInfo: {
              // Include both to avoid wiping skills on shallow merge backends
              certificateFiles: mergedCertificateFiles,
              skillItems: skills.map((s) => ({ id: String(s.id), name: s.name, description: s.description, image: s.image }))
            }
          }
        } as any;

        let saved = false;
        try {
          const res = await axios.patch(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`, minimalPayload, { headers: { 'Content-Type': 'application/json' } });
          setCurrentUser(res.data);
          saved = true;
        } catch {}

        if (!saved) {
          try {
            const res2 = await axios.put(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`, minimalPayload, { headers: { 'Content-Type': 'application/json' } });
            setCurrentUser(res2.data);
            saved = true;
          } catch {}
        }

        if (!saved) {
          try {
            const key = `pending_certificate_files_${userId}`;
            localStorage.setItem(key, JSON.stringify(mergedCertificateFiles));
            // Soft notice via state
            setPendingNotice('Mạng không ổn định. Đã lưu cục bộ chứng chỉ và sẽ tự đồng bộ khi mạng ổn định.');
            saved = true;
          } catch (e: any) {
            console.error('Save certificate failed (offline fallback):', e);
            alert(`Không thể lưu chứng chỉ: ${e?.response?.status || e?.message || 'Network Error'}`);
          }
        }

        // Verify by fetching latest from API and updating local when possible
        try {
          const verify = await axios.get(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`);
          setCurrentUser(verify.data);
        } catch {}
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
    } finally {
      setLoading(false);
      // Always close modal even if API fails (optimistic UI)
      closeCertificateModal();
    }
  };

  const deleteCertificate = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa chứng chỉ này?')) {
      setLoading(true);
      try {
        const updatedCertificates = certificates.filter(cert => cert.id !== id);
        setCertificates(updatedCertificates);

        // Persist to API (ensure admin reads "url" field)
        const userId = currentUser?.id || localStorage.getItem('userId');
        if (userId) {
          const payload = {
            ...currentUser,
            profile: {
              ...(currentUser?.profile || {}),
              professionalInfo: {
                ...((currentUser?.profile && currentUser.profile.professionalInfo) || {}),
                // Also include skills to avoid accidental deletion on replace writes
                skillItems: skills.map((s) => ({ id: String(s.id), name: s.name, description: s.description, image: s.image })),
                certificateFiles: updatedCertificates.map((c) => ({
                  id: String(c.id),
                  name: c.name,
                  issueDate: c.issueDate,
                  organization: c.organization,
                  type: c.type,
                  url: c.image,
                  status: c.status || 'approved',
                  uploadedAt: new Date().toISOString(),
                }))
              }
            }
          };
          const res = await axios.put(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`, payload);
          setCurrentUser(res.data);
        }
      } catch (error) {
        console.error('Error deleting certificate:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Skill functions
  const openSkillModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillForm({
        name: skill.name,
        description: skill.description || '',
        image: skill.image || ''
      });
      setSkillImagePreview(skill.image || '');
    } else {
      setEditingSkill(null);
      setSkillForm({
        name: '',
        description: '',
        image: ''
      });
      setSkillImagePreview('');
    }
    setShowSkillModal(true);
  };

  const closeSkillModal = () => {
    setShowSkillModal(false);
    setEditingSkill(null);
    setSkillForm({ name: '', description: '', image: '' });
    setSkillImagePreview('');
  };

  const saveSkill = async () => {
    setLoading(true);
    try {
      let nextSkills: Skill[] = [];
      if (editingSkill) {
        nextSkills = skills.map(skill =>
          skill.id === editingSkill.id
            ? { ...skill, ...skillForm }
            : skill
        );
      } else {
        const newSkill: Skill = {
          id: Date.now(),
          ...skillForm
        };
        nextSkills = [...skills, newSkill];
      }
      setSkills(nextSkills);

      // Persist to API as structured skillItems
      const userId = currentUser?.id || localStorage.getItem('userId');
      if (userId) {
        const payload = {
          ...currentUser,
          profile: {
            ...(currentUser?.profile || {}),
            professionalInfo: {
              ...((currentUser?.profile && currentUser.profile.professionalInfo) || {}),
              skillItems: nextSkills.map((s) => ({ id: String(s.id), name: s.name, description: s.description, image: s.image }))
            }
          }
        };
        const res = await axios.put(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`, payload);
        setCurrentUser(res.data);
      }
      closeSkillModal();
    } catch (error) {
      console.error('Error saving skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa kỹ năng này?')) {
      setLoading(true);
      try {
        const updatedSkills = skills.filter(skill => skill.id !== id);
        setSkills(updatedSkills);

        // Persist to API as structured skillItems
        const userId = currentUser?.id || localStorage.getItem('userId');
        if (userId) {
          const payload = {
            ...currentUser,
            profile: {
              ...(currentUser?.profile || {}),
              professionalInfo: {
                ...((currentUser?.profile && currentUser.profile.professionalInfo) || {}),
                skillItems: updatedSkills.map((s) => ({ id: String(s.id), name: s.name, description: s.description, image: s.image }))
              }
            }
          };
          const res = await axios.put(`https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`, payload);
          setCurrentUser(res.data);
        }
      } catch (error) {
        console.error('Error deleting skill:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header - align title style with other pages */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Chứng chỉ & Kỹ năng
              </h1>
              <p className="text-gray-600">Quản lý chứng chỉ đã được duyệt. Chứng chỉ mới sẽ chờ admin xét duyệt.</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Thông báo chứng chỉ"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {(pendingNotice || rejectionNotice) && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-red-600 text-white rounded-full">!
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-3 border-b font-medium text-gray-800">Thông báo chứng chỉ</div>
                  <div className="max-h-60 overflow-auto p-3 space-y-2">
                    {!pendingNotice && !rejectionNotice && (
                      <div className="text-sm text-gray-500">Không có thông báo</div>
                    )}
                    {pendingNotice && (
                      <div className="p-2 rounded border border-yellow-200 bg-yellow-50 text-yellow-700 text-sm">{pendingNotice}</div>
                    )}
                    {rejectionNotice && (
                      <div className="p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{rejectionNotice}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certificates Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <FiAward className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Chứng chỉ</h2>
                  
                </div>
              </div>
              <button
                onClick={() => openCertificateModal()}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2 text-sm"
                disabled={loading}
              >
                <FiPlus className="h-4 w-4" />
                <span>Thêm</span>
              </button>
            </div>

            {certificates.filter(c => c.status !== 'rejected').length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiAward className="h-8 w-8 text-teal-500" />
                </div>
                <p className="text-gray-500 text-sm mb-4">Chưa có chứng chỉ nào</p>
                <button
                  onClick={() => openCertificateModal()}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Thêm chứng chỉ đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.filter(c => c.status !== 'rejected').map((certificate) => (
                  <div
                    key={certificate.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Certificate Image */}
                      <div className="flex-shrink-0">
                        {certificate.image ? (
                          <img
                            src={certificate.image}
                            alt={certificate.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <FiImage className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Certificate Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {certificate.name}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Ngày cấp: {formatDate(certificate.issueDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <FiUser className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Tổ chức: {certificate.organization}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="inline-block bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">
                            {certificate.type}
                          </span>
                          {certificate.status === 'pending' && (
                            <span className="inline-block bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded">Đang chờ duyệt</span>
                          )}
                        </div>
                        {certificate.status === 'rejected' && certificate.adminNote && (
                          <div className="mt-2 text-xs text-red-600">Bị từ chối: {certificate.adminNote}</div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openCertificateModal(certificate)}
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          disabled={loading}
                          title="Chỉnh sửa"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCertificate(certificate.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={loading}
                          title="Xóa"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FiStar className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Kỹ năng</h2>
               
                </div>
              </div>
              <button
                onClick={() => openSkillModal()}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm"
                disabled={loading}
              >
                <FiPlus className="h-4 w-4" />
                <span>Thêm</span>
              </button>
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiStar className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-gray-500 text-sm mb-4">Chưa có kỹ năng nào</p>
                <button
                  onClick={() => openSkillModal()}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Thêm kỹ năng đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Skill Image */}
                      <div className="flex-shrink-0">
                        {skill.image ? (
                          <img
                            src={skill.image}
                            alt={skill.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <FiImage className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Skill Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {skill.name}
                        </h3>
                        {skill.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">
                            {skill.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded">
                            Kỹ năng chuyên môn
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openSkillModal(skill)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          disabled={loading}
                          title="Chỉnh sửa"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={loading}
                          title="Xóa"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCertificate ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ mới'}
                </h3>
                <button
                  onClick={closeCertificateModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chứng chỉ *
                  </label>
                  <input
                    type="text"
                    value={certificateForm.name}
                    onChange={(e) => setCertificateForm({ ...certificateForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: Chứng chỉ chăm sóc người cao tuổi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày cấp *
                  </label>
                  <input
                    type="date"
                    value={certificateForm.issueDate}
                    onChange={(e) => setCertificateForm({ ...certificateForm, issueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổ chức cấp chứng chỉ *
                  </label>
                  <input
                    type="text"
                    value={certificateForm.organization}
                    onChange={(e) => setCertificateForm({ ...certificateForm, organization: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: Viện Đào tạo Y tế TP.HCM"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại chứng chỉ *
                  </label>
                  <select
                    value={certificateForm.type}
                    onChange={(e) => setCertificateForm({ ...certificateForm, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Chọn loại chứng chỉ</option>
                    <option value="Chăm sóc sức khỏe">Chăm sóc sức khỏe</option>
                    <option value="Sơ cứu">Sơ cứu</option>
                    <option value="Dinh dưỡng">Dinh dưỡng</option>
                    <option value="Vật lý trị liệu">Vật lý trị liệu</option>
                    <option value="Tâm lý học">Tâm lý học</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh chứng chỉ *
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {certificateImagePreview && (
                      <div className="relative">
                        <img
                          src={certificateImagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('certificate')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Nhấp để tải ảnh</span> hoặc kéo thả
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Kích thước file không được vượt quá 5MB');
                                return;
                              }
                              handleImageUpload(file, 'certificate');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={saveCertificate}
                  disabled={loading || !certificateForm.name || !certificateForm.issueDate || !certificateForm.organization || !certificateForm.type || !certificateForm.image}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <FiSave className="h-4 w-4" />
                  <span>{loading ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
                <button
                  onClick={closeCertificateModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSkill ? 'Sửa kỹ năng' : 'Thêm kỹ năng mới'}
                </h3>
                <button
                  onClick={closeSkillModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên kỹ năng *
                  </label>
                  <input
                    type="text"
                    value={skillForm.name}
                    onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: Chăm sóc người bệnh nằm liệt"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={skillForm.description}
                    onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mô tả chi tiết về kỹ năng, kinh nghiệm của bạn..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh minh họa (tùy chọn)
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {skillImagePreview && (
                      <div className="relative">
                        <img
                          src={skillImagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('skill')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Nhấp để tải ảnh</span> hoặc kéo thả
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Kích thước file không được vượt quá 5MB');
                                return;
                              }
                              handleImageUpload(file, 'skill');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={saveSkill}
                  disabled={loading || !skillForm.name}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <FiSave className="h-4 w-4" />
                  <span>{loading ? 'Đang lưu...' : 'Lưu'}</span>
                </button>
                <button
                  onClick={closeSkillModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverCertificatesSkillsPage;