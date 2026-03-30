/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import { sendSuccess, sendError } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/auth";
import { logAction } from "@/utils/logger";
import { getChanges } from "@/common/getChanges";
import AppConfig from "@/models/AppConfig";
import { AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY, CAPABILITIES } from "@/constants";

// GET: Your Flutter app will call this every time it opens
export async function GET(req: NextRequest) {
  try {
    // 1. Connect to the database
    await connectDB();

    // 2. Look for the configuration document
    let config = await AppConfig.findOne();

    // 3. If it doesn't exist yet (because this is our very first test!),
    // Mongoose will automatically create one using all the default values we set in the model.
    if (!config) {
      config = await AppConfig.create({});
    }

    // 4. Generate our beautiful standard success response
    const response = sendSuccess(config, "Configuration fetched successfully");

    // 5. ✨ THE MAGIC CACHE LINE ✨
    // This tells Vercel/Next.js to cache this exact JSON response at the edge for 60 seconds.
    // If 5,000 users open the app in the same minute, MongoDB is only queried ONE time!
    response.headers.set(
      'Cache-Control', 
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    return response;

  } catch (error: any) {
    // 5. Catch any database connection errors
    return sendError(
      "Failed to load configuration",
      500,
      "DB_ERROR",
      error.message,
    );
  }
}

// PUT: Your future Admin Panel will call this to update the settings
export async function PUT(req: NextRequest) {
  try {
    // 1. Authenticate user
    const userContext = requireAuth(req, CAPABILITIES.WRITE_CONFIG);

    await connectDB();
    const body = await req.json();

    // 2. Fetch old config
    const oldConfig = await AppConfig.findOne();

    // 3. Update config
    const updatedConfig = await AppConfig.findOneAndUpdate({}, body, {
      returnDocument: 'after', // Replaced "new: true"
      upsert: true,
      runValidators: true,
    });

    // 4. Convert mongoose docs → plain objects
    const oldObj = oldConfig?.toObject() || {};
    const newObj = updatedConfig?.toObject() || {};

    // 5. Get actual changes (before vs after)
    const changes = getChanges(oldObj, newObj);

    // 6. Log only if something changed
    if (Object.keys(changes).length > 0) {
      await logAction({
        req,
        userId: userContext.userId,
        userRole: userContext.role,
        action: AUDIT_ACTIONS.UPDATE_CONFIG,
        resource: AUDIT_RESOURCES.APP_CONFIG,
        resourceId: updatedConfig._id.toString(),
        details: changes,
      severity: AUDIT_SEVERITY.WARNING,
      });
    }

    return sendSuccess(updatedConfig, "Configuration updated successfully");
  } catch (error: any) {
    return sendError(
      "Failed to update configuration",
      400,
      "UPDATE_FAILED",
      error.message,
    );
  }
}
