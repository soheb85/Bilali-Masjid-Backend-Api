/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { ERROR_CODES } from '@/constants';

// Flutter calls this when FirebaseMessaging.onTokenRefresh fires
export async function PATCH(req: NextRequest) {
  try {
    const userContext = requireAuth(req); // Any authenticated user
    await connectDB();

    const { fcmToken } = await req.json();

    if (!fcmToken || typeof fcmToken !== 'string') {
      return sendError('fcmToken is required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await User.findById(userContext.userId);
    if (!user) {
      return sendError('User not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Add new token if not already in the list
    if (!user.fcmTokens) user.fcmTokens = [];
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      // Keep max 5 device tokens per user
      if (user.fcmTokens.length > 5) user.fcmTokens.shift();
      await user.save();
    }

    return sendSuccess(null, 'FCM token updated successfully.');
  } catch (error: any) {
    return sendError('Failed to update FCM token', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}