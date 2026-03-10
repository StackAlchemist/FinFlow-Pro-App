import mongoose, { Schema } from 'mongoose';
import { IFraudFlag, FraudReason, FraudStatus } from '../types';

const FraudFlagSchema = new Schema<IFraudFlag>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    reason: {
      type: String,
      enum: Object.values(FraudReason),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FraudStatus),
      default: FraudStatus.OPEN,
      index: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: null,
    },
    autoFlagged: {
      type: Boolean,
      default: true,
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

FraudFlagSchema.index({ user: 1, status: 1 });
FraudFlagSchema.index({ status: 1, createdAt: -1 });
FraudFlagSchema.index({ transaction: 1 });

const FraudFlag = mongoose.model<IFraudFlag>('FraudFlag', FraudFlagSchema);

export default FraudFlag;