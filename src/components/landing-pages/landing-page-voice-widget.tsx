'use client';

import { useEffect, useState } from 'react';
import { getVoiceChatConfigByUserId } from '@/app/actions/voice-chat-actions';

interface LandingPageVoiceWidgetProps {
  enabled: boolean;
  greeting?: string;
  position?: 'left' | 'right';
  primaryColor: string;
  pageName: string;
  pageId: string;
  userId: string;
}

export default function LandingPageVoiceWidget({
  enabled,
  greeting,
  position = 'right',
  primaryColor,
  pageName,
  pageId,
  userId,
}: LandingPageVoiceWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [companyConfig, setCompanyConfig] = useState<any>(null);

  useEffect(() => {
    async function loadCompanyConfig() {
      if (!enabled) {
        setIsLoading(false);
        return;
      }

      if (!userId) {
        console.log('No userId provided for Voice Chat widget');
        setIsLoading(false);
        return;
      }

      try {
        // Use the new function that looks up companyId from userId
        const result = await getVoiceChatConfigByUserId(userId);
        
        if (result && result.success && result.config?.enabled) {
          setCompanyConfig(result.config);
          console.log('✅ Voice Chat AI config loaded for landing page');
        } else {
          console.log('Voice Chat AI not configured:', result.message || 'No config found');
        }
      } catch (error) {
        console.error('Error loading Voice Chat config:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanyConfig();
  }, [userId, enabled]);

  useEffect(() => {
    if (isLoading || !companyConfig?.widgetScript) {
      return;
    }

    console.log('🎤 Loading Voice Chat AI widget for landing page:', pageId);

    const defaultGreeting = greeting || `Hi! Welcome to ${pageName}. How can I help you today?`;

    // Set global config for the widget
    (window as any).OmniFlowVoiceChat = {
      pageId: pageId,
      pageName: pageName,
      greeting: defaultGreeting,
      position: `bottom-${position}`,
      theme: {
        primaryColor: primaryColor,
      },
      metadata: {
        pageId: pageId,
        pageName: pageName,
        userId: userId,
        source: 'landing-page',
      }
    };

    // Parse and inject the widget script
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = companyConfig.widgetScript.trim();
    
    const scriptElement = tempDiv.querySelector('script');
    
    if (scriptElement) {
      const script = document.createElement('script');
      
      if (scriptElement.src) {
        script.src = scriptElement.src;
      }
      
      if (scriptElement.innerHTML) {
        script.innerHTML = scriptElement.innerHTML;
      }

      // Copy all attributes
      Array.from(scriptElement.attributes).forEach(attr => {
        script.setAttribute(attr.name, attr.value);
      });

      script.async = true;
      script.onload = () => {
        console.log('✅ Voice Chat AI widget loaded successfully for landing page');
      };
      script.onerror = () => {
        console.error('❌ Failed to load Voice Chat AI widget');
      };

      document.body.appendChild(script);

      // Cleanup on unmount
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete (window as any).OmniFlowVoiceChat;
      };
    } else {
      console.error('❌ No script tag found in widget code');
    }
  }, [isLoading, companyConfig, greeting, position, primaryColor, pageName, pageId, userId]);

  // This component doesn't render anything visible - the widget injects itself
  return null;
}
