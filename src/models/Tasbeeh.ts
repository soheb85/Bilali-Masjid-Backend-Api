import mongoose, { Schema, Document } from 'mongoose';

export interface ITasbeeh extends Document {
  arabic:    string;
  en:        string;   // English transliteration
  meaning: {
    en: string;
    hi: string;
    ur: string;
  };
  target:   number;    // default recommended count (33, 100, etc.)
  category: string;    // 'morning' | 'evening' | 'salah' | 'general'
  sortOrder: number;
}

const TasbeehSchema: Schema = new Schema({
  arabic:   { type: String, required: true },
  en:       { type: String, required: true }, // transliteration
  meaning: {
    en: { type: String, default: '' },
    hi: { type: String, default: '' },
    ur: { type: String, default: '' },
  },
  target:   { type: Number, default: 33 },
  category: { type: String, default: 'general',
    enum: ['morning', 'evening', 'salah', 'general', 'special'] },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Tasbeeh ||
  mongoose.model<ITasbeeh>('Tasbeeh', TasbeehSchema);