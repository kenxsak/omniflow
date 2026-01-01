'use server';

import { adminDb } from '@/lib/firebase-admin';

export interface AIVoiceWidgetConfig {
  enabled: boolean;
  embedCode: string;
  position: 'bottom-right' | 'bottom-left';
  welcomeMessage: string;
  primaryColor: string;
}

export interface AIVoiceWidgetSettings {
  salesWidget: AIVoiceWidgetConfig;
  supportWidget: AIVoiceWidgetConfig;
  updatedAt?: string;
  updatedBy?: string;
}

const SETTINGS_DOC_ID = 'ai-voice-widgets';

/**
 * Get AI Voice Widget settings from Firestore
 */
export async function getAIVoiceWidgetSettings(): Promise<{ success: boolean; settings?: AIVoiceWidgetSettings; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not initialized' };
    }
    
    const docRef = adminDb.collection('platformSettings').doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Return default settings if none exist
      return {
        success: true,
        settings: {
          salesWidget: {
            enabled: false,
            embedCode: '',
            position: 'bottom-right',
            welcomeMessage: 'Hi! I\'m your AI sales assistant. How can I help you learn about OmniFlow today?',
            primaryColor: '#7c3aed',
          },
          supportWidget: {
            enabled: false,
            embedCode: '',
            position: 'bottom-right',
            welcomeMessage: 'Hello! I\'m here to help you with any questions about using OmniFlow.',
            primaryColor: '#3b82f6',
          },
        },
      };
    }
    
    return {
      success: true,
      settings: doc.data() as AIVoiceWidgetSettings,
    };
  } catch (error) {
    console.error('Error getting AI voice widget settings:', error);
    return { success: false, error: 'Failed to load settings' };
  }
}

/**
 * Save AI Voice Widget settings to Firestore
 */
export async function saveAIVoiceWidgetSettings(
  settings: AIVoiceWidgetSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not initialized' };
    }
    
    const docRef = adminDb.collection('platformSettings').doc(SETTINGS_DOC_ID);
    
    await docRef.set({
      ...settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving AI voice widget settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

/**
 * Get only the sales widget settings (for public pages)
 */
export async function getSalesWidgetSettings(): Promise<{ enabled: boolean; embedCode: string }> {
  try {
    const result = await getAIVoiceWidgetSettings();
    if (result.success && result.settings) {
      return {
        enabled: result.settings.salesWidget.enabled,
        embedCode: result.settings.salesWidget.embedCode,
      };
    }
    return { enabled: false, embedCode: '' };
  } catch (error) {
    return { enabled: false, embedCode: '' };
  }
}

/**
 * Get only the support widget settings (for help center)
 */
export async function getSupportWidgetSettings(): Promise<{ enabled: boolean; embedCode: string }> {
  try {
    const result = await getAIVoiceWidgetSettings();
    if (result.success && result.settings) {
      return {
        enabled: result.settings.supportWidget.enabled,
        embedCode: result.settings.supportWidget.embedCode,
      };
    }
    return { enabled: false, embedCode: '' };
  } catch (error) {
    return { enabled: false, embedCode: '' };
  }
}
