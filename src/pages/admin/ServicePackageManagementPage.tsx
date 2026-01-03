import React, { useState, useEffect } from "react";
import { getPackages, createPackage, getPackageById, updatePackage, togglePackageStatus, ServicePackage as APIServicePackage } from "../../services/package.service";
import Notification from "../../components/Notification";

type PackageType = "basic" | "professional" | "premium";

interface ServicePackage {
  id: number;
  _id?: string; // MongoDB ObjectId
  name: string;
  description: string;
  price: number;
  type: PackageType;
  duration: number; // giờ/ngày
  billingCycle: "month" | "day" | "hour";
  features: string[];
  customFeatures?: string[];
  usageLimit?: string;
  userCount: number;
  isPopular: boolean;
  isActive: boolean;
}


const ServicePackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPackages, setTotalPackages] = useState(0);
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

  // Fetch packages từ API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching packages...', { packageTypeFilter, isActiveFilter, currentPage });
        
        const result = await getPackages({
          packageType: packageTypeFilter === 'all' ? undefined : packageTypeFilter,
          isActive: isActiveFilter,
          page: currentPage,
          limit: PACKAGES_PER_PAGE,
        });

        console.log('📦 Packages result:', result);

        // Map API packages sang local format
        const mappedPackages: ServicePackage[] = result.packages.map((pkg: APIServicePackage) => ({
          id: parseInt(pkg._id.slice(-8), 16) || Math.random(), // Generate numeric ID from _id
          _id: pkg._id, // Store original MongoDB ID
          name: pkg.packageName,
          description: pkg.description,
          price: pkg.price,
          type: pkg.packageType as PackageType,
          duration: pkg.duration,
          billingCycle: pkg.paymentCycle as 'day' | 'month' | 'hour',
          features: pkg.services || [],
          customFeatures: pkg.customServices || [],
          usageLimit: `${pkg.duration} giờ`,
          userCount: 0, // API không trả về
          isPopular: pkg.isPopular || false,
          isActive: pkg.isActive,
        }));

        setPackages(mappedPackages);
        setTotalPackages(result.total);
        setTotalPages(result.totalPages || Math.ceil(result.total / PACKAGES_PER_PAGE));
      } catch (error) {
        console.error('❌ Error fetching packages:', error);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [packageTypeFilter, isActiveFilter, currentPage]);

  const stats = {
    total: totalPackages,
    active: packages.filter(p => p.isActive).length,
    totalUsers: packages.reduce((sum, p) => sum + p.userCount, 0),
    revenue: packages.reduce((sum, p) => sum + p.price * p.userCount, 0)
  };

  const handleCreatePackage = () => {
    setEditingPackage(null);
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
      if (pkg._id) {
        console.log('📦 Fetching package details for editing:', pkg._id);
        const result = await getPackageById(pkg._id);
        
        console.log('📦 Get package result:', result);
        
        if (result.success && result.package) {
          const apiPkg = result.package;
          setEditingPackage(pkg);
          setFormData({
            name: apiPkg.packageName,
            description: apiPkg.description,
            price: apiPkg.price.toString(),
            type: apiPkg.packageType,
            duration: apiPkg.duration.toString(),
            paymentCycle: apiPkg.paymentCycle,
            features: apiPkg.services || [],
            notes: apiPkg.notes || "",
            isPopular: apiPkg.isPopular,
            isActive: apiPkg.isActive
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

    // Collect selected services
    const selectedServices: string[] = [];
    if (featureChecks.basicCare) selectedServices.push("Chăm sóc cơ bản hàng ngày");
    if (featureChecks.personalHygiene) selectedServices.push("Hỗ trợ vệ sinh cá nhân");
    if (featureChecks.mealPrep) selectedServices.push("Chuẩn bị bữa ăn");
    if (featureChecks.healthMonitoring) selectedServices.push("Theo dõi sức khỏe định kỳ");
    if (featureChecks.nutritionConsulting) selectedServices.push("Tư vấn dinh dưỡng chuyên nghiệp");
    if (featureChecks.physicalTherapy) selectedServices.push("Hỗ trợ vật lý trị liệu");
    if (featureChecks.medicalCare) selectedServices.push("Chăm sóc y tế chuyên sâu");
    if (featureChecks.professionalNurse) selectedServices.push("Điều dưỡng viên chuyên nghiệp");
    if (featureChecks.emergencySupport) selectedServices.push("Hỗ trợ khẩn cấp ưu tiên");

    if (editingPackage) {
      // Update existing package
      const payload = {
        packageName: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        packageType: formData.type,
        duration: parseInt(formData.duration),
        paymentCycle: formData.paymentCycle,
        services: selectedServices,
        customServices: customFeatures,
        notes: formData.notes,
        isPopular: formData.isPopular,
      };

      console.log('📦 Updating package with payload:', payload);

      const result = await updatePackage(editingPackage._id || editingPackage.id.toString(), payload);

      if (result.success) {
        showNotification('success', result.message || 'Cập nhật gói dịch vụ thành công!');
        setShowModal(false);
        setEditingPackage(null);
        
        // Reload packages sau 1s
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ');
      }
    } else {
      // Create new package
      const payload = {
        packageName: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        packageType: formData.type,
        duration: parseInt(formData.duration),
        paymentCycle: formData.paymentCycle,
        services: selectedServices,
        customServices: customFeatures,
        notes: formData.notes,
        isPopular: formData.isPopular,
      };

      console.log('📦 Creating package with payload:', payload);

      const result = await createPackage(payload);

      if (result.success) {
        showNotification('success', result.message || 'Tạo gói dịch vụ thành công!');
        setShowModal(false);
        
        // Reload packages sau 1s
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra khi tạo gói dịch vụ');
      }
    }
  };

  const handleToggleStatus = async (pkg: ServicePackage, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit modal
    
    if (!pkg._id) {
      showNotification('error', 'Không tìm thấy ID gói dịch vụ');
      return;
    }

    try {
      const result = await togglePackageStatus(pkg._id);
      
      if (result.success) {
        showNotification('success', result.message || `Đã ${pkg.isActive ? 'khóa' : 'kích hoạt'} gói dịch vụ`);
        
        // Reload packages
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('❌ Error toggling package status:', error);
      showNotification('error', 'Không thể cập nhật trạng thái gói dịch vụ');
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
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                <option value="premium">Cao cấp</option>
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
                {/* Lock/Unlock Icon */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => handleToggleStatus(pkg, e)}
                    className="rounded-full bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-colors border border-white/30"
                    title={pkg.isActive ? 'Click để khóa' : 'Click để kích hoạt'}
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
                <p className="mt-2 text-sm text-white/90">{pkg.description}</p>
              </div>

              {/* Price */}
              <div className="border-b border-gray-100 bg-white p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {(pkg.price / 1000).toFixed(0)}K
                  </span>
                  <span className="text-sm text-gray-500">
                    VND / {pkg.billingCycle === "month" ? "tháng" : "slot"}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 space-y-3">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#70C1F1" }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
                {pkg.customFeatures && pkg.customFeatures.length > 0 && pkg.customFeatures.map((feature, idx) => (
                  <div key={`custom-${idx}`} className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#70C1F1" }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-6 bg-gray-50 mt-auto">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                    <span>{pkg.usageLimit || `${pkg.duration} ${pkg.billingCycle === "day" ? "giờ/ngày" : "ngày"}`}</span>
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPackage ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
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

              {/* Thời gian và Chu kỳ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian (giờ/ngày) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="4"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: formData.duration ? "#70C1F1" : undefined }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chu kỳ thanh toán
                  </label>
                  <select
                    value={formData.paymentCycle}
                    onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value as "daily" | "monthly" | "hourly" })}
                    className="w-full rounded-lg border-2 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: "#70C1F1" }}
                  >
                    <option value="monthly">Tháng</option>
                    <option value="daily">Slot</option>
                    <option value="hourly">Giờ</option>
                  </select>
                </div>
              </div>

              {/* Tính năng gói dịch vụ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tính năng gói dịch vụ
                </label>
                <div className="space-y-2.5 rounded-lg border-2 border-gray-100 bg-gray-50 p-4">
                  {[
                    { key: "basicCare", label: "Chăm sóc cơ bản hàng ngày" },
                    { key: "personalHygiene", label: "Hỗ trợ vệ sinh cá nhân" },
                    { key: "mealPrep", label: "Chuẩn bị bữa ăn" },
                    { key: "healthMonitoring", label: "Theo dõi sức khỏe định kỳ" },
                    { key: "nutritionConsulting", label: "Tư vấn dinh dưỡng chuyên nghiệp" },
                    { key: "physicalTherapy", label: "Hỗ trợ vật lý trị liệu" },
                    { key: "medicalCare", label: "Chăm sóc y tế chuyên sâu" },
                    { key: "professionalNurse", label: "Điều dưỡng viên chuyên nghiệp" },
                    { key: "emergencySupport", label: "Hỗ trợ khẩn cấp ưu tiên" }
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={featureChecks[feature.key as keyof typeof featureChecks]}
                        onChange={(e) => setFeatureChecks({ ...featureChecks, [feature.key]: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 transition-colors"
                        style={{ accentColor: "#70C1F1" }}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tính năng tùy chỉnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thêm tính năng tùy chỉnh
                </label>
                <div className="space-y-3">
                  {customFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg border-2 bg-gray-50 px-3 py-2" style={{ borderColor: "#70C1F1" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" style={{ color: "#70C1F1" }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <span className="flex-1 text-sm text-gray-700">{feature}</span>
                      <button
                        onClick={() => setCustomFeatures(customFeatures.filter((_, i) => i !== idx))}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customFeature}
                      onChange={(e) => setCustomFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customFeature.trim()) {
                            setCustomFeatures([...customFeatures, customFeature.trim()]);
                            setCustomFeature("");
                          }
                        }
                      }}
                      placeholder="Nhập tính năng mới..."
                      className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none transition-colors"
                      style={{ borderColor: customFeature ? "#70C1F1" : undefined }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (customFeature.trim()) {
                          setCustomFeatures([...customFeatures, customFeature.trim()]);
                          setCustomFeature("");
                        }
                      }}
                      className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: "#70C1F1" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ghi chú thêm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú thêm
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Các điều khoản, chính sách, hoặc đặc biệt..."
                  rows={4}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none transition-colors"
                  style={{ borderColor: formData.notes ? "#70C1F1" : undefined }}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: "#70C1F1" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#70C1F1" }}>
                    Đánh dấu là gói phổ biến
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePackage}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                style={{ backgroundColor: "#70C1F1" }}
              >
                {editingPackage ? "Lưu thay đổi" : "Lưu gói dịch vụ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePackageManagementPage;
