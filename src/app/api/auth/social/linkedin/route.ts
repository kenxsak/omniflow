import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * LinkedIn OAuth - Initiate flow
 * GET /api/auth/social/linkedin?companyId=xxx
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // If we have a code, this is the callback
  if (code) {
    return handleCallback(code, state);
  }

  // Otherwise, initiate OAuth flow
  if (!companyId) {
    return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
  }

  if (!LINKEDIN_CLIENT_ID) {
    return NextResponse.json({ error: 'LinkedIn App not configured' }, { status: 500 });
  }

  const redirectUri = `${BASE_URL}/api/auth/social/linkedin`;
  const scopes = ['r_liteprofile', 'w_member_social'].join(' ');

  // Store companyId in state for callback
  const oauthState = Buffer.from(JSON.stringify({ companyId })).toString('base64');

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${oauthState}`;

  return NextResponse.redirect(authUrl);
}

async function handleCallback(code: string, state: string | null) {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=not_configured`);
  }

  try {
    // Decode state to get companyId
    let companyId = '';
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      companyId = decoded.companyId;
    }

    const redirectUri = `${BASE_URL}/api/auth/social/linkedin`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('LinkedIn token error:', tokenData.error);
      return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const profileData = await profileResponse.json();

    // Store token data in a secure cookie for the frontend to process
    const cookieStore = await cookies();
    cookieStore.set('linkedin_oauth_data', JSON.stringify({
      accessToken,
      userId: profileData.id,
      firstName: profileData.localizedFirstName,
      lastName: profileData.localizedLastName,
      companyId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300, // 5 minutes
      path: '/',
    });

    return NextResponse.redirect(`${BASE_URL}/social-media/planner?oauth=linkedin&success=true`);
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=oauth_failed`);
  }
}
