// Service để quản lý thông tin gia đình
export interface FamilyMember {
  id: string;
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
  // Thông tin sức khỏe chi tiết
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

// Mock data - trong thực tế sẽ gọi API
const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'fm1',
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
    id: 'fm2',
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
];

// Lấy danh sách thành viên gia đình
export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockFamilyMembers);
    }, 500);
  });
};

// Lấy thông tin chi tiết của một thành viên gia đình
export const getFamilyMemberById = async (id: string): Promise<FamilyMember | null> => {
  const members = await getFamilyMembers();
  return members.find(member => member.id === id) || null;
};
