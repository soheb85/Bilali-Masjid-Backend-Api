/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendSuccess, sendError } from "@/utils/apiResponse";
import { ROLES } from "@/constants";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { adminKey, name, email, password, mobileNumber } = await req.json();

    if (adminKey !== process.env.ADMIN_CREATION_KEY) {
      return sendError("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Check if any Super Admin already exists to prevent accidental master account resets
    const adminExists = await User.findOne({ role: ROLES.SUPER_ADMIN });
    if (adminExists) {
      return sendError("Super Admin already exists", 403, "FORBIDDEN");
    }


    if (!name || !email || !password || !mobileNumber) {
      return sendError("All fields are required", 400, "VALIDATION_ERROR");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const superAdmin = await User.create({
      name,
      email,
      mobileNumber,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      capabilities: ["*"], // The wildcard gives them power over everything
    });

    return sendSuccess(
      { email: superAdmin.email },
      "Super Admin created successfully. Delete this route now!",
    );
  } catch (error: any) {
    return sendError(
      "Failed to create admin",
      500,
      "SERVER_ERROR",
      error.message,
    );
  }
}
