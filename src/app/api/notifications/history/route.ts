/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import NotificationRecord from '@/models/NotificationRecord';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { CAPABILITIES, ERROR_CODES } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req, CAPABILITIES.READ_NOTIFICATIONS);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get('page')  ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      NotificationRecord.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sentBy', 'name role'),   // Include sender's name
      NotificationRecord.countDocuments(),
    ]);

    return sendSuccess(records, 'Notification history fetched', 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return sendError('Failed to fetch history', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}