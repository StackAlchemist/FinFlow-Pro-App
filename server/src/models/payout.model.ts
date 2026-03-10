import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IScheduledPayout, PayoutFrequency, PayoutStatus, Currency } from '../types';

export const FREQUENCY_CRON_MAP: Record<PayoutFrequency, string> = {
  [PayoutFrequency.DAILY]:    '0 9 * * *',
  [PayoutFrequency.WEEKLY]:   '0 9 * * 1',
  [PayoutFrequency.BIWEEKLY]: '0 9 */14 * *',
  [PayoutFrequency.MONTHLY]:  '0 9 1 * *',
};

const ScheduledPayoutSchema = new Schema<IScheduledPayout>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceWallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    destinationWallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payout amount must be at least 1 unit'],
    },
    currency: {
      type: String,
      enum: Object.values(Currency),
      required: true,
    },
    frequency: {
      type: String,
      enum: Object.values(PayoutFrequency),
      required: true,
    },
    cronExpression: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.ACTIVE,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [255, 'Description too long'],
    },
    nextExecutionAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
    totalExecutions: {
      type: Number,
      default: 0,
    },
    maxExecutions: {
      type: Number,
      default: null,
    },
    // Rotated after each successful run to prevent duplicate execution
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes 
ScheduledPayoutSchema.index({ owner: 1, status: 1 });
ScheduledPayoutSchema.index({ status: 1, nextExecutionAt: 1 }); // cron runner queries

// Hooks 

ScheduledPayoutSchema.pre('save', async function () {
  if (!this.idempotencyKey) {
    this.idempotencyKey = await uuidv4();
  }
});

const ScheduledPayout = mongoose.model<IScheduledPayout>('ScheduledPayout', ScheduledPayoutSchema);

export default ScheduledPayout;