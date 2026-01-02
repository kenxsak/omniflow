'use server';

import { serverDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AICallingConfig {
  enabled: boolean;
  defaultProvider: 'bland' | 'vapi';
  companyName: string;
  productService: string;
  specialOffer: string;
  defaultScript: string;
  voice: string;
  maxCallDuration: number;
  webhookEnabled: boolean;
  recordCalls: boolean;
  language: string;
}

export async function saveAICallingConfig(
  companyId: string,
  config: AICallingConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!serverDb) {
      return { success: false, error: 'Database not initialized' };
    }

    const configRef = doc(serverDb, 'companies', companyId, 'settings', 'aiCalling');
    await setDoc(configRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving AI calling config:', error);
    return { success: false, error: 'Failed to save configuration' };
  }
}

export async function getAICallingConfig(
  companyId: string
): Promise<{ success: boolean; config?: Partial<AICallingConfig>; error?: string }> {
  try {
    if (!serverDb) {
      return { success: false, error: 'Database not initialized' };
    }

    const configRef = doc(serverDb, 'companies', companyId, 'settings', 'aiCalling');
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      return { success: true, config: configDoc.data() as Partial<AICallingConfig> };
    }

    return { success: true, config: {} };
  } catch (error) {
    console.error('Error getting AI calling config:', error);
    return { success: false, error: 'Failed to load configuration' };
  }
}
