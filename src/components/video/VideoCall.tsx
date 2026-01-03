import React, { useState, useEffect, useRef } from 'react';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, FiX, FiSettings } from 'react-icons/fi';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  caregiverName: string;
  caregiverAvatar: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ isOpen, onClose, caregiverName, caregiverAvatar }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCall();
    } else {
      endCall();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isCallActive) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCallActive]);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      // Simulate call connection
      setTimeout(() => {
        setIsConnecting(false);
        setIsCallActive(true);
        setCallDuration(0);
      }, 2000);

      // In a real implementation, you would:
      // 1. Get user media
      // 2. Set up WebRTC connection
      // 3. Connect to signaling server
      // 4. Handle peer connection
      
      if (localVideoRef.current) {
        // Mock local video stream
        localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        }).catch(() => null);
      }
    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsConnecting(false);
    setCallDuration(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Stop all tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // In real implementation, toggle video track
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // In real implementation, toggle audio track
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                {caregiverAvatar}
              </div>
              <div>
                <h3 className="text-white font-semibold">{caregiverName}</h3>
                <p className="text-gray-300 text-sm">
                  {isConnecting ? 'Đang kết nối...' : isCallActive ? formatDuration(callDuration) : 'Cuộc gọi video'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative w-full h-full">
          {/* Remote Video (Caregiver) */}
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            {isConnecting ? (
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p>Đang kết nối với {caregiverName}...</p>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                    {caregiverAvatar}
                  </div>
                  <p className="text-lg font-semibold">{caregiverName}</p>
                  <p className="text-gray-300">Đang chờ video từ caregiver...</p>
                </div>
              </div>
            )}
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
          </div>

          {/* Local Video (User) */}
          <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <FiVideoOff className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-colors ${
                isMicOn 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isMicOn ? <FiMic className="w-6 h-6" /> : <FiMicOff className="w-6 h-6" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOn 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isVideoOn ? <FiVideo className="w-6 h-6" /> : <FiVideoOff className="w-6 h-6" />}
            </button>

            {/* End Call */}
            <button
              onClick={() => {
                endCall();
                onClose();
              }}
              className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <FiPhone className="w-6 h-6" />
            </button>

            {/* Settings */}
            <button className="p-4 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors">
              <FiSettings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Đang kết nối...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
