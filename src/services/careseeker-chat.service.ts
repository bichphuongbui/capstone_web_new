// Types
export interface Caregiver {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastActive: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

export interface ChatRoom {
  id: string;
  caregiver: Caregiver;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

// Mock data cho caregivers
export const mockCaregivers: Caregiver[] = [
  {
    id: 'cg1',
    name: 'Nguyễn Văn A',
    avatar: '😊',
    status: 'online',
    lastActive: new Date().toISOString(),
    unreadCount: 2
  },
  {
    id: 'cg2',
    name: 'Trần Thị B',
    avatar: '👩',
    status: 'online',
    lastActive: new Date().toISOString(),
    unreadCount: 0
  },
  {
    id: 'cg3',
    name: 'Lê Văn C',
    avatar: '🧑',
    status: 'online',
    lastActive: new Date().toISOString(),
    unreadCount: 0
  },
  {
    id: 'cg4',
    name: 'Phạm Thị D',
    avatar: '👩‍⚕️',
    status: 'away',
    lastActive: new Date(Date.now() - 300000).toISOString(),
    unreadCount: 0
  },
  {
    id: 'cg5',
    name: 'Hoàng Văn E',
    avatar: '👨‍⚕️',
    status: 'offline',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0
  }
];

// Mock messages
export const mockMessages: { [caregiverId: string]: Message[] } = {
  'cg1': [
    {
      id: 'msg1',
      senderId: 'cg1',
      senderName: 'Nguyễn Văn A',
      content: 'Chào bạn, bạn rảnh cuối tuần không?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isMe: false
    },
    {
      id: 'msg2',
      senderId: 'me',
      senderName: 'Tôi',
      content: 'Mình rảnh chiều thứ 7 nhé!',
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      isMe: true
    },
    {
      id: 'msg3',
      senderId: 'cg1',
      senderName: 'Nguyễn Văn A',
      content: 'Tuyệt quá, cảm ơn bạn!',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isMe: false
    }
  ],
  'cg2': [
    {
      id: 'msg4',
      senderId: 'cg2',
      senderName: 'Trần Thị B',
      content: 'Mình có 3 năm kinh nghiệm ạ.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isMe: false
    }
  ],
  'cg3': [
    {
      id: 'msg5',
      senderId: 'cg3',
      senderName: 'Lê Văn C',
      content: 'Có thể nhé!',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      isMe: false
    }
  ]
};

// Service functions
export const getCaregivers = async (): Promise<Caregiver[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockCaregivers;
};

export const getCaregiverById = async (id: string): Promise<Caregiver | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockCaregivers.find(cg => cg.id === id);
};

export const getMessages = async (caregiverId: string): Promise<Message[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockMessages[caregiverId] || [];
};

export const sendMessage = async (caregiverId: string, content: string): Promise<Message> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    senderId: 'me',
    senderName: 'Tôi',
    content,
    timestamp: new Date().toISOString(),
    isMe: true
  };
  
  // Add to mock messages
  if (!mockMessages[caregiverId]) {
    mockMessages[caregiverId] = [];
  }
  mockMessages[caregiverId].push(newMessage);
  
  return newMessage;
};

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 172800000 && date.getDate() === now.getDate() - 1) {
    return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('vi-VN');
};
