import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title:        string;
  imageUrl:     string;
  description?: string;   // ← ADD: Flutter popup needs this
  badgeType?:   string;   // ← ADD: 'Event' | 'Fundraiser' | 'Emergency' | 'Jummah'
  targetScreen?: string;
  targetUrl?:   string;
  showFrom:     Date;
  showUntil:    Date;
  priority:     number;
  isActive:     boolean;
  isUrgentPopup: boolean; // ← ADD: Show as full-screen popup on app open
}

const AnnouncementSchema: Schema = new Schema(
  {
    title:       { type: String,  required: true },
    imageUrl:    { type: String,  required: true },
    description: { type: String,  default: ''    }, // ← NEW
    badgeType:   {
      type: String,
      enum: ['Event', 'Fundraiser', 'Emergency', 'Jummah', 'General'],
      default: 'General',
    },                                               // ← NEW
    targetScreen:  { type: String, default: ''   },
    targetUrl:     { type: String, default: ''   },
    showFrom:      { type: Date,   required: true },
    showUntil:     { type: Date,   required: true },
    priority:      { type: Number, default: 0    },
    isActive:      { type: Boolean, default: true },
    isUrgentPopup: { type: Boolean, default: false }, // ← NEW
  },
  { timestamps: true },
);

AnnouncementSchema.index({ showFrom: 1, showUntil: 1, isActive: 1 });
AnnouncementSchema.index({ isUrgentPopup: 1, isActive: 1 });

export default mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);