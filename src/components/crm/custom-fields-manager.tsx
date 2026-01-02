"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';

export interface CustomField {
  id: string;
  name: string;
  key: string; // Firestore field key
  type: 'text' | 'number' | 'date' | 'select' | 'email' | 'phone' | 'url' | 'currency';
  options?: string[]; // For select type
  required: boolean;
  showInTable: boolean;
  showInCard: boolean;
  placeholder?: string;
  icon?: string;
  createdAt: string;
}

// Pre-built field templates for non-tech users
const FIELD_TEMPLATES: Omit<CustomField, 'id' | 'createdAt'>[] = [
  { name: 'Budget', key: 'budget', type: 'currency', required: false, showInTable: true, showInCard: true, icon: 'solar:wallet-bold', placeholder: 'Enter budget' },
  { name: 'Industry', key: 'industry', type: 'select', options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Other'], required: false, showInTable: true, showInCard: false, icon: 'solar:buildings-bold' },
  { name: 'Company Size', key: 'companySize', type: 'select', options: ['1-10', '11-50', '51-200', '201-500', '500+'], required: false, showInTable: false, showInCard: true, icon: 'solar:users-group-rounded-bold' },
  { name: 'Website', key: 'website', type: 'url', required: false, showInTable: false, showInCard: true, icon: 'solar:global-bold', placeholder: 'https://' },
  { name: 'LinkedIn', key: 'linkedin', type: 'url', required: false, showInTable: false, showInCard: true, icon: 'mdi:linkedin', placeholder: 'LinkedIn profile URL' },
  { name: 'Decision Date', key: 'decisionDate', type: 'date', required: false, showInTable: true, showInCard: true, icon: 'solar:calendar-bold' },
  { name: 'Referral Source', key: 'referralSource', type: 'text', required: false, showInTable: false, showInCard: false, icon: 'solar:share-bold', placeholder: 'Who referred them?' },
  { name: 'Product Interest', key: 'productInterest', type: 'select', options: ['Basic Plan', 'Pro Plan', 'Enterprise', 'Custom Solution'], required: false, showInTable: true, showInCard: true, icon: 'solar:box-bold' },
];

interface CustomFieldsManagerProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldsChange?: (fields: CustomField[]) => void;
}

