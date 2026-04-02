import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpToken extends Document {
  userId:    mongoose.Types.ObjectId;
  otpHash:   string;      // bcrypt hashed — never store raw OTP
  purpose:   'reset_password' | 'verify_mobile';
  expiresAt: Date;        // 10 minutes
  isUsed:    boolean;
  attempts:  number;      // Max 3 wrong attempts before lock
}

const OtpTokenSchema: Schema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    otpHash: {
      type:     String,
      required: true,
    },
    purpose: {
      type:    String,
      enum:    ['reset_password', 'verify_mobile'],
      default: 'reset_password',
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    isUsed:   { type: Boolean, default: false  },
    attempts: { type: Number,  default: 0      },
  },
  { timestamps: true },
);

// ✅ MongoDB TTL index — auto-deletes documents after they expire
// No manual cleanup needed ever
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpTokenSchema.index({ userId: 1, purpose: 1 });

export default mongoose.models.OtpToken ||
  mongoose.model<IOtpToken>('OtpToken', OtpTokenSchema);