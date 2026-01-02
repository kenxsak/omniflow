import type { Lead } from '@/lib/mock-data';

/**
 * Lead Scoring System
 * Calculates a 0-100 score based on lead completeness and engagement
 * Similar to Freshsales, LeadSquared, and Zoho CRM
 */

export interface ScoreBreakdown {
  total: number;
  factors: {
    name: string;
    points: number;
    maxPoints: number;
  }[];
}

// Scoring weights (total = 100)
const SCORING_WEIGHTS = {
  // Profile completeness (30 points)
  hasEmail: 10,
  hasPhone: 10,
  hasCompany: 5,
  hasNotes: 5,
  
  // Engagement (40 points)
  emailOpened: 5,      // per open, max 15
  emailClicked: 10,    // per click, max 20
  meetingsBooked: 5,   // per meeting, max 5
  
  // Recency (30 points)
  recentActivity: 15,  // contacted in last 7 days
  notStale: 15,        // not inactive for 14+ days
};

/**
 * Calculate lead score based on profile and engagement
 */
export function calculateLeadScore(lead: Lead): ScoreBreakdown {
  const factors: ScoreBreakdown['factors'] = [];
  let total = 0;

  // Profile completeness
  if (lead.email) {
    factors.push({ name: 'Has Email', points: SCORING_WEIGHTS.hasEmail, maxPoints: SCORING_WEIGHTS.hasEmail });
    total += SCORING_WEIGHTS.hasEmail;
  } else {
    factors.push({ name: 'Has Email', points: 0, maxPoints: SCORING_WEIGHTS.hasEmail });
  }

  if (lead.phone) {
    factors.push({ name: 'Has Phone', points: SCORING_WEIGHTS.hasPhone, maxPoints: SCORING_WEIGHTS.hasPhone });
    total += SCORING_WEIGHTS.hasPhone;
  } else {
    factors.push({ name: 'Has Phone', points: 0, maxPoints: SCORING_WEIGHTS.hasPhone });
  }

  if (lead.attributes?.COMPANY_NAME) {
    factors.push({ name: 'Has Company', points: SCORING_WEIGHTS.hasCompany, maxPoints: SCORING_WEIGHTS.hasCompany });
    total += SCORING_WEIGHTS.hasCompany;
  } else {
    factors.push({ name: 'Has Company', points: 0, maxPoints: SCORING_WEIGHTS.hasCompany });
  }

  if (lead.notes && lead.notes.length > 10) {
    factors.push({ name: 'Has Notes', points: SCORING_WEIGHTS.hasNotes, maxPoints: SCORING_WEIGHTS.hasNotes });
    total += SCORING_WEIGHTS.hasNotes;
  } else {
    factors.push({ name: 'Has Notes', points: 0, maxPoints: SCORING_WEIGHTS.hasNotes });
  }

  // Engagement scores from scoreFactors
  const sf = lead.scoreFactors || {};
  
  const emailOpenPoints = Math.min((sf.emailOpened || 0) * SCORING_WEIGHTS.emailOpened, 15);
  factors.push({ name: 'Email Opens', points: emailOpenPoints, maxPoints: 15 });
  total += emailOpenPoints;

  const emailClickPoints = Math.min((sf.emailClicked || 0) * SCORING_WEIGHTS.emailClicked, 20);
  factors.push({ name: 'Email Clicks', points: emailClickPoints, maxPoints: 20 });
  total += emailClickPoints;

  const meetingPoints = Math.min((sf.meetingsBooked || 0) * SCORING_WEIGHTS.meetingsBooked, 5);
  factors.push({ name: 'Meetings', points: meetingPoints, maxPoints: 5 });
  total += meetingPoints;

  // Recency scoring
  const lastContactedDate = lead.lastContacted?.toDate?.() || new Date(lead.lastContacted);
  const daysSinceContact = Math.floor((Date.now() - lastContactedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceContact <= 7) {
    factors.push({ name: 'Recent Activity', points: SCORING_WEIGHTS.recentActivity, maxPoints: SCORING_WEIGHTS.recentActivity });
    total += SCORING_WEIGHTS.recentActivity;
  } else {
    factors.push({ name: 'Recent Activity', points: 0, maxPoints: SCORING_WEIGHTS.recentActivity });
  }

  if (daysSinceContact <= 14) {
    factors.push({ name: 'Not Stale', points: SCORING_WEIGHTS.notStale, maxPoints: SCORING_WEIGHTS.notStale });
    total += SCORING_WEIGHTS.notStale;
  } else {
    factors.push({ name: 'Not Stale', points: 0, maxPoints: SCORING_WEIGHTS.notStale });
  }

  return { total: Math.min(total, 100), factors };
}

/**
 * Get lead temperature based on score
 */
export function getLeadTemperature(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

/**
 * Get temperature color for UI
 */
export function getTemperatureColor(temp: 'hot' | 'warm' | 'cold'): string {
  switch (temp) {
    case 'hot': return 'text-red-500';
    case 'warm': return 'text-orange-500';
    case 'cold': return 'text-blue-500';
  }
}

/**
 * Get temperature background color for badges
 */
export function getTemperatureBgColor(temp: 'hot' | 'warm' | 'cold'): string {
  switch (temp) {
    case 'hot': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'warm': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'cold': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  }
}

/**
 * Get score color for progress bars
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Update lead score when activity happens
 */
export function updateScoreFactors(
  currentFactors: Lead['scoreFactors'] = {},
  activityType: 'email_open' | 'email_click' | 'meeting' | 'call' | 'form_submit'
): Lead['scoreFactors'] {
  const updated = { ...currentFactors };
  
  switch (activityType) {
    case 'email_open':
      updated.emailOpened = (updated.emailOpened || 0) + 1;
      break;
    case 'email_click':
      updated.emailClicked = (updated.emailClicked || 0) + 1;
      break;
    case 'meeting':
      updated.meetingsBooked = (updated.meetingsBooked || 0) + 1;
      break;
    case 'call':
      updated.callsReceived = (updated.callsReceived || 0) + 1;
      break;
    case 'form_submit':
      updated.formSubmissions = (updated.formSubmissions || 0) + 1;
      break;
  }
  
  return updated;
}
