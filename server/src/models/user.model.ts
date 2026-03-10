import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserRole, AccountStatus } from "../types";

const UserSchema = new Schema<IUser>({

    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [3, "First name must be at least 3 characters long"],
        maxlength: [50, "First name must be less than 50 characters long"],
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [3, "Last name must be at least 3 characters long"],
        maxlength: [50, "Last name must be less than 50 characters long"],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-()]{7,20}$/, 'Please enter a valid phone number'],
      },
      role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER,
      },
      status: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.ACTIVE
      },
      businessName: {
        type: String,
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 Characters']
      },
      businessRegNumber: {
        type: String,
        trim: true,
      },
      isEmailVerified: {
        type: Boolean,
        default: false,
      },
      lastLoginAt: {
        type: Date,
      },
}, 
{
    timestamps: true,
    toJSON: {
        transform(_doc, ret: Record<string, any>) {
          delete ret.password;
          delete ret.__v;
          return ret;
        },
      },
})


// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });

// Hooks
UserSchema.pre('save', async function (){
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

    
// methods
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password)
}

UserSchema.virtual('fullName').get(function (){
    return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;