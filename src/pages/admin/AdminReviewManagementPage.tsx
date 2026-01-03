import React, { useEffect, useMemo, useState } from "react";
import { getAllVideoFeedbacks, getVideoFeedbackById, VideoFeedback } from '../../services/video-feedback.service';
import { getAllSystemFeedbacks, getSystemFeedbackById, SystemFeedback, getAllServiceReviews, getServiceReviewById, ServiceReview, getAllDisputes, getDisputeById, DisputeReview } from '../../services/feedback.service';
import Notification from '../../components/Notification';

type ReviewCategory = "Video Consultation" | "Service" | "System" | "Complaint";
type ReviewRole = "Care Seeker" | "Caregiver";

export type AdminReview = {
  id: string;
  category: ReviewCategory;
  rating: number; // 1..5
  comment: string;
  createdByRole: ReviewRole;
  createdByName: string;
  createdByEmail?: string;
  relatedBookingId?: string;
  createdAt: string; // ISO
};

const CATEGORIES: ReviewCategory[] = [
  "Video Consultation",
  "Service",
  "System",
  "Complaint",
];

const CATEGORY_LABEL: Record<ReviewCategory, string> = {
  "Video Consultation": "Tư vấn video",
  "Service": "Dịch vụ",
  "System": "Hệ thống",
  "Complaint": "Khiếu nại",
};

