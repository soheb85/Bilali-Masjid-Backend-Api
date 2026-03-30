import mongoose, { Schema, Document } from 'mongoose';

export interface ICapability extends Document {
  name: string;        // The code-friendly key (e.g., 'write:config')
  displayName: string; // The UI-friendly name (e.g., 'Edit App Settings')
  description: string; // What this actually does
  module: string;      // Used to group checkboxes in the Admin UI (e.g., 'Settings', 'Azan', 'Users')
  isSystem: boolean;   // If true, admins cannot delete this capability from the database
}

const CapabilitySchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    displayName: { type: String, required: true },
    description: { type: String, required: true },
    module: { type: String, required: true },
    isSystem: { type: Boolean, default: false }, // Protects core capabilities from accidental deletion
  },
  { timestamps: true }
);

export default mongoose.models.Capability || mongoose.model<ICapability>('Capability', CapabilitySchema);