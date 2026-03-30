/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb'; // ✅ Added DB Connection
import { messaging } from '@/lib/firebaseAdmin';
import NotificationRecord from '@/models/NotificationRecord'; // ✅ Added the new Model
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { logAction } from '@/utils/logger';
import { CAPABILITIES, ERROR_CODES, AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_SEVERITY } from '@/constants';

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check
    const userContext = requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);

    // ✅ Connect to DB because we are saving history now
    await connectDB();

    const body = await req.json();
    const { title, messageBody, imageUrl, targetScreen, targetUrl, topic } = body;

    // 2. Validation
    if (!title || !messageBody) {
      return sendError('Title and messageBody are required', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const targetTopic = topic || 'global';

    // 3. Construct the Payload
    const messagePayload = {
      topic: targetTopic,
      notification: {
        title: title,
        body: messageBody,
        ...(imageUrl && { imageUrl: imageUrl }), 
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        targetScreen: targetScreen || 'HOME',
        ...(targetUrl && { targetUrl: targetUrl }), 
      },
    };

    let responseId = "";
    let sendStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage = "";

    // 4. Send to Firebase! (Wrapped in try/catch so we can log failures)
    try {
      responseId = await messaging.send(messagePayload);
    } catch (firebaseError: any) {
      sendStatus = 'FAILED';
      errorMessage = firebaseError.message;
    }

    // ✅ 5. Save to the Notification History / Template Library
    const savedRecord = await NotificationRecord.create({
      title,
      messageBody,
      imageUrl,
      targetScreen,
      targetUrl,
      topic: targetTopic,
      firebaseMessageId: responseId,
      sentBy: userContext.userId,
      status: sendStatus,
      errorMessage: errorMessage,
    });

    // 6. Audit Log
    await logAction({
      req,
      userId: userContext.userId,
      userRole: userContext.role,
      action: AUDIT_ACTIONS.CREATE_ANNOUNCEMENT,
      resource: AUDIT_RESOURCES.ANNOUNCEMENT,
      details: { title, targetTopic, messageId: responseId, status: sendStatus },
      severity: sendStatus === 'SUCCESS' ? AUDIT_SEVERITY.INFO : AUDIT_SEVERITY.ERROR,
    });

    // 7. Return Response
    if (sendStatus === 'FAILED') {
      return sendError('Failed to send to Firebase, but failure was logged.', 500, ERROR_CODES.SERVER_ERROR, errorMessage);
    }

    return sendSuccess(savedRecord, 'Push notification broadcasted and saved to history successfully', 200);

  } catch (error: any) {
    return sendError('Failed to process push notification request', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}