import { api } from './api';

export interface VideoFeedback {
  _id: string;
  reviewer: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  receiver: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  booking: string | null;
  chatSession: string | null;
  videoQuality: number;
  audioQuality: number;
  connectionStability: number;
  issues: string[];
  overallExperience: string;
  additionalNotes: string;
  wouldUseAgain: boolean;
  status: string;
  averageRating: string;
  callInfo?: {
    duration: number;
    startTime: string;
    endTime: string;
  };
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface VideoFeedbackResponse {
  feedbacks: VideoFeedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetVideoFeedbacksParams {
  page?: number;
  limit?: number;
}

// Get all video feedbacks (Admin only)
export async function getAllVideoFeedbacks(params: GetVideoFeedbacksParams = {}): Promise<VideoFeedbackResponse> {
  try {
    const { page = 1, limit = 10 } = params;
    const response = await api.get('/api/video-feedback/admin/all', {
      params: { page, limit }
    });
    
    console.log('Full API Response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Check if request failed (404 or other errors)
    if (response.status === 404) {
      console.warn('API returned 404 - endpoint not found or no feedback data available');
      return {
        feedbacks: [],
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0
      };
    }
    
    if (response.status >= 400) {
      console.error('API returned error status:', response.status, response.data);
      throw new Error(`API returned status ${response.status}`);
    }
    
    // API returns { success: true, data: { feedbacks, pagination, ... } }
    if (response.data?.success && response.data?.data) {
      const result = response.data.data;
      console.log('Extracted data:', result);
      
      const pagination = result.pagination || {};
      
      // Return with correct structure
      return {
        feedbacks: result.feedbacks || [],
        total: pagination.total || 0,
        page: pagination.currentPage || page,
        limit: limit,
        totalPages: pagination.totalPages || 1
      };
    }
    
    // Fallback: return empty result
    console.warn('Response structure unexpected:', response.data);
    return {
      feedbacks: [],
      total: 0,
      page: page,
      limit: limit,
      totalPages: 1
    };
  } catch (error) {
    console.error('Error fetching video feedbacks:', error);
    throw error;
  }
}

// Get video feedback details by ID (Admin only)
export async function getVideoFeedbackById(id: string): Promise<VideoFeedback> {
  try {
    const response = await api.get(`/api/video-feedback/${id}`);
    
    console.log('Get feedback by ID response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Check if request failed
    if (response.status === 404) {
      console.error('Feedback not found');
      throw new Error('Feedback not found');
    }
    
    if (response.status >= 400) {
      console.error('API returned error status:', response.status, response.data);
      throw new Error(`API returned status ${response.status}`);
    }
    
    // API returns { success: true, data: {...} }
    if (response.data?.success && response.data?.data) {
      console.log('Extracted feedback:', response.data.data);
      return response.data.data;
    }
    
    // Fallback: return data directly if structure is different
    console.warn('Unexpected response structure, returning data directly');
    return response.data;
  } catch (error) {
    console.error('Error fetching video feedback details:', error);
    throw error;
  }
}
