import { api } from './api';

export interface Feedback {
  title: string;
  category: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface SystemFeedback {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  feedbackType: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  attachments: string[];
  satisfactionRating: number;
  status: string;
  tags: string[];
  followUpCount: number;
  internalNotes: any[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemFeedbackResponse {
  success: boolean;
  data: {
    feedbacks: SystemFeedback[];
    statistics: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export async function submitSystemFeedback(feedback: Feedback): Promise<void> {
  // Mock submit
  console.log('Submitting system feedback:', feedback);
  await new Promise((r) => setTimeout(r, 300));
}

export async function getAllSystemFeedbacks(params: {
  page?: number;
  limit?: number;
  status?: string;
  feedbackType?: string;
  priority?: string;
}): Promise<SystemFeedbackResponse['data']> {
  const response = await api.get<SystemFeedbackResponse>('/api/system-feedback/admin/all', {
    params
  });
  return response.data.data;
}

export async function getSystemFeedbackById(id: string): Promise<SystemFeedback> {
  const response = await api.get<{ success: boolean; data: SystemFeedback }>(`/api/system-feedback/${id}`);
  return response.data.data;
}

export interface ServiceReview {
  _id: string;
  reviewer: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  caregiver: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  caregiverProfile: {
    _id: string;
  };
  booking: {
    _id: string;
    bookingDate: string;
    bookingTime: string;
    duration: number;
    workLocation: string;
  };
  ratings: {
    professionalism: number;
    attitude: number;
    punctuality: number;
    careQuality: number;
    communication: number;
  };
  overallSatisfaction: string;
  strengths: string[];
  improvements: string[];
  wouldUseAgain: string;
  additionalNotes: string;
  status: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  reviewType: string;
}

export interface ServiceReviewResponse {
  success: boolean;
  data: {
    reviews: ServiceReview[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
    statistics: {
      caregiverReviews: number;
      careseekerReviews: number;
      totalReviews: number;
    };
  };
}

export async function getAllServiceReviews(params: {
  page?: number;
  limit?: number;
  reviewType?: string;
}): Promise<ServiceReviewResponse['data']> {
  const response = await api.get<ServiceReviewResponse>('/api/reviews/admin/all', {
    params
  });
  return response.data.data;
}

export async function getServiceReviewById(id: string): Promise<ServiceReview> {
  const response = await api.get<{ success: boolean; data: ServiceReview }>(`/api/reviews/admin/${id}`);
  return response.data.data;
}

export interface DisputeReview {
  _id: string;
  complainant: string;
  respondent: {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
  };
  booking: {
    _id: string;
  };
  disputeType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  adminDecision?: {
    decision: string;
    resolution: string;
    refundAmount: number;
    compensationAmount: number;
    actions: string[];
    decidedBy: string;
    decidedAt: string;
    notes: string;
  };
  respondentSatisfaction?: {
    rating: number;
    feedback: string;
    ratedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface DisputeReviewResponse {
  success: boolean;
  data: DisputeReview;
}

export interface AllDisputesResponse {
  success: boolean;
  data: {
    disputes: DisputeReview[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export async function getAllDisputes(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AllDisputesResponse['data']> {
  const response = await api.get<AllDisputesResponse>('/api/disputes/admin/all', {
    params
  });
  return response.data.data;
}

export async function getDisputeById(id: string): Promise<DisputeReview> {
  const response = await api.get<DisputeReviewResponse>(`/api/disputes/${id}`);
  return response.data.data;
}


