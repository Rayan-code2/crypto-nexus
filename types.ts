
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
<<<<<<< HEAD
  weekly_directs?: number;
  last_reward_week?: string;
=======
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
  is_qualified: boolean;
  role: UserRole;
  created_at: string;
}

<<<<<<< HEAD
export interface WeeklyOffer {
  id: string;
  reward_amount: number;
  description: string;
  min_directs: number;
  is_active: boolean;
  end_date: string;
}

export interface OfferAchiever {
  user_id: string;
  email: string;
  count: number;
  status: 'pending' | 'rewarded';
}

=======
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
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
  from_user_id?: string; // Source user for direct/level income
  income_level?: number; // Level from which income was received (1-6)
  type: TransactionType | 'pool_payout';
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
<<<<<<< HEAD

export interface Settings {
  id: string;
  usdt_buy_rate: number;
  usdt_sell_rate: number;
  admin_upi: string;
  admin_qr: string;
  admin_address_trc20: string;
  admin_address_bep20: string;
  admin_address_erc20: string;
  telegram_link: string;
  marquee_text: string;
  min_deposit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  deposit_fee: number;
  withdrawal_fee: number;
  weekly_reward: number;
  weekly_description: string;
  hall_of_fame_marquee: string;
  updated_at: string;
}
=======
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
