
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  wallet_address: string;
  sponsor_id: string | null;
  matrix_parent_id: string | null;
  matrix_position: 'left' | 'right' | null;
  level: number;
  is_blocked: boolean;
  is_active: boolean;
  direct_count: number;
  is_qualified: boolean;
  role: UserRole;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  roi_earned: number; // Legacy, keeping for compatibility
  wallet_roi_earned: number;
  pool_roi_earned: number;
  direct_income: number;
  level_income: number;
  hold_balance: number; // For Autopool entry
  total_withdrawn: number;
  last_roi_at?: string;
  last_pool_roi_at?: string;
}

export type TransactionType = 'direct' | 'level' | 'pool' | 'roi' | 'task' | 'exchange';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  created_at: string;
}

export interface Pool {
  id: string;
  user_id: string;
  pool_number: number;
  status: 'active' | 'completed';
  members_count: number;
  created_at: string;
}

export interface ExchangerRequest {
  id: string;
  user_id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdraw';
  amount: number;
  inr_amount?: number;
  rate?: number;
  hash_id?: string;
  utr_number?: string;
  user_upi?: string;
  network?: string;
  address?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  is_active: boolean;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
