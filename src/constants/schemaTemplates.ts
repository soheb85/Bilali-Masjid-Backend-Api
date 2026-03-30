/* eslint-disable @typescript-eslint/no-explicit-any */
// src/constants/schemaTemplates.ts

export const API_PAYLOAD_TEMPLATES: Record<string, Record<string, any>> = {
  Announcement: {
    title: "Ramadan Series 2026",
    imageUrl: "https://example.com/banner.jpg",
    targetScreen: "QURAN_SCREEN",
    targetUrl: "https://youtube.com/live",
    showFrom: new Date().toISOString(),
    showUntil: new Date(Date.now() + 86400000 * 7).toISOString(), // +7 Days
    priority: 10,
    isActive: true,
  },
  BroadcastNotification: {
    title: "Urgent Update",
    messageBody: "Tomorrow's Fajr time has been updated.",
    imageUrl: "https://example.com/icon.png",
    targetScreen: "HOME",
    targetUrl: "",
    topic: "global",
  },
  AzanUpdate: {
    hijriDate: "12 Shawwal 1447",
    isRamadan: false,
    dailyAnnouncement: "Dars-e-Quran tonight after Isha.",
    prayers: {
      fajr: { start: "05:00", end: "06:19", azan: "05:15", jamat: "05:45", safayi: "05:35" },
      zuhar: { start: "12:26", end: "15:59", azan: "13:00", jamat: "13:30", safayi: "13:20" },
      asr: { start: "16:00", end: "18:44", azan: "16:45", jamat: "17:00", safayi: "16:50" },
      maghrib: { start: "18:45", end: "20:00", azan: "18:45", jamat: "18:50", safayi: "18:40" },
      isha: { start: "20:01", end: "01:29", azan: "20:15", jamat: "20:30", safayi: "20:20" },
      jummah: { start: "12:26", end: "15:59", azan: "13:15", jamat: "14:00", safayi: "13:45" }
    },
    specialTimes: {
      tahajjudStart: "01:30", tahajjudEnd: "04:50", sehri: "04:55", sunrise: "06:20",
      ishraq: "06:35", zawalStart: "12:15", zawalEnd: "12:25", iftar: "18:45"
    }
  },
  AppConfigUpdate: {
    "mobileConfig.isMaintenanceMode": false,
    "prayerSettings.hijriDateAdjustment": 1,
    "urgentPopup.isVisible": true,
    "urgentPopup.title": "Eid Mubarak",
    "urgentPopup.message": "Namaz will be held at 7:30 AM",
  },
  Capability: {
    name: "write:announcements",
    displayName: "Manage Banners",
    description: "Allows admin to create or delete app banners",
    module: "Announcements",
    isSystem: false,
  }
};