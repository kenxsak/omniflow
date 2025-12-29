/**
 * Buffer OAuth Callback - Handle authorization response
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeBufferCode, getBufferUser } from '@/lib/buffer-api';
import { serverDb } from '@/lib/firebase-server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseRedirect = '/settings/connected-accounts';

  // Handle errors from Buffer
  if (error) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=${error}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=missing_params`, request.url));
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('buffer_oauth_state')?.value;
  
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=invalid_state`, request.url));
  }

  // Parse state to get company ID
  let companyId: string;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    companyId = stateData.companyId;
    
    // Check if state is expired (10 minutes)
    if (Date.now() - stateData.timestamp > 600000) {
      return NextResponse.redirect(new URL(`${baseRedirect}?error=state_expired`, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=invalid_state`, request.url));
  }

  // Exchange code for token
  const clientId = process.env.BUFFER_CLIENT_ID;
  const clientSecret = process.env.BUFFER_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=buffer_not_configured`, request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniflow-xi.vercel.app';
  const redirectUri = `${appUrl}/api/auth/buffer/callback`;

  const tokenResult = await exchangeBufferCode(code, clientId, clientSecret, redirectUri);
  
  if ('error' in tokenResult) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=token_exchange_failed`, request.url));
  }

  // Get user info and profiles
  const userResult = await getBufferUser(tokenResult.access_token);
  
  if ('error' in userResult) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=user_fetch_failed`, request.url));
  }

  // Store Buffer connection in Firestore
  if (!serverDb) {
    return NextResponse.redirect(new URL(`${baseRedirect}?error=database_error`, request.url));
  }

  try {
    // Store the Buffer connection
    const bufferConnectionRef = doc(serverDb, 'bufferConnections', companyId);
    await setDoc(bufferConnectionRef, {
      companyId,
      bufferId: userResult.id,
      bufferName: userResult.name,
      bufferEmail: userResult.email,
      bufferPlan: userResult.plan,
      accessToken: tokenResult.access_token, // In production, encrypt this
      profileCount: userResult.profiles.length,
      profiles: userResult.profiles.map(p => ({
        id: p.id,
        service: p.service,
        formattedService: p.formatted_service,
        username: p.formatted_username,
        avatar: p.avatar,
      })),
      connectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Clear the state cookie
    cookieStore.delete('buffer_oauth_state');

    return NextResponse.redirect(new URL(`${baseRedirect}?success=buffer_connected&profiles=${userResult.profiles.length}`, request.url));
  } catch (err) {
    console.error('Error storing Buffer connection:', err);
    return NextResponse.redirect(new URL(`${baseRedirect}?error=storage_failed`, request.url));
  }
}
