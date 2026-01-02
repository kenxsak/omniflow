"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/app/actions/activity-actions';
import type { Lead } from '@/lib/mock-data';
import type { ActivityType } from '@/types/crm';

interface QuickActivityLoggerProps {
  lead: Lead;
  onActivityLogged?: () => void;
}

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string; color: string }[] = [
  { type: 'call', label: 'Call', icon: 'solar:phone-linear', color: 'text-green-500' },
  { type: 'meeting', label: 'Meeting', icon: 'solar:users-group-rounded-linear', color: 'text-blue-500' },
  { type: 'email', label: 'Email', icon: 'solar:letter-linear', color: 'text-purple-500' },
  { type: 'whatsapp', label: 'WhatsApp', icon: 'mdi:whatsapp', color: 'text-green-600' },
  { type: 'note', label: 'Note', icon: 'solar:document-text-linear', color: 'text-orange-500' },
];

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected - Interested' },
  { value: 'connected_not_interested', label: 'Connected - Not Interested' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'voicemail', label: 'Left Voicemail' },
  { value: 'busy', label: 'Busy / Call Back Later' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
];

export function QuickActivityLogger({ lead, onActivityLogged }: QuickActivityLoggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>('call');
  const [notes, setNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const handleQuickLog = async (type: ActivityType) => {
    if (type === 'call') {
      setSelectedType('call');
      setIsOpen(true);
      return;
    }
    
    setSelectedType(type);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!notes.trim() && selectedType !== 'call') {
      toast({ title: 'Please add notes', variant: 'destructive' });
      return;
    }

    setIsLogging(true);
    try {
      const content = selectedType === 'call' 
        ? `${CALL_OUTCOMES.find(o => o.value === callOutcome)?.label || 'Call logged'}${notes ? `: ${notes}` : ''}`
        : notes;

      await logActivity({
        companyId: lead.companyId,
        contactId: lead.id,
        type: selectedType,
        content,
        metadata: selectedType === 'call' ? { outcome: callOutcome } : undefined,
      });

      toast({ title: 'Activity logged successfully' });
      setIsOpen(false);
      setNotes('');
      setCallOutcome('');
      onActivityLogged?.();
    } catch (error) {
      toast({ title: 'Failed to log activity', variant: 'destructive' });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <>
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {ACTIVITY_TYPES.map(({ type, label, icon, color }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleQuickLog(type)}
            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Icon icon={icon} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 ${color}`} />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Activity Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon 
                icon={ACTIVITY_TYPES.find(t => t.type === selectedType)?.icon || 'solar:document-text-linear'} 
                className={`w-4 h-4 sm:w-5 sm:h-5 ${ACTIVITY_TYPES.find(t => t.type === selectedType)?.color}`} 
              />
              Log {ACTIVITY_TYPES.find(t => t.type === selectedType)?.label}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {lead.name} • {lead.phone || lead.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* Call Outcome (only for calls) */}
            {selectedType === 'call' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Call Outcome</Label>
                <Select value={callOutcome} onValueChange={setCallOutcome}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CALL_OUTCOMES.map(outcome => (
                      <SelectItem key={outcome.value} value={outcome.value} className="text-sm">
                        {outcome.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {selectedType === 'call' ? 'Additional Notes (optional)' : 'Notes'}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selectedType === 'call' 
                    ? 'Add any additional details...' 
                    : `What happened during this ${selectedType}?`
                }
                className="min-h-[80px] sm:min-h-[100px] text-sm resize-none"
              />
            </div>

            {/* Quick Templates */}
            {selectedType === 'note' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Quick Templates</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Interested in pricing',
                    'Requested callback',
                    'Needs more info',
                    'Decision maker identified',
                    'Budget confirmed',
                  ].map(template => (
                    <Button
                      key={template}
                      variant="outline"
                      size="sm"
                      onClick={() => setNotes(prev => prev ? `${prev}\n${template}` : template)}
                      className="h-7 text-xs px-2"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLogging || (selectedType === 'call' && !callOutcome)}
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                {isLogging ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:check-circle-linear" className="w-3.5 h-3.5 mr-1.5" />
                    Log Activity
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
