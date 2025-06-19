import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface LineWebhookBody {
  events: LineWebhookEvent[];
  destination: string;
}

export interface LineWebhookEvent {
  type: string;
  message?: LineMessage;
  postback?: {
    data: string;
    params?: any;
  };
  source: {
    type: 'group' | 'user';
    groupId?: string;
    userId: string;
  };
  timestamp: number;
  replyToken?: string;
}

export interface LineMessage {
  id: string;
  type: 'text' | 'image' | 'file' | 'location';
  text?: string;
  mention?: {
    mentionees: Array<{
      index: number;
      length: number;
      userId: string;
      type: 'user';
      isSelf: boolean;
    }>;
  };
}

export function validateSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET is not set');
    return false;
  }
  
  const hash = createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
  
  return hash === signature;
}

export function validateWebhookRequest(request: NextRequest): { 
  isValid: boolean; 
  body?: string; 
  signature?: string; 
  error?: NextResponse 
} {
  const signature = request.headers.get('x-line-signature');
  
  if (!signature) {
    return {
      isValid: false,
      error: NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    };
  }

  return {
    isValid: true,
    signature
  };
}

export async function parseWebhookBody(request: NextRequest): Promise<{
  success: boolean;
  body?: string;
  parsedBody?: LineWebhookBody;
  error?: NextResponse;
}> {
  try {
    const body = await request.text();
    
    if (!body) {
      return {
        success: false,
        error: NextResponse.json({ error: 'Empty body' }, { status: 400 })
      };
    }

    const parsedBody = JSON.parse(body) as LineWebhookBody;
    
    if (!parsedBody.events || !Array.isArray(parsedBody.events)) {
      return {
        success: false,
        error: NextResponse.json({ error: 'Invalid webhook format' }, { status: 400 })
      };
    }

    return {
      success: true,
      body,
      parsedBody
    };
  } catch (error) {
    console.error('Failed to parse webhook body:', error);
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    };
  }
}

export function createWebhookResponse(message: string, status: number = 200): NextResponse {
  return NextResponse.json({ message }, { status });
}