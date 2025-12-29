import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Facebook OAuth - Initiate flow
 * GET /api/auth/social/facebook?companyId=xxx
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

  if (!FACEBOOK_APP_ID) {
    return NextResponse.json({ error: 'Facebook App not configured' }, { status: 500 });
  }

  const redirectUri = `${BASE_URL}/api/auth/social/facebook`;
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',');

  // Store companyId in state for callback
  const oauthState = Buffer.from(JSON.stringify({ companyId })).toString('base64');

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${oauthState}&response_type=code`;

  return NextResponse.redirect(authUrl);
}

async function handleCallback(code: string, state: string | null) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=not_configured`);
  }

  try {
    // Decode state to get companyId
    let companyId = '';
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      companyId = decoded.companyId;
    }

    const redirectUri = `${BASE_URL}/api/auth/social/facebook`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Facebook token error:', tokenData.error);
      return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    // Store token data in a secure cookie for the frontend to process
    const cookieStore = await cookies();
    cookieStore.set('fb_oauth_data', JSON.stringify({
      accessToken,
      pages: pagesData.data || [],
      companyId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300, // 5 minutes
      path: '/',
    });

    // Redirect to page selection
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?oauth=facebook&success=true`);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=oauth_failed`);
  }
}
