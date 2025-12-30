'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Helper to check if mobile
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper to check notification permission
export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
};

// Send browser notification
export const sendBrowserNotification = (title: string, body: string, options?: NotificationOptions) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    });
  }
  return null;
};

interface NotifyOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  // If true, will also send browser notification on mobile
  pushOnMobile?: boolean;
  // If true, will send browser notification on all devices
  pushAlways?: boolean;
}

export function useNotifications() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback(({ title, description, variant = 'default', pushOnMobile = true, pushAlways = false }: NotifyOptions) => {
    // Always show toast
    toast({
      title,
      description,
      variant,
    });

    // Send browser notification if conditions are met
    const shouldPush = pushAlways || (pushOnMobile && isMobileDevice());
    if (shouldPush && permission === 'granted') {
      sendBrowserNotification(title, description);
    }
  }, [toast, permission]);

  // Convenience methods
  const success = useCallback((title: string, description: string, pushOnMobile = true) => {
    notify({ title: `✅ ${title}`, description, pushOnMobile });
  }, [notify]);

  const error = useCallback((title: string, description: string, pushOnMobile = false) => {
    notify({ title: `❌ ${title}`, description, variant: 'destructive', pushOnMobile });
  }, [notify]);

  const info = useCallback((title: string, description: string, pushOnMobile = true) => {
    notify({ title: `ℹ️ ${title}`, description, pushOnMobile });
  }, [notify]);

  const warning = useCallback((title: string, description: string, pushOnMobile = true) => {
    notify({ title: `⚠️ ${title}`, description, pushOnMobile });
  }, [notify]);

  return {
    notify,
    success,
    error,
    info,
    warning,
    permission,
    requestPermission,
    isMobile: isMobileDevice(),
  };
}
