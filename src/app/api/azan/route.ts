/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Azan from '@/models/Azan';
import AppConfig from '@/models/AppConfig'; // ✅ Import AppConfig
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { logAction } from '@/utils/logger';
import { formatAllTimesInObject, formatAllTo12Hour } from '@/utils/timeFormat';
import { calculateHijriDate } from '@/utils/hijriCalc'; // ✅ Import your new math tool
import { CAPABILITIES, ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY } from '@/constants';

// ----------------------------------------------------------------------
// GET: Fetch the current Live Prayer Times (With Dynamic Hijri Math)
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Fetch the Live Times
    let liveTimes = await Azan.findOne();
    if (!liveTimes) {
      liveTimes = await Azan.create({});
    }

    // 2. Fetch the AppConfig to get the Hijri Offset (defaults to 0 if not found)
    const config = await AppConfig.findOne();
    const hijriOffset = config?.prayerSettings?.hijriDateAdjustment || 0;

    // 3. Convert Mongoose Document to plain object so we can inject our calculated date
    const responseData = liveTimes.toObject();

    // ✅ 4. AUTOMATIC FRIDAY CALCULATION
    // getDay() returns 0 for Sunday, 1 for Monday... 5 for FRIDAY.
    const today = new Date();
    responseData.isFriday = (today.getDay() === 5);
    
    // ✅ 4. Dynamically calculate today's Hijri Date using your exact math!
    responseData.hijriDate = calculateHijriDate(hijriOffset);

    // Global is always 0 offset
    responseData.globalHijriDate = calculateHijriDate(0);

    // ✅ 6. SERVER METADATA
    responseData.serverDate = today.toISOString().split('T')[0]; 
    responseData.serverDay = today.toLocaleDateString('en-US', { weekday: 'long' });

    // 2. ✨ THE MAGIC: Generate 12-hour versions for the UI
    // We create a new field specifically for your Flutter UI
    responseData.displayTimes = {
      prayers: formatAllTo12Hour(responseData.prayers),
      specialTimes: formatAllTo12Hour(responseData.specialTimes)
    };

    // 5. Send it to Flutter
    const response = sendSuccess(responseData, 'Live prayer times fetched successfully');

    response.headers.set(
      'Cache-Control', 
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    return response;

  } catch (error: any) {
    return sendError('Failed to fetch prayer times', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}

// ----------------------------------------------------------------------
// PUT: Update the Live Prayer Times (Partial Updates Supported)
// ----------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const userContext = requireAuth(req, CAPABILITIES.WRITE_AZAN);

    await connectDB();
    const body = await req.json();

    // 1. Fetch the existing record (Singleton Pattern)
    let liveTimes = await Azan.findOne();
    if (!liveTimes) {
      // If for some reason the database is completely empty, create a blank slate
      liveTimes = new Azan(); 
    }

    // 2. Convert to 24-hour format ONLY if those specific fields were sent in the body
    if (body.prayers) {
      formatAllTimesInObject(body.prayers);
    }
    if (body.specialTimes) {
      formatAllTimesInObject(body.specialTimes);
    }

    // 3. ✨ THE FIX: Safely merge the new data into the existing data
    // .set() is a smart Mongoose function. If you only send "dailyAnnouncement", 
    // it will ONLY update that field and leave the prayer times untouched!
    liveTimes.set(body);
    
    // Save the merged document
    await liveTimes.save();

    // 4. Fetch Config to calculate the proper Hijri date for the response
    const config = await AppConfig.findOne();
    const hijriOffset = config?.prayerSettings?.hijriDateAdjustment || 0;
    
    const responseData = liveTimes.toObject();
    responseData.hijriDate = calculateHijriDate(hijriOffset);

    // 5. Audit Logging
    await logAction({
      req,
      userId: userContext.userId,
      userRole: userContext.role,
      action: AUDIT_ACTIONS.UPDATE_AZAN,
      resource: AUDIT_RESOURCES.AZAN,
      resourceId: liveTimes._id.toString(),
      details: { updatedFields: Object.keys(body) }, // Logs exactly which keys were changed
      severity: AUDIT_SEVERITY.INFO,
    });

    return sendSuccess(responseData, 'Live prayer times updated successfully', 200);

  } catch (error: any) {
    return sendError('Failed to update prayer times', 400, ERROR_CODES.VALIDATION_ERROR, error.message);
  }
}