/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { logAction } from '@/utils/logger';
import { ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY } from '@/constants';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      return sendError('Reset token and new password are required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (newPassword.length < 6) {
      return sendError('Password must be at least 6 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Verify the reset token
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return sendError('Reset token is invalid or expired.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    if (decoded.purpose !== 'reset_password') {
      return sendError('Invalid token purpose', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) {
      return sendError('User not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Hash the new password
    const newHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = newHash;

    // Invalidate ALL existing refresh tokens (forces logout on all devices)
    user.refreshTokens = [];
    await user.save();

    await logAction({
      req,
      userId:   user._id.toString(),
      userRole: user.role,
      action:   AUDIT_ACTIONS.RESET_PASSWORD,
      resource: AUDIT_RESOURCES.USER,
      resourceId: user._id.toString(),
      details:  { allSessionsRevoked: true },
      severity: AUDIT_SEVERITY.WARNING,
    });

    return sendSuccess(null, 'Password reset successfully. Please log in with your new password.');
  } catch (error: any) {
    return sendError('Password reset failed', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}