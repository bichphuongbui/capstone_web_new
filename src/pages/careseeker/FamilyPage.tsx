import React, { useState } from 'react';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiHeart, FiCalendar, FiAlertTriangle, FiX, FiUser, FiPhone, FiAward, FiActivity, FiTrendingUp, FiEye, FiShield, FiZap } from 'react-icons/fi';

// Interface cho thành viên gia đình
interface FamilyMember {
  id: number;
  name: string;
  age: number;
  relationship: string;
  avatar: string;
  medicalConditions: string[];
  medications: string[];
  lastCheckup: string;
  notes: string;
  bloodPressure: string;
  bloodSugar: string;
  weight: string;
  height: string;
  bloodPressureUpdatedBy: string;
  bloodPressureUpdatedAt: string;
  bloodSugarUpdatedBy: string;
  bloodSugarUpdatedAt: string;
  // Thêm thông tin sức khỏe chi tiết
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  bmi: string;
  allergies: string[];
  emergencyContact: string;
  emergencyPhone: string;
  doctorName: string;
  doctorPhone: string;
  nextAppointment: string;
  healthAlerts: {
    type: 'warning' | 'danger' | 'info';
    message: string;
    date: string;
  }[];
  vitalHistory: {
    date: string;
    bloodPressure: string;
    bloodSugar: string;
    heartRate: string;
    weight: string;
    recordedBy: string;
  }[];
}

const FamilyPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: 1,
      name: 'Nguyễn Văn Bố',
      age: 72,
      relationship: 'Bố',
      avatar: '👨‍🦳',
      medicalConditions: ['Cao huyết áp', 'Tiểu đường type 2'],
      medications: ['Metformin', 'Amlodipine', 'Lisinopril'],
      lastCheckup: '2024-01-10',
      notes: 'Cần theo dõi huyết áp hàng ngày, uống thuốc đúng giờ',
      bloodPressure: '140/90 mmHg',
      bloodSugar: '8.5 mmol/L',
      weight: '75 kg',
      height: '165 cm',
      bloodPressureUpdatedBy: 'Trần Thị Mai',
      bloodPressureUpdatedAt: '2024-01-20 08:30',
      bloodSugarUpdatedBy: 'Trần Thị Mai',
      bloodSugarUpdatedAt: '2024-01-20 08:30',
      // Thông tin sức khỏe chi tiết
      heartRate: '85 bpm',
      temperature: '36.8°C',
      oxygenSaturation: '96%',
      bmi: '27.5',
      allergies: ['Penicillin', 'Shellfish'],
      emergencyContact: 'Nguyễn Thị Lan',
      emergencyPhone: '0901234567',
      doctorName: 'BS. Trần Văn Minh',
      doctorPhone: '0281234567',
      nextAppointment: '2024-02-15',
      healthAlerts: [
        {
          type: 'warning',
          message: 'Huyết áp cao hơn bình thường',
          date: '2024-01-20'
        },
        {
          type: 'info',
          message: 'Cần uống thuốc đúng giờ',
          date: '2024-01-19'
        }
      ],
      vitalHistory: [
        {
          date: '2024-01-20',
          bloodPressure: '140/90',
          bloodSugar: '8.5',
          heartRate: '85',
          weight: '75',
          recordedBy: 'Trần Thị Mai'
        },
        {
          date: '2024-01-19',
          bloodPressure: '135/88',
          bloodSugar: '8.2',
          heartRate: '82',
          weight: '75.2',
          recordedBy: 'Lê Văn Hùng'
        }
      ]
    },
    {
      id: 2,
      name: 'Trần Thị Mẹ',
      age: 68,
      relationship: 'Mẹ',
      avatar: '👩‍🦳',
      medicalConditions: ['Viêm khớp', 'Loãng xương'],
      medications: ['Calcium', 'Vitamin D', 'Ibuprofen'],
      lastCheckup: '2024-01-15',
      notes: 'Cần tập thể dục nhẹ nhàng, tránh vận động mạnh',
      bloodPressure: '125/80 mmHg',
      bloodSugar: '6.2 mmol/L',
      weight: '58 kg',
      height: '155 cm',
      bloodPressureUpdatedBy: 'Lê Văn Hùng',
      bloodPressureUpdatedAt: '2024-01-19 14:15',
      bloodSugarUpdatedBy: 'Lê Văn Hùng',
      bloodSugarUpdatedAt: '2024-01-19 14:15',
      // Thông tin sức khỏe chi tiết
      heartRate: '78 bpm',
      temperature: '36.5°C',
      oxygenSaturation: '98%',
      bmi: '24.1',
      allergies: ['Aspirin'],
      emergencyContact: 'Nguyễn Văn Bố',
      emergencyPhone: '0901234568',
      doctorName: 'BS. Lê Thị Hoa',
      doctorPhone: '0281234568',
      nextAppointment: '2024-02-20',
      healthAlerts: [
        {
          type: 'info',
          message: 'Tình trạng sức khỏe ổn định',
          date: '2024-01-19'
        }
      ],
      vitalHistory: [
        {
          date: '2024-01-19',
          bloodPressure: '125/80',
          bloodSugar: '6.2',
          heartRate: '78',
          weight: '58',
          recordedBy: 'Lê Văn Hùng'
        }
      ]
    }
  ]);

  // Hàm mở modal thêm thành viên
  const handleAddMember = () => {
    setIsModalOpen(true);
  };

  // Hàm đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Hàm xóa thành viên
  const handleDeleteMember = (id: number) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FiUsers className="h-8 w-8 mr-3 text-blue-600" />
              Quản lý gia đình
            </h1>
            <p className="text-lg text-gray-600">
              Tạo và quản lý hồ sơ của các thành viên cao tuổi trong gia đình
            </p>
          </div>
          <button 
            onClick={handleAddMember}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* Danh sách thành viên */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Header card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{member.avatar}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.age} tuổi - {member.relationship}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <FiEdit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Health Alerts */}
            {member.healthAlerts.length > 0 && (
              <div className="mb-4">
                {member.healthAlerts.map((alert, index) => (
                  <div key={index} className={`p-2 rounded-lg mb-2 flex items-center ${
                    alert.type === 'danger' ? 'bg-red-100 text-red-800' :
                    alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <FiAlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{alert.message}</span>
                    <span className="text-xs ml-auto">{alert.date}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Thông tin sức khỏe chi tiết */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-red-600 font-medium">Huyết áp</div>
                  <FiActivity className="h-3 w-3 text-red-500" />
                </div>
                <div className="text-sm font-semibold text-red-800">{member.bloodPressure}</div>
                <div className="text-xs text-red-500 mt-1">
                  Bởi: {member.bloodPressureUpdatedBy}
                </div>
                <div className="text-xs text-red-400">
                  {member.bloodPressureUpdatedAt}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-blue-600 font-medium">Đường huyết</div>
                  <FiZap className="h-3 w-3 text-blue-500" />
                </div>
                <div className="text-sm font-semibold text-blue-800">{member.bloodSugar}</div>
                <div className="text-xs text-blue-500 mt-1">
                  Bởi: {member.bloodSugarUpdatedBy}
                </div>
                <div className="text-xs text-blue-400">
                  {member.bloodSugarUpdatedAt}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-green-600 font-medium">Nhịp tim</div>
                  <FiHeart className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-sm font-semibold text-green-800">{member.heartRate}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-purple-600 font-medium">Nhiệt độ</div>
                  <FiActivity className="h-3 w-3 text-purple-500" />
                </div>
                <div className="text-sm font-semibold text-purple-800">{member.temperature}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-orange-600 font-medium">Oxy</div>
                  <FiShield className="h-3 w-3 text-orange-500" />
                </div>
                <div className="text-sm font-semibold text-orange-800">{member.oxygenSaturation}</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-indigo-600 font-medium">BMI</div>
                  <FiTrendingUp className="h-3 w-3 text-indigo-500" />
                </div>
                <div className="text-sm font-semibold text-indigo-800">{member.bmi}</div>
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium mb-1">Cân nặng</div>
                <div className="text-sm font-semibold text-gray-800">{member.weight}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium mb-1">Chiều cao</div>
                <div className="text-sm font-semibold text-gray-800">{member.height}</div>
              </div>
            </div>

            {/* Tình trạng sức khỏe */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Tình trạng sức khỏe</h4>
              <div className="flex flex-wrap gap-1">
                {member.medicalConditions.map((condition, index) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    {condition}
                  </span>
                ))}
              </div>
            </div>

            {/* Thuốc đang dùng */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Thuốc đang dùng</h4>
              <div className="flex flex-wrap gap-1">
                {member.medications.map((med, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {med}
                  </span>
                ))}
              </div>
            </div>

            {/* Dị ứng */}
            {member.allergies.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Dị ứng</h4>
                <div className="flex flex-wrap gap-1">
                  {member.allergies.map((allergy, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lịch sử theo dõi sức khỏe */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <FiEye className="h-4 w-4 mr-1" />
                Lịch sử theo dõi
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {member.vitalHistory.slice(0, 3).map((record, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{record.date}</span>
                      <span className="text-gray-500">Bởi: {record.recordedBy}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>HA: {record.bloodPressure}</div>
                      <div>ĐH: {record.bloodSugar}</div>
                      <div>Tim: {record.heartRate}</div>
                      <div>Cân: {record.weight}kg</div>
                    </div>
                  </div>
                ))}
                {member.vitalHistory.length > 3 && (
                  <div className="text-center text-xs text-gray-500">
                    +{member.vitalHistory.length - 3} bản ghi khác
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin liên hệ khẩn cấp */}
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                <FiAlertTriangle className="h-4 w-4 mr-1" />
                Liên hệ khẩn cấp
              </h4>
              <div className="text-sm text-red-700">
                <div className="flex items-center space-x-2 mb-1">
                  <FiUser className="h-3 w-3" />
                  <span>{member.emergencyContact}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiPhone className="h-3 w-3" />
                  <span>{member.emergencyPhone}</span>
                </div>
              </div>
            </div>

            {/* Thông tin bác sĩ */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <FiAward className="h-4 w-4 mr-1" />
                Bác sĩ điều trị
              </h4>
              <div className="text-sm text-blue-700">
                <div className="flex items-center space-x-2 mb-1">
                  <FiUser className="h-3 w-3" />
                  <span>{member.doctorName}</span>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <FiPhone className="h-3 w-3" />
                  <span>{member.doctorPhone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiCalendar className="h-3 w-3" />
                  <span>Hẹn tiếp: {member.nextAppointment}</span>
                </div>
              </div>
            </div>

            {/* Lần khám cuối */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FiCalendar className="h-4 w-4" />
              <span>Khám cuối: {member.lastCheckup}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal thêm thành viên */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Thêm thành viên mới</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6">
              <form className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tuổi *
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tuổi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mối quan hệ *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Chọn mối quan hệ</option>
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Ông nội">Ông nội</option>
                    <option value="Bà nội">Bà nội</option>
                    <option value="Ông ngoại">Ông ngoại</option>
                    <option value="Bà ngoại">Bà ngoại</option>
                    <option value="Cô">Cô</option>
                    <option value="Chú">Chú</option>
                    <option value="Dì">Dì</option>
                    <option value="Cậu">Cậu</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cân nặng
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 75 kg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chiều cao
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 165 cm"
                    />
                  </div>
                </div>

                {/* Thông tin sức khỏe chi tiết */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Huyết áp
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 120/80 mmHg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đường huyết
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 5.5 mmol/L"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhịp tim
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 75 bpm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhiệt độ
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 36.5°C"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oxy trong máu
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 98%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BMI
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: 22.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tình trạng sức khỏe
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: Cao huyết áp, Tiểu đường, Viêm khớp..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thuốc đang dùng
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: Metformin, Amlodipine, Calcium..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dị ứng
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: Penicillin, Shellfish, Aspirin..."
                  />
                </div>

                {/* Thông tin liên hệ khẩn cấp */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ khẩn cấp</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên người liên hệ
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tên người liên hệ khẩn cấp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Số điện thoại liên hệ khẩn cấp"
                      />
                    </div>
                  </div>
                </div>

                {/* Thông tin bác sĩ */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bác sĩ điều trị</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên bác sĩ
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tên bác sĩ điều trị"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại bác sĩ
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Số điện thoại bác sĩ"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lần khám cuối
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lần khám tiếp theo
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú sức khỏe
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Ghi chú về tình trạng sức khỏe, lưu ý đặc biệt, hướng dẫn chăm sóc..."
                  />
                </div>
              </form>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Thêm thành viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyPage;
