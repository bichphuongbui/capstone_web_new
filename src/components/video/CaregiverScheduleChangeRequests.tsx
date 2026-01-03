import React, { useState, useEffect } from 'react';
import { FiBell, FiCalendar, FiClock, FiMessageSquare, FiCheck, FiX } from 'react-icons/fi';
import { ScheduleChangeRequest, getPendingScheduleChangeRequests, acceptScheduleChangeRequest, rejectScheduleChangeRequest, formatDateTime, getStatusColor, getStatusText } from '../../services/schedule-change.service';

interface CaregiverScheduleChangeRequestsProps {
  careSeekerId: string;
  onRequestUpdate?: () => void;
  className?: string;
}

const CaregiverScheduleChangeRequests: React.FC<CaregiverScheduleChangeRequestsProps> = ({
  careSeekerId,
  onRequestUpdate,
  className = ''
}) => {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Load pending requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const pendingRequests = await getPendingScheduleChangeRequests(careSeekerId);
        setRequests(pendingRequests);
      } catch (error) {
        console.error('Lỗi khi tải đề nghị đổi lịch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [careSeekerId]);

  const handleAcceptRequest = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      await acceptScheduleChangeRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      onRequestUpdate?.();
    } catch (error) {
      console.error('Lỗi khi chấp nhận đề nghị:', error);
      alert('Có lỗi xảy ra khi chấp nhận đề nghị');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      await rejectScheduleChangeRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      onRequestUpdate?.();
    } catch (error) {
      console.error('Lỗi khi từ chối đề nghị:', error);
      alert('Có lỗi xảy ra khi từ chối đề nghị');
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show anything if no requests
  }

  return (
    <div className={`bg-white rounded-lg border border-yellow-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-yellow-200 bg-yellow-50">
        <div className="flex items-center space-x-2">
          <FiBell className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800">Đề nghị đổi lịch từ chuyên gia</h3>
          <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
            {requests.length}
          </span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Có {requests.length} đề nghị đổi lịch đang chờ phản hồi của bạn
        </p>
      </div>

      {/* Requests List */}
      <div className="p-4 space-y-4">
        {requests.map((request) => {
          const originalDateTime = formatDateTime(request.originalDateTime);
          const proposedDateTime = formatDateTime(request.proposedDateTime);

          return (
            <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {/* Caregiver Info */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{request.caregiverAvatar || '👨‍⚕️'}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{request.caregiverName || 'Chuyên gia chăm sóc'}</h4>
                  <p className="text-sm text-gray-600">{request.serviceTitle || 'Dịch vụ chăm sóc'}</p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>

              {/* Schedule Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Original Schedule */}
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiX className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Lịch hiện tại</span>
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
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <FiMessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Lý do đề nghị</span>
                </div>
                <p className="text-sm text-gray-600 bg-white rounded p-2 border">{request.reason}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  disabled={isProcessing === request.id}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <FiX className="h-4 w-4 mr-1" />
                  {isProcessing === request.id ? 'Đang xử lý...' : 'Từ chối'}
                </button>
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={isProcessing === request.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <FiCheck className="h-4 w-4 mr-1" />
                  {isProcessing === request.id ? 'Đang xử lý...' : 'Chấp nhận'}
                </button>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 mt-2">
                Đề nghị lúc: {formatDateTime(request.createdAt).date} {formatDateTime(request.createdAt).time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Vui lòng phản hồi các đề nghị đổi lịch để chuyên gia có thể sắp xếp lại thời gian phù hợp
        </p>
      </div>
    </div>
  );
};

export default CaregiverScheduleChangeRequests;


