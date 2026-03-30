/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User'; // Required so Mongoose knows how to populate the userId
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { CAPABILITIES } from '@/constants';

export async function GET(req: NextRequest) {
  try {
    // 1. Security check: Only users with the 'read:auditlogs' capability can view this
    requireAuth(req, CAPABILITIES.READ_AUDITLOGS);

    await connectDB();

    // 2. Parse URL Search Parameters for Pagination and Filtering
    const { searchParams } = new URL(req.url);
    
    // Pagination defaults: page 1, 20 items per page
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 3. Build the dynamic query object based on what the frontend asked for
    const query: any = {};

    const action = searchParams.get('action');
    if (action) query.action = action;

    const resource = searchParams.get('resource');
    if (resource) query.resource = resource;

    const severity = searchParams.get('severity');
    if (severity) query.severity = severity;

    const userId = searchParams.get('userId');
    if (userId) query.userId = userId;

    // 4. Fetch the logs and count the total (for frontend pagination UI)
    // We use Promise.all to run both database queries at the exact same time for speed
    const [logs, totalDocs] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 }) // Newest logs first
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role'), // This replaces the raw ID with the actual user's name!
      
      AuditLog.countDocuments(query)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalDocs / limit);

    // 5. Send response with attached metadata
    return sendSuccess(
      logs, 
      'Audit logs fetched successfully', 
      200, 
      {
        pagination: {
          total: totalDocs,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        }
      }
    );

  } catch (error: any) {
    return sendError('Failed to fetch audit logs', 500, 'SERVER_ERROR', error.message);
  }
}