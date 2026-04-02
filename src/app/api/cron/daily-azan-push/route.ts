/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { messaging } from '@/lib/firebaseAdmin';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { FCM_TOPICS, ERROR_CODES } from '@/constants';

// Vercel Cron calls this at 11:55 PM every night
// It sends a silent FCM push that wakes Flutter apps
// and triggers daily azan refresh (WorkManager backup)
export async function GET(req: NextRequest) {
  try {
    // Security: Vercel sends a secret header for cron routes
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return sendError('Unauthorized', 401, ERROR_CODES.UNAUTHORIZED);
    }

    await messaging.send({
      topic: FCM_TOPICS.ALL_USERS,
      data:  { type: 'daily_refresh', timestamp: new Date().toISOString() },
      android: { priority: 'high' },
      apns: {
        payload: { aps: { 'content-available': 1 } },
        headers: { 'apns-priority': '5' },
      },
    });

    return sendSuccess(
      { topic: FCM_TOPICS.ALL_USERS, sentAt: new Date().toISOString() },
      'Daily refresh push sent successfully.',
    );
  } catch (error: any) {
    return sendError('Cron job failed', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}