/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OtpToken from '@/models/OtpToken';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { logAction } from '@/utils/logger';
import { ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY } from '@/constants';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { mobileNumber, otp } = await req.json();

    if (!mobileNumber || !otp) {
      return sendError('Mobile number and OTP are required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await User.findOne({ mobileNumber: mobileNumber.trim() });
    if (!user) {
      return sendError('Invalid request', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const otpRecord = await OtpToken.findOne({
      userId:  user._id,
      purpose: 'reset_password',
      isUsed:  false,
    });

    if (!otpRecord) {
      return sendError(
        'OTP not found or already used. Request a new one.',
        400,
        ERROR_CODES.OTP_EXPIRED,
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      return sendError('OTP has expired. Please request a new one.', 400, ERROR_CODES.OTP_EXPIRED);
    }

    if (otpRecord.attempts >= 3) {
      await otpRecord.deleteOne();
      return sendError(
        'Too many wrong attempts. Please request a new OTP.',
        400,
        ERROR_CODES.OTP_MAX_ATTEMPTS,
      );
    }

    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return sendError(
        `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`,
        400,
        ERROR_CODES.OTP_INVALID,
      );
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Issue a short-lived "reset token" (15 minutes)
    // This is passed to /reset-password to authorize the password change
    const resetToken = jwt.sign(
      { userId: user._id.toString(), purpose: 'reset_password' },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    await logAction({
      req,
      userId:   user._id.toString(),
      userRole: user.role,
      action:   AUDIT_ACTIONS.VERIFY_OTP,
      resource: AUDIT_RESOURCES.OTP,
      details:  { success: true },
      severity: AUDIT_SEVERITY.INFO,
    });

    return sendSuccess({ resetToken }, 'OTP verified successfully.');
  } catch (error: any) {
    return sendError('OTP verification failed', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}