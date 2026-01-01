'use client';

import { useEffect, useState } from 'react';
import { getSalesWidgetSettings, getSupportWidgetSettings } from '@/app/actions/ai-voice-widget-actions';

interface AIVoiceWidgetProps {
  type: 'sales' | 'support';
}

/**
 * AI Voice Widget Component
 * Renders the embed code for AI voice assistants
 * - Sales widget: for public homepage
 * - Support widget: for help center
 */
export function AIVoiceWidget({ type }: AIVoiceWidgetProps) {
  const [embedCode, setEmbedCode] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (type === 'sales') {
          const settings = await getSalesWidgetSettings();
          setIsEnabled(settings.enabled);
          setEmbedCode(settings.embedCode);
        } else {
          const settings = await getSupportWidgetSettings();
          setIsEnabled(settings.enabled);
          setEmbedCode(settings.embedCode);
        }
      } catch (error) {
        console.error('Error loading AI voice widget settings:', error);
      }
    };

    loadSettings();
  }, [type]);

  // Don't render anything if disabled or no embed code
  if (!isEnabled || !embedCode.trim()) {
    return null;
  }

  // Render the embed code
  // Using dangerouslySetInnerHTML to inject the widget code
  // This is safe because only Super Admins can set this code
  return (
    <div 
      id={`ai-voice-widget-${type}`}
      className="ai-voice-widget-container"
      dangerouslySetInnerHTML={{ __html: embedCode }}
    />
  );
}

/**
 * Script-based AI Voice Widget
 * For widgets that need to be loaded as scripts
 */
export function AIVoiceWidgetScript({ type }: AIVoiceWidgetProps) {
  const [embedCode, setEmbedCode] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (type === 'sales') {
          const settings = await getSalesWidgetSettings();
          setIsEnabled(settings.enabled);
          setEmbedCode(settings.embedCode);
        } else {
          const settings = await getSupportWidgetSettings();
          setIsEnabled(settings.enabled);
          setEmbedCode(settings.embedCode);
        }
      } catch (error) {
        console.error('Error loading AI voice widget settings:', error);
      }
    };

    loadSettings();
  }, [type]);

  useEffect(() => {
    if (!isEnabled || !embedCode.trim()) return;

    // Extract and execute script tags from embed code
    const container = document.createElement('div');
    container.innerHTML = embedCode;

    // Find all script tags
    const scripts = container.querySelectorAll('script');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy inline script content
      if (script.innerHTML) {
        newScript.innerHTML = script.innerHTML;
      }
      
      document.body.appendChild(newScript);
    });

    // Append non-script elements
    const nonScriptContent = embedCode.replace(/<script[\s\S]*?<\/script>/gi, '');
    if (nonScriptContent.trim()) {
      const widgetContainer = document.getElementById(`ai-voice-widget-${type}`);
      if (widgetContainer) {
        widgetContainer.innerHTML = nonScriptContent;
      }
    }

    // Cleanup on unmount
    return () => {
      scripts.forEach((script) => {
        const src = script.getAttribute('src');
        if (src) {
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            existingScript.remove();
          }
        }
      });
    };
  }, [isEnabled, embedCode, type]);

  if (!isEnabled || !embedCode.trim()) {
    return null;
  }

  return <div id={`ai-voice-widget-${type}`} className="ai-voice-widget-container" />;
}
