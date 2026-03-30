/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document } from 'mongoose';

export interface IPrayerTime {
  start: string;  
  end: string;    
  azan: string;   
  jamat: string;  
  safayi: string; 
}

export interface ISpecialTimes {
  tahajjudStart: string; 
  tahajjudEnd: string;   
  sehri: string;         
  sunrise: string;       
  ishraq: string;        
  zawalStart: string;    
  zawalEnd: string;      
  iftar: string;         
}

export interface IAzan extends Document {
  hijriDate: string;  // The current Islamic Date (Updated manually by Admin)
  
  prayers: {
    fajr: IPrayerTime;
    zuhar: IPrayerTime;
    asr: IPrayerTime;
    maghrib: IPrayerTime;
    isha: IPrayerTime;
    jummah?: IPrayerTime; 
  };

  specialTimes: ISpecialTimes;
  
  isRamadan: boolean;
  dailyAnnouncement?: string; 
  customData: Record<string, any>; 
}

const PrayerTimeSchema = new Schema(
  {
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    azan: { type: String, default: "" },
    jamat: { type: String, default: "" },
    safayi: { type: String, default: "" },
  },
  { _id: false } 
);

const SpecialTimesSchema = new Schema(
  {
    tahajjudStart: { type: String, default: "" },
    tahajjudEnd: { type: String, default: "" },
    sehri: { type: String, default: "" },
    sunrise: { type: String, default: "" },
    ishraq: { type: String, default: "" },
    zawalStart: { type: String, default: "" },
    zawalEnd: { type: String, default: "" },
    iftar: { type: String, default: "" },
  },
  { _id: false }
);

const AzanSchema: Schema = new Schema(
  {
    hijriDate: { type: String, default: "1 Muharram 1446" },

    prayers: {
      fajr: { type: PrayerTimeSchema, default: () => ({}) },
      zuhar: { type: PrayerTimeSchema, default: () => ({}) },
      asr: { type: PrayerTimeSchema, default: () => ({}) },
      maghrib: { type: PrayerTimeSchema, default: () => ({}) },
      isha: { type: PrayerTimeSchema, default: () => ({}) },
      jummah: { type: PrayerTimeSchema, default: () => ({}) },
    },

    specialTimes: { type: SpecialTimesSchema, default: () => ({}) },

    isRamadan: { type: Boolean, default: false },
    dailyAnnouncement: { type: String, default: "" },
    customData: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.Azan || mongoose.model<IAzan>('Azan', AzanSchema);