/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { ApiError, Exceptions } from "./exceptions";

const JWT_SECRET =process.env.JWT_SECRET ||"Z3VhcmFudGVlZF9zZWN1cmVfand0X3NlY3JldF8yMDI2XyFAIw==";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "8f3c9a7d2b6e1f4a9c0d5e8b7a3f6c1d2e9b4a7f8c5d0e6b1a3f9c7d2e8b6a4";

export interface JwtPayload {
  userId: string;
  role: string;
  capabilities: string[];
}

// 1. Generate Token
export function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      capabilities: user.capabilities,
    },
    JWT_SECRET,
    { expiresIn: "30m" } // ⏳ 30 Minutes
  );
}

// 2. Generate the Long-Lived Refresh Token (15 days)
// Notice we only put the userId in here. It doesn't need capabilities.
export function generateRefreshToken(user: any): string {
  return jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "15d" } // ⏳ 15 Days
  );
}

// 2. Protect Routes
export function requireAuth(
  req: NextRequest,
  requiredCapability?: string,
): JwtPayload {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw Exceptions.Unauthorized("Missing or invalid token. Please log in.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (decoded.role === "USER") {
      throw Exceptions.Forbidden(
        "Users are not allowed to access this resource",
      );
    }

    // Check permissions
    if (requiredCapability) {
      const caps = decoded.capabilities || [];

      const hasPermission =
        decoded.role === "SUPER_ADMIN" ||
        caps.includes("*") ||
        caps.includes(requiredCapability);

      if (!hasPermission) {
        throw Exceptions.Forbidden(
          `You do not have permission to do this. Required: ${requiredCapability}`,
        );
      }
    }

    return decoded;
  } catch (error) {
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    throw Exceptions.Unauthorized("Token is expired or invalid.");
  }
}
