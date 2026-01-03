"use client";

/**
 * Hook for geo-detection
 * 
 * Auto-detects user's location on signup/first visit
 * Caches result in sessionStorage to avoid repeated API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { detectGeoLocation, getGeoDataForCountry, type GeoData } from '@/lib/geo-detection';

const CACHE_KEY = 'omniflow_geo_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedGeoData {
  data: GeoData;
  timestamp: number;
}

export function useGeoDetection() {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detect() {
      setIsLoading(true);
      setError(null);

      // Check cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedGeoData = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            setGeoData(parsed.data);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Ignore cache errors
      }

      // Detect from IP
      try {
        const data = await detectGeoLocation();
        if (data) {
          setGeoData(data);
          // Cache the result
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
              data,
              timestamp: Date.now(),
            }));
          } catch {
            // Ignore storage errors
          }
        } else {
          // Fallback to browser timezone detection
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setGeoData({
            country: 'Unknown',
            countryCode: 'US',
            timezone: browserTz,
            currency: 'USD',
            callingCode: '+1',
          });
        }
      } catch (err) {
        setError('Failed to detect location');
        // Set default values
        setGeoData({
          country: 'Unknown',
          countryCode: 'US',
          timezone: 'UTC',
          currency: 'USD',
          callingCode: '+1',
        });
      }

      setIsLoading(false);
    }

    detect();
  }, []);

  const updateCountry = useCallback((countryCode: string) => {
    const newData = getGeoDataForCountry(countryCode);
    setGeoData(newData);
    
    // Update cache
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newData,
        timestamp: Date.now(),
      }));
    } catch {
      // Ignore
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    geoData,
    isLoading,
    error,
    updateCountry,
    clearCache,
  };
}
