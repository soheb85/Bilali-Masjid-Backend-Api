/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendSuccess, sendError } from '@/utils/apiResponse';
// ✅ FIX 1: Import the new Dual-Token functions
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
      // User exists. Add the new device FCM token if we don't already have it
      if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
        user.fcmTokens.push(fcmToken);
        await user.save();
      }
    } else {
      // New user registration
      user = await User.create({
        name,
        mobileNumber,
        role: 'USER',
        fcmTokens: fcmToken ? [fcmToken] : [],
      });
    }

    // ✅ FIX 2: Generate both tokens for the mobile app
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ✅ FIX 3: Return both tokens in the response so the Flutter app can refresh its session
    return sendSuccess({ accessToken, refreshToken, user }, 'Mobile login successful');

  } catch (error: any) {
    if (error.code === 11000) {
      return sendError('Database conflict error', 409, 'CONFLICT', error.message);
    }
    return sendError('Mobile login failed', 500, 'SERVER_ERROR', error.message);
  }
}