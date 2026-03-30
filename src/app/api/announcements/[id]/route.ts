/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { CAPABILITIES, ERROR_CODES } from '@/constants';

// Update a Banner
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // ✅ Changed to Promise
) {
  try {
    requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);
    await connectDB();

    // ✅ Await the params before extracting the ID
    const resolvedParams = await params;
    const body = await req.json();
    
    const updated = await Announcement.findByIdAndUpdate(
      resolvedParams.id, 
      body, 
      { new: true }
    );

    if (!updated) return sendError('Banner not found', 404, ERROR_CODES.NOT_FOUND);
    return sendSuccess(updated, 'Banner updated successfully');
  } catch (error: any) {
    return sendError('Update failed', 400, ERROR_CODES.VALIDATION_ERROR, error.message);
  }
}

// Delete a Banner
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // ✅ Changed to Promise
) {
  try {
    requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);
    await connectDB();

    // ✅ Await the params before extracting the ID
    const resolvedParams = await params;

    const deleted = await Announcement.findByIdAndDelete(resolvedParams.id);
    if (!deleted) return sendError('Banner not found', 404, ERROR_CODES.NOT_FOUND);
    
    return sendSuccess(null, 'Banner deleted successfully');
  } catch (error: any) {
    return sendError('Delete failed', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}