/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AppConfig from '@/models/AppConfig';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { ROLES } from '@/constants';

export const dynamic = 'force-dynamic'; // ✅ Added this line!

// GET: Verifies the token and returns the latest user data & UI permissions
export async function GET(req: NextRequest) {
  try {
    const decodedToken = requireAuth(req);
    await connectDB();

    const user = await User.findById(decodedToken.userId).select('-passwordHash');
    
    if (!user || !user.isActive) {
      return sendError('User not found or disabled', 401, 'AUTH_FAILED');
    }

    let finalUiPermissions: string[] = [];

    if (user.role === ROLES.SUPER_ADMIN) {
      finalUiPermissions = ['*']; 
    } else {
      let config = await AppConfig.findOne();
      if (!config) config = await AppConfig.create({});

      const baseMap = config.adminPanelUI?.roleScreenMapping;
      const basePermissions = baseMap ? (baseMap.get(user.role) || []) : [];
      let combined = [...basePermissions, ...(user.extraUiPermissions || [])];
      combined = Array.from(new Set(combined));

      finalUiPermissions = combined.filter(
        (permission) => !(user.restrictedUiPermissions || []).includes(permission)
      );
    }

    const userObj = user.toObject();
    userObj.uiPermissions = finalUiPermissions;

    return sendSuccess({ user: userObj }, 'Token verified successfully');

  } catch (error: any) {
    return sendError('Session expired. Please log in again.', 401, 'UNAUTHORIZED', error.message);
  }
}