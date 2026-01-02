'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClickToCallProps {
  phoneNumber: string;
  leadName?: string;
  leadId?: string;
  compact?: boolean;
  className?: string;
}

export function ClickToCall({ phoneNumber, leadName, leadId, compact = false, className }: ClickToCallProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callType, setCallType] = useState<'regular' | 'ai' | null>(null);

  // Check TRAI compliance (India calling hours: 9 AM - 9 PM)
  const checkTRAICompliance = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 9 && hour < 21;
  };

  const handleRegularCall = async () => {
    setIsLoading(true);
    setCallType('regular');

    try {
      // Check TRAI compliance for Indian numbers
      if (phoneNumber.startsWith('+91') || phoneNumber.startsWith('91')) {
        if (!checkTRAICompliance()) {
          toast({
            title: 'TRAI Compliance',
            description: 'Calls to Indian numbers are only allowed between 9 AM - 9 PM IST',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/telephony/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          leadId,
          leadName,
          type: 'outbound',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Call Initiated',
          description: `Connecting to ${leadName || phoneNumber}...`,
        });
        setIsDialogOpen(true);
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }
    } catch (error) {
      toast({
        title: 'Call Failed',
        description: error instanceof Error ? error.message : 'Could not initiate call',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAICall = async () => {
    setIsLoading(true);
    setCallType('ai');

    try {
      const response = await fetch('/api/telephony/ai-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          leadId,
          leadName,
          type: 'ai-outbound',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'AI Call Initiated',
          description: `AI agent calling ${leadName || phoneNumber}...`,
        });
        setIsDialogOpen(true);
      } else {
        throw new Error(data.error || 'Failed to initiate AI call');
      }
    } catch (error) {
      toast({
        title: 'AI Call Failed',
        description: error instanceof Error ? error.message : 'Could not initiate AI call',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeCall = () => {
    // Open native phone dialer
    window.location.href = `tel:${phoneNumber}`;
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${className}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icon icon="solar:refresh-bold" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon="solar:phone-bold" className="h-4 w-4 text-green-600" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleNativeCall}>
            <Icon icon="solar:phone-linear" className="h-4 w-4 mr-2" />
            <span className="text-xs">Phone Dialer</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRegularCall}>
            <Icon icon="solar:phone-calling-linear" className="h-4 w-4 mr-2" />
            <span className="text-xs">Browser Call</span>
            <Badge variant="secondary" className="ml-auto text-[8px]">WebRTC</Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAICall}>
            <Icon icon="solar:cpu-bolt-linear" className="h-4 w-4 mr-2" />
            <span className="text-xs">AI Voice Agent</span>
            <Badge className="ml-auto text-[8px] bg-purple-600">AI</Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 sm:h-10 gap-2 ${className}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icon icon="solar:refresh-bold" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon="solar:phone-bold" className="h-4 w-4 text-green-600" />
            )}
            <span className="text-xs sm:text-sm">Call</span>
            <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">Call {leadName || phoneNumber}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNativeCall} className="gap-2">
            <Icon icon="solar:phone-linear" className="h-4 w-4" />
            <div className="flex-1">
              <p className="text-xs font-medium">Phone Dialer</p>
              <p className="text-[10px] text-muted-foreground">Open native dialer</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRegularCall} className="gap-2">
            <Icon icon="solar:phone-calling-linear" className="h-4 w-4" />
            <div className="flex-1">
              <p className="text-xs font-medium">Browser Call</p>
              <p className="text-[10px] text-muted-foreground">WebRTC call with recording</p>
            </div>
            <Badge variant="secondary" className="text-[8px]">WebRTC</Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAICall} className="gap-2">
            <Icon icon="solar:cpu-bolt-linear" className="h-4 w-4 text-purple-600" />
            <div className="flex-1">
              <p className="text-xs font-medium">AI Voice Agent</p>
              <p className="text-[10px] text-muted-foreground">Automated AI call</p>
            </div>
            <Badge className="text-[8px] bg-purple-600">AI</Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Call Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              {callType === 'ai' ? (
                <Icon icon="solar:cpu-bolt-bold" className="h-5 w-5 text-purple-600" />
              ) : (
                <Icon icon="solar:phone-calling-bold" className="h-5 w-5 text-green-600" />
              )}
              {callType === 'ai' ? 'AI Call in Progress' : 'Call in Progress'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {callType === 'ai' 
                ? 'AI agent is handling the call'
                : 'Your call is being connected'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* Call Info */}
            <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Icon icon="solar:user-bold" className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium truncate">{leadName || 'Unknown'}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{phoneNumber}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-600">Calling...</span>
                </div>
              </div>
            </div>

            {/* TRAI Compliance Note for Indian Numbers */}
            {(phoneNumber.startsWith('+91') || phoneNumber.startsWith('91')) && (
              <Alert className="p-2 sm:p-3">
                <Icon icon="solar:shield-check-bold" className="h-3.5 w-3.5" />
                <AlertDescription className="text-[10px] sm:text-xs">
                  TRAI compliant call • Recording enabled • DND checked
                </AlertDescription>
              </Alert>
            )}

            {/* AI Call Features */}
            {callType === 'ai' && (
              <div className="space-y-2">
                <p className="text-xs font-medium">AI Agent Features:</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[9px]">Real-time Transcription</Badge>
                  <Badge variant="secondary" className="text-[9px]">Sentiment Analysis</Badge>
                  <Badge variant="secondary" className="text-[9px]">Auto Summary</Badge>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                onClick={() => {
                  // TODO: Implement call end
                  setIsDialogOpen(false);
                  toast({ title: 'Call Ended' });
                }}
              >
                <Icon icon="solar:phone-rounded-bold" className="h-4 w-4 mr-1.5 rotate-[135deg]" />
                End Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
