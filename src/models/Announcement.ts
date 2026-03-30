import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;           // Internal name (e.g., "Ramadan Series 2026")
  imageUrl: string;        // Cloudinary/S3 URL for the banner image
  
  // Navigation Logic
  targetScreen?: string;   // Flutter screen name (e.g., "quran_screen", "live_stream")
  targetUrl?: string;      // External link (e.g., YouTube URL)
  
  // Scheduling
  showFrom: Date;          // Start showing at this time
  showUntil: Date;         // Stop showing at this time
  
  priority: number;        // Higher number = shows first in the list
  isActive: boolean;       // Master kill-switch
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    
    // Example targets: "QURAN", "HADITH", "NAMAZ_TIMING", "EXTERNAL_URL"
    targetScreen: { type: String, default: "" },
    targetUrl: { type: String, default: "" },
    
    showFrom: { type: Date, required: true },
    showUntil: { type: Date, required: true },
    
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexing for high-speed date filtering
AnnouncementSchema.index({ showFrom: 1, showUntil: 1, isActive: 1 });

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);