/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Capability from '@/models/Capability';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { logAction } from '@/utils/logger'; // ✅ Imported Logger
import { AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY, CAPABILITIES } from '@/constants';

// GET: Fetch all capabilities to draw the checkboxes in Admin Panel
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    await connectDB();
    const capabilities = await Capability.find({}).sort({ module: 1, name: 1 });

    const grouped = capabilities.reduce((acc: any, cap) => {
      if (!acc[cap.module]) acc[cap.module] = [];
      acc[cap.module].push(cap);
      return acc;
    }, {});

    return sendSuccess(grouped, 'Capabilities fetched successfully');
  } catch (error: any) {
    return sendError('Failed to fetch capabilities', 500, 'SERVER_ERROR', error.message);
  }
}

// POST: Bulk Create or Single Create Capabilities (Super Admin Only)
export async function POST(req: NextRequest) {
  try {
    // ✅ Capture the user context so we know WHO is creating the capabilities
    const userContext = requireAuth(req, CAPABILITIES.WRITE_CAPABILITIES);

    await connectDB();
    const body = await req.json();

    if (Array.isArray(body)) {
      // 1. Bulk Insert
      const newCapabilities = await Capability.insertMany(body, { ordered: false });
      
      // ✅ LOG THE BULK ACTION
      await logAction({
        req,
        userId: userContext.userId,
        userRole: userContext.role,
        action: AUDIT_ACTIONS.BULK_CREATE_CAPABILITIES,
        resource: AUDIT_RESOURCES.CAPABILITY,
        details: { 
          count: newCapabilities.length, 
          capabilitiesAdded: newCapabilities.map(c => c.name) 
        },
        severity: AUDIT_SEVERITY.WARNING, // Flagged as warning because modifying RBAC structure is sensitive
      });

      return sendSuccess(newCapabilities, 'Bulk capabilities created successfully', 201);
      
    } else {
      // 2. Single Insert
      const newCapability = await Capability.create(body);
      
      // ✅ LOG THE SINGLE ACTION
      await logAction({
        req,
        userId: userContext.userId,
        userRole: userContext.role,
        action: AUDIT_ACTIONS.CREATE_CAPABILITY,
        resource: AUDIT_RESOURCES.CAPABILITY,
        resourceId: newCapability._id.toString(),
        details: { 
          name: newCapability.name, 
          module: newCapability.module 
        },
        severity: AUDIT_SEVERITY.WARNING,
      });

      return sendSuccess(newCapability, 'Capability created successfully', 201);
    }
  } catch (error: any) {
    if (error.code === 11000) {
      return sendError('One or more capabilities already exist in the database', 409, 'CONFLICT');
    }
    return sendError('Failed to create capabilities', 400, 'VALIDATION_ERROR', error.message);
  }
}