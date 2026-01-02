import { describe, it, expect } from 'vitest';
import { applyFiltersToLeads, type LeadFilters } from './advanced-filters';
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

const DEFAULT_FILTERS: LeadFilters = {
  search: '',
  status: 'all',
  source: 'all',
  assignedTo: 'all',
  temperature: 'all',
  dateRange: undefined,
  tags: [],
  hasPhone: null,
  hasEmail: null,
  scoreMin: null,
  scoreMax: null,
};

describe('Advanced Filters - applyFiltersToLeads', () => {
  describe('Search Filter', () => {
    it('should filter by name', () => {
      const leads = [
        createMockLead({ name: 'John Doe', email: 'john@example.com' }),
        createMockLead({ name: 'Jane Smith', email: 'jane@example.com' }),
        createMockLead({ name: 'Bob Johnson', email: 'bob@example.com' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, search: 'john' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2); // John Doe and Bob Johnson
    });

    it('should filter by email', () => {
      const leads = [
        createMockLead({ name: 'John', email: 'john@company.com' }),
        createMockLead({ name: 'Jane', email: 'jane@different.com' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, search: 'company.com' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should filter by phone', () => {
      const leads = [
        createMockLead({ name: 'John', phone: '+919876543210' }),
        createMockLead({ name: 'Jane', phone: '+14155551234' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, search: '9876' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should filter by company name in attributes', () => {
      const leads = [
        createMockLead({ name: 'John', attributes: { COMPANY_NAME: 'Acme Corp' } }),
        createMockLead({ name: 'Jane', attributes: { COMPANY_NAME: 'Tech Inc' } }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, search: 'acme' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should be case insensitive', () => {
      const leads = [
        createMockLead({ name: 'JOHN DOE', email: 'john@example.com' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, search: 'john doe' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
    });
  });

  describe('Status Filter', () => {
    it('should filter by status', () => {
      const leads = [
        createMockLead({ name: 'John', status: 'New' }),
        createMockLead({ name: 'Jane', status: 'Contacted' }),
        createMockLead({ name: 'Bob', status: 'New' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, status: 'New' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
      expect(result.every(l => l.status === 'New')).toBe(true);
    });

    it('should return all leads when status is "all"', () => {
      const leads = [
        createMockLead({ status: 'New' }),
        createMockLead({ status: 'Contacted' }),
        createMockLead({ status: 'Won' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, status: 'all' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(3);
    });
  });

  describe('Source Filter', () => {
    it('should filter by source', () => {
      const leads = [
        createMockLead({ name: 'John', source: 'Website' }),
        createMockLead({ name: 'Jane', source: 'Referral' }),
        createMockLead({ name: 'Bob', source: 'Website' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, source: 'Website' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
      expect(result.every(l => l.source === 'Website')).toBe(true);
    });
  });

  describe('Assigned To Filter', () => {
    it('should filter by assigned user', () => {
      const leads = [
        createMockLead({ name: 'John', assignedTo: 'user-1' }),
        createMockLead({ name: 'Jane', assignedTo: 'user-2' }),
        createMockLead({ name: 'Bob', assignedTo: 'user-1' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, assignedTo: 'user-1' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
      expect(result.every(l => l.assignedTo === 'user-1')).toBe(true);
    });

    it('should filter unassigned leads', () => {
      const leads = [
        createMockLead({ name: 'John', assignedTo: 'user-1' }),
        createMockLead({ name: 'Jane', assignedTo: undefined }),
        createMockLead({ name: 'Bob', assignedTo: undefined }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, assignedTo: 'unassigned' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
      expect(result.every(l => !l.assignedTo)).toBe(true);
    });
  });

  describe('Temperature Filter', () => {
    it('should filter by temperature', () => {
      const leads = [
        createMockLead({ name: 'John', temperature: 'hot' }),
        createMockLead({ name: 'Jane', temperature: 'warm' }),
        createMockLead({ name: 'Bob', temperature: 'hot' }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, temperature: 'hot' };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
      expect(result.every(l => l.temperature === 'hot')).toBe(true);
    });
  });

  describe('Tags Filter', () => {
    it('should filter by tags', () => {
      const leads = [
        createMockLead({ name: 'John', tags: ['vip', 'enterprise'] }),
        createMockLead({ name: 'Jane', tags: ['startup'] }),
        createMockLead({ name: 'Bob', tags: ['vip'] }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, tags: ['vip'] };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
    });

    it('should match any tag (OR logic)', () => {
      const leads = [
        createMockLead({ name: 'John', tags: ['vip'] }),
        createMockLead({ name: 'Jane', tags: ['enterprise'] }),
        createMockLead({ name: 'Bob', tags: ['startup'] }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, tags: ['vip', 'enterprise'] };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
    });
  });

  describe('Score Range Filter', () => {
    it('should filter by minimum score', () => {
      const leads = [
        createMockLead({ name: 'John', leadScore: 80 }),
        createMockLead({ name: 'Jane', leadScore: 50 }),
        createMockLead({ name: 'Bob', leadScore: 30 }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, scoreMin: 50 };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
    });

    it('should filter by maximum score', () => {
      const leads = [
        createMockLead({ name: 'John', leadScore: 80 }),
        createMockLead({ name: 'Jane', leadScore: 50 }),
        createMockLead({ name: 'Bob', leadScore: 30 }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, scoreMax: 60 };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(2);
    });

    it('should filter by score range', () => {
      const leads = [
        createMockLead({ name: 'John', leadScore: 80 }),
        createMockLead({ name: 'Jane', leadScore: 50 }),
        createMockLead({ name: 'Bob', leadScore: 30 }),
      ];

      const filters: LeadFilters = { ...DEFAULT_FILTERS, scoreMin: 40, scoreMax: 70 };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane');
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', () => {
      const leads = [
        createMockLead({ name: 'John', status: 'New', source: 'Website', temperature: 'hot' }),
        createMockLead({ name: 'Jane', status: 'New', source: 'Referral', temperature: 'hot' }),
        createMockLead({ name: 'Bob', status: 'Contacted', source: 'Website', temperature: 'hot' }),
        createMockLead({ name: 'Alice', status: 'New', source: 'Website', temperature: 'cold' }),
      ];

      const filters: LeadFilters = {
        ...DEFAULT_FILTERS,
        status: 'New',
        source: 'Website',
        temperature: 'hot',
      };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should combine search with other filters', () => {
      const leads = [
        createMockLead({ name: 'John Doe', status: 'New' }),
        createMockLead({ name: 'John Smith', status: 'Contacted' }),
        createMockLead({ name: 'Jane Doe', status: 'New' }),
      ];

      const filters: LeadFilters = {
        ...DEFAULT_FILTERS,
        search: 'john',
        status: 'New',
      };
      const result = applyFiltersToLeads(leads, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });
  });
});
