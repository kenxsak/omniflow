"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/use-auth";
import { createSupportTicket } from "@/lib/support-data";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, type TicketCategory, type TicketPriority } from "@/types/support";
import { useToast } from '@/hooks/use-toast';

interface SupportTicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
  onCancel?: () => void;
}

export function SupportTicketForm({ onSuccess, onCancel }: SupportTicketFormProps) {
  const { appUser, company } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "general" as TicketCategory,
    priority: "medium" as TicketPriority,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appUser || !company) {
      toast({ title: "Error", description: "Please log in to submit a support ticket", variant: "destructive" });
      return;
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSupportTicket({
        userId: appUser.uid,
        userEmail: appUser.email || "",
        userName: appUser.name,
        companyId: company.id,
        companyName: company.name,
        planId: company.planId,
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      });

      if (result.success && result.ticketNumber) {
        toast({ title: "Success", description: `Ticket ${result.ticketNumber} created successfully!` });
        onSuccess?.(result.ticketNumber);
        setFormData({ subject: "", description: "", category: "general", priority: "medium" });
      } else {
        toast({ title: "Error", description: result.error || "Failed to create ticket", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4">
      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value as TicketCategory })}
        >
          <SelectTrigger className="h-9 sm:h-10 text-sm">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {TICKET_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <Icon icon={cat.icon} className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{cat.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Subject *</Label>
        <Input
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Brief description of your issue"
          className="h-9 sm:h-10 text-sm"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your issue in detail..."
          className="min-h-[100px] sm:min-h-[120px] text-sm resize-none"
          maxLength={2000}
        />
        <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
          {formData.description.length}/2000
        </p>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
        >
          <SelectTrigger className="h-9 sm:h-10 text-sm">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {TICKET_PRIORITIES.map((pri) => (
              <SelectItem key={pri.value} value={pri.value}>
                <span className={`text-sm ${pri.color}`}>{pri.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="w-full sm:flex-1 h-9 sm:h-10 text-sm"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full sm:flex-1 h-9 sm:h-10 text-sm"
        >
          {isSubmitting ? (
            <>
              <Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Icon icon="solar:send-square-bold" className="w-4 h-4 mr-2" />
              Submit Ticket
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
