import React, { useMemo, useState } from 'react';
import {FiPaperclip, FiSmile, FiSend, FiSearch} from 'react-icons/fi';

interface Message {
  id: string;
  sender: 'care_seeker' | 'care_giver';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  careSeekerName: string;
  avatar?: string;
  online?: boolean;
  unreadCount?: number;
  messages: Message[];
}

const initialConversations: Conversation[] = [
  {
    id: 'c1',
    careSeekerName: 'Nguyen Van A',
    avatar: 'https://i.pravatar.cc/100?img=12',
    online: true,
    unreadCount: 2,
    messages: [
      { id: 'm1', sender: 'care_seeker', text: 'Chào bạn, bạn rảnh cuối tuần không?', timestamp: '2025-09-23T09:00:00Z' },
      { id: 'm2', sender: 'care_giver', text: 'Mình rảnh chiều thứ 7 nhé!', timestamp: '2025-09-23T09:05:00Z' },
      { id: 'm3', sender: 'care_seeker', text: 'Tuyệt quá, cảm ơn bạn!', timestamp: '2025-09-23T09:06:00Z' },
    ],
  },
  {
    id: 'c2',
    careSeekerName: 'Tran Thi B',
    avatar: 'https://i.pravatar.cc/100?img=32',
    online: false,
    unreadCount: 0,
    messages: [
      { id: 'm1', sender: 'care_seeker', text: 'Bạn có kinh nghiệm chăm người lớn tuổi không?', timestamp: '2025-09-22T08:00:00Z' },
      { id: 'm2', sender: 'care_giver', text: 'Mình có 3 năm kinh nghiệm ạ.', timestamp: '2025-09-22T08:10:00Z' },
    ],
  },
  {
    id: 'c3',
    careSeekerName: 'Le Van C',
    avatar: 'https://i.pravatar.cc/100?img=7',
    online: true,
    unreadCount: 0,
    messages: [
      { id: 'm1', sender: 'care_seeker', text: 'Bạn có thể nhận lịch hẹn ban đêm không?', timestamp: '2025-09-21T21:00:00Z' },
      { id: 'm2', sender: 'care_giver', text: 'Có thể nhé!', timestamp: '2025-09-21T21:10:00Z' },
    ],
  },
];

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string>(initialConversations[0]?.id || '');
  const [draftMessage, setDraftMessage] = useState<string>('');

  const selectedConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed || !selectedConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: 'care_giver',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id !== selectedConversation.id) return conv;
      return { ...conv, messages: [...conv.messages, newMessage] };
    }));

    setDraftMessage('');
  };

  return (
    <div className="-m-6 h-[100vh]">
      <div className="bg-white rounded-none md:rounded-lg shadow h-full overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Sidebar */}
          <div className="md:w-[320px] w-full border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 space-y-3">
              <h2 className="text-lg font-semibold">Hội thoại</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {conversations.map(conv => {
                const isActive = conv.id === selectedConversationId;
                return (
                  <li
                    key={conv.id}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={conv.avatar} alt={conv.careSeekerName} className="w-10 h-10 rounded-full object-cover" />
                        
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>{conv.careSeekerName}</span>
                          {conv.unreadCount ? (
                            <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold bg-blue-600 text-white rounded-full w-5 h-5">
                              {conv.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {conv.messages[conv.messages.length - 1]?.text}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Chat box */}
          <div className="flex-1 w-full flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {selectedConversation && (
                  <img src={selectedConversation.avatar} alt={selectedConversation.careSeekerName} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold truncate">
                      {selectedConversation ? selectedConversation.careSeekerName : 'Chọn một hội thoại'}
                    </h3>
                   
                  </div>
                  
                </div>
              </div>
            </div>

            

            {/* Body */}
            <div className="flex-1 p-4 space-y-3 bg-gray-50 overflow-y-auto">
              {selectedConversation && selectedConversation.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'care_giver' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`${
                      msg.sender === 'care_giver'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    } px-4 py-2 rounded-lg max-w-[80%]`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {!selectedConversation && (
                <div className="text-center text-gray-500">Hãy chọn một hội thoại để bắt đầu</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600" title="Đính kèm">
                    <FiPaperclip />
                  </button>
                  <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600" title="Emoji">
                    <FiSmile />
                  </button>
                </div>
                <textarea
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-40"
                  placeholder="Nhập tin nhắn..."
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={!selectedConversation}
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
                  onClick={handleSend}
                  disabled={!selectedConversation || !draftMessage.trim()}
                  title="Gửi"
                >
                  <FiSend />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Nhấn Enter để gửi, Shift+Enter để xuống dòng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;


