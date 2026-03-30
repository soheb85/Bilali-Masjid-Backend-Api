/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { CAPABILITIES, ERROR_CODES } from '@/constants';

// ----------------------------------------------------------------------
// GET: Fetch Active Banners (Public - For Flutter App)
// ----------------------------------------------------------------------
export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    // Query: Only get banners that are ACTIVE and CURRENTLY within time range
    const activeBanners = await Announcement.find({
      isActive: true,
      showFrom: { $lte: now },
      showUntil: { $gte: now }
    }).sort({ priority: -1, createdAt: -1 });

    const response = sendSuccess(activeBanners, 'Active banners fetched successfully');

    // Cache for 2 minutes (120s) so the app stays fresh but doesn't spam DB
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    return response;
  } catch (error: any) {
    return sendError('Failed to fetch banners', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}

// ----------------------------------------------------------------------
// POST: Create a New Banner (Admin Only)
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Security: Only admins with WRITE_ANNOUNCEMENTS can post
    requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);

    await connectDB();
    const body = await req.json();

    // Validation: Ensure basic dates are provided
    if (!body.showFrom || !body.showUntil || !body.imageUrl) {
      return sendError('Image, Start Date, and End Date are required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const newBanner = await Announcement.create(body);

    return sendSuccess(newBanner, 'Banner created successfully', 201);
  } catch (error: any) {
    return sendError('Failed to create banner', 400, ERROR_CODES.VALIDATION_ERROR, error.message);
  }
}