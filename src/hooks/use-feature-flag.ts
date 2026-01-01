
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getCompany, getStoredPlans, getStoredFeatures } from '@/lib/saas-data';
import type { Company, Plan, Feature } from '@/types/saas';
import type { PlanTier } from '@/lib/menu-config';

// A simple in-memory cache to avoid repeated DB lookups for the same feature flag within a session.
const featureFlagsCache = new Map<string, boolean>();
const featureStateCache = new Map<string, FeatureState>();

/**
 * Feature state for locked feature display
 */
export interface FeatureState {
    isEnabled: boolean;
    isLocked: boolean;
    currentPlan: PlanTier;
    minPlan?: PlanTier;
}

/**
 * Map plan IDs to plan tiers
 * Handles various plan ID formats: plan_enterprise, Enterprise, enterprise, etc.
 */
function getPlanTier(planId: string): PlanTier {
    const normalizedId = planId.toLowerCase();
    
    // Check for enterprise first (highest tier)
    if (normalizedId.includes('enterprise') || normalizedId.includes('business')) {
        return 'enterprise';
    }
    // Check for pro/professional
    if (normalizedId.includes('pro') || normalizedId.includes('professional') || normalizedId.includes('growth')) {
        return 'pro';
    }
    // Check for starter/basic
    if (normalizedId.includes('starter') || normalizedId.includes('basic')) {
        return 'starter';
    }
    // Default to free
    return 'free';
}

export const useFeatureFlag = () => {
    const { appUser } = useAuth();
    const [dataVersion, setDataVersion] = useState(0);

    const refreshData = useCallback(() => {
        featureFlagsCache.clear();
        featureStateCache.clear();
        setDataVersion(v => v + 1);
    }, []);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'omniFlowSaasPlans' || event.key === 'omniFlowSaasFeatures' || event.key === 'omniFlowSaasCompanies') {
                refreshData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [refreshData]);

    const isFeatureEnabled = useCallback(async (featureId: string): Promise<boolean> => {
        // Super Admins have all features enabled by default.
        if (appUser?.role === 'superadmin') {
            return true;
        }

        if (!appUser?.companyId) {
            return false;
        }

        const cacheKey = `${appUser.companyId}-${featureId}-${dataVersion}`;
        if (featureFlagsCache.has(cacheKey)) {
            return featureFlagsCache.get(cacheKey) as boolean;
        }
        
        // Asynchronous check against Firestore data
        try {
            const userCompany = await getCompany(appUser.companyId);
            if (!userCompany) {
                return false;
            }

            const allPlans = await getStoredPlans();
            const companyPlan = allPlans.find(p => p.id === userCompany.planId);
            if (!companyPlan) {
                return false;
            }
            
            const allFeatures = await getStoredFeatures();
            const masterFeature = allFeatures.find(f => f.id === featureId);
            if (!masterFeature || !masterFeature.active) {
                return false;
            }
            
            const finalIsEnabled = companyPlan.featureIds.includes(featureId);
            featureFlagsCache.set(cacheKey, finalIsEnabled);
            return finalIsEnabled;

        } catch (e) {
            console.error("Error checking feature flag:", e);
            return false;
        }

    }, [appUser, dataVersion]);

    /**
     * Get detailed feature state including locked status
     * Used for showing locked features with upgrade prompts
     */
    const getFeatureState = useCallback(async (
        featureId: string,
        minPlan?: PlanTier
    ): Promise<FeatureState> => {
        // Super Admins have all features enabled
        if (appUser?.role === 'superadmin') {
            return {
                isEnabled: true,
                isLocked: false,
                currentPlan: 'enterprise',
            };
        }

        if (!appUser?.companyId) {
            return {
                isEnabled: false,
                isLocked: true,
                currentPlan: 'free',
                minPlan,
            };
        }

        const cacheKey = `state-${appUser.companyId}-${featureId}-${minPlan}-${dataVersion}`;
        if (featureStateCache.has(cacheKey)) {
            return featureStateCache.get(cacheKey) as FeatureState;
        }

        try {
            const userCompany = await getCompany(appUser.companyId);
            if (!userCompany) {
                const state: FeatureState = {
                    isEnabled: false,
                    isLocked: true,
                    currentPlan: 'free',
                    minPlan,
                };
                featureStateCache.set(cacheKey, state);
                return state;
            }

            const allPlans = await getStoredPlans();
            const companyPlan = allPlans.find(p => p.id === userCompany.planId);
            const currentPlan = companyPlan ? getPlanTier(companyPlan.id) : 'free';

            if (!companyPlan) {
                const state: FeatureState = {
                    isEnabled: false,
                    isLocked: true,
                    currentPlan: 'free',
                    minPlan,
                };
                featureStateCache.set(cacheKey, state);
                return state;
            }

            const allFeatures = await getStoredFeatures();
            const masterFeature = allFeatures.find(f => f.id === featureId);
            
            // Feature doesn't exist or is inactive
            if (!masterFeature || !masterFeature.active) {
                const state: FeatureState = {
                    isEnabled: false,
                    isLocked: true,
                    currentPlan,
                    minPlan,
                };
                featureStateCache.set(cacheKey, state);
                return state;
            }

            const isEnabled = companyPlan.featureIds.includes(featureId);
            const state: FeatureState = {
                isEnabled,
                isLocked: !isEnabled,
                currentPlan,
                minPlan,
            };
            
            featureStateCache.set(cacheKey, state);
            return state;

        } catch (e) {
            console.error("Error getting feature state:", e);
            return {
                isEnabled: false,
                isLocked: true,
                currentPlan: 'free',
                minPlan,
            };
        }
    }, [appUser, dataVersion]);

    /**
     * Get the current user's plan tier
     */
    const getCurrentPlan = useCallback(async (): Promise<PlanTier> => {
        if (appUser?.role === 'superadmin') {
            return 'enterprise';
        }

        if (!appUser?.companyId) {
            return 'free';
        }

        try {
            const userCompany = await getCompany(appUser.companyId);
            if (!userCompany) return 'free';

            return getPlanTier(userCompany.planId);
        } catch (e) {
            console.error("Error getting current plan:", e);
            return 'free';
        }
    }, [appUser]);

    return { isFeatureEnabled, getFeatureState, getCurrentPlan, refreshData };
};
