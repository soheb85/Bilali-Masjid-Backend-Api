/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import NotificationRecord from '@/models/NotificationRecord';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { CAPABILITIES, ERROR_CODES } from '@/constants';

// GET: Fetch the last 50 sent notifications (History & Templates)
export async function GET(req: NextRequest) {
  try {
    // 1. Security: Only users who can write announcements can view the history
    requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);

    await connectDB();

    // 2. Fetch records: Sort by newest first, limit to 50
    // We populate 'sentBy' so the Admin Panel shows the name of the person who sent it
    const history = await NotificationRecord.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sentBy', 'firstName lastName email role');

    return sendSuccess(history, 'Notification history fetched successfully');

  } catch (error: any) {
    return sendError(
      'Failed to fetch notification history', 
      500, 
      ERROR_CODES.SERVER_ERROR, 
      error.message
    );
  }
}