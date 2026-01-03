import React, { useState } from 'react';
import { FiX, FiCalendar, FiClock, FiMessageSquare, FiCheck, FiXCircle } from 'react-icons/fi';
import { ScheduleChangeRequest, formatDateTime, getStatusColor, getStatusText } from '../../services/schedule-change.service';

interface ScheduleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ScheduleChangeRequest[];
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onCreateRequest: (data: {
    caregiverId: string;
    originalScheduleId: string;
    originalDateTime: string;
    proposedDateTime: string;
    reason: string;
  }) => void;
  currentScheduleId?: string;
  currentDateTime?: string;
  caregiverId?: string;
  className?: string;
}

const ScheduleChangeModal: React.FC<ScheduleChangeModalProps> = ({
  isOpen,
  onClose,
  requests,
  onAcceptRequest,
  onRejectRequest,
  onCreateRequest,
  currentScheduleId,
  currentDateTime,
  caregiverId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'create'>('requests');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    proposedDate: '',
    proposedTime: '',
    reason: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.proposedDate) {
      newErrors.proposedDate = 'Vui lòng chọn ngày đề nghị';
    }
    
    if (!formData.proposedTime) {
      newErrors.proposedTime = 'Vui lòng chọn giờ đề nghị';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Vui lòng nhập lý do đề nghị';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check if proposed time is in the future
    const proposedDateTime = new Date(`${formData.proposedDate}T${formData.proposedTime}`);
    const now = new Date();
    
    if (proposedDateTime <= now) {
      setErrors({ proposedDateTime: 'Thời gian đề nghị phải trong tương lai' });
      return;
    }

    setIsCreating(true);
    
    try {
      await onCreateRequest({
        caregiverId: caregiverId || 'caregiver-1',
        originalScheduleId: currentScheduleId || 'schedule-1',
        originalDateTime: currentDateTime || new Date().toISOString(),
        proposedDateTime: proposedDateTime.toISOString(),
        reason: formData.reason.trim()
      });
      
      // Reset form
      setFormData({
        proposedDate: '',
        proposedTime: '',
        reason: ''
      });
      setErrors({});
      setActiveTab('requests');
    } catch (error) {
      console.error('Lỗi khi tạo đề nghị đổi lịch:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      proposedDate: '',
      proposedTime: '',
      reason: ''
    });
    setErrors({});
    setActiveTab('requests');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quản lý đổi lịch</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Đề nghị đổi lịch ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tạo đề nghị mới
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'requests' ? (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đề nghị đổi lịch</h3>
                  <p className="text-gray-600">Tất cả đề nghị đổi lịch sẽ hiển thị ở đây</p>
                </div>
              ) : (
                requests.map((request) => {
                  const originalDateTime = formatDateTime(request.originalDateTime);
                  const proposedDateTime = formatDateTime(request.proposedDateTime);

                  return (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">{request.caregiverAvatar || '👨‍⚕️'}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{request.caregiverName || 'Chuyên gia chăm sóc'}</h4>
                            <p className="text-sm text-gray-600">{request.serviceTitle || 'Dịch vụ chăm sóc'}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {/* Original Schedule */}
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FiXCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Lịch cũ</span>
                          </div>
                          <div className="text-sm text-red-700">
                            <div className="flex items-center space-x-1">
                              <FiCalendar className="h-3 w-3" />
                              <span>{originalDateTime.date}</span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <FiClock className="h-3 w-3" />
                              <span>{originalDateTime.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Proposed Schedule */}
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FiCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Lịch đề nghị</span>
                          </div>
                          <div className="text-sm text-green-700">
                            <div className="flex items-center space-x-1">
                              <FiCalendar className="h-3 w-3" />
                              <span>{proposedDateTime.date}</span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <FiClock className="h-3 w-3" />
                              <span>{proposedDateTime.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <FiMessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Lý do đề nghị</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-white rounded p-2">{request.reason}</p>
                      </div>

                      {/* Caregiver Response */}
                      {request.caregiverResponse && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">Phản hồi từ chuyên gia</span>
                          </div>
                          <p className="text-sm text-gray-600 bg-blue-50 rounded p-2">{request.caregiverResponse}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => onRejectRequest(request.id)}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Từ chối
                          </button>
                          <button
                            onClick={() => onAcceptRequest(request.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Chấp nhận
                          </button>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        Tạo lúc: {formatDateTime(request.createdAt).date} {formatDateTime(request.createdAt).time}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* Current Schedule Info */}
              {currentDateTime && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Lịch hiện tại</h3>
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <FiCalendar className="h-4 w-4" />
                    <span>{formatDateTime(currentDateTime).date}</span>
                    <FiClock className="h-4 w-4 ml-2" />
                    <span>{formatDateTime(currentDateTime).time}</span>
                  </div>
                </div>
              )}

              {/* Proposed Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline h-4 w-4 mr-1" />
                  Ngày đề nghị *
                </label>
                <input
                  type="date"
                  value={formData.proposedDate}
                  onChange={(e) => handleInputChange('proposedDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.proposedDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.proposedDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.proposedDate}</p>
                )}
              </div>

              {/* Proposed Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline h-4 w-4 mr-1" />
                  Giờ đề nghị *
                </label>
                <input
                  type="time"
                  value={formData.proposedTime}
                  onChange={(e) => handleInputChange('proposedTime', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.proposedTime ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.proposedTime && (
                  <p className="mt-1 text-xs text-red-600">{errors.proposedTime}</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMessageSquare className="inline h-4 w-4 mr-1" />
                  Lý do đề nghị *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows={3}
                  placeholder="Vui lòng giải thích lý do cần đổi lịch..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.reason ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.reason && (
                  <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
                )}
              </div>

              {errors.proposedDateTime && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{errors.proposedDateTime}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Đang gửi...' : 'Gửi đề nghị'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleChangeModal;


