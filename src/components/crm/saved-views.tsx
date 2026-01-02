"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';

export interface SavedView {
  id: string;
  name: string;
  icon: string;
  color: string;
  filters: {
    search?: string;
    status?: string[];
    source?: string[];
    temperature?: string[];
    tags?: string[];
    scoreRange?: [number, number];
    dateRange?: { from?: string; to?: string };
    assignedTo?: string;
  };
  isDefault?: boolean;
  createdAt: string;
}

// Pre-built smart views for non-tech users
const SMART_VIEWS: SavedView[] = [
  {
    id: 'hot-leads',
    name: 'Hot Leads 🔥',
    icon: 'solar:fire-bold',
    color: '#ef4444',
    filters: { temperature: ['hot'] },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'needs-followup',
    name: 'Needs Follow-up',
    icon: 'solar:clock-circle-bold',
    color: '#f59e0b',
    filters: { status: ['Contacted'], scoreRange: [40, 100] },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'new-this-week',
    name: 'New This Week',
    icon: 'solar:calendar-bold',
    color: '#3b82f6',
    filters: { status: ['New'] },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'high-value',
    name: 'High Value',
    icon: 'solar:dollar-bold',
    color: '#10b981',
    filters: { scoreRange: [70, 100] },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cold-leads',
    name: 'Cold Leads ❄️',
    icon: 'solar:snowflake-bold',
    color: '#6366f1',
    filters: { temperature: ['cold'] },
    createdAt: new Date().toISOString(),
  },
];

interface SavedViewsProps {
  currentFilters: SavedView['filters'];
  onApplyView: (filters: SavedView['filters']) => void;
  companyId: string;
}

export function SavedViews({ currentFilters, onApplyView, companyId }: SavedViewsProps) {
  const [views, setViews] = useState<SavedView[]>(SMART_VIEWS);
  const [customViews, setCustomViews] = useState<SavedView[]>([]);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const { toast } = useToast();

  // Load custom views from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`crm-views-${companyId}`);
    if (stored) {
      try {
        setCustomViews(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading saved views:', e);
      }
    }
  }, [companyId]);

  // Save custom views to localStorage
  const saveCustomViews = (newViews: SavedView[]) => {
    setCustomViews(newViews);
    localStorage.setItem(`crm-views-${companyId}`, JSON.stringify(newViews));
  };

  const handleApplyView = (view: SavedView) => {
    setActiveView(view.id);
    onApplyView(view.filters);
    toast({ title: `View: ${view.name}`, description: 'Filters applied' });
  };

  const handleSaveCurrentView = () => {
    if (!newViewName.trim()) {
      toast({ title: 'Enter a name', variant: 'destructive' });
      return;
    }

    const newView: SavedView = {
      id: `custom-${Date.now()}`,
      name: newViewName,
      icon: 'solar:bookmark-bold',
      color: '#8b5cf6',
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    saveCustomViews([...customViews, newView]);
    setShowSaveDialog(false);
    setNewViewName('');
    toast({ title: 'View saved!', description: `"${newViewName}" is now available` });
  };

  const handleDeleteView = (viewId: string) => {
    saveCustomViews(customViews.filter(v => v.id !== viewId));
    if (activeView === viewId) setActiveView(null);
    toast({ title: 'View deleted' });
  };

  const hasActiveFilters = Object.values(currentFilters).some(v => 
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="flex items-center gap-2">
      {/* Quick View Buttons - Most used views as pills */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
        {SMART_VIEWS.slice(0, 3).map((view) => (
          <Button
            key={view.id}
            variant={activeView === view.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleApplyView(view)}
            className="h-7 text-xs px-2.5 whitespace-nowrap"
            style={activeView === view.id ? { backgroundColor: view.color } : {}}
          >
            <Icon icon={view.icon} className="w-3 h-3 mr-1" />
            {view.name}
          </Button>
        ))}
      </div>

      {/* All Views Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Icon icon="solar:filter-bold" className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Views</span>
            {activeView && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
                1
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Smart Views
            </p>
          </div>
          {SMART_VIEWS.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => handleApplyView(view)}
              className="gap-2"
            >
              <Icon icon={view.icon} className="w-4 h-4" style={{ color: view.color }} />
              <span className="flex-1">{view.name}</span>
              {activeView === view.id && (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-500" />
              )}
            </DropdownMenuItem>
          ))}

          {customViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  My Views
                </p>
              </div>
              {customViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  className="gap-2 group"
                >
                  <div 
                    className="flex-1 flex items-center gap-2"
                    onClick={() => handleApplyView(view)}
                  >
                    <Icon icon={view.icon} className="w-4 h-4" style={{ color: view.color }} />
                    <span>{view.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteView(view.id);
                    }}
                  >
                    <Icon icon="solar:trash-bin-2-linear" className="w-3 h-3 text-destructive" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          
          {hasActiveFilters && (
            <DropdownMenuItem onClick={() => setShowSaveDialog(true)} className="gap-2">
              <Icon icon="solar:bookmark-linear" className="w-4 h-4 text-primary" />
              <span>Save Current Filters</span>
            </DropdownMenuItem>
          )}
          
          {activeView && (
            <DropdownMenuItem 
              onClick={() => {
                setActiveView(null);
                onApplyView({});
              }}
              className="gap-2 text-muted-foreground"
            >
              <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
              <span>Clear View</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save View Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] p-4 sm:p-5 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="solar:bookmark-bold" className="w-5 h-5 text-primary" />
              Save View
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Save your current filters as a reusable view
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g., My Hot Leads, Website Inquiries..."
              className="h-9 sm:h-10 text-sm"
              autoFocus
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCurrentView}
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon icon="solar:bookmark-bold" className="w-4 h-4 mr-1.5" />
                Save View
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
