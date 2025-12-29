'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { WhiteLabelSettings } from '@/types/saas';

/**
 * Get white-label settings for a company
 */
export async function getWhiteLabelSettings(companyId: string): Promise<{
  success: boolean;
  settings?: WhiteLabelSettings;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    
    if (!companyDoc.exists) {
      return { success: false, error: 'Company not found' };
    }

    const companyData = companyDoc.data();
    const settings = companyData?.whiteLabelSettings as WhiteLabelSettings | undefined;

    return {
      success: true,
      settings: settings || {
        enabled: false,
        brandName: '',
        primaryColor: '#6366f1',
        primaryForeground: '#ffffff',
        accentColor: '#8b5cf6',
      },
    };
  } catch (error) {
    console.error('Error getting white-label settings:', error);
    return { success: false, error: 'Failed to get settings' };
  }
}

/**
 * Save white-label settings for a company
 */
export async function saveWhiteLabelSettings(
  companyId: string,
  userId: string,
  settings: WhiteLabelSettings
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    // Validate required fields
    if (settings.enabled && !settings.brandName?.trim()) {
      return { success: false, error: 'Brand name is required when white-label is enabled' };
    }

    // Validate color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (settings.primaryColor && !hexColorRegex.test(settings.primaryColor)) {
      return { success: false, error: 'Invalid primary color format. Use hex format (e.g., #6366f1)' };
    }

    // Update company document with white-label settings
    const updatedSettings: WhiteLabelSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await adminDb.collection('companies').doc(companyId).update({
      whiteLabelSettings: updatedSettings,
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving white-label settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

/**
 * Upload a white-label asset (logo, favicon, etc.)
 * Uses base64 data URL storage for simplicity (works without Firebase Storage)
 */
export async function uploadWhiteLabelAsset(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const type = formData.get('type') as 'logo' | 'logoDark' | 'favicon';

    if (!file || !companyId || !type) {
      return { success: false, error: 'Missing required fields' };
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Allowed: PNG, JPEG, SVG, ICO, WebP' };
    }

    // Validate file size (max 500KB for data URL storage)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 500KB' };
    }

    // Convert File to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Store the data URL directly in the company document
    const fieldMap: Record<string, string> = {
      logo: 'whiteLabelSettings.logoUrl',
      logoDark: 'whiteLabelSettings.logoDarkUrl',
      favicon: 'whiteLabelSettings.faviconUrl',
    };

    await adminDb.collection('companies').doc(companyId).update({
      [fieldMap[type]]: dataUrl,
      'whiteLabelSettings.updatedAt': new Date().toISOString(),
    });

    return { success: true, url: dataUrl };
  } catch (error) {
    console.error('Error uploading white-label asset:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}

/**
 * Get white-label settings by custom domain (for multi-tenant routing)
 */
export async function getWhiteLabelByDomain(domain: string): Promise<{
  success: boolean;
  companyId?: string;
  settings?: WhiteLabelSettings;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    // Query companies with matching custom domain
    const snapshot = await adminDb
      .collection('companies')
      .where('whiteLabelSettings.customDomain', '==', domain)
      .where('whiteLabelSettings.customDomainVerified', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Domain not found' };
    }

    const doc = snapshot.docs[0];
    const companyData = doc.data();

    return {
      success: true,
      companyId: doc.id,
      settings: companyData.whiteLabelSettings as WhiteLabelSettings,
    };
  } catch (error) {
    console.error('Error getting white-label by domain:', error);
    return { success: false, error: 'Failed to get settings' };
  }
}
