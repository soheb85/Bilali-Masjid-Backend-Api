/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { messaging } from '@/lib/firebaseAdmin';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { logAction } from '@/utils/logger';
import { CAPABILITIES, ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY } from '@/constants';

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check: Only admins with Announcement permissions can send Push Notifications
    const userContext = requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);

    const body = await req.json();
    const { title, messageBody, imageUrl, targetScreen, targetUrl, topic } = body;

    // 2. Validation
    if (!title || !messageBody) {
      return sendError('Title and messageBody are required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 3. Construct the Payload
    // We use a default 'global' topic, but allow the admin to specify others (e.g., 'committee_members')
    const targetTopic = topic || 'global';

    const messagePayload = {
      topic: targetTopic,
      notification: {
        title: title,
        body: messageBody,
        ...(imageUrl && { imageUrl: imageUrl }), // If there is an image, attach it!
      },
      data: {
        // This is hidden data the Flutter app reads when the user taps the notification
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        targetScreen: targetScreen || 'HOME',
        ...(targetUrl && { targetUrl: targetUrl }), // Useful if you want to open a YouTube link
      },
    };

    // 4. Send to Firebase!
    const responseId = await messaging.send(messagePayload);

    // 5. Audit Log (So you know exactly which Admin sent the message)
    await logAction({
      req,
      userId: userContext.userId,
      userRole: userContext.role,
      action: AUDIT_ACTIONS.CREATE_ANNOUNCEMENT, // Reusing this action constant
      resource: AUDIT_RESOURCES.ANNOUNCEMENT,
      details: { title, targetTopic, messageId: responseId },
      severity: AUDIT_SEVERITY.INFO,
    });

    // 6. Return the Firebase Receipt to Postman
    return sendSuccess({ messageId: responseId }, 'Push notification broadcasted successfully', 200);

  } catch (error: any) {
    return sendError('Failed to send push notification', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}