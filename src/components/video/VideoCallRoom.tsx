import React, { useRef, useState, useEffect } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhone, FiMessageSquare, FiX } from 'react-icons/fi';
import { VideoCallSession, VideoCallMessage, VideoCallControls, getVideoCallControls, updateVideoCallControls, sendVideoCallMessage, getVideoCallMessages } from '../../services/video-call.service';

interface VideoCallRoomProps {
  session: VideoCallSession;
  currentUserId: string;
  currentUserRole: 'caregiver' | 'careseeker';
  onEndCall: () => void;
  className?: string;
}

const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  session,
  currentUserId,
  currentUserRole,
  onEndCall,
  className = ''
}) => {
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCamOn, setIsCamOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [messages, setMessages] = useState<VideoCallMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  
  const listRef = useRef<HTMLDivElement | null>(null);

  // Load initial controls
  useEffect(() => {
    const controls = getVideoCallControls(session.id);
    setIsMicOn(controls.isMicOn);
    setIsCamOn(controls.isCamOn);
    setIsScreenSharing(controls.isScreenSharing);
    setIsMuted(controls.isMuted);
    
    // Simulate connection
    setTimeout(() => setIsConnecting(false), 2000);
  }, [session.id]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const msgs = await getVideoCallMessages(session.id);
      setMessages(msgs);
    };
    loadMessages();
  }, [session.id]);

  // Listen for control updates from other participants
  useEffect(() => {
    const handleControlsUpdate = (event: CustomEvent) => {
      if (event.detail.sessionId === session.id) {
        const { controls } = event.detail;
        if (controls.isMicOn !== undefined) setIsMicOn(controls.isMicOn);
        if (controls.isCamOn !== undefined) setIsCamOn(controls.isCamOn);
        if (controls.isScreenSharing !== undefined) setIsScreenSharing(controls.isScreenSharing);
        if (controls.isMuted !== undefined) setIsMuted(controls.isMuted);
      }
    };

    window.addEventListener('video-controls-updated', handleControlsUpdate as EventListener);
    return () => window.removeEventListener('video-controls-updated', handleControlsUpdate as EventListener);
  }, [session.id]);

  // Listen for call end
  useEffect(() => {
    const handleCallEnd = (event: CustomEvent) => {
      if (event.detail.sessionId === session.id) {
        onEndCall();
      }
    };

    window.addEventListener('video-call-ended', handleCallEnd as EventListener);
    return () => window.removeEventListener('video-call-ended', handleCallEnd as EventListener);
  }, [session.id, onEndCall]);

  const updateControls = async (newControls: Partial<VideoCallControls>) => {
    await updateVideoCallControls(session.id, newControls);
  };

  const toggleMic = () => {
    const newMicState = !isMicOn;
    setIsMicOn(newMicState);
    updateControls({ isMicOn: newMicState });
  };

  const toggleCam = () => {
    const newCamState = !isCamOn;
    setIsCamOn(newCamState);
    updateControls({ isCamOn: newCamState });
  };

  const toggleScreenShare = () => {
    const newScreenShareState = !isScreenSharing;
    setIsScreenSharing(newScreenShareState);
    updateControls({ isScreenSharing: newScreenShareState });
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    updateControls({ isMuted: newMuteState });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    try {
      const newMessage = await sendVideoCallMessage({
        sessionId: session.id,
        senderId: currentUserId,
        senderName: currentUserRole === 'caregiver' ? session.caregiver.name : session.careSeeker.name,
        senderRole: currentUserRole,
        message: text
      });

      setMessages(prev => [...prev, newMessage]);
      setInput('');
      
      // Scroll to bottom
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const controlBtn = (
    active: boolean,
    onToggle: () => void,
    IconOn: React.ComponentType<any>,
    IconOff: React.ComponentType<any>,
    labelOn: string,
    labelOff: string,
    activeColor: string
  ) => (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors ${
        active ? activeColor : 'bg-gray-500'
      } hover:opacity-90`}
      title={active ? labelOn : labelOff}
    >
      {active ? <IconOn className="h-4 w-4" /> : <IconOff className="h-4 w-4" />}
      <span className="hidden sm:inline">{active ? labelOn : labelOff}</span>
    </button>
  );

  const otherParticipant = currentUserRole === 'caregiver' ? session.careSeeker : session.caregiver;

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Phòng Gọi Video</h1>
          <p className="mt-1 text-sm text-gray-600">
            {session.title} • {otherParticipant.name}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video area (70%) */}
          <div className="lg:col-span-2 rounded-2xl bg-black relative overflow-hidden">
            {isConnecting ? (
              <div className="aspect-video w-full bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Đang kết nối...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Main video placeholder */}
                <div className="aspect-video w-full bg-gray-900 flex items-center justify-center text-gray-400 relative">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{otherParticipant.avatar}</div>
                    <h3 className="text-xl font-semibold text-white">{otherParticipant.name}</h3>
                    <p className="text-gray-300">
                      {currentUserRole === 'caregiver'
                        ? 'relationship' in otherParticipant
                          ? otherParticipant.relationship
                          : ''
                        : 'specialty' in otherParticipant
                          ? otherParticipant.specialty
                          : ''}
                    </p>
                    {!isCamOn && (
                      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <p className="text-gray-400">Camera đã tắt</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Small self camera */}
                <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-700/80 rounded-lg flex items-center justify-center text-gray-200">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{currentUserRole === 'caregiver' ? '👨‍⚕️' : '👨‍🦳'}</div>
                    <p className="text-xs">Bạn</p>
                    {!isCamOn && (
                      <div className="absolute inset-0 bg-gray-600 rounded-lg flex items-center justify-center">
                        <p className="text-xs text-gray-300">Camera tắt</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control bar */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-black/40 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    {controlBtn(isMicOn, toggleMic, FiMic, FiMicOff, 'Mic bật', 'Mic tắt', 'bg-blue-600')}
                    {controlBtn(isCamOn, toggleCam, FiVideo, FiVideoOff, 'Camera bật', 'Camera tắt', 'bg-blue-600')}
                    {controlBtn(isScreenSharing, toggleScreenShare, FiMonitor, FiMonitor, 'Chia sẻ màn hình', 'Dừng chia sẻ', 'bg-green-600')}
                    {controlBtn(isMuted, toggleMute, FiMicOff, FiMic, 'Tắt tiếng', 'Bật tiếng', 'bg-red-600')}
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white ${
                        showChat ? 'bg-purple-600' : 'bg-gray-500'
                      } hover:opacity-90`}
                    >
                      <FiMessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </button>
                    <button
                      onClick={onEndCall}
                      className="ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      <FiPhone className="h-4 w-4" />
                      <span className="hidden sm:inline">Kết thúc cuộc gọi</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar chat (30%) */}
          <div className={`rounded-2xl bg-white border border-gray-100 shadow p-4 flex flex-col transition-all duration-300 ${
            showChat ? 'block' : 'hidden lg:flex'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Chat</h2>
              <button
                onClick={() => setShowChat(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 mb-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border px-3 py-2 ${
                    msg.senderId === currentUserId
                      ? 'bg-blue-50 border-blue-200 ml-4'
                      : 'bg-gray-50 border-gray-200 mr-4'
                  }`}
                >
                  <div className="text-xs text-gray-500">{msg.senderName}</div>
                  <div className="text-sm text-gray-800">{msg.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <button
                onClick={sendMessage}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Info */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin cuộc gọi</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Meeting ID</p>
              <p className="font-mono text-lg">{session.meetingId}</p>
            </div>
            {session.meetingPassword && (
              <div>
                <p className="text-sm text-gray-600">Mật khẩu</p>
                <p className="font-mono text-lg">{session.meetingPassword}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Thời lượng dự kiến</p>
              <p className="text-lg font-medium">{session.duration} phút</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;


