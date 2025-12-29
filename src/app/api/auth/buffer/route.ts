/**
 * Buffer OAuth - Initiate authorization
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBufferOAuthUrl } from '@/lib/buffer-api';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.redirect(new URL('/settings/connected-accounts?error=missing_company', request.url));
  }

  const clientId = process.env.BUFFER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/settings/connected-accounts?error=buffer_not_configured', request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniflow-xi.vercel.app';
  const redirectUri = `${appUrl}/api/auth/buffer/callback`;
  
  // Create state with company ID for security
  const state = Buffer.from(JSON.stringify({ companyId, timestamp: Date.now() })).toString('base64');
  
  // Store state in cookie for verification
  const cookieStore = await cookies();
  cookieStore.set('buffer_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  const authUrl = getBufferOAuthUrl(clientId, redirectUri, state);
  return NextResponse.redirect(authUrl);
}
