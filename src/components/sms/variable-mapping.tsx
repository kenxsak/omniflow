"use client";

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseTemplateVariables, replaceTemplateVariables, getValueFromContact, type TemplateVariable } from '@/lib/sms-templates-sync';
import type { SMSTemplate } from '@/lib/sms-templates-sync';

export interface VariableMapping {
  position: number;
  placeholder: string;
  mappingType: 'field' | 'static';
  fieldMapping?: string;
  staticValue?: string;
}

interface VariableMappingProps {
  template: SMSTemplate | null;
  provider: 'msg91' | 'fast2sms' | 'twilio';
  contacts?: { name?: string; phone?: string; email?: string; [key: string]: any }[];
  onMappingsChange: (mappings: VariableMapping[]) => void;
}

const DEFAULT_CONTACT_FIELDS = [
  { value: 'contact.name', label: 'Contact Name' },
  { value: 'contact.phone', label: 'Phone Number' },
  { value: 'contact.email', label: 'Email Address' },
];

export function VariableMapping({ template, provider, contacts = [], onMappingsChange }: VariableMappingProps) {
  const [mappings, setMappings] = useState<VariableMapping[]>([]);

  // Dynamically detect available contact fields from loaded contacts
  const availableContactFields = useMemo(() => {
    const fields = [...DEFAULT_CONTACT_FIELDS];
    
    // Add custom fields found in contacts
    if (contacts.length > 0) {
      const firstContact = contacts[0];
      const customFieldKeys = Object.keys(firstContact).filter(
        key => !['name', 'phone', 'email', 'phoneNumber', 'id', 'createdAt', 'updatedAt', 'listId', 'companyId'].includes(key)
      );
      
      customFieldKeys.forEach(key => {
        const fieldValue = firstContact[key];
        // Only add if it's a simple value (string, number)
        if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
          fields.push({
            value: `contact.${key}`,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
          });
        }
      });
    }
    
    return fields;
  }, [contacts]);

  const parsedVariables = useMemo(() => {
    if (!template?.text) return { count: 0, positions: [] };
    return parseTemplateVariables(template.text, provider);
  }, [template?.text, provider]);

  useEffect(() => {
    if (parsedVariables.count > 0) {
      const initialMappings: VariableMapping[] = parsedVariables.positions.map((pos, index) => ({
        position: index + 1,
        placeholder: pos.placeholder,
        mappingType: index === 0 ? 'field' : 'static',
        fieldMapping: index === 0 ? 'contact.name' : undefined,
        staticValue: undefined,
      }));
      setMappings(initialMappings);
      onMappingsChange(initialMappings);
    } else {
      setMappings([]);
      onMappingsChange([]);
    }
  }, [parsedVariables, onMappingsChange]);

  const handleMappingTypeChange = (index: number, type: 'field' | 'static') => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      mappingType: type,
      fieldMapping: type === 'field' ? 'contact.name' : undefined,
      staticValue: type === 'static' ? '' : undefined,
    };
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const handleFieldMappingChange = (index: number, fieldMapping: string) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      fieldMapping,
    };
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const handleStaticValueChange = (index: number, staticValue: string) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      staticValue,
    };
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const previewMessage = useMemo(() => {
    if (!template?.text || mappings.length === 0) return template?.text || '';
    
    const sampleContact = contacts[0] || { name: 'John Doe', phone: '+919876543210', email: 'john@example.com' };
    
    const values = mappings.map(mapping => {
      if (mapping.mappingType === 'static') {
        return mapping.staticValue || '[value]';
      }
      return getValueFromContact(sampleContact, mapping.fieldMapping, '[value]');
    });
    
    return replaceTemplateVariables(template.text, provider, values);
  }, [template?.text, mappings, contacts, provider]);

  const highlightedTemplate = useMemo(() => {
    if (!template?.text) return null;
    
    let result = template.text;
    const pattern = provider === 'msg91' ? /##[^#]+##/g : /\{#[^}]+#\}/g;
    
    result = result.replace(pattern, (match) => {
      return `<span class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1 rounded font-medium">${match}</span>`;
    });
    
    return result;
  }, [template?.text, provider]);

  if (!template) {
    return null;
  }

  if (parsedVariables.count === 0) {
    return (
      <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50">
        <p className="text-sm text-foreground">
          This template has no variables to map. The message will be sent as-is to all recipients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Variable Mapping</p>
            <span className="px-1.5 py-0.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 text-muted-foreground rounded">
              {parsedVariables.count} variable{parsedVariables.count > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Map each variable to a contact field or enter a static value
          </p>
        </div>
        <div className="p-4 space-y-4">
          {mappings.map((mapping, index) => (
            <div key={index} className="space-y-2 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 font-mono text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                  {mapping.placeholder}
                </span>
                <span className="text-sm text-muted-foreground">
                  Variable {index + 1}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mapping Type</Label>
                  <Select
                    value={mapping.mappingType}
                    onValueChange={(value) => handleMappingTypeChange(index, value as 'field' | 'static')}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field">Contact Field</SelectItem>
                      <SelectItem value="static">Static Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mapping.mappingType === 'field' ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Select Field</Label>
                    <Select
                      value={mapping.fieldMapping || 'contact.name'}
                      onValueChange={(value) => handleFieldMappingChange(index, value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContactFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Enter Value</Label>
                    <Input
                      value={mapping.staticValue || ''}
                      onChange={(e) => handleStaticValueChange(index, e.target.value)}
                      placeholder="Enter value for all recipients"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Tip:</span> Use "Contact Field" to personalize messages for each recipient, 
              or "Static Value" to use the same value for everyone.
            </p>
          </div>
        </div>
      </div>

      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="text-muted-foreground">📋</span>
            Template Preview
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Original Template:</p>
            <div 
              className="text-sm text-foreground p-2 bg-stone-50 dark:bg-stone-900/50 rounded border border-stone-200 dark:border-stone-800"
              dangerouslySetInnerHTML={{ __html: highlightedTemplate || '' }}
            />
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Preview ({contacts[0]?.name || 'Sample Contact'}):
            </p>
            <div className="text-sm text-foreground p-2 bg-stone-50 dark:bg-stone-900/50 rounded border border-stone-200 dark:border-stone-800">
              {previewMessage}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
