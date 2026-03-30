import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationRecord extends Document {
  title: string;
  messageBody: string;
  imageUrl?: string;
  targetScreen?: string;
  targetUrl?: string;
  topic: string;
  
  // Audit & Tracking
  firebaseMessageId: string; 
  sentBy: mongoose.Types.ObjectId; // Links to the User who pushed the button
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

const NotificationRecordSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    messageBody: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    targetScreen: { type: String, default: "HOME" },
    targetUrl: { type: String, default: "" },
    topic: { type: String, default: "global" },
    
    firebaseMessageId: { type: String, default: "" },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true } // Automatically adds createdAt (when it was sent)
);

// Sort by newest first
NotificationRecordSchema.index({ createdAt: -1 });

export default mongoose.models.NotificationRecord || mongoose.model<INotificationRecord>('NotificationRecord', NotificationRecordSchema);