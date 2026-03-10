import { Document, Types } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  USER = 'user',
  BUSINESS = 'business',
  ADMIN = 'admin',
}

export enum AccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
}

export enum WalletType {
  MAIN = 'main',
  SUB = 'sub',
}

export enum SubWalletLabel {
  SALES = 'sales',
  PAYROLL = 'payroll',
  SAVINGS = 'savings',
  CUSTOM = 'custom',
}

export enum TransactionType {
  FUNDING = 'funding',
  TRANSFER = 'transfer',
  PAYOUT = 'payout',
  REVERSAL = 'reversal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  FLAGGED = 'flagged',
}

export enum PayoutFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum PayoutStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum FraudReason {
  HIGH_FREQUENCY = 'high_frequency_transfers',
  HIGH_AMOUNT = 'high_amount_threshold',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  MANUAL_FLAG = 'manual_flag',
}

export enum FraudStatus {
  OPEN = 'open',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  ACTIONED = 'actioned',
}

// ─── Model Interfaces ─────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  businessName?: string;
  businessRegNumber?: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IWallet extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  currency: Currency;
  type: WalletType;
  label?: string;
  balance: number;           // stored in kobo (NGN) or cents (USD)
  isActive: boolean;
  parentWallet?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  fromWallet?: Types.ObjectId;
  toWallet: Types.ObjectId;
  fromUser?: Types.ObjectId;
  toUser: Types.ObjectId;
  amount: number;
  currency: Currency;
  balanceBeforeFrom?: number;
  balanceAfterFrom?: number;
  balanceBeforeTo: number;
  balanceAfterTo: number;
  description?: string;
  metadata?: Record<string, unknown>;
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledPayout extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  sourceWallet: Types.ObjectId;
  destinationWallet: Types.ObjectId;
  amount: number;
  currency: Currency;
  frequency: PayoutFrequency;
  cronExpression: string;
  status: PayoutStatus;
  description?: string;
  nextExecutionAt: Date;
  lastExecutedAt?: Date;
  totalExecutions: number;
  maxExecutions?: number;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFraudFlag extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  transaction?: Types.ObjectId;
  reason: FraudReason;
  status: FraudStatus;
  details: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  autoFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth & Request ───────────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}