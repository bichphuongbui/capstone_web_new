import axios from 'axios';

// Types cho Video Call
export interface VideoCallSession {
  id: string;
  meetingId: string;
  title: string;
  description: string;
  caregiver: {
    id: string;
    name: string;
    avatar: string;
    specialty: string;
    rating: number;
  };
  careSeeker: {
    id: string;
    name: string;
    avatar: string;
    age: number;
    relationship: string;
  };
  scheduledTime: string;
  duration: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meetingPassword?: string;
  notes?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoCallMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: 'caregiver' | 'careseeker';
  message: string;
  timestamp: string;
}

export interface VideoCallControls {
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isMuted: boolean;
}

// Base URL cho MockAPI
const API_BASE_URL = 'https://68aed258b91dfcdd62ba657c.mockapi.io';

// Service để tạo video call session
export const createVideoCallSession = async (data: {
  title: string;
  description: string;
  caregiverId: string;
  careSeekerId: string;
  scheduledTime: string;
  duration: number;
  notes?: string;
}): Promise<VideoCallSession> => {
  try {
    const meetingId = generateMeetingId();
    const response = await axios.post<VideoCallSession>(`${API_BASE_URL}/video-calls`, {
      ...data,
      meetingId,
      status: 'scheduled',
      meetingPassword: generatePassword(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo video call session:', error);
    throw error;
  }
};

// Service để lấy danh sách video call sessions
export const getVideoCallSessions = async (userId: string, role: 'caregiver' | 'careseeker'): Promise<VideoCallSession[]> => {
  try {
    const response = await axios.get<VideoCallSession[]>(`${API_BASE_URL}/video-calls`);
    const sessions = response.data;
    
    // Filter sessions based on user role
    if (role === 'caregiver') {
      return sessions.filter(session => session.caregiver.id === userId);
    } else {
      return sessions.filter(session => session.careSeeker.id === userId);
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách video call sessions:', error);
    return [];
  }
};

// Service để join video call
export const joinVideoCall = async (meetingId: string, _userId: string): Promise<VideoCallSession | null> => {
  try {
    const response = await axios.get<VideoCallSession[]>(`${API_BASE_URL}/video-calls`);
    const session = response.data.find(s => s.meetingId === meetingId);
    
    if (session) {
      // Update status to live if not already
      if (session.status === 'scheduled') {
        await updateVideoCallStatus(session.id, 'live');
        session.status = 'live';
      }
      return session;
    }
    return null;
  } catch (error) {
    console.error('Lỗi khi join video call:', error);
    return null;
  }
};

// Service để cập nhật trạng thái video call
export const updateVideoCallStatus = async (sessionId: string, status: VideoCallSession['status']): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/video-calls/${sessionId}`, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái video call:', error);
  }
};

// Service để gửi tin nhắn trong video call
export const sendVideoCallMessage = async (message: Omit<VideoCallMessage, 'id' | 'timestamp'>): Promise<VideoCallMessage> => {
  try {
    const response = await axios.post<VideoCallMessage>(`${API_BASE_URL}/video-call-messages`, {
      ...message,
      timestamp: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn video call:', error);
    throw error;
  }
};

// Service để lấy tin nhắn của video call session
export const getVideoCallMessages = async (sessionId: string): Promise<VideoCallMessage[]> => {
  try {
    const response = await axios.get<VideoCallMessage[]>(`${API_BASE_URL}/video-call-messages`);
    return response.data.filter(msg => msg.sessionId === sessionId);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn video call:', error);
    return [];
  }
};

// Service để cập nhật controls
export const updateVideoCallControls = async (sessionId: string, controls: Partial<VideoCallControls>): Promise<void> => {
  try {
    // Lưu controls vào localStorage để sync real-time
    localStorage.setItem(`video_controls_${sessionId}`, JSON.stringify(controls));
    
    // Dispatch event để notify other participants
    window.dispatchEvent(new CustomEvent('video-controls-updated', {
      detail: { sessionId, controls }
    }));
  } catch (error) {
    console.error('Lỗi khi cập nhật video call controls:', error);
  }
};

// Service để lấy controls hiện tại
export const getVideoCallControls = (sessionId: string): VideoCallControls => {
  try {
    const stored = localStorage.getItem(`video_controls_${sessionId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Lỗi khi lấy video call controls:', error);
  }
  
  // Default controls
  return {
    isMicOn: true,
    isCamOn: true,
    isScreenSharing: false,
    isMuted: false
  };
};

// Utility functions
const generateMeetingId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generatePassword = (): string => {
  return Math.random().toString(36).substring(2, 8);
};

// Service để kết thúc video call
export const endVideoCall = async (sessionId: string): Promise<void> => {
  try {
    await updateVideoCallStatus(sessionId, 'completed');
    
    // Clean up controls
    localStorage.removeItem(`video_controls_${sessionId}`);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('video-call-ended', {
      detail: { sessionId }
    }));
  } catch (error) {
    console.error('Lỗi khi kết thúc video call:', error);
  }
};


