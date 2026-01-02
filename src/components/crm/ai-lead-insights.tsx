"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import type { Lead } from '@/lib/mock-data';

interface AILeadInsightsProps {
  lead: Lead;
  onSuggestedAction?: (action: string) => void;
}

interface AIInsight {
  type: 'tip' | 'warning' | 'opportunity' | 'action';
  title: string;
  description: string;
  action?: {
    label: string;
    type: 'email' | 'call' | 'whatsapp' | 'task' | 'meeting';
  };
  confidence: number;
}

// AI-powered insights generator (runs locally, no API needed)
function generateInsights(lead: Lead): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date();
  
  // Calculate days since last contact
  let daysSinceContact = 999;
  if (lead.lastContacted) {
    const lastDate = lead.lastContacted?.toDate ? lead.lastContacted.toDate() : new Date(lead.lastContacted);
    daysSinceContact = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Lead Score Insights
  const score = lead.leadScore || 0;
  if (score >= 80) {
    insights.push({
      type: 'opportunity',
      title: '🔥 High-Value Lead',
      description: `This lead has a score of ${score}. They're highly engaged and ready to convert. Prioritize immediate follow-up.`,
      action: { label: 'Schedule Call', type: 'call' },
      confidence: 95,
    });
  } else if (score >= 60 && score < 80) {
    insights.push({
      type: 'tip',
      title: '📈 Growing Interest',
      description: 'This lead is warming up. A personalized email or demo offer could push them to the next stage.',
      action: { label: 'Send Email', type: 'email' },
      confidence: 80,
    });
  } else if (score < 30 && lead.status !== 'Lost') {
    insights.push({
      type: 'warning',
      title: '⚠️ Low Engagement',
      description: 'This lead has low engagement. Consider a re-engagement campaign or qualifying call.',
      action: { label: 'Send WhatsApp', type: 'whatsapp' },
      confidence: 70,
    });
  }

  // Contact Timing Insights
  if (daysSinceContact >= 14 && lead.status !== 'Won' && lead.status !== 'Lost') {
    insights.push({
      type: 'warning',
      title: '🚨 Lead Going Cold',
      description: `No contact in ${daysSinceContact} days. Reach out immediately to prevent losing this opportunity.`,
      action: { label: 'Call Now', type: 'call' },
      confidence: 90,
    });
  } else if (daysSinceContact >= 7 && daysSinceContact < 14) {
    insights.push({
      type: 'action',
      title: '📞 Follow-up Due',
      description: `It's been ${daysSinceContact} days since last contact. A quick check-in can keep the conversation warm.`,
      action: { label: 'Quick Follow-up', type: 'whatsapp' },
      confidence: 85,
    });
  }

  // Status-based Insights
  if (lead.status === 'New' && daysSinceContact > 2) {
    insights.push({
      type: 'action',
      title: '⚡ New Lead Alert',
      description: 'New leads should be contacted within 24-48 hours for best conversion rates.',
      action: { label: 'Make First Contact', type: 'call' },
      confidence: 92,
    });
  }

  if (lead.status === 'Qualified' && !lead.expectedValue) {
    insights.push({
      type: 'tip',
      title: '💰 Add Deal Value',
      description: 'This qualified lead doesn\'t have an expected value. Adding one helps with forecasting.',
      confidence: 75,
    });
  }

  // Contact Info Insights
  if (!lead.phone && lead.email) {
    insights.push({
      type: 'tip',
      title: '📱 Missing Phone',
      description: 'No phone number on file. Ask for it in your next email to enable faster communication.',
      confidence: 65,
    });
  }

  if (!lead.attributes?.COMPANY_NAME && lead.status !== 'Lost') {
    insights.push({
      type: 'tip',
      title: '🏢 Company Unknown',
      description: 'Knowing their company helps personalize your pitch. Research or ask in your next call.',
      confidence: 60,
    });
  }

  // Best Time to Contact (simple heuristic)
  const hour = now.getHours();
  if (hour >= 9 && hour <= 11) {
    insights.push({
      type: 'opportunity',
      title: '⏰ Best Time to Call',
      description: 'Morning hours (9-11 AM) have the highest answer rates. Great time to reach out!',
      confidence: 70,
    });
  } else if (hour >= 14 && hour <= 16) {
    insights.push({
      type: 'opportunity',
      title: '⏰ Good Calling Window',
      description: 'Afternoon (2-4 PM) is another peak time for reaching decision makers.',
      confidence: 65,
    });
  }

  // Sort by confidence
  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

export function AILeadInsights({ lead, onSuggestedAction }: AILeadInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const insights = generateInsights(lead);
  const { toast } = useToast();

  const handleAction = (action: AIInsight['action']) => {
    if (!action) return;
    onSuggestedAction?.(action.type);
    toast({ title: `Opening ${action.label}...` });
  };

  const typeColors = {
    tip: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    opportunity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    action: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  const typeIcons = {
    tip: 'solar:lightbulb-bolt-bold',
    warning: 'solar:danger-triangle-bold',
    opportunity: 'solar:star-bold',
    action: 'solar:play-circle-bold',
  };

  if (insights.length === 0) return null;

  return (
    <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Icon icon="solar:magic-stick-3-bold" className="w-3.5 h-3.5 text-white" />
            </div>
            AI Insights
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-indigo-100 text-indigo-700">
              SMART
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon 
              icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
              className="w-4 h-4" 
            />
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="p-2.5 sm:p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800"
            >
              <div className="flex items-start gap-2">
                <div className={`p-1 rounded ${typeColors[insight.type]}`}>
                  <Icon icon={typeIcons[insight.type]} className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{insight.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              </div>
              
              {insight.action && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => handleAction(insight.action)}
                >
                  <Icon icon="solar:play-circle-linear" className="w-3 h-3 mr-1" />
                  {insight.action.label}
                </Button>
              )}
            </div>
          ))}
          
          <p className="text-[9px] text-center text-muted-foreground pt-1">
            <Icon icon="solar:cpu-bolt-linear" className="w-3 h-3 inline mr-0.5" />
            AI-powered suggestions based on lead behavior
          </p>
        </CardContent>
      )}
    </Card>
  );
}
