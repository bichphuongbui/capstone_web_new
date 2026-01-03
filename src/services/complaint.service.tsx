import { api } from './api';

export interface Complaint {
  bookingId: string;
  caregiverId?: string;
  careseekerId?: string;
  reason: string;
  content: string;
  fileUrl?: string;
  sendToAdmin: boolean;
  createdAt: string;
}

export async function submitComplaint(complaint: Complaint): Promise<void> {
  console.log('Submitting complaint:', complaint);
  await new Promise((r) => setTimeout(r, 300));
}

// Admin Dispute Management Types
export interface DisputeUser {
  _id: string;
  name: string;
  email: string;
  role: 'careseeker' | 'caregiver';
}

export interface DisputeBooking {
  _id: string;
  bookingDate: string;
  totalPrice: number;
}

export interface DisputeEvidence {
  type: 'image' | 'pdf' | 'docx' | 'video' | 'other';
  url: string;
  description?: string;
  uploadedBy?: {
    _id: string;
    name: string;
    role: 'careseeker' | 'caregiver';
  };
  _id: string;
  uploadedAt: string;
}

export interface DisputeResponse {
  from: 'complainant' | 'respondent';
  userId: string;
  message: string;
  evidence: DisputeEvidence[];
  respondedAt: string;
  _id: string;
}

export interface DisputeTimeline {
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
  _id: string;
}

export interface DisputeInternalNote {
  note: string;
  addedBy: string;
  addedAt: string;
  _id: string;
}

export interface AdminDecision {
  decision?: 'favor_complainant' | 'favor_respondent' | 'partial_favor' | 'no_fault';
  resolution?: string;
  refundAmount?: number;
  compensationAmount?: number;
  actions?: string[];
  decidedBy?: string;
  decidedAt?: string;
  notes?: string;
}

export interface RespondentSatisfaction {
  rating?: number;
  feedback?: string;
  ratedAt?: string;
}

export interface AdminDispute {
  _id: string;
  complainant: DisputeUser;
  respondent: DisputeUser;
  booking: DisputeBooking;
  disputeType: 'service_quality' | 'payment_issue' | 'schedule_conflict' | 'unprofessional_behavior' | 'safety_concern' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: DisputeEvidence[];
  requestedResolution: 'refund' | 'partial_refund' | 'apology' | 'warning' | 'other';
  requestedAmount?: number;
  refundBankInfo?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch?: string;
  };
  status: 'pending' | 'under_review' | 'awaiting_response' | 'resolved' | 'rejected' | 'withdrawn';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  responses: DisputeResponse[];
  timeline: DisputeTimeline[];
  internalNotes: DisputeInternalNote[];
  adminDecision?: AdminDecision;
  respondentSatisfaction?: RespondentSatisfaction;
  assignedTo?: DisputeUser;
  allowComplainantResponse: boolean;
  allowRespondentResponse: boolean;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface AllDisputesResponse {
  success: boolean;
  data: {
    disputes: AdminDispute[];
    statistics: DisputeStatistics;
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export interface DisputeDetailResponse {
  success: boolean;
  data: AdminDispute;
}

// API Functions
export async function getAllDisputesForAdmin(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  severity?: string;
  disputeType?: string;
}): Promise<AllDisputesResponse> {
  const response = await api.get('/api/disputes/admin/all', { params });
  return response.data;
}

export async function getDisputeByIdForAdmin(id: string): Promise<DisputeDetailResponse> {
  const response = await api.get(`/api/disputes/${id}`);
  return response.data;
}

export interface UpdateDisputeStatusRequest {
  status: string;
  note?: string;
  allowComplainantResponse?: boolean;
  allowRespondentResponse?: boolean;
}

export async function updateDisputeStatus(id: string, data: UpdateDisputeStatusRequest): Promise<{ success: boolean; data: AdminDispute }> {
  const response = await api.put(`/api/disputes/${id}/status`, data);
  return response.data;
}

export async function assignDisputeToAdmin(id: string, adminId: string): Promise<{ success: boolean; data: AdminDispute }> {
  const response = await api.put(`/api/disputes/${id}/assign`, { adminId });
  return response.data;
}

export async function updateDisputePriority(id: string, priority: string): Promise<{ success: boolean; data: AdminDispute }> {
  const response = await api.patch(`/api/disputes/${id}/priority`, { priority });
  return response.data;
}

export async function updateDisputeSeverity(id: string, severity: string): Promise<{ success: boolean; data: AdminDispute }> {
  const response = await api.patch(`/api/disputes/${id}/severity`, { severity });
  return response.data;
}

export async function addDisputeInternalNote(id: string, note: string): Promise<{ success: boolean; data: AdminDispute }> {
  const response = await api.post(`/api/disputes/${id}/internal-note`, { note });
  return response.data;
}

export async function makeAdminDecision(
  id: string,
  decision: {
    decision: string;
    resolution: string;
    refundAmount?: number;
    actions?: string[];
    notes?: string;
  }
): Promise<{ success: boolean; data: AdminDispute }> {
  const response = await api.post(`/api/disputes/${id}/decide`, decision);
  return response.data;
}


