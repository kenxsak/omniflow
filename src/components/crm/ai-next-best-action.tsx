"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import type { Lead } from '@/lib/mock-data';
import { openWhatsApp } from '@/lib/open-external-link';

interface AINextBestActionProps {
  leads: Lead[];
  onAction?: (lead: Lead, action: string) => void;
}

interface SuggestedAction {
  lead: Lead;
  action: 'call' | 'email' | 'whatsapp' | 'meeting' | 'task';
  reason: string;
  priority: 'urgent' | 'high' | 'medium';
  icon: string;
  color: string;
}

// AI-powered action prioritization
function generateNextBestActions(leads: Lead[]): SuggestedAction[] {
  const actions: SuggestedAction[] = [];
  const now = new Date();

  leads.forEach(lead => {
    if (lead.status === 'Won' || lead.status === 'Lost') return;

    // Calculate days since last contact
    let daysSinceContact = 999;
    if (lead.lastContacted) {
      const lastDate = lead.lastContacted?.toDate ? lead.lastContacted.toDate() : new Date(lead.lastContacted);
      daysSinceContact = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const score = lead.leadScore || 50;
    const temperature = lead.temperature || 'warm';

    // Hot lead not contacted recently - URGENT
    if (temperature === 'hot' && daysSinceContact >= 3) {
      actions.push({
        lead,
        action: 'call',
        reason: `Hot lead! No contact in ${daysSinceContact} days. Call immediately.`,
        priority: 'urgent',
        icon: 'solar:phone-calling-bold',
        color: '#ef4444',
      });
      return;
    }

    // High score lead going cold - URGENT
    if (score >= 70 && daysSinceContact >= 7) {
      actions.push({
        lead,
        action: 'call',
        reason: `High-value lead (${score} score) going cold. Reach out now!`,
        priority: 'urgent',
        icon: 'solar:fire-bold',
        color: '#f97316',
      });
      return;
    }

    // New lead not contacted - HIGH
    if (lead.status === 'New' && daysSinceContact > 1) {
      actions.push({
        lead,
        action: lead.phone ? 'whatsapp' : 'email',
        reason: 'New lead waiting for first contact. Quick response = higher conversion.',
        priority: 'high',
        icon: 'solar:user-plus-bold',
        color: '#3b82f6',
      });
      return;
    }

    // Qualified lead needs follow-up - HIGH
    if (lead.status === 'Qualified' && daysSinceContact >= 5) {
      actions.push({
        lead,
        action: 'meeting',
        reason: 'Qualified lead ready for next step. Schedule a demo or meeting.',
        priority: 'high',
        icon: 'solar:calendar-bold',
        color: '#8b5cf6',
      });
      return;
    }

    // Contacted lead needs nurturing - MEDIUM
    if (lead.status === 'Contacted' && daysSinceContact >= 7) {
      actions.push({
        lead,
        action: 'email',
        reason: 'Time for a follow-up. Send value-adding content.',
        priority: 'medium',
        icon: 'solar:letter-bold',
        color: '#10b981',
      });
      return;
    }

    // Cold lead re-engagement - MEDIUM
    if (temperature === 'cold' && daysSinceContact >= 14 && score >= 30) {
      actions.push({
        lead,
        action: 'whatsapp',
        reason: 'Cold lead with potential. Try a casual WhatsApp check-in.',
        priority: 'medium',
        icon: 'solar:chat-round-dots-bold',
        color: '#06b6d4',
      });
    }
  });

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
}

export function AINextBestAction({ leads, onAction }: AINextBestActionProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const suggestions = useMemo(() => {
    return generateNextBestActions(leads).filter(s => !completedActions.has(s.lead.id));
  }, [leads, completedActions]);

  const handleAction = (suggestion: SuggestedAction) => {
    const { lead, action } = suggestion;

    switch (action) {
      case 'call':
        if (lead.phone) {
          window.location.href = `tel:${lead.phone}`;
        }
        break;
      case 'whatsapp':
        if (lead.phone) {
          openWhatsApp(lead.phone, `Hi ${lead.name.split(' ')[0]}, `);
        }
        break;
      case 'email':
        if (lead.email) {
          window.location.href = `mailto:${lead.email}?subject=Following up`;
        }
        break;
      case 'meeting':
        onAction?.(lead, 'meeting');
        break;
      case 'task':
        onAction?.(lead, 'task');
        break;
    }

    toast({ title: `Action started for ${lead.name}` });
  };

  const handleComplete = (leadId: string) => {
    setCompletedActions(prev => new Set([...prev, leadId]));
    toast({ title: 'Marked as done!' });
  };

  if (suggestions.length === 0) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4 text-center">
          <Icon icon="solar:check-circle-bold" className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">All caught up!</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">No urgent actions needed right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 dark:border-stone-800 overflow-hidden">
      <div className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500">
        <div className="flex items-center gap-2">
          <Icon icon="solar:magic-stick-3-bold" className="w-4 h-4 text-white" />
          <span className="text-xs sm:text-sm font-semibold text-white">AI: Your Next Best Actions</span>
          <Badge className="ml-auto bg-white/20 text-white text-[9px] h-4 px-1.5 border-0">
            {suggestions.length} suggested
          </Badge>
        </div>
      </div>
      <CardContent className="p-0 divide-y divide-stone-100 dark:divide-stone-800">
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.lead.id}-${index}`}
            className="p-3 sm:p-4 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Priority Indicator */}
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${suggestion.color}20` }}
              >
                <Icon icon={suggestion.icon} className="w-4 h-4" style={{ color: suggestion.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium truncate">{suggestion.lead.name}</span>
                  <Badge 
                    variant="outline" 
                    className="text-[9px] h-4 px-1 capitalize"
                    style={{ 
                      borderColor: suggestion.color, 
                      color: suggestion.color,
                      backgroundColor: `${suggestion.color}10`
                    }}
                  >
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                  {suggestion.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleAction(suggestion)}
                  className="h-7 text-xs px-2"
                  style={{ backgroundColor: suggestion.color }}
                >
                  <Icon icon={suggestion.icon} className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline capitalize">{suggestion.action}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleComplete(suggestion.lead.id)}
                  className="h-7 w-7 p-0"
                >
                  <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-emerald-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
