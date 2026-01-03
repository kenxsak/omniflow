'use server';

import { getOnboardingProgress, updateChecklistItem, skipOnboarding, completeOnboarding, setupCompanyLocale, type ChecklistItem, type OnboardingProgress } from './onboarding-actions';

export async function getOnboardingProgressAction(companyId: string): Promise<OnboardingProgress | null> {
  return getOnboardingProgress(companyId);
}

export async function updateChecklistItemAction(
  companyId: string,
  item: ChecklistItem,
  completed: boolean = true
): Promise<{ success: boolean; message: string }> {
  return updateChecklistItem(companyId, item, completed);
}

export async function skipOnboardingAction(companyId: string): Promise<{ success: boolean; message: string }> {
  return skipOnboarding(companyId);
}

export async function completeOnboardingAction(companyId: string): Promise<{ success: boolean; message: string }> {
  return completeOnboarding(companyId);
}

export async function setupCompanyLocaleAction(
  companyId: string,
  localeData: {
    country?: string;
    countryCode?: string;
    timezone?: string;
    currencyCode?: string;
    callingCode?: string;
  }
): Promise<{ success: boolean; message: string }> {
  return setupCompanyLocale(companyId, localeData);
}

// Import and re-export detection functions as async wrappers
import { 
  detectOnboardingProgress as detectProgress, 
  syncOnboardingProgress as syncProgress,
  type OnboardingDetectionResult 
} from './onboarding-detection-actions';

export type { OnboardingDetectionResult };

export async function detectOnboardingProgressAction(companyId: string): Promise<OnboardingDetectionResult | null> {
  return detectProgress(companyId);
}

export async function syncOnboardingProgressAction(companyId: string): Promise<{
  success: boolean;
  updated: ChecklistItem[];
  detection: OnboardingDetectionResult | null;
}> {
  return syncProgress(companyId);
}
