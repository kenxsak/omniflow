"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function SessionExpiredMessage() {
  const { firebaseUser, refreshAuthContext } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshAttempted, setAutoRefreshAttempted] = useState(false);

  // Auto-refresh on mount if user is logged in
  useEffect(() => {
    if (firebaseUser && !autoRefreshAttempted) {
      setAutoRefreshAttempted(true);
      handleRefresh();
    }
  }, [firebaseUser, autoRefreshAttempted]);

  const handleRefresh = async () => {
    if (!firebaseUser) {
      window.location.href = '/login';
      return;
    }

    setIsRefreshing(true);
    try {
      const freshToken = await firebaseUser.getIdToken(true);
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: freshToken }),
      });

      await refreshAuthContext();
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsRefreshing(false);
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-3 sm:p-4">
      <Card className="w-full max-w-[320px] sm:max-w-[380px]">
        <CardContent className="p-4 sm:p-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2.5 sm:p-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
            Session Expired
          </h3>
          
          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5">
            {isRefreshing 
              ? 'Refreshing your session...' 
              : 'Your session has expired. Tap below to refresh and continue.'}
          </p>
          
          {/* Button */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full h-9 sm:h-10 text-xs sm:text-sm"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Refresh Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
