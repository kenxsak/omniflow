"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { fetchCompanyApiKeysAction } from '@/app/actions/api-keys-actions';
import type { StoredApiKeys } from '@/types/integrations';

interface UseCompanyApiKeysReturn {
  apiKeys: StoredApiKeys | null;
  isLoading: boolean;
  error: string | null;
  companyName: string | null;
  refetch: () => Promise<void>;
}

export function useCompanyApiKeys(): UseCompanyApiKeysReturn {
  const { appUser, company } = useAuth();
  const [apiKeys, setApiKeys] = useState<StoredApiKeys | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!appUser?.companyId) {
      setIsLoading(false);
      setApiKeys(null);
      setCompanyName(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use server action to fetch and decrypt API keys
      const result = await fetchCompanyApiKeysAction(appUser.companyId);
      
      if (result.success && result.apiKeys) {
        setApiKeys(result.apiKeys as StoredApiKeys);
      } else {
        console.warn('Failed to fetch API keys:', result.error);
        setApiKeys(null);
      }
      
      // Set company name from auth context
      setCompanyName(company?.name || null);

    } catch (err) {
      console.error('Failed to fetch company API keys:', err);
      setApiKeys(null);
    } finally {
      setIsLoading(false);
    }
  }, [appUser?.companyId, company?.name]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return {
    apiKeys,
    isLoading,
    error,
    companyName,
    refetch: fetchApiKeys,
  };
}
