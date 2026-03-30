/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document } from 'mongoose';

// 1. Marquee Interface
export interface IMarquee {
  isVisible: boolean;
  text: string;
  actionUrl?: string;
  targetScreens: string[];  // e.g., ['home', 'prayer_times', 'all']
  backgroundColor?: string; // e.g., '#FF0000' for urgent alerts
  textColor?: string;       // e.g., '#FFFFFF'
}

// 2. Carousel Item Interface
export interface ICarouselItem {
  id: string;
  imageUrl: string;
  actionUrl?: string;
  isActive: boolean;
  sortOrder: number;
  targetScreens: string[];  // e.g., ['home', 'community']
  
  // Production UI Additions
  title?: string;           // Optional text to overlay on the image
  subtitle?: string;        // Optional subtext
  textColor?: string;       // Hex color for the overlay text
  
  // Metadata for Analytics or Deep Linking (e.g., { campaignId: "ramadan_26", type: "sponsor" })
  metadata?: Record<string, any>; 
}

// 3. The Main Config Interface
export interface IAppConfig extends Document {
  appName: string;
  mobileConfig: {
    minAppVersion: { android: string; ios: string };
    latestAppVersion: { android: string; ios: string };
    isMaintenanceMode: boolean;
    maintenanceMessage: string;
  };
  ui: {
    marquee: IMarquee;
    carousels: ICarouselItem[]; // Renamed to handle multiple screens
    specialEventMode: boolean; // e.g., turn the app theme green for Ramadan
  };
  dynamicLinks: {
    privacyPolicy: string;
    termsOfService: string;
    whatsappSupport: string; // Great for immediate user support
  };
  features: {
    enableSocialLogin: boolean;
    enablePremiumFeatures: boolean;
    enableAds: boolean; // Toggle ads on/off remotely
  };
  // 1. PRAYER & AZAN SPECIFIC CONFIG
  prayerSettings: {
    defaultCalculationMethod: string; // e.g., 'KARACHI', 'MWL', 'ISNA'
    allowManualTimeAdjustment: boolean; // Let users tweak times by +/- minutes
    hijriDateAdjustment: number; // Sometimes the moon sighting requires a +1 or -1 day shift globally
  };
  // 2. APP BEHAVIOR & CACHING
  appBehavior: {
    forceSyncIntervalHours: number; // How often Flutter should fetch fresh data in the background
    showRatingPromptAfterOpens: number; // Ask for a Play Store rating after X app opens
    enableQiblaCompass: boolean; // Kill-switch: If a new Android/iOS update breaks your compass UI, turn it off remotely!
  };
  // 3. ONBOARDING & URGENT POPUPS
  urgentPopup: {
    isVisible: boolean;
    title: string;
    message: string;
    buttonText: string;
    actionUrl?: string; // E.g., Link to a donation page or important news
  };
  // 4. COMMUNITY & SOCIALS
  socialLinks: {
    instagramUrl: string;
    youtubeUrl: string;
    twitterUrl: string;
    websiteUrl: string;
  };
  // 5. NOTIFICATION & ALARM SETTINGS
  notificationSettings: {
    enableGlobalNotifications: boolean; // Master kill-switch for all push notifications
    daysToScheduleAhead: number; // Crucial: iOS has a hard limit of 64 scheduled local notifications
    defaultSafayiOffsetMinutes: number; // Globally set the default Safayi time (e.g., 10 mins before Jamat)
    jummahMuteDurationMinutes: number; // Automatically keep the app/phone silent for X minutes after Jummah Azan
    fajrWakeUpMode: boolean; // Toggle a special "hard to dismiss" screen for Fajr remotely
    defaultAzanAudioUrl: string; // If you ever need to change the default Azan sound without an app update
  };
  // 6. DYNAMIC KEY-VALUE STORE
  customSettings: Record<string, any>;
}

// 4. The Mongoose Schema
const AppConfigSchema: Schema = new Schema(
  {
    appName: { type: String, required: true, default: 'Azan & Prayer App' },
    mobileConfig: {
      minAppVersion: {
        android: { type: String, default: '1.0.0' },
        ios: { type: String, default: '1.0.0' },
      },
      latestAppVersion: {
        android: { type: String, default: '1.0.0' },
        ios: { type: String, default: '1.0.0' },
      },
      isMaintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: { type: String, default: 'Servers are undergoing maintenance.' },
    },
    ui: {
      marquee: {
        isVisible: { type: Boolean, default: false },
        text: { type: String, default: 'Welcome to the app!' },
        actionUrl: { type: String, default: '' },
        targetScreens: { type: [String], default: ['home'] }, 
        backgroundColor: { type: String, default: '#000000' },
        textColor: { type: String, default: '#FFFFFF' },
      },
      carousels: [
        {
          id: { type: String, required: true },
          imageUrl: { type: String, required: true },
          actionUrl: { type: String },
          isActive: { type: Boolean, default: true },
          sortOrder: { type: Number, default: 0 },
          targetScreens: { type: [String], default: ['home'] },
          
          title: { type: String },
          subtitle: { type: String },
          textColor: { type: String, default: '#FFFFFF' },
          
          metadata: { type: Schema.Types.Mixed, default: {} },
        },
      ],
      specialEventMode: { type: Boolean, default: false },
    },
    dynamicLinks: {
      privacyPolicy: { type: String, default: 'https://yourdomain.com/privacy' },
      termsOfService: { type: String, default: 'https://yourdomain.com/terms' },
      whatsappSupport: { type: String, default: '+1234567890' },
    },
    features: {
      enableSocialLogin: { type: Boolean, default: true },
      enablePremiumFeatures: { type: Boolean, default: false },
      enableAds: { type: Boolean, default: false },
    },
    prayerSettings: {
      defaultCalculationMethod: { type: String, default: 'KARACHI' }, 
      allowManualTimeAdjustment: { type: Boolean, default: true },
      hijriDateAdjustment: { type: Number, default: 0 }, 
    },
    appBehavior: {
      forceSyncIntervalHours: { type: Number, default: 24 },
      showRatingPromptAfterOpens: { type: Number, default: 5 },
      enableQiblaCompass: { type: Boolean, default: true },
    },
    urgentPopup: {
      isVisible: { type: Boolean, default: false },
      title: { type: String, default: 'Important Update' },
      message: { type: String, default: 'Please read this important announcement.' },
      buttonText: { type: String, default: 'Okay' },
      actionUrl: { type: String, default: '' },
    },
    socialLinks: {
      instagramUrl: { type: String, default: '' },
      youtubeUrl: { type: String, default: '' },
      twitterUrl: { type: String, default: '' },
      websiteUrl: { type: String, default: '' },
    },
    notificationSettings: {
      enableGlobalNotifications: { type: Boolean, default: true },
      daysToScheduleAhead: { type: Number, default: 7 }, 
      defaultSafayiOffsetMinutes: { type: Number, default: 10 },
      jummahMuteDurationMinutes: { type: Number, default: 45 },
      fajrWakeUpMode: { type: Boolean, default: false },
      defaultAzanAudioUrl: { type: String, default: '' },
    },
    customSettings: {
      type: Map,
      of: Schema.Types.Mixed, 
      default: {}, 
    },
  },
  { timestamps: true }
);

export default mongoose.models.AppConfig || mongoose.model<IAppConfig>('AppConfig', AppConfigSchema);