// CRM Components Index
// Export all CRM components for easy importing

// Core Components
export { LeadScoreBadge, getScoreColor, getTemperatureColor, getTemperatureLabel } from './lead-score-badge';
export { DuplicateWarning } from './duplicate-warning';
export { BulkActionsBar } from './bulk-actions-bar';
export { AdvancedFilters } from './advanced-filters';
export { QuickActivityLogger } from './quick-activity-logger';
export { QuickEmailComposer } from './quick-email-composer';

// AI-Powered Components
export { AILeadInsights } from './ai-lead-insights';
export { AINextBestAction } from './ai-next-best-action';
export { AIFollowupGenerator } from './ai-followup-generator';

// Analytics & Forecasting
export { SalesForecast } from './sales-forecast';
export { LeadSourceTracker } from './lead-source-tracker';

// Pipeline & Views
export { SavedViews, type SavedView } from './saved-views';
export { PipelineManager, usePipelines, DEFAULT_PIPELINE, type Pipeline, type PipelineStage } from './pipeline-manager';

// Customization
export { CustomFieldsManager, useCustomFields, type CustomField } from './custom-fields-manager';

// Quotes & Proposals
export { QuickQuoteGenerator } from './quick-quote-generator';

// Utilities
export { calculateLeadScore, getTemperature, type ScoreFactors } from '@/lib/crm/lead-scoring';
export { findDuplicates, type DuplicateMatch } from '@/lib/crm/duplicate-detection';
