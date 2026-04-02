/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Azan from '@/models/Azan';
import AppConfig from '@/models/AppConfig';
import { messaging } from '@/lib/firebaseAdmin';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { logAction } from '@/utils/logger';
import { formatAllTimesInObject, formatAllTo12Hour } from '@/utils/timeFormat';
import { calculateHijriDate } from '@/utils/hijriCalc';
import {
  CAPABILITIES, ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES,
  AUDIT_SEVERITY, FCM_TOPICS,
} from '@/constants';

// ─────────────────────────────────────────────────────────────
// GET — Public — Flutter calls this on every app open
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    let liveTimes = await Azan.findOne();
    if (!liveTimes) liveTimes = await Azan.create({});

    const config      = await AppConfig.findOne();
    const hijriOffset = config?.prayerSettings?.hijriDateAdjustment ?? 0;

    const responseData = liveTimes.toObject();

    // ── Automatically computed fields ──────────────────────
    const today = new Date();
    responseData.isFriday  = today.getDay() === 5;
    responseData.isRamadan = responseData.isRamadan ?? false;

    // ── Hijri dates ────────────────────────────────────────
    // localHijriDate applies mosque-specific offset (moon sighting)
    // globalHijriDate is always Saudi/astronomical calculation
    responseData.hijriDate       = calculateHijriDate(hijriOffset);
    responseData.globalHijriDate = calculateHijriDate(0);

    // ── Server metadata (Flutter uses for clock sync) ──────
    responseData.serverDate = today.toISOString().split('T')[0];
    responseData.serverDay  = today.toLocaleDateString('en-US', { weekday: 'long' });
    responseData.serverTime = today.toISOString();

    // ── App config values Flutter needs ───────────────────
    responseData.daysToScheduleAhead =
      config?.notificationSettings?.daysToScheduleAhead ?? 7;
    responseData.fajrWakeUpMode =
      config?.notificationSettings?.fajrWakeUpMode ?? false;

    // ── 12-hour display times for direct UI render ─────────
    // Flutter doesn't need to format — just use displayTimes.prayers.fajr.azan
    responseData.displayTimes = {
      prayers:      formatAllTo12Hour(responseData.prayers),
      specialTimes: formatAllTo12Hour(responseData.specialTimes),
    };

    const response = sendSuccess(
      responseData,
      'Live prayer times fetched successfully',
    );

    // Cache 5 minutes on CDN — fresh enough, saves DB hits
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600',
    );

    return response;
  } catch (error: any) {
    return sendError(
      'Failed to fetch prayer times',
      500,
      ERROR_CODES.SERVER_ERROR,
      error.message,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT — Protected — Moazin/Admin updates times
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const userContext = requireAuth(req, CAPABILITIES.WRITE_AZAN);
    await connectDB();

    const body = await req.json();

    let liveTimes = await Azan.findOne();
    if (!liveTimes) liveTimes = new Azan();

    // Convert any 12-hour strings to 24-hour before saving
    if (body.prayers)      formatAllTimesInObject(body.prayers);
    if (body.specialTimes) formatAllTimesInObject(body.specialTimes);

    liveTimes.set(body);
    await liveTimes.save();

    // ── ✅ CRITICAL: Silent FCM push after saving ──────────
    // This wakes up all Flutter apps in background and triggers
    // AzanSchedulerService.rescheduleWithNewTimes()
    try {
      await messaging.send({
        topic: FCM_TOPICS.ALL_USERS,
        data: {
          type:      'prayer_times_updated',
          updatedAt: new Date().toISOString(),
          // No 'notification' key = SILENT push (no tray notification)
        },
        android: { priority: 'high' },
        apns: {
          payload: { aps: { 'content-available': 1 } },
          headers: { 'apns-priority': '5' },
        },
      });
    } catch (fcmError: any) {
      // Don't fail the save if FCM fails — log it but continue
      console.error('FCM silent push failed after azan update:', fcmError.message);
    }

    // ── Audit log ──────────────────────────────────────────
    await logAction({
      req,
      userId:   userContext.userId,
      userRole: userContext.role,
      action:   AUDIT_ACTIONS.UPDATE_AZAN,
      resource: AUDIT_RESOURCES.AZAN,
      resourceId: liveTimes._id.toString(),
      details:  { updatedFields: Object.keys(body) },
      severity: AUDIT_SEVERITY.INFO,
    });

    const config      = await AppConfig.findOne();
    const hijriOffset = config?.prayerSettings?.hijriDateAdjustment ?? 0;
    const responseData     = liveTimes.toObject();
    responseData.hijriDate = calculateHijriDate(hijriOffset);

    return sendSuccess(responseData, 'Prayer times updated successfully');
  } catch (error: any) {
    return sendError(
      'Failed to update prayer times',
      400,
      ERROR_CODES.VALIDATION_ERROR,
      error.message,
    );
  }
}