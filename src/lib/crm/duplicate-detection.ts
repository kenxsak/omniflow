import type { Lead } from '@/lib/mock-data';

/**
 * Duplicate Detection System
 * Finds potential duplicate leads based on email, phone, and name similarity
 * Similar to Zoho CRM, Freshsales, and HubSpot
 */

export interface DuplicateMatch {
  lead: Lead;
  matchType: 'exact_email' | 'exact_phone' | 'similar_name' | 'partial_match';
  confidence: number; // 0-100
  matchedFields: string[];
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize phone for comparison (remove all non-digits)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10); // Last 10 digits
}

/**
 * Calculate name similarity using Levenshtein distance
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const s1 = name1.toLowerCase().trim();
  const s2 = name2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round(((longer.length - distance) / longer.length) * 100);
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Find potential duplicates for a new lead
 */
export function findDuplicates(
  newLead: { name: string; email: string; phone?: string },
  existingLeads: Lead[],
  threshold: number = 70 // Minimum confidence to consider a match
): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];
  
  const normalizedNewEmail = normalizeEmail(newLead.email);
  const normalizedNewPhone = newLead.phone ? normalizePhone(newLead.phone) : '';
  
  for (const lead of existingLeads) {
    const matchedFields: string[] = [];
    let confidence = 0;
    let matchType: DuplicateMatch['matchType'] = 'partial_match';
    
    // Check exact email match (highest priority)
    if (lead.email && normalizeEmail(lead.email) === normalizedNewEmail) {
      matchedFields.push('email');
      confidence = 100;
      matchType = 'exact_email';
    }
    
    // Check exact phone match
    if (normalizedNewPhone && lead.phone) {
      const normalizedExistingPhone = normalizePhone(lead.phone);
      if (normalizedExistingPhone === normalizedNewPhone) {
        matchedFields.push('phone');
        if (confidence < 95) {
          confidence = 95;
          matchType = 'exact_phone';
        }
      }
    }
    
    // Check name similarity
    const nameSimilarity = calculateNameSimilarity(newLead.name, lead.name);
    if (nameSimilarity >= 85) {
      matchedFields.push('name');
      if (confidence < nameSimilarity) {
        confidence = nameSimilarity;
        matchType = 'similar_name';
      }
    }
    
    // Partial match: similar name + partial email domain
    if (nameSimilarity >= 70 && lead.email && newLead.email) {
      const existingDomain = lead.email.split('@')[1];
      const newDomain = newLead.email.split('@')[1];
      if (existingDomain === newDomain) {
        matchedFields.push('email_domain');
        confidence = Math.max(confidence, 80);
        matchType = 'partial_match';
      }
    }
    
    if (confidence >= threshold && matchedFields.length > 0) {
      duplicates.push({
        lead,
        matchType,
        confidence,
        matchedFields,
      });
    }
  }
  
  // Sort by confidence (highest first)
  return duplicates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if a lead is a definite duplicate (exact email or phone match)
 */
export function isDefiniteDuplicate(
  newLead: { email: string; phone?: string },
  existingLeads: Lead[]
): Lead | null {
  const normalizedNewEmail = normalizeEmail(newLead.email);
  const normalizedNewPhone = newLead.phone ? normalizePhone(newLead.phone) : '';
  
  for (const lead of existingLeads) {
    // Exact email match
    if (lead.email && normalizeEmail(lead.email) === normalizedNewEmail) {
      return lead;
    }
    
    // Exact phone match (if both have phone)
    if (normalizedNewPhone && lead.phone) {
      if (normalizePhone(lead.phone) === normalizedNewPhone) {
        return lead;
      }
    }
  }
  
  return null;
}

/**
 * Get duplicate warning message
 */
export function getDuplicateWarning(matches: DuplicateMatch[]): string {
  if (matches.length === 0) return '';
  
  const topMatch = matches[0];
  const matchFieldsText = topMatch.matchedFields.join(', ');
  
  if (topMatch.matchType === 'exact_email') {
    return `A contact with this email already exists: ${topMatch.lead.name}`;
  }
  
  if (topMatch.matchType === 'exact_phone') {
    return `A contact with this phone number already exists: ${topMatch.lead.name}`;
  }
  
  return `Potential duplicate found: ${topMatch.lead.name} (${topMatch.confidence}% match on ${matchFieldsText})`;
}
