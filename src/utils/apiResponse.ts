/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

// Standard Success Shape
export function sendSuccess<T>(
  data: T, 
  message: string = 'Success', 
  statusCode: number = 200,
  meta?: Record<string, any> // NEW: Optional metadata for pagination, etc.
) {
  return NextResponse.json(
    {
      success: true,
      statusCode,
      message,
      data,
      meta: {
        ...meta,
        serverTime: new Date().toISOString(), // NEW: Crucial for Flutter clock-sync
      }
    },
    { status: statusCode }
  );
}

// Standard Error Shape
export function sendError(
  message: string, 
  statusCode: number = 500, 
  errorCode?: string, 
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      statusCode,
      error: {
        code: errorCode || 'INTERNAL_SERVER_ERROR',
        message,
        // Hide technical details in production to prevent security leaks
        details: process.env.NODE_ENV === 'development' ? details : undefined, 
      },
      meta: {
        serverTime: new Date().toISOString(), // Helps track exactly when the error happened
      }
    },
    { status: statusCode }
  );
}