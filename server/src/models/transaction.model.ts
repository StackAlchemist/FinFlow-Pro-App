import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITransaction , TransactionType, TransactionStatus, Currency }  from '../types'

const TransactionSchema = new Schema<ITransaction>(
    {
        reference: {
            type: String,
            unique: true,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(TransactionType),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(TransactionStatus),
            default: TransactionStatus.PENDING,
        },
        fromWallet: {
            types: Schema.Types.ObjectId,
            ref: 'Wallet',
            default: null,
        },
        toWallet: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
        },
        fromUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        toUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, 'Transaction amount must be at least 1 unit'],
        },
        currency: {
            type: String,
            enum: Object.values(Currency),
            required: true
        },
        // balance snapshots before and after on both wallets
        balanceBeforeFrom: { type: Number, default: null },
        balanceAfterFrom: { type: Number, default: null },
        balanceBeforeTo: { type: Number, required: true },
        balanceAfterTo: { type: Number, required: true },
        description: {
            type: String,
            trim: true,
            maxlength: [255,'Description too long'],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        reversedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reversedAt: {
            type: Date,
            default: null,
          },
          isFlagged: {
            type: Boolean,
            default: false,
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


TransactionSchema.index({ fromUser: 1, createdAt: -1 });
TransactionSchema.index({ toUser: 1, createdAt: -1 });
TransactionSchema.index({ fromWallet: 1, createdAt: -1 });
TransactionSchema.index({ toWallet: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ fromUser: 1, type: 1, createdAt: -1 }); // fraud detection


// Hooks
TransactionSchema.pre('save', async function () {
    if (!this.reference) {
      this.reference = await `TXN-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    }
  });
  
  const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
  
  export default Transaction;