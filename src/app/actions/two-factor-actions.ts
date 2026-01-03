'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import { generateTOTPSecret, generateTOTPUri, verifyTOTP } from '@/lib/totp';

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt?: string;
  hasBackupCodes: boolean;
}

/**
 * Get 2FA status for the current user
 */
export async function getTwoFactorStatus(idToken: string): Promise<{
  success: boolean;
  status?: TwoFactorStatus;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(idToken);
    if (!verification.success || !verification.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = adminDb.collection('users').doc(verification.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const twoFactor = userData?.twoFactor;

    return {
      success: true,
      status: {
        enabled: twoFactor?.enabled || false,
        enabledAt: twoFactor?.enabledAt,
        hasBackupCodes: (twoFactor?.backupCodes?.length || 0) > 0,
      },
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return { success: false, error: 'Failed to get 2FA status' };
  }
}

/**
 * Initialize 2FA setup - generates secret and QR code URI
 */
export async function initializeTwoFactorSetup(idToken: string): Promise<{
  success: boolean;
  data?: TwoFactorSetupData;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(idToken);
    if (!verification.success || !verification.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = adminDb.collection('users').doc(verification.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    
    // Check if 2FA is already enabled
    if (userData?.twoFactor?.enabled) {
      return { success: false, error: '2FA is already enabled' };
    }

    // Generate new secret
    const secret = generateTOTPSecret();
    const email = userData?.email || verification.uid;
    const qrCodeUri = generateTOTPUri(secret, email);

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
      ).join('')
    );

    // Store pending setup (not yet verified)
    await userRef.update({
      'twoFactor.pendingSecret': secret,
      'twoFactor.pendingBackupCodes': backupCodes,
      'twoFactor.setupInitiatedAt': new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        secret,
        qrCodeUri,
        backupCodes,
      },
    };
  } catch (error) {
    console.error('Error initializing 2FA setup:', error);
    return { success: false, error: 'Failed to initialize 2FA setup' };
  }
}

/**
 * Verify and enable 2FA
 */
export async function verifyAndEnableTwoFactor(
  idToken: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(idToken);
    if (!verification.success || !verification.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = adminDb.collection('users').doc(verification.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const pendingSecret = userData?.twoFactor?.pendingSecret;
    const pendingBackupCodes = userData?.twoFactor?.pendingBackupCodes;

    if (!pendingSecret) {
      return { success: false, error: 'No pending 2FA setup found. Please start setup again.' };
    }

    // Verify the code
    const isValid = await verifyTOTP(pendingSecret, code);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code. Please try again.' };
    }

    // Enable 2FA
    const { FieldValue } = await import('firebase-admin/firestore');
    await userRef.update({
      'twoFactor.enabled': true,
      'twoFactor.secret': pendingSecret,
      'twoFactor.backupCodes': pendingBackupCodes,
      'twoFactor.enabledAt': new Date().toISOString(),
      'twoFactor.pendingSecret': FieldValue.delete(),
      'twoFactor.pendingBackupCodes': FieldValue.delete(),
      'twoFactor.setupInitiatedAt': FieldValue.delete(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
}

/**
 * Disable 2FA (requires current code or backup code)
 */
export async function disableTwoFactor(
  idToken: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(idToken);
    if (!verification.success || !verification.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = adminDb.collection('users').doc(verification.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const twoFactor = userData?.twoFactor;

    if (!twoFactor?.enabled) {
      return { success: false, error: '2FA is not enabled' };
    }

    // Verify with TOTP code
    const isValidTOTP = await verifyTOTP(twoFactor.secret, code);
    
    // Or verify with backup code
    let isValidBackup = false;
    let usedBackupIndex = -1;
    if (!isValidTOTP && twoFactor.backupCodes) {
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      usedBackupIndex = twoFactor.backupCodes.findIndex(
        (bc: string) => bc === normalizedCode
      );
      isValidBackup = usedBackupIndex !== -1;
    }

    if (!isValidTOTP && !isValidBackup) {
      return { success: false, error: 'Invalid code. Please try again.' };
    }

    // Disable 2FA
    const { FieldValue } = await import('firebase-admin/firestore');
    await userRef.update({
      twoFactor: FieldValue.delete(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
}

/**
 * Check if user has 2FA enabled (for login flow - doesn't require auth token)
 */
export async function checkTwoFactorEnabled(
  userId: string
): Promise<{ success: boolean; enabled: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, enabled: false, error: 'Database not initialized' };
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: true, enabled: false }; // User doc doesn't exist yet, no 2FA
    }

    const userData = userDoc.data();
    const enabled = userData?.twoFactor?.enabled || false;

    return { success: true, enabled };
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return { success: false, enabled: false, error: 'Failed to check 2FA status' };
  }
}

/**
 * Verify 2FA code during login
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const twoFactor = userData?.twoFactor;

    if (!twoFactor?.enabled) {
      return { success: true }; // 2FA not enabled, allow login
    }

    // Verify with TOTP code
    const isValidTOTP = await verifyTOTP(twoFactor.secret, code);
    if (isValidTOTP) {
      return { success: true };
    }

    // Or verify with backup code
    if (twoFactor.backupCodes) {
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const usedBackupIndex = twoFactor.backupCodes.findIndex(
        (bc: string) => bc === normalizedCode
      );
      
      if (usedBackupIndex !== -1) {
        // Remove used backup code
        const updatedBackupCodes = [...twoFactor.backupCodes];
        updatedBackupCodes.splice(usedBackupIndex, 1);
        
        await userRef.update({
          'twoFactor.backupCodes': updatedBackupCodes,
        });
        
        return { success: true };
      }
    }

    return { success: false, error: 'Invalid verification code' };
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return { success: false, error: 'Failed to verify code' };
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  idToken: string,
  code: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(idToken);
    if (!verification.success || !verification.uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = adminDb.collection('users').doc(verification.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const twoFactor = userData?.twoFactor;

    if (!twoFactor?.enabled) {
      return { success: false, error: '2FA is not enabled' };
    }

    // Verify current code
    const isValid = await verifyTOTP(twoFactor.secret, code);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
      ).join('')
    );

    await userRef.update({
      'twoFactor.backupCodes': backupCodes,
      'twoFactor.backupCodesRegeneratedAt': new Date().toISOString(),
    });

    return { success: true, backupCodes };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return { success: false, error: 'Failed to regenerate backup codes' };
  }
}
