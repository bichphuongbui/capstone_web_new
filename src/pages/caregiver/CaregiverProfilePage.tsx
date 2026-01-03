import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  status?: string;
  profile?: CaregiverProfile;
}

interface CertificateFile {
  id: string;
  url: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNote?: string;
}

interface CaregiverProfile {
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
    certificates?: string;
    certificateFiles?: CertificateFile[] | string[]; // Support both formats during transition
    skillItems?: {
      id: string;
      name: string;
      description?: string;
      image?: string;
    }[]; // Structured skills
    // New fields
    educationLevel?: string; // 'trung-cap' | 'cao-dang' | 'dai-hoc' | 'sau-dai-hoc'
    graduationStatus?: string; // 'graduated' | 'not_graduated'
    graduationCertificate?: string; // base64
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
    specialAbilities?: string; // legacy
    introduction?: string; // new
  };
}

const CaregiverProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstErrorRef = useRef<HTMLElement | null>(null);

  // Form states
  const [personalInfo, setPersonalInfo] = useState<
    Required<NonNullable<CaregiverProfile["personalInfo"]>>
  >({
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    permanentAddress: "",
    temporaryAddress: "",
    phone: "",
    idCardFront: "",
    idCardBack: "",
  });

  const [professionalInfo, setProfessionalInfo] = useState<
    Required<NonNullable<CaregiverProfile["professionalInfo"]>>
  >({
    yearsOfExperience: 0,
    previousWorkplace: "",
    skills: "",
    certificates: "",
    certificateFiles: [] as CertificateFile[],
    skillItems: [] as {
      id: string;
      name: string;
      description?: string;
      image?: string;
    }[],
    educationLevel: "",
    graduationStatus: "",
    graduationCertificate: "",
  });

  const [legalDocuments, setLegalDocuments] = useState<
    Required<NonNullable<CaregiverProfile["legalDocuments"]>>
  >({
    criminalRecord: "",
    healthCertificate: "",
    vaccinationCertificate: "",
    workPermit: "",
  });

  const [references, setReferences] = useState<
    Required<NonNullable<CaregiverProfile["references"]>>
  >({
    referenceName: "",
    referencePhone: "",
    referenceRelation: "",
  });

  const [commitments, setCommitments] = useState<
    Required<NonNullable<CaregiverProfile["commitments"]>>
  >({
    ethicalCommitment: false,
    termsAgreement: false,
  });

  const [additionalProfile, setAdditionalProfile] = useState<
    Required<NonNullable<CaregiverProfile["additionalProfile"]>>
  >({
    profilePhoto: "",
    introductionVideo: "",
    specialAbilities: "",
    introduction: "",
  });

  // File upload states
  const [filePreviews, setFilePreviews] = useState<{
    criminalRecord?: string;
    healthCertificate?: string;
    vaccinationCertificate?: string;
    workPermit?: string;
    idCardFront?: string;
    idCardBack?: string;
    profilePhoto?: string;
  }>({});

  const [certificatePreviews, setCertificatePreviews] = useState<
    CertificateFile[]
  >([]);
  const [pendingCertificates, setPendingCertificates] = useState<
    CertificateFile[]
  >([]);
  const [certificateNotifications, setCertificateNotifications] = useState<
    string[]
  >([]);
  const [showBell, setShowBell] = useState(false);

  // Languages removed per requirements

  // Parse and merge structured skillItems with free-text skills
  const parsedSkills = useMemo(() => {
    const raw = professionalInfo.skills || "";
    const freeText = raw
      .split(/\n|,|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    const structured = (professionalInfo.skillItems || [])
      .map((s) => s.name)
      .filter(Boolean);
    return [...structured, ...freeText].slice(0, 50);
  }, [professionalInfo.skills, professionalInfo.skillItems]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        setMessage("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
        return;
      }
      try {
        const res = await axios.get<UserData>(
          `https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`
        );
        const userData = res.data;
        setUser(userData);

        const profile = userData.profile || {};
        setPersonalInfo((prev) => ({
          ...prev,
          ...profile.personalInfo,
        }));
        setProfessionalInfo((prev) => ({
          ...prev,
          ...profile.professionalInfo,
          yearsOfExperience:
            profile.professionalInfo?.yearsOfExperience ??
            prev.yearsOfExperience,
          skillItems: (profile.professionalInfo as any)?.skillItems || [],
          educationLevel:
            (profile.professionalInfo as any)?.educationLevel || "",
          graduationStatus:
            (profile.professionalInfo as any)?.graduationStatus || "",
          graduationCertificate:
            (profile.professionalInfo as any)?.graduationCertificate || "",
        }));
        setLegalDocuments((prev) => ({
          ...prev,
          ...profile.legalDocuments,
        }));
        setReferences((prev) => ({
          ...prev,
          ...profile.references,
        }));
        setCommitments((prev) => ({
          ...prev,
          ...profile.commitments,
        }));
        setAdditionalProfile((prev) => ({
          ...prev,
          ...profile.additionalProfile,
          introduction:
            (profile.additionalProfile as any)?.introduction ||
            (profile.additionalProfile as any)?.specialAbilities ||
            "",
        }));

        // Load existing file previews
        if (profile.legalDocuments) {
          setFilePreviews((prev) => ({
            ...prev,
            criminalRecord: profile.legalDocuments?.criminalRecord || "",
            healthCertificate: profile.legalDocuments?.healthCertificate || "",
            vaccinationCertificate:
              profile.legalDocuments?.vaccinationCertificate || "",
            workPermit: profile.legalDocuments?.workPermit || "",
          }));
        }

        if (profile.personalInfo) {
          setFilePreviews((prev) => ({
            ...prev,
            idCardFront: profile.personalInfo?.idCardFront || "",
            idCardBack: profile.personalInfo?.idCardBack || "",
          }));
        }

        if (profile.additionalProfile) {
          setFilePreviews((prev) => ({
            ...prev,
            profilePhoto: profile.additionalProfile?.profilePhoto || "",
          }));
        }

        // Merge locally saved full profile (with images) as fallback when API strips base64
        try {
          const localFullStr = localStorage.getItem("caregiver_profile_full");
          if (localFullStr) {
            const localFull = JSON.parse(localFullStr) as CaregiverProfile;
            if (
              localFull.personalInfo?.idCardFront ||
              localFull.personalInfo?.idCardBack
            ) {
              setPersonalInfo((prev) => ({
                ...prev,
                idCardFront:
                  localFull.personalInfo?.idCardFront || prev.idCardFront,
                idCardBack:
                  localFull.personalInfo?.idCardBack || prev.idCardBack,
              }));
              setFilePreviews((prev) => ({
                ...prev,
                idCardFront:
                  localFull.personalInfo?.idCardFront || prev.idCardFront,
                idCardBack:
                  localFull.personalInfo?.idCardBack || prev.idCardBack,
              }));
            }
            if (localFull.additionalProfile?.profilePhoto) {
              setAdditionalProfile((prev) => ({
                ...prev,
                profilePhoto:
                  localFull.additionalProfile?.profilePhoto ||
                  prev.profilePhoto,
              }));
              setFilePreviews((prev) => ({
                ...prev,
                profilePhoto:
                  localFull.additionalProfile?.profilePhoto ||
                  prev.profilePhoto,
              }));
            }
            if (
              Array.isArray(
                (localFull as any)?.professionalInfo?.certificateFiles
              )
            ) {
              const localCerts = (localFull as any).professionalInfo
                .certificateFiles as any[];
              // Support both string[] and CertificateFile[]
              const normalized: CertificateFile[] = localCerts.map(
                (c: any, idx: number) =>
                  typeof c === "string"
                    ? {
                        id: `local-${idx}`,
                        url: c,
                        status: "pending",
                        uploadedAt: new Date().toISOString(),
                      }
                    : c
              );
              // Keep only approved for previews, pending for info
              setCertificatePreviews((prev) =>
                prev.length
                  ? prev
                  : normalized.filter((c) => c.status === "approved")
              );
              setPendingCertificates((prev) =>
                prev.length
                  ? prev
                  : normalized.filter((c) => c.status === "pending")
              );
            }
          }
        } catch {}

        if (profile.professionalInfo?.certificateFiles) {
          // Handle both old format (string[]) and new format (CertificateFile[])
          const certificateFiles = profile.professionalInfo.certificateFiles;

          if (certificateFiles.length > 0) {
            // Check if it's old format (strings) or new format (objects)
            const isOldFormat = typeof certificateFiles[0] === "string";

            if (isOldFormat) {
              // Convert old format to new format - treat all as approved
              const convertedCertificates: CertificateFile[] = (
                certificateFiles as string[]
              ).map((url, index) => ({
                id: `legacy-${index}`,
                url: url,
                status: "approved" as const,
                uploadedAt: new Date().toISOString(),
                approvedAt: new Date().toISOString(),
              }));

              const approvedCertificates = convertedCertificates.filter(
                (cert) => cert.status === "approved"
              );
              const pendingCertificates = convertedCertificates.filter(
                (cert) => cert.status === "pending"
              );
              const rejectedCertificates = convertedCertificates.filter(
                (cert) => cert.status === "rejected"
              );
              setCertificatePreviews(approvedCertificates);
              setPendingCertificates(pendingCertificates);

              // Show notifications for rejected certificates
              if (rejectedCertificates.length > 0) {
                setCertificateNotifications((prev) => [
                  ...prev,
                  `Có ${rejectedCertificates.length} chứng chỉ đã bị admin từ chối. Vui lòng upload lại chứng chỉ mới.`,
                ]);
              }

              // Update the professional info with converted format
              setProfessionalInfo((prev) => ({
                ...prev,
                certificateFiles: convertedCertificates,
              }));
            } else {
              // New format - use as is
              const newFormatCertificates =
                certificateFiles as CertificateFile[];
              const approvedCertificates = newFormatCertificates.filter(
                (cert) => cert.status === "approved"
              );
              const pendingCertificates = newFormatCertificates.filter(
                (cert) => cert.status === "pending"
              );
              const rejectedCertificates = newFormatCertificates.filter(
                (cert) => cert.status === "rejected"
              );
              setCertificatePreviews(approvedCertificates);
              setPendingCertificates(pendingCertificates);

              // Show notifications for rejected certificates
              if (rejectedCertificates.length > 0) {
                setCertificateNotifications((prev) => [
                  ...prev,
                  `Có ${rejectedCertificates.length} chứng chỉ đã bị admin từ chối. Vui lòng upload lại chứng chỉ mới.`,
                ]);
              }

              // Show notifications for pending certificates
              if (pendingCertificates.length > 0) {
                setCertificateNotifications((prev) => [
                  ...prev,
                  `Có ${pendingCertificates.length} chứng chỉ đang chờ admin duyệt.`,
                ]);
              }
            }
          }
        }
      } catch (e) {
        setMessage("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAge = (isoDate: string): number => {
    if (!isoDate) return 0;
    const today = new Date();
    const birth = new Date(isoDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const validators = {
    dateOfBirth: (v: string) => {
      if (!v) return "Vui lòng chọn ngày sinh";
      const age = getAge(v);
      if (age < 18) return "Bạn phải đủ 18 tuổi trở lên";
      if (age > 65) return "Độ tuổi vượt quá giới hạn (≤ 65)";
      return "";
    },
    gender: (v: string) => (!v ? "Vui lòng chọn giới tính" : ""),
    phone: (v: string) =>
      !/^(0[3|5|7|8|9])[0-9]{8}$|^(\+84[3|5|7|8|9])[0-9]{8}$/.test(v)
        ? "Số điện thoại VN không hợp lệ"
        : "",
    permanentAddress: (v: string) =>
      !v || v.trim().length < 5 ? "Địa chỉ thường trú tối thiểu 5 ký tự" : "",
    yearsOfExperience: (v: number) =>
      v < 0 || v > 50 ? "Số năm kinh nghiệm 0-50" : "",
  } as const;

  // Pure validity check (no state updates) for UI disabling
  const isValid = React.useMemo(() => {
    // Always allow saving - validation will be done in handleSave
    return true;
  }, []);

  const onFieldBlur = (field: keyof typeof validators, value: any) => {
    const err = (validators as any)[field](value);
    setErrors((prev) => {
      const next = { ...prev } as Record<string, string>;
      if (err) next[field as string] = err;
      else delete next[field as string];
      return next;
    });
  };

  const handleFileUpload = async (
    field: keyof typeof filePreviews,
    file: File
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File quá lớn (tối đa 5MB)");
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      setMessage("Chỉ chấp nhận file ảnh (JPG, PNG) hoặc PDF");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFilePreviews((prev) => ({ ...prev, [field]: dataUrl }));

        // Update corresponding fields
        if (field === "criminalRecord") {
          setLegalDocuments((prev) => ({ ...prev, criminalRecord: dataUrl }));
        } else if (field === "healthCertificate") {
          setLegalDocuments((prev) => ({
            ...prev,
            healthCertificate: dataUrl,
          }));
        } else if (field === "vaccinationCertificate") {
          setLegalDocuments((prev) => ({
            ...prev,
            vaccinationCertificate: dataUrl,
          }));
        } else if (field === "workPermit") {
          setLegalDocuments((prev) => ({ ...prev, workPermit: dataUrl }));
        } else if (field === "idCardFront") {
          setPersonalInfo((prev) => ({ ...prev, idCardFront: dataUrl }));
        } else if (field === "idCardBack") {
          setPersonalInfo((prev) => ({ ...prev, idCardBack: dataUrl }));
        } else if (field === "profilePhoto") {
          setAdditionalProfile((prev) => ({ ...prev, profilePhoto: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage("Có lỗi khi upload file");
    }
  };

  const removeFile = (field: keyof typeof filePreviews) => {
    setFilePreviews((prev) => ({ ...prev, [field]: "" }));

    // Clear corresponding fields
    if (field === "criminalRecord") {
      setLegalDocuments((prev) => ({ ...prev, criminalRecord: "" }));
    } else if (field === "healthCertificate") {
      setLegalDocuments((prev) => ({ ...prev, healthCertificate: "" }));
    } else if (field === "vaccinationCertificate") {
      setLegalDocuments((prev) => ({ ...prev, vaccinationCertificate: "" }));
    } else if (field === "workPermit") {
      setLegalDocuments((prev) => ({ ...prev, workPermit: "" }));
    } else if (field === "idCardFront") {
      setPersonalInfo((prev) => ({ ...prev, idCardFront: "" }));
    } else if (field === "idCardBack") {
      setPersonalInfo((prev) => ({ ...prev, idCardBack: "" }));
    } else if (field === "profilePhoto") {
      setAdditionalProfile((prev) => ({ ...prev, profilePhoto: "" }));
    }
  };

  // Upload/sửa chứng chỉ được chuyển sang trang Chứng chỉ & Kỹ năng

  const clearNotification = (index: number) => {
    setCertificateNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllNotifications = () => {
    setCertificateNotifications([]);
  };

  const handleSave = async () => {
    setMessage("");

    // Check for critical validation errors but don't block saving
    const criticalErrors: Record<string, string> = {};

    // Only validate if user has entered data
    if (personalInfo.dateOfBirth) {
      const ageError = validators.dateOfBirth(personalInfo.dateOfBirth);
      if (ageError) criticalErrors.dateOfBirth = ageError;
    }

    if (personalInfo.gender) {
      const genderError = validators.gender(personalInfo.gender);
      if (genderError) criticalErrors.gender = genderError;
    }

    if (personalInfo.phone) {
      const phoneError = validators.phone(personalInfo.phone);
      if (phoneError) criticalErrors.phone = phoneError;
    }

    if (personalInfo.permanentAddress) {
      const addressError = validators.permanentAddress(
        personalInfo.permanentAddress
      );
      if (addressError) criticalErrors.permanentAddress = addressError;
    }

    if (
      professionalInfo.yearsOfExperience !== undefined &&
      professionalInfo.yearsOfExperience !== null
    ) {
      const expError = validators.yearsOfExperience(
        professionalInfo.yearsOfExperience
      );
      if (expError) criticalErrors.yearsOfExperience = expError;
    }

    // Validate education if needed
    if (
      professionalInfo.educationLevel === "dai-hoc" &&
      professionalInfo.graduationStatus === "graduated"
    ) {
      if (!professionalInfo.graduationCertificate) {
        criticalErrors.graduationCertificate =
          "Cần tải bằng tốt nghiệp đại học";
      }
    }

    // Show errors but don't block saving
    setErrors(criticalErrors);
    if (Object.keys(criticalErrors).length > 0) {
      setMessage(
        "Có một số lỗi format, nhưng vẫn có thể lưu. Vui lòng kiểm tra lại thông tin."
      );
    }

    const userId = user?.id || localStorage.getItem("userId");
    if (!userId) {
      setMessage("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    // Validate and prepare profile data
    const updatedProfile: CaregiverProfile = {
      personalInfo: {
        ...personalInfo,
        // Ensure all required fields have default values
        dateOfBirth: personalInfo.dateOfBirth || "",
        gender: personalInfo.gender || "",
        idNumber: personalInfo.idNumber || "",
        permanentAddress: personalInfo.permanentAddress || "",
        temporaryAddress: personalInfo.temporaryAddress || "",
        phone: personalInfo.phone || "",
        idCardFront: personalInfo.idCardFront || "",
        idCardBack: personalInfo.idCardBack || "",
      },
      professionalInfo: {
        ...professionalInfo,
        yearsOfExperience: professionalInfo.yearsOfExperience || 0,
        previousWorkplace: professionalInfo.previousWorkplace || "",
        skills: professionalInfo.skills || "",
        certificates: professionalInfo.certificates || "",
        certificateFiles: professionalInfo.certificateFiles || [],
        educationLevel: professionalInfo.educationLevel || "",
        graduationStatus: professionalInfo.graduationStatus || "",
        graduationCertificate: professionalInfo.graduationCertificate || "",
      },
      legalDocuments: {
        ...legalDocuments,
        criminalRecord: legalDocuments.criminalRecord || "",
        healthCertificate: legalDocuments.healthCertificate || "",
        vaccinationCertificate: legalDocuments.vaccinationCertificate || "",
        workPermit: legalDocuments.workPermit || "",
      },
      references: {
        ...references,
        referenceName: references.referenceName || "",
        referencePhone: references.referencePhone || "",
        referenceRelation: references.referenceRelation || "",
      },
      commitments: {
        ...commitments,
        ethicalCommitment: commitments.ethicalCommitment || false,
        termsAgreement: commitments.termsAgreement || false,
      },
      additionalProfile: {
        ...additionalProfile,
        profilePhoto: additionalProfile.profilePhoto || "",
        introductionVideo: additionalProfile.introductionVideo || "",
        specialAbilities: additionalProfile.specialAbilities || "",
        introduction:
          additionalProfile.introduction ||
          additionalProfile.specialAbilities ||
          "",
      },
    };

    setSaving(true);
    try {
      console.log("Saving profile with data:", {
        userId,
        email: user?.email,
        profile: updatedProfile,
      });

      // Prepare data for API - ensure all fields are properly formatted
      const apiData = {
        ...user, // Keep existing user data
        email: user?.email,
        profile: {
          ...updatedProfile,
          professionalInfo: {
            ...updatedProfile.professionalInfo,
            certificateFiles:
              updatedProfile.professionalInfo?.certificateFiles || [],
          },
        },
      };

      console.log("API data being sent:", apiData);

      // Do NOT modify immutable fields: fullName, role, status
      let response;
      try {
        response = await axios.put(
          `https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`,
          apiData
        );
        console.log("Save response:", response.data);
      } catch (apiError: any) {
        console.log(
          "First attempt failed, trying with simplified data structure..."
        );

        // Fallback: try with simpler data structure
        const simplifiedData = {
          ...user,
          email: user?.email,
          profile: {
            personalInfo: updatedProfile.personalInfo,
            professionalInfo: {
              ...updatedProfile.professionalInfo,
              // Convert certificateFiles to simple array for compatibility
              certificateFiles:
                (
                  updatedProfile.professionalInfo
                    ?.certificateFiles as CertificateFile[]
                )?.map((cert) => ({
                  id: cert.id,
                  url: cert.url,
                  status: cert.status,
                  uploadedAt: cert.uploadedAt,
                  approvedAt: cert.approvedAt,
                  rejectedAt: cert.rejectedAt,
                  adminNote: cert.adminNote,
                })) || [],
            },
            legalDocuments: updatedProfile.legalDocuments,
            references: updatedProfile.references,
            commitments: updatedProfile.commitments,
            additionalProfile: updatedProfile.additionalProfile,
          },
        };

        console.log("Trying with simplified data:", simplifiedData);
        response = await axios.put(
          `https://68aed258b91dfcdd62ba657c.mockapi.io/users/${userId}`,
          simplifiedData
        );
        console.log("Fallback save response:", response.data);
      }

      // Check if there are pending certificates and notify admin
      const certificateFiles = updatedProfile.professionalInfo
        ?.certificateFiles as CertificateFile[] | undefined;
      const hasPendingCertificates = certificateFiles?.some(
        (cert) => cert.status === "pending"
      );
      const pendingCount =
        certificateFiles?.filter((cert) => cert.status === "pending").length ||
        0;

      if (hasPendingCertificates) {
        // Add notification for pending certificates
        setCertificateNotifications((prev) => [
          ...prev,
          `Đang chờ admin duyệt ${pendingCount} chứng chỉ. Bạn sẽ được thông báo khi có kết quả.`,
        ]);
        setMessage(
          "Lưu thay đổi thành công. Admin đã được thông báo về chứng chỉ mới cần duyệt."
        );
      } else {
        setMessage("Lưu thay đổi thành công.");
      }
      setErrors({}); // Clear errors on successful save
    } catch (e: any) {
      console.error("Save error details:", e);
      console.error("Error response:", e.response?.data);
      console.error("Error status:", e.response?.status);

      // More specific error message
      if (e.response?.status === 400) {
        setMessage("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.");
      } else if (e.response?.status === 404) {
        setMessage("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
      } else if (e.response?.status === 500) {
        setMessage("Lỗi máy chủ. Vui lòng thử lại sau.");
      } else {
        setMessage(
          `Có lỗi xảy ra khi lưu thay đổi: ${
            e.response?.data?.message || e.message
          }`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hồ sơ chuyên môn của bạn
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowBell((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="Thông báo chứng chỉ"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {certificateNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-red-600 text-white rounded-full">
                {certificateNotifications.length}
              </span>
            )}
          </button>
          {showBell && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-3 border-b font-medium text-gray-800 flex items-center justify-between">
                <span>Thông báo chứng chỉ</span>
                {certificateNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-auto p-3 space-y-2">
                {certificateNotifications.length === 0 && (
                  <div className="text-sm text-gray-500">
                    Không có thông báo
                  </div>
                )}
                {certificateNotifications.map((n, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded border ${
                      n.includes("từ chối")
                        ? "bg-red-50 text-red-700 border-red-200"
                        : n.includes("chờ admin") || n.includes("đang chờ")
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{n}</span>
                      <button
                        onClick={() => clearNotification(i)}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Photo Section */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          Ảnh đại diện
        </h2>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {filePreviews.profilePhoto ? (
              <img
                src={filePreviews.profilePhoto}
                alt="Ảnh đại diện"
                className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center shadow-lg">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="text-center space-y-3">
            <div>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Chọn ảnh mới
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("profilePhoto", file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-xs text-gray-500">
              Chấp nhận: JPG, PNG (tối đa 5MB)
            </p>

            {filePreviews.profilePhoto && (
              <button
                type="button"
                onClick={() => removeFile("profilePhoto")}
                className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Xóa ảnh
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Basic info - readonly */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          1. Thông tin cơ bản
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Họ tên
            </label>
            <input
              type="text"
              readOnly
              value={user?.fullName || ""}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              onChange={(e) =>
                setUser((prev) =>
                  prev ? { ...prev, email: e.target.value } : null
                )
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Personal & contact */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          2. Thông tin cá nhân & liên hệ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ngày sinh
            </label>
            <input
              type="date"
              value={personalInfo.dateOfBirth}
              onChange={(e) =>
                setPersonalInfo((prev) => ({
                  ...prev,
                  dateOfBirth: e.target.value,
                }))
              }
              onBlur={(e) => onFieldBlur("dateOfBirth", e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                errors.dateOfBirth ? "border-red-500" : "border-gray-300"
              }`}
              max={(() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - 18);
                return d.toISOString().split("T")[0];
              })()}
              min={(() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - 65);
                return d.toISOString().split("T")[0];
              })()}
              ref={
                !errors.dateOfBirth
                  ? undefined
                  : (el) => {
                      if (!firstErrorRef.current) firstErrorRef.current = el;
                    }
              }
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Giới tính
            </label>
            <select
              value={personalInfo.gender}
              onChange={(e) =>
                setPersonalInfo((prev) => ({ ...prev, gender: e.target.value }))
              }
              onBlur={(e) => onFieldBlur("gender", e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
              ref={
                !errors.gender
                  ? undefined
                  : (el) => {
                      if (!firstErrorRef.current) firstErrorRef.current = el;
                    }
              }
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Số CMND/CCCD
            </label>
            <input
              type="text"
              value={personalInfo.idNumber}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Số CCCD không thể thay đổi sau khi đăng ký
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) =>
                setPersonalInfo((prev) => ({
                  ...prev,
                  phone: e.target.value.replace(/[^\d+]/g, "").slice(0, 12),
                }))
              }
              onBlur={(e) => onFieldBlur("phone", e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0123456789 hoặc +84123456789"
              ref={
                !errors.phone
                  ? undefined
                  : (el) => {
                      if (!firstErrorRef.current) firstErrorRef.current = el;
                    }
              }
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ thường trú
            </label>
            <textarea
              value={personalInfo.permanentAddress}
              onChange={(e) =>
                setPersonalInfo((prev) => ({
                  ...prev,
                  permanentAddress: e.target.value,
                }))
              }
              onBlur={(e) => onFieldBlur("permanentAddress", e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                errors.permanentAddress ? "border-red-500" : "border-gray-300"
              }`}
              rows={3}
              ref={
                !errors.permanentAddress
                  ? undefined
                  : (el) => {
                      if (!firstErrorRef.current)
                        firstErrorRef.current = el as any;
                    }
              }
            />
            {errors.permanentAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.permanentAddress}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ tạm trú
            </label>
            <textarea
              value={personalInfo.temporaryAddress}
              onChange={(e) =>
                setPersonalInfo((prev) => ({
                  ...prev,
                  temporaryAddress: e.target.value,
                }))
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          {/* ID Card Display Section - Readonly */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Ảnh CCCD/CCCD
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh CCCD mặt trước
                </label>
                {filePreviews.idCardFront ? (
                  <div className="mt-3">
                    <img
                      src={filePreviews.idCardFront}
                      alt="CCCD mặt trước"
                      className="h-32 w-full object-cover rounded-md border"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Ảnh đã được tải lên khi đăng ký
                    </p>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      Chưa có ảnh CCCD mặt trước
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh CCCD mặt sau
                </label>
                {filePreviews.idCardBack ? (
                  <div className="mt-3">
                    <img
                      src={filePreviews.idCardBack}
                      alt="CCCD mặt sau"
                      className="h-32 w-full object-cover rounded-md border"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Ảnh đã được tải lên khi đăng ký
                    </p>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      Chưa có ảnh CCCD mặt sau
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>Lưu ý:</strong> Ảnh CCCD không thể thay đổi sau khi đăng
                ký. Nếu cần cập nhật, vui lòng liên hệ quản trị viên.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional */}
      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          3. Thông tin nghề nghiệp
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Số năm kinh nghiệm
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={professionalInfo.yearsOfExperience}
              onChange={(e) =>
                setProfessionalInfo((prev) => ({
                  ...prev,
                  yearsOfExperience: Number(e.target.value) || 0,
                }))
              }
              onBlur={(e) =>
                onFieldBlur("yearsOfExperience", Number(e.target.value) || 0)
              }
              className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                errors.yearsOfExperience ? "border-red-500" : "border-gray-300"
              }`}
              ref={
                !errors.yearsOfExperience
                  ? undefined
                  : (el) => {
                      if (!firstErrorRef.current) firstErrorRef.current = el;
                    }
              }
            />
            {errors.yearsOfExperience && (
              <p className="text-red-500 text-xs mt-1">
                {errors.yearsOfExperience}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nơi từng làm việc
            </label>
            <input
              type="text"
              value={professionalInfo.previousWorkplace}
              onChange={(e) =>
                setProfessionalInfo((prev) => ({
                  ...prev,
                  previousWorkplace: e.target.value,
                }))
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          {/* Education */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Học vấn
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <div>
                <select
                  value={professionalInfo.educationLevel}
                  onChange={(e) =>
                    setProfessionalInfo((prev) => ({
                      ...prev,
                      educationLevel: e.target.value as any,
                      graduationStatus: "",
                      graduationCertificate: "",
                    }))
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Chọn trình độ</option>
                  <option value="trung-cap">Trung cấp</option>
                  <option value="cao-dang">Cao đẳng</option>
                  <option value="dai-hoc">Đại học</option>
                  <option value="sau-dai-hoc">Sau đại học</option>
                </select>
              </div>
              {professionalInfo.educationLevel === "dai-hoc" && (
                <div className="flex items-center gap-6">
                  <label className="flex items-center text-sm">
                    <input
                      type="radio"
                      name="graduationStatus"
                      value="graduated"
                      checked={
                        professionalInfo.graduationStatus === "graduated"
                      }
                      onChange={(e) =>
                        setProfessionalInfo((prev) => ({
                          ...prev,
                          graduationStatus: e.target.value,
                        }))
                      }
                      className="mr-2"
                    />
                    Đã tốt nghiệp
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="radio"
                      name="graduationStatus"
                      value="not_graduated"
                      checked={
                        professionalInfo.graduationStatus === "not_graduated"
                      }
                      onChange={(e) =>
                        setProfessionalInfo((prev) => ({
                          ...prev,
                          graduationStatus: e.target.value,
                          graduationCertificate: "",
                        }))
                      }
                      className="mr-2"
                    />
                    Chưa tốt nghiệp
                  </label>
                </div>
              )}
              {professionalInfo.educationLevel === "dai-hoc" &&
                professionalInfo.graduationStatus === "graduated" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bằng tốt nghiệp đại học (bắt buộc)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setProfessionalInfo((prev) => ({
                            ...prev,
                            graduationCertificate: reader.result as string,
                          }));
                        reader.readAsDataURL(file);
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Kỹ năng chuyên môn{" "}
              </label>
              <button
                type="button"
                onClick={() => navigate("/care-giver/certificates")}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Quản lý tại trang Chứng chỉ & Kỹ năng
              </button>
            </div>
            {parsedSkills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {parsedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Chưa có kỹ năng nào. Vui lòng thêm ở trang Chứng chỉ & Kỹ năng.
              </p>
            )}
          </div>
          {/* Expected salary */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Bằng cấp / chứng chỉ liên quan
              </label>
              <button
                type="button"
                onClick={() => navigate("/care-giver/certificates")}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Quản lý tại trang Chứng chỉ & Kỹ năng
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Các chứng chỉ đã duyệt được hiển thị bên dưới. Vui lòng thêm/sửa
              chứng chỉ tại trang Chứng chỉ & Kỹ năng.
            </p>
          </div>

          {/* Approved Certificates (read-only) */}
          <div className="md:col-span-2">
            {/* Approved Certificates */}
            {certificatePreviews.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Chứng chỉ đã được duyệt:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certificatePreviews.map((certificate) => (
                    <div
                      key={certificate.id}
                      className="flex items-center justify-between p-2 border border-green-200 rounded-md bg-green-50"
                    >
                      <div className="flex items-center">
                        <img
                          src={certificate.url}
                          alt={`Certificate ${certificate.id}`}
                          className="h-12 w-12 object-cover rounded mr-3"
                        />
                        <div>
                          <span className="text-sm text-gray-700 block">
                            Chứng chỉ đã duyệt
                          </span>
                          <span className="text-xs text-green-600">
                            Duyệt lúc:{" "}
                            {new Date(
                              certificate.approvedAt || ""
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      {/* No edit/delete here */}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Certificates - info only */}
            {pendingCertificates.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Chứng chỉ đang chờ duyệt:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingCertificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className="flex items-center justify-between p-2 border border-yellow-200 rounded-md bg-yellow-50"
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-yellow-100 rounded mr-3 flex items-center justify-center">
                          <svg
                            className="h-6 w-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm text-gray-700 block">
                            Đang chờ duyệt
                          </span>
                          <span className="text-xs text-yellow-600">
                            Upload lúc:{" "}
                            {new Date(
                              certificate.uploadedAt
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      {/* No remove here */}
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 text-xs">
                    <strong>Lưu ý:</strong> Chứng chỉ đang chờ admin duyệt. Bạn
                    sẽ được thông báo khi có kết quả.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Legal & References */}
      {/* <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Giấy tờ pháp lý & tham chiếu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Lý lịch tư pháp</label>
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('criminalRecord', file);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Chấp nhận: JPG, PNG, PDF (tối đa 5MB)</p>
            {filePreviews.criminalRecord && (
              <div className="mt-3">
                <img 
                  src={filePreviews.criminalRecord} 
                  alt="Lý lịch tư pháp" 
                  className="h-32 w-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeFile('criminalRecord')}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Xóa file
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giấy khám sức khỏe</label>
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('healthCertificate', file);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Chấp nhận: JPG, PNG, PDF (tối đa 5MB)</p>
            {filePreviews.healthCertificate && (
              <div className="mt-3">
                <img 
                  src={filePreviews.healthCertificate} 
                  alt="Giấy khám sức khỏe" 
                  className="h-32 w-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeFile('healthCertificate')}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Xóa file
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêm phòng</label>
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('vaccinationCertificate', file);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Chấp nhận: JPG, PNG, PDF (tối đa 5MB)</p>
            {filePreviews.vaccinationCertificate && (
              <div className="mt-3">
                <img 
                  src={filePreviews.vaccinationCertificate} 
                  alt="Tiêm phòng" 
                  className="h-32 w-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeFile('vaccinationCertificate')}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Xóa file
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giấy phép lao động (nếu có)</label>
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('workPermit', file);
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Chấp nhận: JPG, PNG, PDF (tối đa 5MB)</p>
            {filePreviews.workPermit && (
              <div className="mt-3">
                <img 
                  src={filePreviews.workPermit} 
                  alt="Giấy phép lao động" 
                  className="h-32 w-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeFile('workPermit')}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Xóa file
                </button>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center text-sm">
              <input type="checkbox" checked={commitments.ethicalCommitment} onChange={(e) => setCommitments(prev => ({ ...prev, ethicalCommitment: e.target.checked }))} className="mr-2" />
              Cam kết đạo đức
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center text-sm">
              <input type="checkbox" checked={commitments.termsAgreement} onChange={(e) => setCommitments(prev => ({ ...prev, termsAgreement: e.target.checked }))} className="mr-2" />
              Đồng ý với các điều khoản và điều kiện sử dụng hệ thống
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Link video giới thiệu (nếu có)</label>
            <input
              type="text"
              value={additionalProfile.introductionVideo}
              onChange={(e) => setAdditionalProfile(prev => ({ ...prev, introductionVideo: e.target.value }))}
              onBlur={() => {}}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://youtu.be/..."
            />
          </div>
          
        </div>
      </section> */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Giới thiệu
        </label>
        <textarea
          value={additionalProfile.introduction}
          onChange={(e) =>
            setAdditionalProfile((prev) => ({
              ...prev,
              introduction: e.target.value,
            }))
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
          placeholder="Giới thiệu về bản thân, kinh nghiệm, điểm mạnh..."
        />
      </div>
      {/* Certificate Notifications - moved into bell dropdown */}

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes("thành công")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          className={`px-6 py-2 rounded text-white font-semibold ${
            saving || !isValid
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
};

export default CaregiverProfilePage;
