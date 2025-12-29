'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  // Redirect non-super admins
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
      toast({ title: 'Feature Updated', description: `Feature ${active ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update feature', variant: 'destructive' });
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature.id || !newFeature.name) {
      toast({ title: 'Error', description: 'Feature ID and name are required', variant: 'destructive' });
      return;
    }

    try {
      await addStoredFeature(newFeature);
      await loadFeatures();
      setIsAddDialogOpen(false);
      setNewFeature({ id: '', name: '', description: '', active: true });
      toast({ title: 'Feature Added', description: 'New feature created successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add feature', variant: 'destructive' });
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      await deleteStoredFeature(featureId);
      await loadFeatures();
      toast({ title: 'Feature Deleted', description: 'Feature removed successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete feature', variant: 'destructive' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted-foreground">
            Control which features are available across the platform
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Features</CardTitle>
          <CardDescription>Toggle features on/off to control availability</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-mono text-xs">{feature.id}</TableCell>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{feature.description || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={feature.active}
                      onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Feature Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Feature</DialogTitle>
            <DialogDescription>Create a new feature flag for the platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Feature ID</Label>
              <Input
                placeholder="feat_my_feature"
                value={newFeature.id}
                onChange={(e) => setNewFeature({ ...newFeature, id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Use snake_case with feat_ prefix</p>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="My Feature"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="What this feature does..."
                value={newFeature.description}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newFeature.active}
                onCheckedChange={(checked) => setNewFeature({ ...newFeature, active: checked })}
              />
              <Label>Active by default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFeature}>Add Feature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