export function CustomFieldsManager({ companyId, open, onOpenChange, onFieldsChange }: CustomFieldsManagerProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const { toast } = useToast();

  // Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomField['type']>('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [showInTable, setShowInTable] = useState(true);
  const [showInCard, setShowInCard] = useState(true);

  // Load fields from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`crm-custom-fields-${companyId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFields(parsed);
        onFieldsChange?.(parsed);
      } catch (e) {
        console.error('Error loading custom fields:', e);
      }
    }
  }, [companyId, onFieldsChange]);

  const saveFields = (newFields: CustomField[]) => {
    setFields(newFields);
    localStorage.setItem(`crm-custom-fields-${companyId}`, JSON.stringify(newFields));
    onFieldsChange?.(newFields);
  };

  const resetForm = () => {
    setFieldName('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setShowInTable(true);
    setShowInCard(true);
    setEditingField(null);
  };

  const handleAddTemplate = (template: typeof FIELD_TEMPLATES[0]) => {
    // Check if field already exists
    if (fields.some(f => f.key === template.key)) {
      toast({ title: 'Field already exists', variant: 'destructive' });
      return;
    }

    const newField: CustomField = {
      ...template,
      id: `field-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    saveFields([...fields, newField]);
    toast({ title: `Added "${template.name}" field` });
  };

  const handleSaveField = () => {
    if (!fieldName.trim()) {
      toast({ title: 'Enter field name', variant: 'destructive' });
      return;
    }

    const key = fieldName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    if (!editingField && fields.some(f => f.key === key)) {
      toast({ title: 'Field with this name already exists', variant: 'destructive' });
      return;
    }

    const field: CustomField = {
      id: editingField?.id || `field-${Date.now()}`,
      name: fieldName,
      key,
      type: fieldType,
      options: fieldType === 'select' ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      required: fieldRequired,
      showInTable,
      showInCard,
      createdAt: editingField?.createdAt || new Date().toISOString(),
    };

    if (editingField) {
      saveFields(fields.map(f => f.id === editingField.id ? field : f));
      toast({ title: 'Field updated' });
    } else {
      saveFields([...fields, field]);
      toast({ title: 'Field added' });
    }

    setShowAddDialog(false);
    resetForm();
  };

  const handleDeleteField = (fieldId: string) => {
    saveFields(fields.filter(f => f.id !== fieldId));
    toast({ title: 'Field deleted' });
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setFieldOptions(field.options?.join(', ') || '');
    setFieldRequired(field.required);
    setShowInTable(field.showInTable);
    setShowInCard(field.showInCard);
    setShowAddDialog(true);
  };

  const typeIcons: Record<CustomField['type'], string> = {
    text: 'solar:text-bold',
    number: 'solar:hashtag-bold',
    date: 'solar:calendar-bold',
    select: 'solar:list-bold',
    email: 'solar:letter-bold',
    phone: 'solar:phone-bold',
    url: 'solar:link-bold',
    currency: 'solar:dollar-bold',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[520px] sm:max-w-[600px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:settings-bold" className="w-5 h-5 text-primary" />
            Custom Fields
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Add custom fields to capture more information about your leads
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Add Templates */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Quick Add (One-Click)</Label>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_TEMPLATES.filter(t => !fields.some(f => f.key === t.key)).slice(0, 6).map((template) => (
                <Button
                  key={template.key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTemplate(template)}
                  className="h-7 text-xs px-2"
                >
                  <Icon icon={template.icon || 'solar:add-circle-linear'} className="w-3 h-3 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Your Custom Fields</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { resetForm(); setShowAddDialog(true); }}
                className="h-7 text-xs"
              >
                <Icon icon="solar:add-circle-linear" className="w-3 h-3 mr-1" />
                Create New
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Icon icon="solar:box-linear" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No custom fields yet</p>
                <p className="text-xs">Click templates above or create your own</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-lg group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon icon={field.icon || typeIcons[field.type]} className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.name}</span>
                        {field.required && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground capitalize">{field.type}</span>
                        {field.showInTable && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">Table</Badge>
                        )}
                        {field.showInCard && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">Card</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEditField(field)}
                      >
                        <Icon icon="solar:pen-linear" className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Icon icon="solar:trash-bin-2-linear" className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Field Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[400px] p-4 sm:p-5 rounded-xl">
            <DialogHeader className="space-y-1 pb-2">
              <DialogTitle className="text-base sm:text-lg">
                {editingField ? 'Edit Field' : 'Create Custom Field'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Field Name</Label>
                <Input
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., Budget, Industry, Decision Date"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Field Type</Label>
                <Select value={fieldType} onValueChange={(v) => setFieldType(v as CustomField['type'])}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="url">URL/Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fieldType === 'select' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Options (comma separated)</Label>
                  <Input
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <Label className="text-xs font-medium">Required Field</Label>
                <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className="text-xs font-medium">Show in Table</Label>
                <Switch checked={showInTable} onCheckedChange={setShowInTable} />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className="text-xs font-medium">Show in Lead Card</Label>
                <Switch checked={showInCard} onCheckedChange={setShowInCard} />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setShowAddDialog(false); resetForm(); }}
                  className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveField}
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  {editingField ? 'Update Field' : 'Add Field'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Hook to get custom fields
export function useCustomFields(companyId: string) {
  const [fields, setFields] = useState<CustomField[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(`crm-custom-fields-${companyId}`);
    if (stored) {
      try {
        setFields(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading custom fields:', e);
      }
    }
  }, [companyId]);

  return fields;
}
