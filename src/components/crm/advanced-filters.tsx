"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Icon } from '@iconify/react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import type { Lead } from '@/lib/mock-data';
import type { DateRange } from 'react-day-picker';

export interface LeadFilters {
  search: string;
  status: string;
  source: string;
  assignedTo: string;
  temperature: string;
  dateRange: DateRange | undefined;
  tags: string[];
  hasPhone: boolean | null;
  hasEmail: boolean | null;
  scoreMin: number | null;
  scoreMax: number | null;
}

export interface SavedView {
  id: string;
  name: string;
  filters: LeadFilters;
  isDefault?: boolean;
}

interface AdvancedFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  sources: string[];
  teamMembers: { id: string; name: string }[];
  tags: string[];
  savedViews?: SavedView[];
  onSaveView?: (name: string, filters: LeadFilters) => void;
  onDeleteView?: (viewId: string) => void;
  onApplyView?: (view: SavedView) => void;
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' },
];

const TEMPERATURE_OPTIONS = [
  { value: 'all', label: 'All Temperatures' },
  { value: 'hot', label: '🔥 Hot' },
  { value: 'warm', label: '🌡️ Warm' },
  { value: 'cold', label: '❄️ Cold' },
];

const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Yesterday', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This week', getValue: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'This month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
];

export function AdvancedFilters({
  filters,
  onFiltersChange,
  sources,
  teamMembers,
  tags,
  savedViews = [],
  onSaveView,
  onDeleteView,
  onApplyView,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false;
    if (value === 'all' || value === null || value === undefined) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const handleSaveView = () => {
    if (saveViewName.trim() && onSaveView) {
      onSaveView(saveViewName.trim(), filters);
      setSaveViewName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-8 h-9 sm:h-10 text-sm"
          />
        </div>

        {/* Quick Status Filter */}
        <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-9 sm:h-10 px-3 text-sm relative">
              <Icon icon="solar:filter-linear" className="w-4 h-4 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-[400px] p-4 sm:p-6">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-base sm:text-lg">Advanced Filters</SheetTitle>
            </SheetHeader>

            <div className="space-y-4 sm:space-y-5">
              {/* Saved Views */}
              {savedViews.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Saved Views</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {savedViews.map(view => (
                      <Badge
                        key={view.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs py-1 px-2"
                        onClick={() => onApplyView?.(view)}
                      >
                        {view.name}
                        {onDeleteView && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
                            className="ml-1.5 hover:text-destructive"
                          >
                            <Icon icon="solar:close-circle-linear" className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Source</Label>
                <Select value={filters.source} onValueChange={(v) => handleFilterChange('source', v)}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Sources</SelectItem>
                    {sources.map(src => (
                      <SelectItem key={src} value={src} className="text-sm">{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assigned To</Label>
                <Select value={filters.assignedTo} onValueChange={(v) => handleFilterChange('assignedTo', v)}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Team Members</SelectItem>
                    <SelectItem value="unassigned" className="text-sm">Unassigned</SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id} className="text-sm">{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Lead Temperature</Label>
                <Select value={filters.temperature} onValueChange={(v) => handleFilterChange('temperature', v)}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPERATURE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Created Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-9 sm:h-10 text-sm justify-start">
                      <Icon icon="solar:calendar-linear" className="w-4 h-4 mr-2" />
                      {filters.dateRange?.from ? (
                        filters.dateRange.to ? (
                          `${format(filters.dateRange.from, 'MMM d')} - ${format(filters.dateRange.to, 'MMM d')}`
                        ) : (
                          format(filters.dateRange.from, 'MMM d, yyyy')
                        )
                      ) : (
                        'Select date range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 border-b">
                      <div className="flex flex-wrap gap-1">
                        {DATE_PRESETS.map(preset => (
                          <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleFilterChange('dateRange', preset.getValue())}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Calendar
                      mode="range"
                      selected={filters.dateRange}
                      onSelect={(range) => handleFilterChange('dateRange', range)}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lead Score Range */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Lead Score</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    max={100}
                    value={filters.scoreMin ?? ''}
                    onChange={(e) => handleFilterChange('scoreMin', e.target.value ? Number(e.target.value) : null)}
                    className="h-9 sm:h-10 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    max={100}
                    value={filters.scoreMax ?? ''}
                    onChange={(e) => handleFilterChange('scoreMax', e.target.value ? Number(e.target.value) : null)}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs py-1 px-2"
                        onClick={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter(t => t !== tag)
                            : [...filters.tags, tag];
                          handleFilterChange('tags', newTags);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Clear All
                </Button>
                {onSaveView && (
                  <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <Icon icon="solar:bookmark-linear" className="w-3.5 h-3.5 mr-1.5" />
                        Save View
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                      <div className="space-y-2">
                        <Label className="text-xs">View Name</Label>
                        <Input
                          value={saveViewName}
                          onChange={(e) => setSaveViewName(e.target.value)}
                          placeholder="e.g., Hot Leads This Week"
                          className="h-8 text-sm"
                        />
                        <Button onClick={handleSaveView} size="sm" className="w-full h-8 text-xs">
                          Save
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-9 sm:h-10 px-2 text-xs text-muted-foreground"
          >
            <Icon icon="solar:close-circle-linear" className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2">
              Status: {filters.status}
              <button onClick={() => handleFilterChange('status', 'all')} className="ml-1">
                <Icon icon="solar:close-circle-linear" className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.source !== 'all' && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2">
              Source: {filters.source}
              <button onClick={() => handleFilterChange('source', 'all')} className="ml-1">
                <Icon icon="solar:close-circle-linear" className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.temperature !== 'all' && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2">
              {TEMPERATURE_OPTIONS.find(t => t.value === filters.temperature)?.label}
              <button onClick={() => handleFilterChange('temperature', 'all')} className="ml-1">
                <Icon icon="solar:close-circle-linear" className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.dateRange?.from && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2">
              {format(filters.dateRange.from, 'MMM d')} - {filters.dateRange.to ? format(filters.dateRange.to, 'MMM d') : '...'}
              <button onClick={() => handleFilterChange('dateRange', undefined)} className="ml-1">
                <Icon icon="solar:close-circle-linear" className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs py-0.5 px-2">
              {tag}
              <button onClick={() => handleFilterChange('tags', filters.tags.filter(t => t !== tag))} className="ml-1">
                <Icon icon="solar:close-circle-linear" className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Apply filters to leads array
 */
export function applyFiltersToLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  return leads.filter(lead => {
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.phone?.toLowerCase().includes(searchLower) ||
        lead.attributes?.COMPANY_NAME?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status
    if (filters.status !== 'all' && lead.status !== filters.status) return false;

    // Source
    if (filters.source !== 'all' && lead.source !== filters.source) return false;

    // Assigned To
    if (filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned' && lead.assignedTo) return false;
      if (filters.assignedTo !== 'unassigned' && lead.assignedTo !== filters.assignedTo) return false;
    }

    // Temperature
    if (filters.temperature !== 'all' && lead.temperature !== filters.temperature) return false;

    // Date Range
    if (filters.dateRange?.from) {
      const createdAt = lead.createdAt?.toDate?.() || new Date(lead.createdAt);
      if (createdAt < filters.dateRange.from) return false;
      if (filters.dateRange.to && createdAt > filters.dateRange.to) return false;
    }

    // Tags
    if (filters.tags.length > 0) {
      if (!lead.tags || !filters.tags.some(tag => lead.tags?.includes(tag))) return false;
    }

    // Score Range
    if (filters.scoreMin !== null && (lead.leadScore ?? 0) < filters.scoreMin) return false;
    if (filters.scoreMax !== null && (lead.leadScore ?? 0) > filters.scoreMax) return false;

    return true;
  });
}
