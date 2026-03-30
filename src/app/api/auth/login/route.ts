/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AppConfig from '@/models/AppConfig'; // ✅ Imported AppConfig
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { generateAccessToken, generateRefreshToken } from '@/utils/auth';
import { ROLES } from '@/constants';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { mobileNumber, password } = await req.json();

    // ✅ Validate input
    if (!mobileNumber || !password) {
      return sendError(
        'Mobile number and password are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    // ✅ 1. FIX: Find user by mobile number AND fetch the hidden fields
    const user = await User.findOne({ mobileNumber }).select('+passwordHash +refreshTokens');

    if (!user || !user.isActive) {
      return sendError(
        'Invalid credentials or account disabled',
        401,
        'AUTH_FAILED'
      );
    }

    // ❗ Extra safety: ensure staff login only
    if (!user.passwordHash) {
      return sendError(
        'This account does not support password login',
        403,
        'FORBIDDEN'
      );
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError('Invalid credentials', 401, 'AUTH_FAILED');
    }

    // ✅ Generate JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ✅ 2. FIX: Safety check to initialize the array if it is an old account
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }

    // Push the new token
    user.refreshTokens.push(refreshToken);

    // ✅ 3. FIX: Keep only the 5 most recent tokens (Max 5 devices logged in at once)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift(); // Removes the oldest token
    }

    await user.save();

    // ✅ Clean response
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshTokens; // Make sure the array isn't sent to the frontend

    // ---------------------------------------------------------
    // ✅ GRANULAR UI PERMISSION CALCULATOR
    // ---------------------------------------------------------
    let finalUiPermissions: string[] = [];

    if (user.role === ROLES.SUPER_ADMIN) {
      finalUiPermissions = ['*']; // Super Admin sees everything
    } else {
      // 1. Fetch the global AppConfig
      let config = await AppConfig.findOne();
      if (!config) config = await AppConfig.create({});

      // 2. Get base permissions from their Role (e.g., MOAZIN defaults)
      const baseMap = config.adminPanelUI?.roleScreenMapping;
      const basePermissions = baseMap ? (baseMap.get(user.role) || []) : [];

      // 3. Add any extra permissions given specifically to this user
      let combined = [...basePermissions, ...(user.extraUiPermissions || [])];

      // Remove duplicates
      combined = Array.from(new Set(combined));

      // 4. Subtract any restricted permissions taken away from this user
      finalUiPermissions = combined.filter(
        (permission) => !(user.restrictedUiPermissions || []).includes(permission)
      );
    }

    // Attach the calculated permissions to the final output
    userObj.uiPermissions = finalUiPermissions;
    // ---------------------------------------------------------

    return sendSuccess({ 
      accessToken, 
      refreshToken, 
      user: userObj 
    }, 'Login successful');

  } catch (error: any) {
    return sendError('Login failed', 500, 'SERVER_ERROR', error.message);
  }
}