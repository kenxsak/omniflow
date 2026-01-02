import { describe, it, expect } from 'vitest';
import {
  calculateLeadScore,
  getLeadTemperature,
  getTemperatureColor,
  getTemperatureBgColor,
  getScoreColor,
  updateScoreFactors,
} from './lead-scoring';
import type { Lead } from '@/lib/mock-data';

// Helper to create a mock lead
function createMockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-lead-1',
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '+919876543210',
    status: 'New',
    source: 'Website',
    companyId: 'test-company',
    createdAt: new Date(),
    lastContacted: new Date(),
    ...overrides,
  };
}

describe('Lead Scoring', () => {
  describe('calculateLeadScore', () => {
    it('should calculate score for a complete lead profile', () => {
      const lead = createMockLead({
        email: 'test@example.com',
        phone: '+919876543210',
        attributes: { COMPANY_NAME: 'Test Corp' },
        notes: 'This is a detailed note about the lead',
      });

      const result = calculateLeadScore(lead);

      // Should have points for email (10), phone (10), company (5), notes (5), recent activity (15), not stale (15)
      expect(result.total).toBeGreaterThanOrEqual(60);
      expect(result.factors).toHaveLength(9);
    });

    it('should give 0 score for empty lead', () => {
      const lead = createMockLead({
        email: '',
        phone: undefined,
        attributes: undefined,
        notes: undefined,
        lastContacted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      });

      const result = calculateLeadScore(lead);

      expect(result.total).toBeLessThan(30);
    });

    it('should add engagement points for email opens', () => {
      const lead = createMockLead({
        scoreFactors: {
          emailOpened: 3,
        },
      });

      const result = calculateLeadScore(lead);
      const emailOpenFactor = result.factors.find(f => f.name === 'Email Opens');

      expect(emailOpenFactor?.points).toBe(15); // 3 opens * 5 points = 15 (capped at 15)
    });

    it('should add engagement points for email clicks', () => {
      const lead = createMockLead({
        scoreFactors: {
          emailClicked: 2,
        },
      });

      const result = calculateLeadScore(lead);
      const emailClickFactor = result.factors.find(f => f.name === 'Email Clicks');

      expect(emailClickFactor?.points).toBe(20); // 2 clicks * 10 points = 20 (capped at 20)
    });

    it('should penalize stale leads', () => {
      const staleLead = createMockLead({
        lastContacted: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      });

      const freshLead = createMockLead({
        lastContacted: new Date(), // today
      });

      const staleScore = calculateLeadScore(staleLead);
      const freshScore = calculateLeadScore(freshLead);

      expect(freshScore.total).toBeGreaterThan(staleScore.total);
    });

    it('should cap total score at 100', () => {
      const superLead = createMockLead({
        email: 'test@example.com',
        phone: '+919876543210',
        attributes: { COMPANY_NAME: 'Test Corp' },
        notes: 'Detailed notes here',
        scoreFactors: {
          emailOpened: 10,
          emailClicked: 10,
          meetingsBooked: 5,
        },
      });

      const result = calculateLeadScore(superLead);

      expect(result.total).toBeLessThanOrEqual(100);
    });
  });

  describe('getLeadTemperature', () => {
    it('should return "hot" for scores >= 70', () => {
      expect(getLeadTemperature(70)).toBe('hot');
      expect(getLeadTemperature(85)).toBe('hot');
      expect(getLeadTemperature(100)).toBe('hot');
    });

    it('should return "warm" for scores 40-69', () => {
      expect(getLeadTemperature(40)).toBe('warm');
      expect(getLeadTemperature(55)).toBe('warm');
      expect(getLeadTemperature(69)).toBe('warm');
    });

    it('should return "cold" for scores < 40', () => {
      expect(getLeadTemperature(0)).toBe('cold');
      expect(getLeadTemperature(20)).toBe('cold');
      expect(getLeadTemperature(39)).toBe('cold');
    });
  });

  describe('getTemperatureColor', () => {
    it('should return correct colors for each temperature', () => {
      expect(getTemperatureColor('hot')).toBe('text-red-500');
      expect(getTemperatureColor('warm')).toBe('text-orange-500');
      expect(getTemperatureColor('cold')).toBe('text-blue-500');
    });
  });

  describe('getTemperatureBgColor', () => {
    it('should return correct background colors for each temperature', () => {
      expect(getTemperatureBgColor('hot')).toContain('bg-red');
      expect(getTemperatureBgColor('warm')).toContain('bg-orange');
      expect(getTemperatureBgColor('cold')).toContain('bg-blue');
    });
  });

  describe('getScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getScoreColor(70)).toBe('bg-green-500');
      expect(getScoreColor(100)).toBe('bg-green-500');
    });

    it('should return yellow for medium scores', () => {
      expect(getScoreColor(40)).toBe('bg-yellow-500');
      expect(getScoreColor(69)).toBe('bg-yellow-500');
    });

    it('should return red for low scores', () => {
      expect(getScoreColor(0)).toBe('bg-red-500');
      expect(getScoreColor(39)).toBe('bg-red-500');
    });
  });

  describe('updateScoreFactors', () => {
    it('should increment email_open count', () => {
      const current = { emailOpened: 2 };
      const updated = updateScoreFactors(current, 'email_open');

      expect(updated.emailOpened).toBe(3);
    });

    it('should increment email_click count', () => {
      const current = { emailClicked: 1 };
      const updated = updateScoreFactors(current, 'email_click');

      expect(updated.emailClicked).toBe(2);
    });

    it('should increment meeting count', () => {
      const current = {};
      const updated = updateScoreFactors(current, 'meeting');

      expect(updated.meetingsBooked).toBe(1);
    });

    it('should increment call count', () => {
      const current = { callsReceived: 5 };
      const updated = updateScoreFactors(current, 'call');

      expect(updated.callsReceived).toBe(6);
    });

    it('should increment form_submit count', () => {
      const current = {};
      const updated = updateScoreFactors(current, 'form_submit');

      expect(updated.formSubmissions).toBe(1);
    });

    it('should handle undefined current factors', () => {
      const updated = updateScoreFactors(undefined, 'email_open');

      expect(updated.emailOpened).toBe(1);
    });
  });
});
