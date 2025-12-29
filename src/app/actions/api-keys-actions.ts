"use server";

import { serverDb } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { decryptApiKeyServerSide, encryptServerSide } from '@/lib/encryption-server';
import type { StoredApiKeys } from '@/types/integrations';

export async function fetchCompanyApiKeysAction(companyId: string): Promise<{
  success: boolean;
  apiKeys?: Record<string, Record<string, string>>;
  error?: string;
}> {
  try {
    if (!serverDb) {
      console.error('❌ Database not initialized');
      return { success: false, error: 'Database not initialized' };
    }

    if (!companyId) {
      console.error('❌ Company ID is required');
      return { success: false, error: 'Company ID is required' };
    }

    const companyRef = doc(serverDb, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      console.error(`❌ Company ${companyId} not found`);
      return { success: false, error: 'Company not found' };
    }

    const storedKeys = (companyDoc.data().apiKeys as Record<string, any>) || {};
    const decryptedKeys: Record<string, Record<string, string>> = {};

    for (const [serviceId, serviceKeys] of Object.entries(storedKeys)) {
      if (!serviceKeys || typeof serviceKeys !== 'object') {
        console.warn(`⚠️ Invalid service keys for ${serviceId}`);
        continue;
      }

      decryptedKeys[serviceId] = {};

      for (const [fieldId, value] of Object.entries(serviceKeys as Record<string, any>)) {
        if (value === null || value === undefined) {
          continue; // Skip null/undefined values entirely
        }

        try {
          const decrypted = decryptApiKeyServerSide(value);
          if (decrypted) {
            decryptedKeys[serviceId][fieldId] = decrypted;
          }
        } catch (err) {
          console.warn(`⚠️ Failed to decrypt ${serviceId}.${fieldId}:`, err);
          // Don't set empty string - just skip this field
        }
      }

      // Remove service if no valid keys were decrypted
      if (Object.keys(decryptedKeys[serviceId]).length === 0) {
        delete decryptedKeys[serviceId];
      }
    }

    console.log(`✅ Loaded API keys for company ${companyId}:`, Object.keys(decryptedKeys));
    return { success: true, apiKeys: decryptedKeys };
  } catch (err) {
    console.error('❌ Failed to fetch API keys:', err);
    return { success: false, error: 'Failed to load API keys' };
  }
}

export async function saveApiKeysAction(
  companyId: string,
  integrationId: string,
  apiKeyData: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!serverDb) {
      return { success: false, error: 'Database not initialized' };
    }

    if (!companyId || !integrationId) {
      return { success: false, error: 'Invalid parameters' };
    }

    const companyRef = doc(serverDb, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      return { success: false, error: 'Company not found' };
    }

    const currentApiKeys = (companyDoc.data().apiKeys as Record<string, any>) || {};
    const existingIntegrationKeys = currentApiKeys[integrationId] || {};

    // Prepare the new data object for this specific integration
    // Start with existing encrypted keys to preserve any fields not being updated
    const encryptedData: Record<string, any> = { ...existingIntegrationKeys };

    // Update with new values - only update fields that are provided
    for (const [key, value] of Object.entries(apiKeyData)) {
      if (value && typeof value === 'string' && value.trim().length > 0) {
        try {
          encryptedData[key] = encryptServerSide(value.trim());
          console.log(`✅ Encrypted ${integrationId}.${key}`);
        } catch (encryptError) {
          console.error(`Failed to encrypt ${key}:`, encryptError);
          return { success: false, error: `Failed to encrypt ${key}` };
        }
      }
      // Note: We no longer delete keys when value is empty
      // This preserves existing values if user doesn't provide new ones
    }

    // Only update if we have keys to save
    if (Object.keys(encryptedData).length > 0) {
      await updateDoc(companyRef, {
        [`apiKeys.${integrationId}`]: encryptedData
      });
      console.log(`✅ API keys securely saved for ${integrationId} in company ${companyId}:`, Object.keys(encryptedData));
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to save API keys:', err);
    return { success: false, error: 'Failed to save API keys' };
  }
}
