'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { CodeBlock } from '@/components/ui/code-block';
import { generateWidgetEmbedCode } from '@/app/actions/voice-chat-actions';
import { useAuth } from '@/hooks/use-auth';

interface WidgetEmbedCodeProps {
  cardId: string;
  enabled: boolean;
}

export default function WidgetEmbedCode({ cardId, enabled }: WidgetEmbedCodeProps) {
  const { firebaseUser } = useAuth();
  const [embedCode, setEmbedCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled && firebaseUser) {
      loadEmbedCode();
    }
  }, [cardId, enabled, firebaseUser]);

  const loadEmbedCode = async () => {
    if (!firebaseUser) {
      setError('Please log in to view embed code');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await generateWidgetEmbedCode(idToken, cardId);
      
      if (result && result.success && result.embedCode) {
        setEmbedCode(result.embedCode);
      } else {
        setError(result?.message || 'Failed to generate embed code');
      }
    } catch (err) {
      console.error('Error loading embed code:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 p-1">
      <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Icon icon="solar:code-linear" className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Widget Embed Code</h2>
          <p className="text-xs text-muted-foreground truncate">Embed Voice Chat AI on any website</p>
        </div>
      </header>
      <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
        <div className="p-4 sm:p-5 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs sm:text-sm">Generating embed code...</p>
            </div>
          ) : embedCode ? (
            <>
              <CodeBlock 
                code={embedCode} 
                language="html" 
                showLineNumbers 
              />

              <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                <div className="flex items-start gap-2 mb-2 sm:mb-3">
                  <Icon icon="solar:info-circle-linear" className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-medium text-xs sm:text-sm text-foreground">Installation Instructions</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-muted-foreground ml-4 sm:ml-6">
                  <li>Copy the code snippet above using the "Copy" button</li>
                  <li>Paste this code just before the closing <code className="bg-stone-800 text-stone-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono">&lt;/body&gt;</code> tag</li>
                  <li>The widget automatically uses your brand colors and settings</li>
                  <li>It loads as a secure iframe that won't interfere with your website</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                <p className="text-xs sm:text-sm text-foreground font-medium flex items-center gap-2">
                  <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Your widget is ready to use</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 ml-6">
                  Visitors can chat with Voice Chat AI in 109 languages. All conversations automatically create leads in your CRM.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
