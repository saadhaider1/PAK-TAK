import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const messageSchema = z.object({
  manager: z.string().min(1, 'Manager name is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  priority: z.enum(['normal', 'high', 'urgent']).optional(),
  user_id: z.string().optional(), // Allow user_id to be passed for localStorage auth
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = messageSchema.parse(body);

    // Try to get user from session first
    let userId: string;
    try {
      const user = await requireAuth();
      userId = user.id.toString();
    } catch (authError) {
      // If session auth fails, check if user_id was provided in body
      if (validatedData.user_id) {
        userId = validatedData.user_id;

        // Verify the user exists in database
        const userExists = await db.getUserById(userId);
        if (!userExists) {
          return NextResponse.json(
            { success: false, message: 'Invalid user ID' },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: 'Authentication required. Please login.' },
          { status: 401 }
        );
      }
    }

    // Create message
    const messageId = await db.createMessage({
      user_id: userId,
      manager_name: validatedData.manager,
      subject: validatedData.subject,
      message: validatedData.message,
      priority: validatedData.priority || 'normal',
      sender_type: 'user',
      receiver_type: 'agent',
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully!',
      message_id: messageId,
      manager: validatedData.manager,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
