import mongoose, { Schema, Document } from 'mongoose';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRUSTY', 'MOAZIN'];

export interface IUser extends Document {
  name: string;
  mobileNumber: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TRUSTY' | 'MOAZIN' | 'USER';
  email?: string;         
  passwordHash?: string;  
  fcmTokens: string[];    
  isActive: boolean;
  capabilities: string[];
  extraUiPermissions: string[];      // e.g., ['reports_screen', 'delete_user_button']
  restrictedUiPermissions: string[]; // e.g., ['audit_logs_screen']
  refreshTokens: string[];
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: [...STAFF_ROLES, 'USER'],
      default: 'USER',
    },
    // Only required for Admin Panel users
    email: { 
      type: String, 
      lowercase: true,
      unique: true, 
      sparse: true, 
      required: function(this: IUser) { return STAFF_ROLES.includes(this.role); }
    },
    // Only required for Admin Panel users
    passwordHash: { 
      type: String, 
      select: false,
      required: function(this: IUser) { return STAFF_ROLES.includes(this.role); }
    },
    fcmTokens: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    capabilities: { type: [String], default: [] },
    extraUiPermissions: { type: [String], default: [] },
    restrictedUiPermissions: { type: [String], default: [] },
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);