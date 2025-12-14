'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="mt-6 border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon icon="solar:code-linear" className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Widget Embed Code</CardTitle>
        </div>
        <CardDescription>
          Copy this code to embed your Digital Card with Voice Chat AI on any website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            Generating embed code...
          </div>
        ) : embedCode ? (
          <>
            <CodeBlock 
              code={embedCode} 
              language="html" 
              showLineNumbers 
            />

            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm text-foreground">Installation Instructions</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground ml-6">
                <li>Copy the code snippet above using the "Copy" button</li>
                <li>Paste this code just before the closing <code className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-mono">&lt;/body&gt;</code> tag</li>
                <li>The widget automatically uses your brand colors and settings</li>
                <li>It loads as a secure iframe that won't interfere with your website</li>
              </ol>
            </div>

            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-foreground font-medium flex items-center gap-2">
                <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-primary" />
                Your widget is ready to use
              </p>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Visitors can chat with your AI assistant in 109 languages. All conversations automatically create leads in your CRM.
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
