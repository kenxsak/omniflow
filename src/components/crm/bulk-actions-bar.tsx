"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import type { Lead } from '@/lib/mock-data';

interface BulkActionsBarProps {
  selectedLeads: Lead[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: Lead['status']) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkAssign: (userId: string) => Promise<void>;
  onBulkWhatsApp?: (message: string) => void;
  onBulkEmail?: (subject: string, body: string) => void;
  onBulkAddToList?: (listId: string) => Promise<void>;
  teamMembers?: { id: string; name: string }[];
  emailLists?: { id: string; name: string }[];
}

export function BulkActionsBar({
  selectedLeads,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkAssign,
  onBulkWhatsApp,
  onBulkEmail,
  onBulkAddToList,
  teamMembers = [],
  emailLists = [],
}: BulkActionsBarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const { toast } = useToast();

  if (selectedLeads.length === 0) return null;

  const handleStatusUpdate = async (status: Lead['status']) => {
    setIsUpdating(true);
    try {
      await onBulkStatusUpdate(status);
      toast({ title: `Updated ${selectedLeads.length} contacts to ${status}` });
    } catch (error) {
      toast({ title: 'Failed to update contacts', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await onBulkDelete();
      toast({ title: `Deleted ${selectedLeads.length} contacts` });
      setShowDeleteConfirm(false);
    } catch (error) {
      toast({ title: 'Failed to delete contacts', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (userId: string) => {
    setIsUpdating(true);
    try {
      await onBulkAssign(userId);
      const assignee = teamMembers.find(m => m.id === userId)?.name || 'team member';
      toast({ title: `Assigned ${selectedLeads.length} contacts to ${assignee}` });
    } catch (error) {
      toast({ title: 'Failed to assign contacts', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkWhatsApp = () => {
    if (!whatsAppMessage.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return;
    }
    onBulkWhatsApp?.(whatsAppMessage);
    setShowWhatsAppDialog(false);
    setWhatsAppMessage('');
  };

  const leadsWithPhone = selectedLeads.filter(l => l.phone);
  const leadsWithEmail = selectedLeads.filter(l => l.email);

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[600px]">
        <div className="bg-background border shadow-lg rounded-xl p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {selectedLeads.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-7 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            </div>
            {isUpdating && (
              <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Status Update */}
            <Select onValueChange={(v) => handleStatusUpdate(v as Lead['status'])} disabled={isUpdating}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <Icon icon="solar:tag-linear" className="w-3.5 h-3.5 mr-1.5" />
                <span className="truncate">Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New" className="text-sm">New</SelectItem>
                <SelectItem value="Contacted" className="text-sm">Contacted</SelectItem>
                <SelectItem value="Qualified" className="text-sm">Qualified</SelectItem>
                <SelectItem value="Won" className="text-sm">Won</SelectItem>
                <SelectItem value="Lost" className="text-sm">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Assign */}
            {teamMembers.length > 0 && (
              <Select onValueChange={handleAssign} disabled={isUpdating}>
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <Icon icon="solar:user-linear" className="w-3.5 h-3.5 mr-1.5" />
                  <span className="truncate">Assign</span>
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id} className="text-sm">
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* WhatsApp */}
            {onBulkWhatsApp && leadsWithPhone.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWhatsAppDialog(true)}
                disabled={isUpdating}
                className="h-9 text-xs sm:text-sm"
              >
                <Icon icon="mdi:whatsapp" className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                <span className="truncate">WhatsApp ({leadsWithPhone.length})</span>
              </Button>
            )}

            {/* Add to List */}
            {onBulkAddToList && emailLists.length > 0 && (
              <Select onValueChange={(v) => onBulkAddToList(v)} disabled={isUpdating}>
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <Icon icon="solar:list-linear" className="w-3.5 h-3.5 mr-1.5" />
                  <span className="truncate">Add to List</span>
                </SelectTrigger>
                <SelectContent>
                  {emailLists.map(list => (
                    <SelectItem key={list.id} value={list.id} className="text-sm">
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating}
              className="h-9 text-xs sm:text-sm text-destructive hover:text-destructive"
            >
              <Icon icon="solar:trash-bin-trash-linear" className="w-3.5 h-3.5 mr-1.5" />
              <span className="truncate">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg text-destructive flex items-center gap-2">
              <Icon icon="solar:danger-triangle-linear" className="w-5 h-5" />
              Delete Contacts
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete {selectedLeads.length} contact{selectedLeads.length > 1 ? 's' : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isUpdating}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isUpdating ? 'Deleting...' : `Delete ${selectedLeads.length} Contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="mdi:whatsapp" className="w-5 h-5 text-green-600" />
              Bulk WhatsApp Message
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Send to {leadsWithPhone.length} contacts with phone numbers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Message</Label>
              <Textarea
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                placeholder="Hi {{name}}, ..."
                className="min-h-[100px] text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Use {'{{name}}'} to personalize with contact name
              </p>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Quick Templates</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Hi {{name}}, following up on our conversation.',
                  'Hi {{name}}, just checking in. Any updates?',
                  'Hi {{name}}, we have a special offer for you!',
                ].map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setWhatsAppMessage(template)}
                    className="h-7 text-xs px-2"
                  >
                    Template {idx + 1}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowWhatsAppDialog(false)}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkWhatsApp}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
            >
              <Icon icon="mdi:whatsapp" className="w-4 h-4 mr-1.5" />
              Open WhatsApp ({leadsWithPhone.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
