import { describe, it, expect } from 'vitest';
import {
  findDuplicates,
  isDefiniteDuplicate,
  getDuplicateWarning,
} from './duplicate-detection';
import type { Lead } from '@/lib/mock-data';

// Helper to create mock leads
function createMockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: `lead-${Math.random().toString(36).substr(2, 9)}`,
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

describe('Duplicate Detection', () => {
  describe('findDuplicates', () => {
    it('should find exact email match with 100% confidence', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com' }),
        createMockLead({ id: 'lead-2', name: 'Jane Smith', email: 'jane@example.com' }),
      ];

      const newLead = { name: 'Johnny', email: 'john@example.com', phone: '+1234567890' };
      const duplicates = findDuplicates(newLead, existingLeads);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].confidence).toBe(100);
      expect(duplicates[0].matchType).toBe('exact_email');
      expect(duplicates[0].matchedFields).toContain('email');
    });

    it('should find exact phone match with 95% confidence', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com', phone: '+919876543210' }),
      ];

      const newLead = { name: 'Different Name', email: 'different@example.com', phone: '+91 9876 543 210' };
      const duplicates = findDuplicates(newLead, existingLeads);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].confidence).toBeGreaterThanOrEqual(95);
      expect(duplicates[0].matchedFields).toContain('phone');
    });

    it('should find similar name match', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Smith', email: 'john@example.com' }),
      ];

      const newLead = { name: 'John Smyth', email: 'different@example.com' };
      const duplicates = findDuplicates(newLead, existingLeads, 70);

      expect(duplicates.length).toBeGreaterThanOrEqual(1);
      expect(duplicates[0].matchedFields).toContain('name');
    });

    it('should not find duplicates when no match exists', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com', phone: '+1111111111' }),
      ];

      const newLead = { name: 'Completely Different', email: 'unique@different.com', phone: '+9999999999' };
      const duplicates = findDuplicates(newLead, existingLeads);

      expect(duplicates).toHaveLength(0);
    });

    it('should normalize email for comparison (case insensitive)', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'JOHN@EXAMPLE.COM' }),
      ];

      const newLead = { name: 'Johnny', email: 'john@example.com' };
      const duplicates = findDuplicates(newLead, existingLeads);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].matchType).toBe('exact_email');
    });

    it('should normalize phone for comparison (remove non-digits)', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com', phone: '+91-9876-543-210' }),
      ];

      const newLead = { name: 'Johnny', email: 'different@example.com', phone: '9876543210' };
      const duplicates = findDuplicates(newLead, existingLeads);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].matchedFields).toContain('phone');
    });

    it('should find partial match with same email domain', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Smith', email: 'john@company.com' }),
      ];

      const newLead = { name: 'John Smyth', email: 'johnny@company.com' };
      const duplicates = findDuplicates(newLead, existingLeads, 70);

      // Should match on similar name + same domain
      expect(duplicates.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort duplicates by confidence (highest first)', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Smith', email: 'john@example.com' }),
        createMockLead({ id: 'lead-2', name: 'Johnny', email: 'exact@match.com' }),
      ];

      const newLead = { name: 'John Smyth', email: 'exact@match.com' };
      const duplicates = findDuplicates(newLead, existingLeads, 70);

      // Exact email match should be first
      expect(duplicates[0].confidence).toBe(100);
    });

    it('should respect confidence threshold', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John', email: 'john@example.com' }),
      ];

      const newLead = { name: 'Jonathan', email: 'different@example.com' };
      
      // With low threshold, might find match
      const lowThreshold = findDuplicates(newLead, existingLeads, 50);
      
      // With high threshold, should not find match
      const highThreshold = findDuplicates(newLead, existingLeads, 95);

      expect(highThreshold.length).toBeLessThanOrEqual(lowThreshold.length);
    });
  });

  describe('isDefiniteDuplicate', () => {
    it('should return lead for exact email match', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com' }),
      ];

      const result = isDefiniteDuplicate({ email: 'john@example.com' }, existingLeads);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('lead-1');
    });

    it('should return lead for exact phone match', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com', phone: '+919876543210' }),
      ];

      const result = isDefiniteDuplicate({ email: 'different@example.com', phone: '9876543210' }, existingLeads);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('lead-1');
    });

    it('should return null when no definite duplicate exists', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com', phone: '+1111111111' }),
      ];

      const result = isDefiniteDuplicate({ email: 'unique@example.com', phone: '+9999999999' }, existingLeads);

      expect(result).toBeNull();
    });

    it('should handle leads without phone numbers', () => {
      const existingLeads = [
        createMockLead({ id: 'lead-1', name: 'John Doe', email: 'john@example.com', phone: undefined }),
      ];

      const result = isDefiniteDuplicate({ email: 'different@example.com', phone: '+9999999999' }, existingLeads);

      expect(result).toBeNull();
    });
  });

  describe('getDuplicateWarning', () => {
    it('should return empty string for no duplicates', () => {
      const warning = getDuplicateWarning([]);

      expect(warning).toBe('');
    });

    it('should return email warning for exact email match', () => {
      const duplicates = [{
        lead: createMockLead({ name: 'John Doe' }),
        matchType: 'exact_email' as const,
        confidence: 100,
        matchedFields: ['email'],
      }];

      const warning = getDuplicateWarning(duplicates);

      expect(warning).toContain('email already exists');
      expect(warning).toContain('John Doe');
    });

    it('should return phone warning for exact phone match', () => {
      const duplicates = [{
        lead: createMockLead({ name: 'Jane Smith' }),
        matchType: 'exact_phone' as const,
        confidence: 95,
        matchedFields: ['phone'],
      }];

      const warning = getDuplicateWarning(duplicates);

      expect(warning).toContain('phone number already exists');
      expect(warning).toContain('Jane Smith');
    });

    it('should return potential duplicate warning for similar matches', () => {
      const duplicates = [{
        lead: createMockLead({ name: 'John Smith' }),
        matchType: 'similar_name' as const,
        confidence: 85,
        matchedFields: ['name'],
      }];

      const warning = getDuplicateWarning(duplicates);

      expect(warning).toContain('Potential duplicate');
      expect(warning).toContain('85%');
    });
  });
});
