import mongoose, { Schema } from 'mongoose';
import { IWallet, Currency, WalletType } from '../types';

const WalletSchema = new Schema<IWallet>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Wallet must belong to a user'],
            index: true,
        },
        currency: {
            type: String,
            enum: Object.values(Currency),
            required: [true, 'Currency is required'],
        },
        type: {
            type: String,
            enum: Object.values(WalletType),
            default: WalletType.MAIN
        },
        label: {
            type: String,
            trim: true,
        },

        // Balance stored in smallest unit: kobo (NGN) or cents (USD)
        // Avoids floating point precision errors entirely

        balance: {
            type: Number,
            default: 0,
            min: [0, 'Balance cannot be negative']
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        parentWallet: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            default: null,
        },
    }, {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform(_doc, ret: Record<string, any>){
                delete ret.__v;
                return ret;
            },
        },
    }
);

WalletSchema.index({ owner: 1, currency: 1, type: 1 });
WalletSchema.index({ owner: 1, isActive: 1 });
WalletSchema.index({ parentWallet: 1 });

WalletSchema.index(
    { owner: 1, currency: 1, type: 1},
    {
        unique: true,
        partialFilterExpression: { types: WalletType.MAIN },
        name: 'unique_main_wallet_per_currency',
    }
);

WalletSchema.virtual('displayBalance').get(function (){
    return (this.balance / 100).toFixed(2);
});


WalletSchema.virtual('currencySymbol').get(function (){
    return this.currency === Currency.NGN ? '₦' : '$';
});

const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;