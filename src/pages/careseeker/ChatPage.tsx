import React, { useState, useEffect } from 'react';
import { FiSearch, FiPaperclip, FiSmile, FiVideo, FiSend } from 'react-icons/fi';
import { getCaregivers, getMessages, sendMessage, Caregiver, Message, formatTime } from '../../services/careseeker-chat.service';
import VideoCall from '../../components/video/VideoCall';

const ChatPage: React.FC = () => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  useEffect(() => {
    const loadCaregivers = async () => {
      try {
        const data = await getCaregivers();
        setCaregivers(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading caregivers:', error);
        setLoading(false);
      }
    };

    loadCaregivers();
  }, []);

  useEffect(() => {
    if (selectedCaregiver) {
      const loadMessages = async () => {
        try {
          const data = await getMessages(selectedCaregiver.id);
          setMessages(data);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedCaregiver]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCaregiver) return;
    
    try {
      const newMessage = await sendMessage(selectedCaregiver.id, inputMessage);
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredCaregivers = caregivers.filter(caregiver =>
    caregiver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Đang hoạt động';
      case 'away': return 'Vắng mặt';
      default: return 'Offline';
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Left Sidebar - Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Hội thoại</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCaregivers.map(caregiver => {
            const isActive = selectedCaregiver?.id === caregiver.id;
            const lastMessage = messages.length > 0 && selectedCaregiver?.id === caregiver.id 
              ? messages[messages.length - 1]?.content 
              : '';

            return (
              <div
                key={caregiver.id}
                onClick={() => setSelectedCaregiver(caregiver)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      {caregiver.avatar}
                    </div>
                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${getStatusColor(caregiver.status)}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{caregiver.name}</h3>
                      {caregiver.unreadCount && caregiver.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {caregiver.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {isActive ? lastMessage : 'Nhấn để xem tin nhắn'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedCaregiver ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                    {selectedCaregiver.avatar}
                  </div>
                  <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${getStatusColor(selectedCaregiver.status)}`}></span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedCaregiver.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-1 ${getStatusColor(selectedCaregiver.status)}`}></span>
                    {getStatusText(selectedCaregiver.status)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsVideoCallOpen(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Bắt đầu video call"
              >
                <FiVideo className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.isMe 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isMe ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <FiPaperclip className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <FiSmile className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors ${
                    inputMessage.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Gửi</span>
                  <FiSend className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Nhấn Enter để gửi, Shift+Enter để xuống dòng</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chọn cuộc trò chuyện</h3>
              <p>Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu.</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Call Modal */}
      {selectedCaregiver && (
        <VideoCall
          isOpen={isVideoCallOpen}
          onClose={() => setIsVideoCallOpen(false)}
          caregiverName={selectedCaregiver.name}
          caregiverAvatar={selectedCaregiver.avatar}
        />
      )}
    </div>
  );
};

export default ChatPage;
