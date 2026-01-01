'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import type { Feature } from '@/types/saas';
import { getStoredFeatures, saveStoredFeatures, addStoredFeature, deleteStoredFeature } from '@/lib/saas-data';

export default function FeaturesSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({ id: '', name: '', description: '', active: true });

  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setIsLoading(true);
    try {
      const data = await getStoredFeatures();
      setFeatures(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load features', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFeature = async (featureId: string, active: boolean) => {
    try {
      const updatedFeatures = features.map(f => 
        f.id === featureId ? { ...f, active } : f
      );
      await saveStoredFeatures(updatedFeatures);
      setFeatures(updatedFeatures);
      toast({ title: 'Updated', description: `Feature ${active ? 'enabled' : 'disabled'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature.id || !newFeature.name) {
      toast({ title: 'Error', description: 'ID and name required', variant: 'destructive' });
      return;
    }

    try {
      await addStoredFeature(newFeature);
      await loadFeatures();
      setIsAddDialogOpen(false);
      setNewFeature({ id: '', name: '', description: '', active: true });
      toast({ title: 'Added', description: 'Feature created' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add', variant: 'destructive' });
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Delete this feature?')) return;

    try {
      await deleteStoredFeature(featureId);
      await loadFeatures();
      toast({ title: 'Deleted', description: 'Feature removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Feature Flags</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Control platform feature availability
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
          <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1.5" />
          Add Feature
        </Button>
      </div>

      {/* Features List - Card based for mobile */}
      <div className="space-y-2 sm:space-y-3">
        {features.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <Icon icon="solar:widget-4-linear" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No features configured</p>
            </CardContent>
          </Card>
        ) : (
          features.map((feature) => (
            <Card key={feature.id} className="hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  {/* Feature Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{feature.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0 ${
                          feature.active 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {feature.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs font-mono text-muted-foreground mt-0.5">{feature.id}</p>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={feature.active}
                      onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Feature Dialog - Mobile First */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Add Feature</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Create a new feature flag</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Feature ID</Label>
              <Input
                placeholder="feat_my_feature"
                value={newFeature.id}
                onChange={(e) => setNewFeature({ ...newFeature, id: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Use snake_case with feat_ prefix</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name</Label>
              <Input
                placeholder="My Feature"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Input
                placeholder="What this feature does..."
                value={newFeature.description}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newFeature.active}
                onCheckedChange={(checked) => setNewFeature({ ...newFeature, active: checked })}
              />
              <Label className="text-xs">Active by default</Label>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:pt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-9 text-sm">
              Cancel
            </Button>
            <Button onClick={handleAddFeature} className="w-full sm:w-auto h-9 text-sm">
              Add Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
