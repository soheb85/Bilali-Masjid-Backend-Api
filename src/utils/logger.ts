/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import AuditLog from "@/models/AuditLog";

interface LogParams {
  req?: NextRequest;
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  severity?: "INFO" | "WARNING" | "CRITICAL"; // ✅ Added to interface
}

export async function logAction({
  req,
  userId,
  userRole,
  action,
  resource,
  resourceId,
  details = {},
  severity = "INFO", // ✅ Default is INFO
}: LogParams) {
  try {
    let ipAddress = "unknown";
    let userAgent = "unknown";

    if (req) {
      const forwarded = req.headers.get("x-forwarded-for");
      ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";
      userAgent = req.headers.get("user-agent") || "unknown";
    }

    await AuditLog.create({
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity, // ✅ Added to database creation
    });
  } catch (error) {
    console.error("CRITICAL: Failed to write to Audit Log", error);
  }
}
