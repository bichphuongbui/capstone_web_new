import React, { useState, useEffect } from "react";
import { getPackages, createPackage, getPackageById, updatePackage, deletePackage, restorePackage, ServicePackage as APIServicePackage, ServiceTask, Qualification, UpdatePackagePayload, QualificationType, getQualificationTypes } from "../../services/package.service";
import Notification from "../../components/Notification";

type PackageType = "basic" | "professional" | "premium" | "BASIC" | "PROFESSIONAL" | "ADVANCED";

interface ServicePackage {
  id: number;
  _id?: string; // MongoDB ObjectId
  servicePackageId?: string;
  name: string;
  description: string;
  price: number;
  type: PackageType;
  duration: number; // giờ/ngày
  durationHours?: number;
  billingCycle: "month" | "day" | "hour";
  features: string[];
  serviceTasks?: ServiceTask[];
  customFeatures?: string[];
  usageLimit?: string;
  userCount: number;
  isPopular: boolean;
  isActive: boolean;
  status?: "ACTIVE" | "INACTIVE";
  totalCareServices?: number;
}


const ServicePackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); // New state for edit mode
  const [viewingPackageDetails, setViewingPackageDetails] = useState<APIServicePackage | null>(null);
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPackages, setTotalPackages] = useState(0);
  const [totalActivePackages, setTotalActivePackages] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [packageTypeFilter, setPackageTypeFilter] = useState<PackageType | 'all'>('all');
  const [isActiveFilter] = useState<boolean | undefined>(true);
  const PACKAGES_PER_PAGE = 10;

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "basic" as PackageType,
    duration: "",
    paymentCycle: "daily" as "daily" | "monthly" | "hourly",
    features: [] as string[],
    notes: "",
    isPopular: false,
    isActive: true
  });

  const [featureChecks, setFeatureChecks] = useState({
    basicCare: false,
    personalHygiene: false,
    mealPrep: false,
    healthMonitoring: false,
    nutritionConsulting: false,
    physicalTherapy: false,
    medicalCare: false,
    professionalNurse: false,
    emergencySupport: false
  });

  const [customFeature, setCustomFeature] = useState("");
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Array<{
    serviceTaskId?: string;
    taskName: string;
    description: string;
  }>>([]);
  
  // Skills and Certificate Groups state
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certificateGroups, setCertificateGroups] = useState<string[][]>([]);
  const [qualificationTypes, setQualificationTypes] = useState<QualificationType[]>([]);
  const [loadingQualifications, setLoadingQualifications] = useState(false);
  
  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'restore';
    packageId: string;
    packageName: string;
  } | null>(null);

  // Function để fetch packages (tách ra để có thể gọi lại)
  const fetchPackages = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching packages...', { packageTypeFilter, isActiveFilter, currentPage });
      
      const result = await getPackages({
        packageType: packageTypeFilter === 'all' ? undefined : packageTypeFilter as any,
        isActive: isActiveFilter,
        page: currentPage,
        limit: PACKAGES_PER_PAGE,
      });

      console.log('📦 Packages result:', result);

      // Map API packages sang local format
      const mappedPackages: ServicePackage[] = result.packages.map((pkg: APIServicePackage) => {
        // Normalize package type
        let normalizedType: PackageType = 'basic';
        if (pkg.packageType === 'BASIC' || pkg.packageType === 'basic') normalizedType = 'basic';
        else if (pkg.packageType === 'PROFESSIONAL' || pkg.packageType === 'professional') normalizedType = 'professional';
        else if (pkg.packageType === 'ADVANCED' || pkg.packageType === 'premium') normalizedType = 'premium';
        
        return {
          id: parseInt(pkg.servicePackageId?.slice(-8) || pkg._id?.slice(-8) || '', 16) || Math.random(),
          _id: pkg._id || pkg.servicePackageId,
          servicePackageId: pkg.servicePackageId,
          name: pkg.packageName,
          description: pkg.description,
          price: pkg.price,
          type: normalizedType,
          duration: pkg.durationHours || pkg.duration || 0,
          durationHours: pkg.durationHours,
          billingCycle: 'day' as const,
          features: pkg.serviceTasks?.map((task: ServiceTask) => task.taskName) || pkg.services || [],
          serviceTasks: pkg.serviceTasks,
          customFeatures: pkg.customServices || [],
          usageLimit: `${pkg.durationHours || pkg.duration || 0} giờ`,
          userCount: pkg.totalCareServices || 0,
          isPopular: pkg.isPopular || false,
          isActive: pkg.status === 'ACTIVE' || pkg.isActive || false,
          status: pkg.status,
          totalCareServices: pkg.totalCareServices,
        };
      });

      setPackages(mappedPackages);
      setTotalPackages(result.totalPackages || result.total);
      setTotalActivePackages(result.totalActivePackages || result.packages.filter(p => p.status === 'ACTIVE' || p.isActive).length);
      setTotalBookings(result.totalBookings || 0);
      setTotalRevenue(result.totalRevenue || 0);
      setTotalPages(result.totalPages || Math.ceil((result.totalPackages || result.total) / PACKAGES_PER_PAGE));
    } catch (error: any) {
      console.error('❌ Error fetching packages:', error);
      
      // Nếu là lỗi 401, redirect về login
      if (error.response?.status === 401) {
        showNotification('error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showNotification('error', 'Không thể tải danh sách gói dịch vụ');
      }
      
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch packages từ API
  useEffect(() => {
    fetchPackages();
  }, [packageTypeFilter, isActiveFilter, currentPage]);

  // Fetch qualification types
  useEffect(() => {
    const fetchQualificationTypes = async () => {
      setLoadingQualifications(true);
      const result = await getQualificationTypes();
      if (result.success && result.data) {
        setQualificationTypes(result.data);
      } else {
        console.error('❌ Error fetching qualification types:', result.message);
      }
      setLoadingQualifications(false);
    };
    
    fetchQualificationTypes();
  }, []);

  const stats = {
    total: totalPackages,
    active: totalActivePackages || packages.filter(p => p.isActive).length,
    totalBookings: totalBookings,
    totalRevenue: totalRevenue,
    totalUsers: packages.reduce((sum, p) => sum + p.userCount, 0),
    revenue: packages.reduce((sum, p) => sum + p.price * p.userCount, 0)
  };

  const handleCreatePackage = () => {
    setEditingPackage(null);
    setIsEditMode(true); // Set to edit mode for creating
    setViewingPackageDetails(null);
    setSelectedTasks([]);
    setSkills([]);
    setSkillInput('');
    setCertificateGroups([]);
    setFormData({
      name: "",
      description: "",
      price: "",
      type: "basic",
      duration: "",
      paymentCycle: "daily",
      features: [],
      notes: "",
      isPopular: false,
      isActive: true
    });
    setFeatureChecks({
      basicCare: false,
      personalHygiene: false,
      mealPrep: false,
      healthMonitoring: false,
      nutritionConsulting: false,
      physicalTherapy: false,
      medicalCare: false,
      professionalNurse: false,
      emergencySupport: false
    });
    setCustomFeature("");
    setCustomFeatures([]);
    setShowModal(true);
  };

  const handleEditPackage = async (pkg: ServicePackage) => {
    try {
      // Fetch fresh data from API if package has _id
      if (pkg._id || pkg.servicePackageId) {
        console.log('📦 Fetching package details for viewing:', pkg._id || pkg.servicePackageId);
        const result = await getPackageById(pkg._id || pkg.servicePackageId || '');
        
        console.log('📦 Get package result:', result);
        
        if (result.success && result.package) {
          const apiPkg = result.package;
          setEditingPackage(pkg);
          setViewingPackageDetails(apiPkg);
          setIsEditMode(false); // Start in view mode
          
          // Load serviceTasks
          setSelectedTasks(apiPkg.serviceTasks || []);
          
          // Load qualification (skills and certificate_groups)
          if (apiPkg.qualification && typeof apiPkg.qualification === 'object') {
            const qual = apiPkg.qualification as Qualification;
            setSkills(qual.skills || []);
            setCertificateGroups(qual.certificate_groups || []);
          } else {
            setSkills([]);
            setCertificateGroups([]);
          }
          
          setFormData({
            name: apiPkg.packageName,
            description: apiPkg.description,
            price: apiPkg.price.toString(),
            type: (apiPkg.packageType?.toLowerCase() || 'basic') as PackageType,
            duration: (apiPkg.durationHours || apiPkg.duration || 0).toString(),
            paymentCycle: apiPkg.paymentCycle || "daily",
            features: apiPkg.services || [],
            notes: apiPkg.note || apiPkg.notes || "",
            isPopular: apiPkg.isPopular || false,
            isActive: apiPkg.status === 'ACTIVE' || apiPkg.isActive || false
          });
          
          // Update feature checkboxes based on services
          const services = apiPkg.services || [];
          setFeatureChecks({
            basicCare: services.includes("Chăm sóc cơ bản hàng ngày"),
            personalHygiene: services.includes("Hỗ trợ vệ sinh cá nhân"),
            mealPrep: services.includes("Chuẩn bị bữa ăn"),
            healthMonitoring: services.includes("Theo dõi sức khỏe định kỳ"),
            nutritionConsulting: services.includes("Tư vấn dinh dưỡng chuyên nghiệp"),
            physicalTherapy: services.includes("Hỗ trợ vật lý trị liệu"),
            medicalCare: services.includes("Chăm sóc y tế chuyên sâu"),
            professionalNurse: services.includes("Điều dưỡng viên chuyên nghiệp"),
            emergencySupport: services.includes("Hỗ trợ khẩn cấp ưu tiên"),
          });
          
          setCustomFeatures(apiPkg.customServices || []);
          setShowModal(true);
          return;
        } else {
          console.warn('⚠️ API failed or no package data, using fallback');
        }
      } else {
        console.warn('⚠️ No _id found, using fallback data');
      }
      
      // Fallback to current data if API fails or no valid ID
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description,
        price: pkg.price.toString(),
        type: pkg.type,
        duration: pkg.duration.toString(),
        paymentCycle: pkg.billingCycle === "day" ? "daily" : pkg.billingCycle === "month" ? "monthly" : "hourly",
        features: pkg.features,
        notes: "",
        isPopular: pkg.isPopular,
        isActive: pkg.isActive
      });
      
      // Update feature checkboxes
      const services = pkg.features || [];
      setFeatureChecks({
        basicCare: services.includes("Chăm sóc cơ bản hàng ngày"),
        personalHygiene: services.includes("Hỗ trợ vệ sinh cá nhân"),
        mealPrep: services.includes("Chuẩn bị bữa ăn"),
        healthMonitoring: services.includes("Theo dõi sức khỏe định kỳ"),
        nutritionConsulting: services.includes("Tư vấn dinh dưỡng chuyên nghiệp"),
        physicalTherapy: services.includes("Hỗ trợ vật lý trị liệu"),
        medicalCare: services.includes("Chăm sóc y tế chuyên sâu"),
        professionalNurse: services.includes("Điều dưỡng viên chuyên nghiệp"),
        emergencySupport: services.includes("Hỗ trợ khẩn cấp ưu tiên"),
      });
      
      setCustomFeatures(pkg.customFeatures || []);
      setShowModal(true);
    } catch (error) {
      console.error('❌ Error loading package for edit:', error);
      
      // Fallback to current data on error
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description,
        price: pkg.price.toString(),
        type: pkg.type,
        duration: pkg.duration.toString(),
        paymentCycle: pkg.billingCycle === "day" ? "daily" : pkg.billingCycle === "month" ? "monthly" : "hourly",
        features: pkg.features,
        notes: "",
        isPopular: pkg.isPopular,
        isActive: pkg.isActive
      });
      
      // Update feature checkboxes
      const services = pkg.features || [];
      setFeatureChecks({
        basicCare: services.includes("Chăm sóc cơ bản hàng ngày"),
        personalHygiene: services.includes("Hỗ trợ vệ sinh cá nhân"),
        mealPrep: services.includes("Chuẩn bị bữa ăn"),
        healthMonitoring: services.includes("Theo dõi sức khỏe định kỳ"),
        nutritionConsulting: services.includes("Tư vấn dinh dưỡng chuyên nghiệp"),
        physicalTherapy: services.includes("Hỗ trợ vật lý trị liệu"),
        medicalCare: services.includes("Chăm sóc y tế chuyên sâu"),
        professionalNurse: services.includes("Điều dưỡng viên chuyên nghiệp"),
        emergencySupport: services.includes("Hỗ trợ khẩn cấp ưu tiên"),
      });
      
      setCustomFeatures(pkg.customFeatures || []);
      setShowModal(true);
      
      showNotification('warning', 'Đang dùng dữ liệu hiện tại (không tải được từ server)');
    }
  };

  const handleSavePackage = async () => {
    // Validate form
    if (!formData.name.trim()) {
      showNotification('error', 'Vui lòng nhập tên gói dịch vụ');
      return;
    }
    if (!formData.description.trim()) {
      showNotification('error', 'Vui lòng nhập mô tả');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showNotification('error', 'Vui lòng nhập giá hợp lệ');
      return;
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      showNotification('error', 'Vui lòng nhập thời gian hợp lệ');
      return;
    }
    
    // Validate durationHours: chỉ chấp nhận 4 hoặc 8
    const duration = parseInt(formData.duration);
    if (duration !== 4 && duration !== 8) {
      showNotification('error', 'Thời gian chỉ được phép là 4 giờ hoặc 8 giờ');
      return;
    }

    if (editingPackage) {
      // Update existing package
      // Validate serviceTasks
      if (selectedTasks.length === 0) {
        showNotification('error', 'Vui lòng chọn ít nhất một nhiệm vụ dịch vụ');
        return;
      }
      
      // Build qualification object - chỉ gửi nếu có dữ liệu
      let qualification: Qualification | null = null;
      if (skills.length > 0 || certificateGroups.length > 0) {
        qualification = {
          skills: skills,
          certificate_groups: certificateGroups,
        };
      }
      
      const payload: UpdatePackagePayload = {
        packageName: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        packageType: formData.type.toUpperCase() as 'BASIC' | 'PROFESSIONAL' | 'ADVANCED',
        durationHours: parseInt(formData.duration),
        note: formData.notes || null,
        qualification: qualification,
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
        serviceTasks: selectedTasks.map(task => ({
          ...(task.serviceTaskId ? { serviceTaskId: task.serviceTaskId } : {}), // Include serviceTaskId only if exists (update), omit for new tasks
          taskName: task.taskName,
          description: task.description,
        })),
      };

      console.log('📦 Updating package with payload:', payload);

      const result = await updatePackage(editingPackage._id || editingPackage.servicePackageId || editingPackage.id.toString(), payload);

      if (result.success) {
        showNotification('success', result.message || 'Cập nhật gói dịch vụ thành công!');
        setShowModal(false);
        setEditingPackage(null);
        setIsEditMode(false);
        setViewingPackageDetails(null);
        
        // Fetch lại danh sách packages
        fetchPackages();
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ');
      }
    } else {
      // Create new package
      // Validate serviceTasks
      if (selectedTasks.length === 0) {
        showNotification('error', 'Vui lòng chọn ít nhất một nhiệm vụ dịch vụ');
        return;
      }
      
      // Build qualification object - chỉ gửi nếu có dữ liệu
      let qualification: Qualification | null = null;
      if (skills.length > 0 || certificateGroups.length > 0) {
        qualification = {
          skills: skills,
          certificate_groups: certificateGroups,
        };
      }
      
      const payload: any = {
        packageName: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        packageType: formData.type,
        durationHours: parseInt(formData.duration),
        note: formData.notes || null,
        qualification: qualification,
        serviceTasks: selectedTasks,
      };

      console.log('📦 Creating package with payload:', payload);

      const result = await createPackage(payload);

      if (result.success) {
        showNotification('success', result.message || 'Tạo gói dịch vụ thành công!');
        setShowModal(false);
        setIsEditMode(false);
        
        // Fetch lại danh sách packages
        fetchPackages();
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra khi tạo gói dịch vụ');
      }
    }
  };

  const handleToggleStatus = async (pkg: ServicePackage, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit modal
    
    const packageId = pkg._id || pkg.servicePackageId;
    if (!packageId) {
      showNotification('error', 'Không tìm thấy ID gói dịch vụ');
      return;
    }

    const isDeleted = pkg.status === 'INACTIVE' || !pkg.isActive;
    
    // Mở dialog xác nhận
    setConfirmAction({
      type: isDeleted ? 'restore' : 'delete',
      packageId: packageId,
      packageName: pkg.name,
    });
    setShowConfirmDialog(true);
  };
  
  const handleConfirmToggle = async () => {
    if (!confirmAction) return;
    
    try {
      const result = confirmAction.type === 'restore'
        ? await restorePackage(confirmAction.packageId)
        : await deletePackage(confirmAction.packageId);
      
      if (result.success) {
        showNotification('success', result.message || `Đã ${confirmAction.type === 'restore' ? 'mở khóa' : 'khóa'} gói dịch vụ thành công`);
        
        // Fetch lại danh sách packages
        fetchPackages();
      } else {
        showNotification('error', result.message || `Có lỗi xảy ra khi ${confirmAction.type === 'restore' ? 'mở khóa' : 'khóa'} gói dịch vụ`);
      }
    } catch (error) {
      console.error(`❌ Error ${confirmAction.type} package:`, error);
      showNotification('error', `Không thể ${confirmAction.type === 'restore' ? 'mở khóa' : 'khóa'} gói dịch vụ`);
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const getPackageColor = (type: PackageType) => {
    switch (type) {
      case "basic": return { bg: "#4F9CF9", gradient: "linear-gradient(135deg, #4F9CF9, #3B82F6)" };
      case "professional": return { bg: "#A855F7", gradient: "linear-gradient(135deg, #A855F7, #9333EA)" };
      case "premium": return { bg: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B, #D97706)" };
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#70C1F1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý gói dịch vụ</h1>
              <p className="mt-1 text-sm text-gray-500">Tạo và quản lý các gói dịch vụ chăm sóc người cao tuổi</p>
            </div>
            <button
              onClick={handleCreatePackage}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: "#70C1F1" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Tạo gói mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng gói dịch vụ</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(112, 193, 241, 0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" style={{ color: "#70C1F1" }}>
                  <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
                  <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
                  <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(112, 193, 241, 0.15)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng booking</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-purple-600">
                  <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-amber-600">
                  <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            {/* Package Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại gói
              </label>
              <select
                value={packageTypeFilter}
                onChange={(e) => {
                  setPackageTypeFilter(e.target.value as PackageType | 'all');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#70C1F1] focus:border-transparent"
              >
                <option value="all">Tất cả loại gói</option>
                <option value="basic">Cơ bản</option>
                <option value="professional">Chuyên nghiệp</option>
                <option value="premium">Nâng cao</option>
              </select>
            </div>
          </div>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              onClick={() => handleEditPackage(pkg)}
              className="relative rounded-2xl bg-white shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl cursor-pointer flex flex-col"
            >
              {/* Header with gradient */}
              <div className="relative p-6 text-white" style={{ background: getPackageColor(pkg.type).gradient }}>
                {/* Delete/Restore Icon */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => handleToggleStatus(pkg, e)}
                    className="rounded-full bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-colors border border-white/30"
                    title={pkg.isActive ? 'Click để khóa' : 'Click để mở khóa'}
                  >
                    {pkg.isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                        <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 pr-12">
                  <h3 className="text-2xl font-bold">{pkg.name}</h3>
                  {pkg.isPopular && (
                    <span className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-white border border-white/30">
                      PHỔ BIẾN
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-white/90 line-clamp-2">{pkg.description}</p>
              </div>

              {/* Price */}
              <div className="border-b border-gray-100 bg-white p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {(pkg.price / 1000).toFixed(0)}K
                  </span>
                  <span className="text-sm text-gray-500">VND</span>
                </div>
              </div>

              {/* Service Tasks */}
              <div className="p-6 space-y-3 flex-1 min-h-[280px] max-h-[280px] overflow-y-auto">
                {pkg.serviceTasks && pkg.serviceTasks.length > 0 ? (
                  pkg.serviceTasks.slice(0, 5).map((task, idx) => (
                    <div key={task.serviceTaskId} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#70C1F1" }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 font-medium block">{task.taskName}</span>
                        <span className="text-xs text-gray-500 line-clamp-1">{task.description}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#70C1F1" }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))
                )}
                {pkg.serviceTasks && pkg.serviceTasks.length > 5 && (
                  <div className="text-xs text-gray-500 italic pl-8">
                    +{pkg.serviceTasks.length - 5} nhiệm vụ khác...
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-6 bg-gray-50 mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                    <span>{pkg.durationHours || pkg.duration} giờ</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                    </svg>
                    <span>{pkg.totalCareServices || 0} Lượt Đặt</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {packages.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có gói dịch vụ</h3>
            <p className="mt-1 text-sm text-gray-500">Chưa có gói dịch vụ nào phù hợp với bộ lọc.</p>
            <button
              onClick={handleCreatePackage}
              className="mt-4 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: "#70C1F1" }}
            >
              Tạo gói dịch vụ mới
            </button>
          </div>
        )}

        {/* Pagination */}
        {packages.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <span className="px-3 py-1 text-sm">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPackage ? (isEditMode ? "Chỉnh sửa gói dịch vụ" : "Chi tiết gói dịch vụ") : "Tạo gói dịch vụ mới"}
                </h3>
                {editingPackage && !isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: "#70C1F1" }}
                    title="Chỉnh sửa gói dịch vụ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                    </svg>
                    Sửa
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsEditMode(false);
                  setViewingPackageDetails(null);
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* View Mode - Display package details */}
              {editingPackage && !isEditMode && viewingPackageDetails ? (
                <div className="space-y-6">
                  {/* Package Type Badge */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: viewingPackageDetails.packageType === 'BASIC' ? 'rgba(79, 156, 249, 0.1)' : 
                                       viewingPackageDetails.packageType === 'PROFESSIONAL' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: viewingPackageDetails.packageType === 'BASIC' ? '#4F9CF9' : 
                               viewingPackageDetails.packageType === 'PROFESSIONAL' ? '#A855F7' : '#F59E0B'
                      }}
                    >
                      {viewingPackageDetails.packageType === 'BASIC' ? 'Cơ bản' : 
                       viewingPackageDetails.packageType === 'PROFESSIONAL' ? 'Chuyên nghiệp' : 'Nâng cao'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      viewingPackageDetails.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingPackageDetails.status === 'ACTIVE' ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên gói</label>
                      <div className="text-lg font-semibold text-gray-900">{viewingPackageDetails.packageName}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giá</label>
                      <div className="text-lg font-semibold" style={{ color: '#70C1F1' }}>
                        {viewingPackageDetails.price.toLocaleString('vi-VN')} VND
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thời lượng</label>
                      <div className="text-base text-gray-900">{viewingPackageDetails.durationHours} giờ</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Số lượt đặt dịch vụ</label>
                      <div className="text-base text-gray-900">{viewingPackageDetails.totalCareServices || 0}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mô tả</label>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {viewingPackageDetails.description}
                    </div>
                  </div>

                  {/* Note */}
                  {viewingPackageDetails.note && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghi chú</label>
                      <div className="text-sm text-gray-700 bg-amber-50 rounded-lg p-4 border border-amber-200">
                        {viewingPackageDetails.note}
                      </div>
                    </div>
                  )}

                  {/* Qualification */}
                  {viewingPackageDetails.qualification && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Yêu cầu trình độ</label>
                      
                      {typeof viewingPackageDetails.qualification === 'object' ? (
                        <div className="space-y-3">
                          {/* Skills */}
                          {(viewingPackageDetails.qualification as any).skills?.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="text-sm font-semibold text-blue-900 mb-2">Kỹ năng yêu cầu:</h4>
                              <div className="flex flex-wrap gap-2">
                                {(viewingPackageDetails.qualification as any).skills.map((skill: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Certificate Groups */}
                          {(viewingPackageDetails.qualification as any).certificate_groups?.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <h4 className="text-sm font-semibold text-green-900 mb-2">Chứng chỉ yêu cầu:</h4>
                              <div className="space-y-2">
                                {(viewingPackageDetails.qualification as any).certificate_groups.map((group: string[], groupIdx: number) => (
                                  <div key={groupIdx} className="bg-white rounded p-3 border border-green-300">
                                    <span className="text-xs font-semibold text-gray-700 mb-2 block">Nhóm {groupIdx + 1} (Cần 1 trong các cert sau):</span>
                                    <div className="flex flex-wrap gap-2">
                                      {group.map((certId, certIdx) => {
                                        const cert = qualificationTypes.find(qt => qt.qualificationTypeId === certId);
                                        return (
                                          <span key={certIdx} className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                            {cert?.typeName || certId.slice(0, 8) + '...'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 bg-blue-50 rounded-lg p-4 border border-blue-200">
                          {viewingPackageDetails.qualification}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Service Tasks */}
                  {viewingPackageDetails.serviceTasks && viewingPackageDetails.serviceTasks.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Các nhiệm vụ dịch vụ</label>
                      <div className="space-y-3">
                        {viewingPackageDetails.serviceTasks.map((task, index) => (
                          <div key={task.serviceTaskId} className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                  style={{ backgroundColor: '#70C1F1' }}>
                                  {index + 1}
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <h4 className="font-semibold text-gray-900">{task.taskName}</h4>
                                <p className="text-sm text-gray-600">{task.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode - Show form fields */
                <>
              {/* Tên gói */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên gói <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Gói Cơ Bản"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: formData.name ? "#70C1F1" : undefined }}
                />
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả ngắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về gói dịch vụ..."
                  rows={3}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none transition-colors"
                  style={{ borderColor: formData.description ? "#70C1F1" : undefined }}
                />
              </div>

              {/* Giá và Loại gói */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="500000"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: formData.price ? "#70C1F1" : undefined }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại gói <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PackageType })}
                    className="w-full rounded-lg border-2 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: "#70C1F1" }}
                  >
                    <option value="basic">Cơ bản</option>
                    <option value="professional">Chuyên nghiệp</option>
                    <option value="premium">Cao cấp</option>
                  </select>
                </div>
              </div>

              {/* Thời gian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian (giờ) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full rounded-lg border-2 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: formData.duration ? "#70C1F1" : "#d1d5db" }}
                >
                  <option value="">Chọn thời gian</option>
                  <option value="4">4 giờ</option>
                  <option value="8">8 giờ</option>
                </select>
              </div>

              {/* Service Tasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nhiệm vụ dịch vụ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3 rounded-lg border-2 border-gray-100 bg-gray-50 p-4 max-h-96 overflow-y-auto">
                  {selectedTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Chưa có nhiệm vụ nào được chọn</p>
                      <p className="text-xs mt-1">Nhấn nút bên dưới để thêm nhiệm vụ</p>
                    </div>
                  ) : (
                    selectedTasks.map((task, index) => (
                      <div key={task.serviceTaskId} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#70C1F1" }}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={task.taskName}
                              onChange={(e) => {
                                const newTasks = [...selectedTasks];
                                newTasks[index].taskName = e.target.value;
                                setSelectedTasks(newTasks);
                              }}
                              placeholder="Tên nhiệm vụ"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium mb-2"
                            />
                            <input
                              type="text"
                              value={task.description}
                              onChange={(e) => {
                                const newTasks = [...selectedTasks];
                                newTasks[index].description = e.target.value;
                                setSelectedTasks(newTasks);
                              }}
                              placeholder="Mô tả nhiệm vụ"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600"
                            />
                          </div>
                          <button
                            onClick={() => setSelectedTasks(selectedTasks.filter((_, i) => i !== index))}
                            className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTasks([...selectedTasks, {
                        serviceTaskId: crypto.randomUUID(),
                        taskName: '',
                        description: ''
                      }]);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span className="font-medium">Thêm nhiệm vụ</span>
                  </button>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kỹ năng yêu cầu
                </label>
                <div className="space-y-3 rounded-lg border-2 border-gray-100 bg-gray-50 p-4">
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {skills.map((skill, index) => (
                        <div key={index} className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
                          <span>{skill}</span>
                          <button
                            onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillInput.trim()) {
                          e.preventDefault();
                          setSkills([...skills, skillInput.trim()]);
                          setSkillInput('');
                        }
                      }}
                      placeholder="Nhập kỹ năng và nhấn Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (skillInput.trim()) {
                          setSkills([...skills, skillInput.trim()]);
                          setSkillInput('');
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* Certificate Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nhóm chứng chỉ yêu cầu
                  <span className="text-xs text-gray-500 ml-2">(Mỗi nhóm: cần 1 trong các cert. Nhiều nhóm: cần cert từ tất cả nhóm)</span>
                </label>
                <div className="space-y-3 rounded-lg border-2 border-gray-100 bg-gray-50 p-4">
                  {certificateGroups.length > 0 && (
                    <div className="space-y-3">
                      {certificateGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Nhóm {groupIndex + 1}</span>
                            <button
                              onClick={() => setCertificateGroups(certificateGroups.filter((_, i) => i !== groupIndex))}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Display selected certificates */}
                          {group.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {group.map((certId, certIndex) => {
                                const cert = qualificationTypes.find(qt => qt.qualificationTypeId === certId);
                                return (
                                  <div key={certIndex} className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">
                                    <span className="font-medium">{cert?.typeName || certId.slice(0, 8) + '...'}</span>
                                    <button
                                      onClick={() => {
                                        const newGroups = [...certificateGroups];
                                        newGroups[groupIndex] = newGroups[groupIndex].filter((_, i) => i !== certIndex);
                                        if (newGroups[groupIndex].length === 0) {
                                          newGroups.splice(groupIndex, 1);
                                        }
                                        setCertificateGroups(newGroups);
                                      }}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Certificate selection dropdown */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const newGroups = [...certificateGroups];
                                if (!newGroups[groupIndex].includes(e.target.value)) {
                                  newGroups[groupIndex] = [...newGroups[groupIndex], e.target.value];
                                  setCertificateGroups(newGroups);
                                }
                                e.target.value = '';
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Chọn chứng chỉ để thêm vào nhóm này...</option>
                            {qualificationTypes
                              .filter(qt => qt.isActive && !group.includes(qt.qualificationTypeId))
                              .map(qt => (
                                <option key={qt.qualificationTypeId} value={qt.qualificationTypeId}>
                                  {qt.typeName}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setCertificateGroups([...certificateGroups, []]);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span className="font-medium">Thêm nhóm chứng chỉ</span>
                  </button>
                  
                  {loadingQualifications && (
                    <p className="text-xs text-gray-500 italic text-center">Đang tải danh sách chứng chỉ...</p>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Phù hợp cho người cao tuổi cần hỗ trợ..."
                  rows={3}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none transition-colors"
                  style={{ borderColor: formData.notes ? "#70C1F1" : undefined }}
                />
              </div>
              </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-gray-50 sticky bottom-0">
              {editingPackage && !isEditMode ? (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsEditMode(false);
                    setViewingPackageDetails(null);
                  }}
                  className="rounded-lg border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (editingPackage && isEditMode) {
                        setIsEditMode(false);
                      } else {
                        setShowModal(false);
                        setIsEditMode(false);
                        setViewingPackageDetails(null);
                      }
                    }}
                    className="rounded-lg border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {editingPackage && isEditMode ? 'Hủy chỉnh sửa' : 'Hủy'}
                  </button>
                  <button
                    onClick={handleSavePackage}
                    className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                    style={{ backgroundColor: "#70C1F1" }}
                  >
                    {editingPackage ? "Lưu thay đổi" : "Lưu gói dịch vụ"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmAction.type === 'delete' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {confirmAction.type === 'delete' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-600">
                      <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {confirmAction.type === 'delete' ? 'Khóa gói dịch vụ' : 'Mở khóa gói dịch vụ'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Bạn có chắc chắn muốn thực hiện hành động này?
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Gói dịch vụ:</span>{' '}
                  <span className="font-semibold text-gray-900">{confirmAction.packageName}</span>
                </p>
                {confirmAction.type === 'delete' && (
                  <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 flex-shrink-0">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Gói dịch vụ sẽ bị khóa và không hiển thị trên hệ thống
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmToggle}
                className={`px-5 py-2.5 rounded-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl ${
                  confirmAction.type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmAction.type === 'delete' ? 'Khóa' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePackageManagementPage;