const ROLE_LABEL: Record<ReviewRole, string> = {
  "Care Seeker": "Người thuê",
  "Caregiver": "Người chăm sóc",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const StarRating: React.FC<{ value: number }> = ({ value }) => {
  const fullStars = Math.floor(value); // Số sao đầy
  const hasHalfStar = value % 1 >= 0.5; // Có nửa sao không
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => {
        const isFull = idx < fullStars;
        const isHalf = idx === fullStars && hasHalfStar;
        
        return (
          <svg
            key={idx}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFull ? "#F59E0B" : "none"}
            stroke="#F59E0B"
            className="h-4 w-4"
          >
            {isHalf ? (
              <>
                <defs>
                  <linearGradient id={`half-${idx}`}>
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${idx})`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.01 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61L12.53 17.89a.563.563 0 00-.56 0l-4.378 2.649a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L3.65 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.01-5.111z"
                />
              </>
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M11.48 3.499a.562.562 0 011.04 0l2.01 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61L12.53 17.89a.563.563 0 00-.56 0l-4.378 2.649a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L3.65 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.01-5.111z"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
};

// (Đã bỏ badge trạng thái khỏi bảng theo yêu cầu)

type ReviewModalProps = {
  open: boolean;
  review?: AdminReview | null;
  feedbackDetails?: VideoFeedback | null;
  systemFeedbackDetails?: SystemFeedback | null;
  serviceReviewDetails?: ServiceReview | null;
  disputeReviewDetails?: DisputeReview | null;
  loadingDetails?: boolean;
  onClose: () => void;
};

const ReviewModal: React.FC<ReviewModalProps> = ({ open, review, feedbackDetails, systemFeedbackDetails, serviceReviewDetails, disputeReviewDetails, loadingDetails, onClose }) => {
  if (!open || !review) return null;

  const isVideoCall = review.category === "Video Consultation";
  const isSystemFeedback = review.category === "System";
  const isServiceReview = review.category === "Service";
  const isDisputeReview = review.category === "Complaint";

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const experienceLabels: Record<string, string> = {
    'excellent': 'Xuất sắc',
    'good': 'Tốt',
    'average': 'Trung bình',
    'poor': 'Kém',
    'very_poor': 'Rất kém'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-sm">
        <div className="sticky top-0 bg-white flex items-center justify-between border-b border-blue-100 px-6 py-4 z-10 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900">
            Chi tiết đánh giá {isVideoCall ? 'Video Call' : isServiceReview ? 'Dịch vụ' : isDisputeReview ? 'Khiếu nại' : 'Hệ thống'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-6 p-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Người đánh giá</div>
                <div className="font-semibold text-gray-900">{review.createdByName}</div>
                <div className="text-sm text-blue-600 mt-1">({ROLE_LABEL[review.createdByRole]})</div>
                {review.createdByEmail && <div className="text-sm text-gray-600 mt-1">{review.createdByEmail}</div>}
              </div>
              {isVideoCall && feedbackDetails?.receiver && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">Người nhận đánh giá</div>
                  <div className="font-semibold text-gray-900">{feedbackDetails.receiver.name}</div>
                  <div className="text-sm text-blue-600 mt-1">({feedbackDetails.receiver.role === 'caregiver' ? 'Người chăm sóc' : 'Người thuê'})</div>
                  <div className="text-sm text-gray-600 mt-1">{feedbackDetails.receiver.email}</div>
                </div>
              )}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Ngày tạo</div>
                <div className="font-semibold text-gray-900">{formatDate(review.createdAt)}</div>
              </div>
              {review.relatedBookingId && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">Booking ID</div>
                  <div className="font-semibold text-gray-900">{review.relatedBookingId}</div>
                </div>
              )}
            </div>
          </div>

          {/* System Feedback Title & Description */}
          {isSystemFeedback && systemFeedbackDetails && (
            <>
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                  </svg>
                  Tiêu đề
                </h4>
                <div className="text-lg font-semibold text-gray-900 p-4 rounded-lg bg-blue-50 border border-blue-200">
                  {systemFeedbackDetails.title}
                </div>
              </div>

              {review.comment && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Mô tả chi tiết
                  </h4>
                  <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 border border-gray-200">
                    {review.comment}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Chi tiết feedback
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-xs font-medium text-purple-700 mb-2">Loại feedback</div>
                    <div className="font-semibold text-gray-900 capitalize">{systemFeedbackDetails.feedbackType.replace('_', ' ')}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="text-xs font-medium text-indigo-700 mb-2">Danh mục</div>
                    <div className="font-semibold text-gray-900 capitalize">{systemFeedbackDetails.category}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-2">Độ ưu tiên</div>
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                      systemFeedbackDetails.priority === 'high' 
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-600/20'
                        : systemFeedbackDetails.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-600/20'
                        : 'bg-blue-100 text-blue-700 ring-2 ring-blue-600/20'
                    }`}>
                      {systemFeedbackDetails.priority === 'high' ? '🔴 Cao' : systemFeedbackDetails.priority === 'medium' ? '🟡 Trung bình' : '🔵 Thấp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Feedback Tags */}
              {systemFeedbackDetails.tags && systemFeedbackDetails.tags.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {systemFeedbackDetails.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* System Feedback Attachments */}
              {systemFeedbackDetails.attachments && systemFeedbackDetails.attachments.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    Tệp đính kèm
                  </h4>
                  <div className="space-y-2">
                    {systemFeedbackDetails.attachments.map((attachment, idx) => (
                      <a 
                        key={idx} 
                        href={attachment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="font-medium">{attachment.split('/').pop()}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Service Review Details */}
          {isServiceReview && serviceReviewDetails && (
            <>
              {/* Caregiver Info */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Thông tin người chăm sóc
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-2">Tên người chăm sóc</div>
                    <div className="font-semibold text-gray-900">{serviceReviewDetails.caregiver.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{serviceReviewDetails.caregiver.email}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-2">Ngày làm việc</div>
                    <div className="font-semibold text-gray-900">{formatDate(serviceReviewDetails.booking.bookingDate)}</div>
                    <div className="text-sm text-gray-600 mt-1">Thời gian: {serviceReviewDetails.booking.bookingTime} - Thời lượng: {serviceReviewDetails.booking.duration}h</div>
                  </div>
                </div>
              </div>

              {/* Service Ratings */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.01 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61L12.53 17.89a.563.563 0 00-.56 0l-4.378 2.649a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L3.65 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.01-5.111z" />
                  </svg>
                  Đánh giá chi tiết
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-xs font-medium text-purple-700 mb-2">Chuyên nghiệp</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating value={serviceReviewDetails.ratings.professionalism} />
                      <span className="text-sm font-bold text-gray-900">{serviceReviewDetails.ratings.professionalism}/5</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-2">Thái độ</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating value={serviceReviewDetails.ratings.attitude} />
                      <span className="text-sm font-bold text-gray-900">{serviceReviewDetails.ratings.attitude}/5</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-xs font-medium text-green-700 mb-2">Đúng giờ</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating value={serviceReviewDetails.ratings.punctuality} />
                      <span className="text-sm font-bold text-gray-900">{serviceReviewDetails.ratings.punctuality}/5</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-pink-50 border border-pink-200">
                    <div className="text-xs font-medium text-pink-700 mb-2">Chất lượng chăm sóc</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating value={serviceReviewDetails.ratings.careQuality} />
                      <span className="text-sm font-bold text-gray-900">{serviceReviewDetails.ratings.careQuality}/5</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="text-xs font-medium text-indigo-700 mb-2">Giao tiếp</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating value={serviceReviewDetails.ratings.communication} />
                      <span className="text-sm font-bold text-gray-900">{serviceReviewDetails.ratings.communication}/5</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Điểm trung bình</div>
                  <div className="flex items-center gap-3">
                    <StarRating value={review.rating} />
                    <span className="text-2xl font-bold text-gray-900">{review.rating.toFixed(1)}/5</span>
                  </div>
                </div>
              </div>

              {/* Overall Satisfaction & Would Use Again */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                  Mức độ hài lòng
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm ${
                    serviceReviewDetails.overallSatisfaction === 'very_satisfied' 
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-600/20'
                      : serviceReviewDetails.overallSatisfaction === 'satisfied'
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600/20'
                      : serviceReviewDetails.overallSatisfaction === 'neutral'
                      ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-600/20'
                      : 'bg-red-100 text-red-700 ring-2 ring-red-600/20'
                  }`}>
                    {serviceReviewDetails.overallSatisfaction === 'very_satisfied' ? '😄 Rất hài lòng' : 
                     serviceReviewDetails.overallSatisfaction === 'satisfied' ? '🙂 Hài lòng' :
                     serviceReviewDetails.overallSatisfaction === 'neutral' ? '😐 Bình thường' :
                     serviceReviewDetails.overallSatisfaction === 'dissatisfied' ? '☹️ Không hài lòng' : '😡 Rất không hài lòng'}
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm ${
                    serviceReviewDetails.wouldUseAgain === 'definitely'
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-600/20'
                      : serviceReviewDetails.wouldUseAgain === 'probably'
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600/20'
                      : serviceReviewDetails.wouldUseAgain === 'maybe'
                      ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-600/20'
                      : 'bg-gray-100 text-gray-700 ring-2 ring-gray-600/20'
                  }`}>
                    {serviceReviewDetails.wouldUseAgain === 'definitely' ? '✓ Chắc chắn sử dụng lại' :
                     serviceReviewDetails.wouldUseAgain === 'probably' ? '✓ Có thể sử dụng lại' :
                     serviceReviewDetails.wouldUseAgain === 'maybe' ? '? Chưa chắc' : '✗ Không sử dụng lại'}
                  </span>
                </div>
              </div>

              {/* Strengths & Improvements */}
              {(serviceReviewDetails.strengths.length > 0 || serviceReviewDetails.improvements.length > 0) && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {serviceReviewDetails.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Điểm mạnh
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {serviceReviewDetails.strengths.map((strength, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                              {strength.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {serviceReviewDetails.improvements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-orange-500">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                          </svg>
                          Cần cải thiện
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {serviceReviewDetails.improvements.map((improvement, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              {improvement.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {review.comment && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    Ghi chú thêm
                  </h4>
                  <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 border border-gray-200">
                    {review.comment}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Dispute Review Details */}
          {isDisputeReview && disputeReviewDetails && (
            <>
              {/* Dispute Title & Description */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Tiêu đề khiếu nại
                </h4>
                <div className="text-lg font-semibold text-gray-900 p-4 rounded-lg bg-red-50 border border-red-200">
                  {disputeReviewDetails.title}
                </div>
              </div>

              {disputeReviewDetails.description && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-red-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Mô tả khiếu nại
                  </h4>
                  <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 border border-gray-200">
                    {disputeReviewDetails.description}
                  </div>
                </div>
              )}

              {/* Dispute Info */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Chi tiết khiếu nại
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="text-xs font-medium text-orange-700 mb-2">Loại khiếu nại</div>
                    <div className="font-semibold text-gray-900 capitalize">{disputeReviewDetails.disputeType.replace('_', ' ')}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-xs font-medium text-red-700 mb-2">Mức độ nghiêm trọng</div>
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                      disputeReviewDetails.severity === 'critical' 
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-600/20'
                        : disputeReviewDetails.severity === 'high'
                        ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-600/20'
                        : disputeReviewDetails.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-600/20'
                        : 'bg-blue-100 text-blue-700 ring-2 ring-blue-600/20'
                    }`}>
                      {disputeReviewDetails.severity === 'critical' ? '🔴 Nghiêm trọng' : 
                       disputeReviewDetails.severity === 'high' ? '🟠 Cao' :
                       disputeReviewDetails.severity === 'medium' ? '🟡 Trung bình' : '🔵 Thấp'}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-2">Trạng thái</div>
                    <div className="font-semibold text-green-700">✓ Đã giải quyết</div>
                  </div>
                </div>
              </div>

              {/* Respondent Satisfaction */}
              {disputeReviewDetails.respondentSatisfaction && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-green-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.01 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61L12.53 17.89a.563.563 0 00-.56 0l-4.378 2.649a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L3.65 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.01-5.111z" />
                    </svg>
                    Đánh giá của bên bị khiếu nại
                  </h4>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Mức độ hài lòng</div>
                    <div className="flex items-center gap-3">
                      <StarRating value={disputeReviewDetails.respondentSatisfaction.rating} />
                      <span className="text-2xl font-bold text-gray-900">{disputeReviewDetails.respondentSatisfaction.rating}/5</span>
                    </div>
                  </div>
                  {disputeReviewDetails.respondentSatisfaction.feedback && (
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">Phản hồi</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{disputeReviewDetails.respondentSatisfaction.feedback}</div>
                    </div>
                  )}
                  {disputeReviewDetails.respondentSatisfaction.ratedAt && (
                    <div className="mt-3 text-xs text-gray-500">
                      Đánh giá vào: {formatDate(disputeReviewDetails.respondentSatisfaction.ratedAt)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Call Info */}
          {isVideoCall && feedbackDetails?.callInfo && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Thông tin cuộc gọi
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-xs font-medium text-green-700 mb-2">Thời lượng</div>
                  <div className="font-semibold text-gray-900">{formatDuration(feedbackDetails.callInfo.duration)}</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-2">Bắt đầu</div>
                  <div className="font-semibold text-sm text-gray-900">{formatDateTime(feedbackDetails.callInfo.startTime)}</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-xs font-medium text-purple-700 mb-2">Kết thúc</div>
                  <div className="font-semibold text-sm text-gray-900">{formatDateTime(feedbackDetails.callInfo.endTime)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Ratings */}
          {loadingDetails ? (
            <div className="border-t pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: '#7CBCFF' }}></div>
                  <p className="mt-2 text-sm text-gray-600">Đang tải chi tiết...</p>
                </div>
              </div>
            </div>
          ) : isVideoCall && feedbackDetails && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.01 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61L12.53 17.89a.563.563 0 00-.56 0l-4.378 2.649a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L3.65 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.01-5.111z" />
                </svg>
                Chất lượng cuộc gọi
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-xs font-medium text-purple-700 mb-2">Chất lượng video</div>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating value={feedbackDetails.videoQuality} />
                    <span className="text-sm font-bold text-gray-900">{feedbackDetails.videoQuality}/5</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-2">Chất lượng âm thanh</div>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating value={feedbackDetails.audioQuality} />
                    <span className="text-sm font-bold text-gray-900">{feedbackDetails.audioQuality}/5</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-xs font-medium text-green-700 mb-2">Độ ổn định kết nối</div>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating value={feedbackDetails.connectionStability} />
                    <span className="text-sm font-bold text-gray-900">{feedbackDetails.connectionStability}/5</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">Điểm trung bình</div>
                <div className="flex items-center gap-3">
                  <StarRating value={review.rating} />
                  <span className="text-2xl font-bold text-gray-900">{review.rating}/5</span>
                </div>
              </div>
            </div>
          )}

          {/* Overall Experience */}
          {isVideoCall && feedbackDetails?.overallExperience && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
                Trải nghiệm tổng thể
              </h4>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm ${
                  feedbackDetails.overallExperience === 'excellent' 
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-600/20'
                    : feedbackDetails.overallExperience === 'good'
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600/20'
                    : feedbackDetails.overallExperience === 'average'
                    ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-600/20'
                    : 'bg-red-100 text-red-700 ring-2 ring-red-600/20'
                }`}>
                  {experienceLabels[feedbackDetails.overallExperience] || feedbackDetails.overallExperience}
                </span>
                {feedbackDetails.wouldUseAgain !== undefined && (
                  <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm ${
                    feedbackDetails.wouldUseAgain
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-600/20'
                      : 'bg-gray-100 text-gray-700 ring-2 ring-gray-600/20'
                  }`}>
                    {feedbackDetails.wouldUseAgain ? '✓ Sẽ sử dụng lại' : '✗ Không muốn sử dụng lại'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Issues */}
          {isVideoCall && feedbackDetails?.issues && feedbackDetails.issues.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Vấn đề gặp phải
              </h4>
              <div className="flex flex-wrap gap-2">
                {feedbackDetails.issues.map((issue, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes for Video Call */}
          {isVideoCall && review.comment && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Ghi chú thêm
              </h4>
              <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 border border-gray-200">
                {review.comment}
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white flex items-center justify-end gap-2 border-t border-blue-100 px-6 py-4">
          <button 
            onClick={onClose} 
            className="inline-flex items-center px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#7CBCFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5AA5FF')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7CBCFF')}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

type ReviewRowProps = {
  review: AdminReview;
  onView: (r: AdminReview) => void;
};

const ReviewRow: React.FC<ReviewRowProps> = ({ review, onView }) => {
  return (
    <tr className="border-b last:border-0 transition-all hover:bg-blue-50">
      <td className="px-4 py-3 text-sm text-gray-700">{CATEGORY_LABEL[review.category]}</td>
      <td className="px-4 py-3"><StarRating value={review.rating} /></td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
        <div className="line-clamp-2">{review.comment}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="font-medium">{review.createdByName}</div>
        <div className="text-gray-500">{ROLE_LABEL[review.createdByRole]}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(review.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(review)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#7CBCFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5AA5FF')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7CBCFF')}
          >
            Xem chi tiết
          </button>
        </div>
      </td>
    </tr>
  );
};

const PAGE_SIZE = 10;

const AdminReviewManagementPage: React.FC = () => {
  // data
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFromAPI, setTotalFromAPI] = useState(0);
  const [totalPagesFromAPI, setTotalPagesFromAPI] = useState(1);
  const [systemFeedbacksTotal, setSystemFeedbacksTotal] = useState(0);
  const [serviceReviewsTotal, setServiceReviewsTotal] = useState(0);
  const [disputeReviewsTotal, setDisputeReviewsTotal] = useState(0);

  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  // filters
  const [roleFilter, setRoleFilter] = useState<"All" | ReviewRole>("All");
  const [selectedCategory, setSelectedCategory] = useState<ReviewCategory | "All">("All");
  // Bỏ lọc trạng thái theo yêu cầu
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // pagination
  const [page, setPage] = useState(1);

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [selectedFeedbackDetails, setSelectedFeedbackDetails] = useState<VideoFeedback | null>(null);
  const [selectedSystemFeedbackDetails, setSelectedSystemFeedbackDetails] = useState<SystemFeedback | null>(null);
  const [selectedServiceReviewDetails, setSelectedServiceReviewDetails] = useState<ServiceReview | null>(null);
  const [selectedDisputeReviewDetails, setSelectedDisputeReviewDetails] = useState<DisputeReview | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch all types of feedbacks and reviews
  const fetchAllFeedbacks = async (currentPage: number = 1) => {
    setLoading(true);
    try {
      // Fetch all four types in parallel
      const [videoResponse, systemResponse, serviceResponse, disputeResponse] = await Promise.all([
        getAllVideoFeedbacks({
          page: currentPage,
          limit: PAGE_SIZE
        }),
        getAllSystemFeedbacks({
          page: currentPage,
          limit: PAGE_SIZE
        }),
        getAllServiceReviews({
          page: currentPage,
          limit: PAGE_SIZE
        }),
        getAllDisputes({
          page: currentPage,
          limit: PAGE_SIZE,
          status: 'resolved' // Only get resolved disputes
        })
      ]);
      
      // Map VideoFeedback to AdminReview format
      const videoReviews: AdminReview[] = videoResponse.feedbacks.map((feedback: VideoFeedback) => ({
        id: feedback._id,
        category: "Video Consultation" as ReviewCategory,
        rating: parseFloat(feedback.averageRating) || 0,
        comment: feedback.additionalNotes || '',
        createdByRole: feedback.reviewer.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
        createdByName: feedback.reviewer.name,
        createdByEmail: feedback.reviewer.email,
        relatedBookingId: feedback.booking || undefined,
        createdAt: feedback.createdAt
      }));

      // Map SystemFeedback to AdminReview format
      const systemReviews: AdminReview[] = systemResponse.feedbacks.map((feedback: SystemFeedback) => ({
        id: feedback._id,
        category: "System" as ReviewCategory,
        rating: feedback.satisfactionRating || 0,
        comment: feedback.description || '',
        createdByRole: feedback.user.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
        createdByName: feedback.user.name,
        createdByEmail: feedback.user.email,
        relatedBookingId: undefined,
        createdAt: feedback.createdAt
      }));

      // Map ServiceReview to AdminReview format
      const serviceReviews: AdminReview[] = serviceResponse.reviews.map((review: ServiceReview) => {
        const avgRating = (
          review.ratings.professionalism +
          review.ratings.attitude +
          review.ratings.punctuality +
          review.ratings.careQuality +
          review.ratings.communication
        ) / 5;
        
        return {
          id: review._id,
          category: "Service" as ReviewCategory,
          rating: avgRating,
          comment: review.additionalNotes || '',
          createdByRole: review.reviewer.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
          createdByName: review.reviewer.name,
          createdByEmail: review.reviewer.email,
          relatedBookingId: review.booking._id,
          createdAt: review.createdAt
        };
      });

      // Map DisputeReview to AdminReview format (only those with respondentSatisfaction)
      const disputeReviews: AdminReview[] = disputeResponse.disputes
        .filter((dispute: DisputeReview) => dispute.respondentSatisfaction)
        .map((dispute: DisputeReview) => ({
          id: dispute._id,
          category: "Complaint" as ReviewCategory,
          rating: dispute.respondentSatisfaction!.rating || 0,
          comment: dispute.respondentSatisfaction!.feedback || '',
          createdByRole: dispute.respondent.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
          createdByName: dispute.respondent.name || 'Unknown',
          createdByEmail: dispute.respondent.email || '',
          relatedBookingId: dispute.booking._id,
          createdAt: dispute.respondentSatisfaction!.ratedAt || dispute.createdAt
        }));
      
      // Combine and sort by createdAt
      const allReviews = [...videoReviews, ...systemReviews, ...serviceReviews, ...disputeReviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setReviews(allReviews);
      setTotalFromAPI(videoResponse.total);
      setSystemFeedbacksTotal(systemResponse.pagination.total);
      setServiceReviewsTotal(serviceResponse.pagination.total);
      setDisputeReviewsTotal(disputeResponse.disputes.filter((d: DisputeReview) => d.respondentSatisfaction).length);
      setTotalPagesFromAPI(Math.max(videoResponse.totalPages, systemResponse.pagination.totalPages, serviceResponse.pagination.totalPages, disputeResponse.pagination.totalPages));
      setPage(currentPage);
    } catch (err) {
      const errorMessage = 'Không thể tải danh sách đánh giá';
      setNotification({
        show: true,
        type: 'error',
        message: errorMessage
      });
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when page changes
  useEffect(() => {
    fetchAllFeedbacks(page);
  }, [page]);

  // derived counts
  const counts = useMemo(() => {
    const map: Record<ReviewCategory, number> = {
      "Video Consultation": totalFromAPI,
      "Service": serviceReviewsTotal,
      "System": systemFeedbacksTotal,
      "Complaint": disputeReviewsTotal,
    };
    return map;
  }, [totalFromAPI, systemFeedbacksTotal, serviceReviewsTotal, disputeReviewsTotal]);

  // debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    // When using API pagination, we don't filter client-side
    // All filtering should be done server-side if needed
    // For now, just return reviews as-is since API handles pagination
    return reviews.filter((r) => {
      if (roleFilter !== "All" && r.createdByRole !== roleFilter) return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
      if (debouncedSearch) {
        const hay = `${r.createdByName} ${r.createdByEmail ?? ""}`.toLowerCase();
        if (!hay.includes(debouncedSearch)) return false;
      }
      return true;
    });
  }, [reviews, roleFilter, selectedCategory, debouncedSearch]);

  const totalPages = totalPagesFromAPI;
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    // reset page when filters change
    setPage(1);
  }, [roleFilter, selectedCategory, debouncedSearch]);

  const handleView = async (r: AdminReview) => {
    setSelected(r);
    setOpenModal(true);
    setSelectedFeedbackDetails(null); // Reset
    setSelectedSystemFeedbackDetails(null); // Reset
    setSelectedServiceReviewDetails(null); // Reset
    setSelectedDisputeReviewDetails(null); // Reset
    setLoadingDetails(true);
    
    try {
      if (r.category === "Video Consultation") {
        // Fetch video call feedback details
        const details = await getVideoFeedbackById(r.id);
        console.log('Fetched video feedback details:', details);
        setSelectedFeedbackDetails(details);
        
        // Update selected with full details
        const fullReview: AdminReview = {
          id: details._id,
          category: "Video Consultation",
          rating: parseFloat(details.averageRating) || 0,
          comment: details.additionalNotes || '',
          createdByRole: details.reviewer.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
          createdByName: details.reviewer.name,
          createdByEmail: details.reviewer.email,
          relatedBookingId: details.booking || undefined,
          createdAt: details.createdAt
        };
        
        setSelected(fullReview);
      } else if (r.category === "System") {
        // Fetch system feedback details
        const details = await getSystemFeedbackById(r.id);
        console.log('Fetched system feedback details:', details);
        setSelectedSystemFeedbackDetails(details);
        
        // Update selected with full details
        const fullReview: AdminReview = {
          id: details._id,
          category: "System",
          rating: details.satisfactionRating || 0,
          comment: details.description || '',
          createdByRole: details.user.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
          createdByName: details.user.name,
          createdByEmail: details.user.email,
          relatedBookingId: undefined,
          createdAt: details.createdAt
        };
        
        setSelected(fullReview);
      } else if (r.category === "Service") {
        // Fetch service review details
        const details = await getServiceReviewById(r.id);
        console.log('Fetched service review details:', details);
        setSelectedServiceReviewDetails(details);
        
        const avgRating = (
          details.ratings.professionalism +
          details.ratings.attitude +
          details.ratings.punctuality +
          details.ratings.careQuality +
          details.ratings.communication
        ) / 5;
        
        // Update selected with full details
        const fullReview: AdminReview = {
          id: details._id,
          category: "Service",
          rating: avgRating,
          comment: details.additionalNotes || '',
          createdByRole: details.reviewer.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
          createdByName: details.reviewer.name,
          createdByEmail: details.reviewer.email,
          relatedBookingId: details.booking._id,
          createdAt: details.createdAt
        };
        
        setSelected(fullReview);
      } else if (r.category === "Complaint") {
        // Fetch dispute review details
        const details = await getDisputeById(r.id);
        console.log('Fetched dispute review details:', details);
        setSelectedDisputeReviewDetails(details);
        
        // Update selected with full details
        const fullReview: AdminReview = {
          id: details._id,
          category: "Complaint",
          rating: details.respondentSatisfaction?.rating || 0,
          comment: details.respondentSatisfaction?.feedback || '',
          createdByRole: details.respondent.role === 'caregiver' ? 'Caregiver' : 'Care Seeker',
          createdByName: details.respondent.name || 'Unknown',
          createdByEmail: details.respondent.email || '',
          relatedBookingId: details.booking._id,
          createdAt: details.respondentSatisfaction?.ratedAt || details.createdAt
        };
        
        setSelected(fullReview);
      }
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Không thể tải chi tiết đánh giá'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Bỏ cập nhật trạng thái và xoá theo yêu cầu

  const summaryCards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((c, idx) => {
        const styles = [
          { border: '#E0E7FF', text: '#4F46E5', label: '#6B7280' },
          { border: '#FCE7F3', text: '#BE185D', label: '#6B7280' },
          { border: '#DBEAFE', text: '#1E40AF', label: '#6B7280' },
          { border: '#D1FAE5', text: '#047857', label: '#6B7280' }
        ];
        return (
          <div 
            key={c} 
            className="rounded-2xl p-6 bg-white transition-all hover:shadow-lg"
            style={{ 
              border: `2px solid ${styles[idx].border}`
            }}
          >
            <div className="text-sm font-medium" style={{ color: styles[idx].label }}>{CATEGORY_LABEL[c]}</div>
            <div className="mt-2 text-3xl font-bold" style={{ color: styles[idx].text }}>{counts[c]}</div>
          </div>
        );
      })}
    </div>
  );

  if (loading && reviews.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: '#7CBCFF' }}></div>
          <p className="mt-4 text-sm text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá & Phản hồi</h1>
        <p className="mt-2 text-sm text-gray-600">Theo dõi và quản lý các đánh giá video call, dịch vụ, và phản hồi hệ thống</p>
      </div>

      {summaryCards}

      <div className="rounded-2xl bg-white p-6 shadow-lg border border-[#7CBCFF]/20">
        {/* Category Filter Tabs */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Lọc theo danh mục</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === "All"
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {CATEGORIES.map((c) => {
              const isSelected = selectedCategory === c;
              const categoryColors: Record<ReviewCategory, { bg: string; text: string; hover: string }> = {
                "Video Consultation": { bg: 'bg-indigo-500', text: 'text-white', hover: 'bg-indigo-100 text-indigo-700' },
                "Service": { bg: 'bg-pink-500', text: 'text-white', hover: 'bg-pink-100 text-pink-700' },
                "System": { bg: 'bg-blue-500', text: 'text-white', hover: 'bg-blue-100 text-blue-700' },
                "Complaint": { bg: 'bg-green-500', text: 'text-white', hover: 'bg-green-100 text-green-700' }
              };
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                    isSelected
                      ? `${categoryColors[c].bg} ${categoryColors[c].text} shadow-md`
                      : `bg-gray-100 text-gray-700 hover:${categoryColors[c].hover}`
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
            >
              <option value="All">Tất cả vai trò</option>
              <option value="Care Seeker">Người thuê</option>
              <option value="Caregiver">Người chăm sóc</option>
            </select>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-64 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7CBCFF' } as React.CSSProperties}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Nhóm</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Điểm</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Bình luận</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Người tạo</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Ngày tạo</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pageItems.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onView={handleView}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalFromAPI + systemFeedbacksTotal + serviceReviewsTotal)} / {totalFromAPI + systemFeedbacksTotal + serviceReviewsTotal} kết quả
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 transition-all hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <div className="text-sm">Trang {page} / {totalPages}</div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 transition-all hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <ReviewModal
        open={openModal}
        review={selected}
        feedbackDetails={selectedFeedbackDetails}
        systemFeedbackDetails={selectedSystemFeedbackDetails}
        serviceReviewDetails={selectedServiceReviewDetails}
        disputeReviewDetails={selectedDisputeReviewDetails}
        loadingDetails={loadingDetails}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
};

export default AdminReviewManagementPage;


