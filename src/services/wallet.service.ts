import { api } from './api';

export interface CaregiverInfo {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface WalletTransaction {
  _id: string;
  type: 'earning' | 'withdrawal' | 'refund' | 'platform_fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  relatedBooking?: string;
}

export interface CaregiverWallet {
  _id: string;
  caregiver: CaregiverInfo;
  availableBalance: number;
  totalEarnings: number;
  totalPlatformFees: number;
  pendingAmount: number;
  transactions: WalletTransaction[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  totalCaregivers: number;
  totalAvailableBalance: number;
  totalEarnings: number;
  totalPlatformFees: number;
  totalPendingAmount: number;
}

export interface WalletOverviewResponse {
  success: boolean;
  data: {
    stats: WalletStats;
    wallets: CaregiverWallet[];
    platformFeePercentage: number;
  };
}

/**
 * Lấy tổng quan thu nhập của tất cả caregiver (Admin only)
 */
export async function getWalletOverview(): Promise<WalletOverviewResponse> {
  const response = await api.get('/api/wallet/overview');
  return response.data;
}

/**
 * Lấy chi tiết ví của một caregiver (Admin only)
 */
export async function getCaregiverWallet(caregiverId: string): Promise<{ success: boolean; data: CaregiverWallet }> {
  const response = await api.get(`/api/wallet/caregiver/${caregiverId}`);
  return response.data;
}

/**
 * Reset tất cả lương của caregiver về 0 (Admin only)
 */
export async function resetAllBalances(): Promise<{ success: boolean; message: string; data: { modifiedCount: number } }> {
  const response = await api.post('/api/wallet/admin/reset-all-balances');
  return response.data;
}
