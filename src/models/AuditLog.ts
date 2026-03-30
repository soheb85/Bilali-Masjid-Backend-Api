/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId; // Who did it (optional, in case of system actions/anonymous)
  userRole?: string; // e.g., 'ADMIN', 'MOAZIN'
  action: string; // e.g., 'UPDATE_CONFIG', 'UPDATE_AZAN', 'LOGIN'
  resource: string; // e.g., 'AppConfig', 'Azan', 'User'
  resourceId?: string; // The ID of the thing they changed
  details: Record<string, any>; // What exactly changed (Old value vs New value)
  ipAddress?: string;
  userAgent?: string; // Was it a mobile app or a web browser?
  severity: "INFO" | "WARNING" | "CRITICAL" | "ERROR"; // For future use, in case we want to flag certain actions as more important
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userRole: { type: String },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },

    // Schema.Types.Mixed allows you to dump any JSON object here
    details: { type: Schema.Types.Mixed, default: {} },

    ipAddress: { type: String },
    userAgent: { type: String },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL"],
      default: "INFO",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Logs never get "updated", only created
  },
);

// INDUSTRY SECRET: Auto-delete logs after 180 days (6 months) to save database costs!
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);