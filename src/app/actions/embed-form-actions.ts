'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';

/**
 * Generate a unique access key for embed forms
 */
function generateAccessKey(): string {
  // Generate a 32-character hex string (similar to Web3Forms format)
  return randomBytes(16).toString('hex');
}

/**
 * Get the company's embed access key
 */
export async function getEmbedAccessKey(idToken: string): Promise<{
  success: boolean;
  accessKey?: string;
  error?: string;
}> {
  try {
    const authResult = await verifyAuthToken(idToken);
    if (!authResult.success || !authResult.uid) {
      return { success: false, error: 'Authentication failed' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Get user's company
    const userDoc = await adminDb.collection('users').doc(authResult.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.companyId) {
      return { success: false, error: 'No company associated with user' };
    }

    // Get company's access key
    const companyDoc = await adminDb.collection('companies').doc(userData.companyId).get();
    const companyData = companyDoc.data();

    if (companyData?.embedAccessKey) {
      return { success: true, accessKey: companyData.embedAccessKey };
    }

    return { success: true, accessKey: undefined };
  } catch (error) {
    console.error('Error getting embed access key:', error);
    return { success: false, error: 'Failed to get access key' };
  }
}

/**
 * Generate a new embed access key for the company
 */
export async function generateEmbedAccessKey(idToken: string): Promise<{
  success: boolean;
  accessKey?: string;
  error?: string;
}> {
  try {
    const authResult = await verifyAuthToken(idToken);
    if (!authResult.success || !authResult.uid) {
      return { success: false, error: 'Authentication failed' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Get user's company
    const userDoc = await adminDb.collection('users').doc(authResult.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.companyId) {
      return { success: false, error: 'No company associated with user' };
    }

    // Check if user is admin
    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      return { success: false, error: 'Only admins can generate access keys' };
    }

    // Generate new access key
    const accessKey = generateAccessKey();

    // Save to company
    await adminDb.collection('companies').doc(userData.companyId).update({
      embedAccessKey: accessKey,
      embedAccessKeyGeneratedAt: new Date().toISOString(),
      embedAccessKeyGeneratedBy: authResult.uid,
    });

    console.log('✅ Embed access key generated for company:', userData.companyId);

    return { success: true, accessKey };
  } catch (error) {
    console.error('Error generating embed access key:', error);
    return { success: false, error: 'Failed to generate access key' };
  }
}

/**
 * Revoke the embed access key (for security)
 */
export async function revokeEmbedAccessKey(idToken: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const authResult = await verifyAuthToken(idToken);
    if (!authResult.success || !authResult.uid) {
      return { success: false, error: 'Authentication failed' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Get user's company
    const userDoc = await adminDb.collection('users').doc(authResult.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.companyId) {
      return { success: false, error: 'No company associated with user' };
    }

    // Check if user is admin
    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      return { success: false, error: 'Only admins can revoke access keys' };
    }

    // Remove access key
    await adminDb.collection('companies').doc(userData.companyId).update({
      embedAccessKey: null,
      embedAccessKeyRevokedAt: new Date().toISOString(),
      embedAccessKeyRevokedBy: authResult.uid,
    });

    console.log('✅ Embed access key revoked for company:', userData.companyId);

    return { success: true };
  } catch (error) {
    console.error('Error revoking embed access key:', error);
    return { success: false, error: 'Failed to revoke access key' };
  }
}
