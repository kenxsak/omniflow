import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Twitter/X OAuth 2.0 - Initiate flow
 * GET /api/auth/social/twitter?companyId=xxx
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

  if (!TWITTER_CLIENT_ID) {
    return NextResponse.json({ error: 'Twitter App not configured' }, { status: 500 });
  }

  const redirectUri = `${BASE_URL}/api/auth/social/twitter`;
  const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');

  // Store companyId in state for callback
  const oauthState = Buffer.from(JSON.stringify({ companyId })).toString('base64');

  // Twitter OAuth 2.0 with PKCE
  const codeChallenge = 'challenge'; // In production, generate proper PKCE challenge

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${oauthState}&code_challenge=${codeChallenge}&code_challenge_method=plain`;

  return NextResponse.redirect(authUrl);
}

async function handleCallback(code: string, state: string | null) {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=not_configured`);
  }

  try {
    // Decode state to get companyId
    let companyId = '';
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      companyId = decoded.companyId;
    }

    const redirectUri = `${BASE_URL}/api/auth/social/twitter`;

    // Exchange code for access token
    const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: 'challenge', // Must match code_challenge
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Twitter token error:', tokenData.error);
      return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const userData = await userResponse.json();

    // Store token data in a secure cookie for the frontend to process
    const cookieStore = await cookies();
    cookieStore.set('twitter_oauth_data', JSON.stringify({
      accessToken,
      refreshToken,
      userId: userData.data?.id,
      username: userData.data?.username,
      name: userData.data?.name,
      companyId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300, // 5 minutes
      path: '/',
    });

    return NextResponse.redirect(`${BASE_URL}/social-media/planner?oauth=twitter&success=true`);
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/social-media/planner?error=oauth_failed`);
  }
}
