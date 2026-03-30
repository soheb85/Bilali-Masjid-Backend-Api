/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { generateAccessToken } from '@/utils/auth';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "8f3c9a7d2b6e1f4a9c0d5e8b7a3f6c1d2e9b4a7f8c5d0e6b1a3f9c7d2e8b6a4";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return sendError('Refresh token is required', 400, 'VALIDATION_ERROR');
    }

    // 1. Verify the refresh token is mathematically valid and not expired
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err: any) {
      return sendError('Refresh token expired or invalid. Please log in again.', 401, 'AUTH_FAILED',err.message);
    }

    // 2. Security Check: Does this exact token exist in the user's database record?
    // We select('+refreshTokens') because we hid it by default in the model
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    
    if (!user || !user.isActive) {
      return sendError('User not found or disabled', 401, 'AUTH_FAILED');
    }

    if (!user.refreshTokens.includes(refreshToken)) {
      // If the token is mathematically valid but NOT in the database, it means 
      // the Admin manually revoked it (logged the user out from all devices).
      return sendError('Refresh token has been revoked', 403, 'FORBIDDEN');
    }

    // 3. Generate a fresh 30-minute access token!
    const newAccessToken = generateAccessToken(user);

    return sendSuccess({ accessToken: newAccessToken }, 'Access Token refreshed successfully');

  } catch (error: any) {
    return sendError('Failed to refresh access token', 500, 'SERVER_ERROR', error.message);
  }
}