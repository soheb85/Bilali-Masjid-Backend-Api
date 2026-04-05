/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { generateAccessToken, generateRefreshToken } from '@/utils/auth'; 

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, mobileNumber, fcmToken } = await req.json();

    if (!name || !mobileNumber) {
      return sendError('Name and mobile number are required', 400, 'VALIDATION_ERROR');
    }

    const normalizedMobile = mobileNumber.replace(/\D/g, '');

    let user = await User.findOne({ mobileNumber: normalizedMobile });

    if (user) {
      // 🚨 CRITICAL SECURITY FIX 🚨
      // If the user is NOT a normal 'USER', reject this login attempt.
      // They MUST use the /api/staff_login route which requires a password.
      if (user.role !== 'USER') {
        return sendError(
          'Staff and Admin accounts must use the Staff Login portal with a password.',
          403, // 403 Forbidden
          'STAFF_LOGIN_REQUIRED'
        );
      }

      // If they are a normal USER, update FCM token
      if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
        user.fcmTokens.push(fcmToken);
        await user.save();
      }
    } else {
      // New normal user registration
      user = await User.create({
        name,
        mobileNumber,
        role: 'USER', // Defaults to USER
        fcmTokens: fcmToken ? [fcmToken] : [],
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return sendSuccess({ accessToken, refreshToken, user }, 'Mobile login successful');

  } catch (error: any) {
    if (error.code === 11000) {
      return sendError('Database conflict error', 409, 'CONFLICT', error.message);
    }
    return sendError('Mobile login failed', 500, 'SERVER_ERROR', error.message);
  }
}