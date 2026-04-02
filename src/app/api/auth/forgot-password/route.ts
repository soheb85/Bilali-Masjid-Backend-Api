/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OtpToken from '@/models/OtpToken';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { logAction } from '@/utils/logger';
import { ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY } from '@/constants';
import { checkRateLimit } from '@/utils/rateLimit'; // ✅ Imported Rate Limiter

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // ✅ RATE LIMITING SECUTIY CHECK
    // ---------------------------------------------------------
    const forwarded = req.headers.get("x-forwarded-for") ?? "unknown";
    const ip = forwarded.split(",")[0].trim();
    
    // Strict Limit: Only 3 OTP requests allowed per IP every 15 minutes
    const rl = checkRateLimit(`otp_request:${ip}`, 3, 15 * 60 * 1000); 

    if (!rl.allowed) {
      return sendError(
        "Too many OTP requests. Please wait 15 minutes before trying again.",
        429,
        "RATE_LIMITED"
      );
    }
    // ---------------------------------------------------------

    await connectDB();
    const { mobileNumber } = await req.json();

    if (!mobileNumber) {
      return sendError('Mobile number is required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Find staff user (only staff have passwords + emails)
    const user = await User.findOne({ mobileNumber: mobileNumber.trim() });

    if (!user || !user.isActive) {
      // Don't reveal if user exists — security best practice
      return sendSuccess(
        { maskedEmail: null },
        'If this number is registered, an OTP has been sent.',
      );
    }

    if (!user.email) {
      return sendError(
        'No email address on file. Contact Super Admin.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // Delete any existing OTPs for this user + purpose
    await OtpToken.deleteMany({ userId: user._id, purpose: 'reset_password' });

    // Save new OTP (expires in 10 minutes)
    await OtpToken.create({
      userId:   user._id,
      otpHash:  hashedOtp,
      purpose:  'reset_password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your login password)
      },
    });

    await transporter.sendMail({
      from:    `"Bilali Masjid" <${process.env.GMAIL_USER}>`,
      to:      user.email,
      subject: '🕌 Bilali Masjid — Your Password Reset OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:20px">
          <div style="text-align:center;margin-bottom:24px">
            <h2 style="color:#1DB954;margin:0">🕌 Bilali Masjid</h2>
          </div>
          <p style="color:#333">Assalamu Alaikum <strong>${user.name}</strong>,</p>
          <p style="color:#555">Your password reset OTP is:</p>
          <div style="font-size:42px;font-weight:bold;color:#1DB954;text-align:center;
                      padding:20px;background:#f0f9f0;border-radius:12px;
                      letter-spacing:12px;margin:20px 0">
            ${rawOtp}
          </div>
          <p style="color:#888;font-size:13px">⏰ Valid for <strong>10 minutes</strong> only.</p>
          <p style="color:#888;font-size:13px">🔒 Do not share this OTP with anyone.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
          <p style="color:#aaa;font-size:12px;text-align:center">Jazakallah Khair</p>
        </div>
      `,
    });

    // Mask email for display (ab***@gmail.com)
    const [localPart, domain] = user.email.split('@');
    const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

    await logAction({
      req,
      userId:   user._id.toString(),
      userRole: user.role,
      action:   AUDIT_ACTIONS.REQUEST_OTP,
      resource: AUDIT_RESOURCES.OTP,
      details:  { purpose: 'reset_password' },
      severity: AUDIT_SEVERITY.INFO,
    });

    return sendSuccess({ maskedEmail }, 'OTP sent to your registered email address.');
  } catch (error: any) {
    return sendError('Failed to send OTP', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}