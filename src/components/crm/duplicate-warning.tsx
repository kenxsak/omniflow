"use client";

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { DuplicateMatch } from '@/lib/crm/duplicate-detection';
import type { Lead } from '@/lib/mock-data';
import Link from 'next/link';

interface DuplicateWarningProps {
  duplicates: DuplicateMatch[];
  onIgnore?: () => void;
  onViewDuplicate?: (lead: Lead) => void;
  onMerge?: (existingLead: Lead) => void;
}

export function DuplicateWarning({ duplicates, onIgnore, onViewDuplicate, onMerge }: DuplicateWarningProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (duplicates.length === 0) return null;

  const topMatch = duplicates[0];
  const isDefinite = topMatch.confidence >= 95;

  return (
    <>
      <Alert variant={isDefinite ? 'destructive' : 'default'} className="mb-3 sm:mb-4">
        <Icon 
          icon={isDefinite ? 'solar:danger-triangle-linear' : 'solar:info-circle-linear'} 
          className="h-4 w-4" 
        />
        <AlertTitle className="text-xs sm:text-sm font-medium">
          {isDefinite ? 'Duplicate Contact Found' : 'Potential Duplicate'}
        </AlertTitle>
        <AlertDescription className="text-xs sm:text-sm mt-1">
          <p className="mb-2">
            {isDefinite 
              ? `A contact with this ${topMatch.matchedFields.join(' and ')} already exists.`
              : `Found ${duplicates.length} potential duplicate${duplicates.length > 1 ? 's' : ''}.`
            }
          </p>
          
          {/* Top Match Preview */}
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">{topMatch.lead.name}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {topMatch.lead.email} {topMatch.lead.phone && `• ${topMatch.lead.phone}`}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {topMatch.confidence}% match
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="h-7 text-xs"
            >
              <Icon icon="solar:eye-linear" className="w-3 h-3 mr-1" />
              View Details
            </Button>
            {onMerge && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMerge(topMatch.lead)}
                className="h-7 text-xs"
              >
                <Icon icon="solar:link-linear" className="w-3 h-3 mr-1" />
                Update Existing
              </Button>
            )}
            {onIgnore && !isDefinite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onIgnore}
                className="h-7 text-xs text-muted-foreground"
              >
                Create Anyway
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[500px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Duplicate Contacts</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''} found
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {duplicates.map((match, idx) => (
              <div 
                key={match.lead.id} 
                className="p-3 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{match.lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.lead.email}</p>
                    {match.lead.phone && (
                      <p className="text-xs text-muted-foreground">{match.lead.phone}</p>
                    )}
                  </div>
                  <Badge 
                    variant={match.confidence >= 95 ? 'destructive' : 'secondary'}
                    className="text-[10px] shrink-0"
                  >
                    {match.confidence}%
                  </Badge>
                </div>

                {/* Match Details */}
                <div className="flex flex-wrap gap-1">
                  {match.matchedFields.map(field => (
                    <Badge key={field} variant="outline" className="text-[10px]">
                      {field === 'email' && '📧 Email Match'}
                      {field === 'phone' && '📱 Phone Match'}
                      {field === 'name' && '👤 Name Similar'}
                      {field === 'email_domain' && '🏢 Same Domain'}
                    </Badge>
                  ))}
                </div>

                {/* Status & Source */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{match.lead.status}</Badge>
                  <span>•</span>
                  <span>{match.lead.source}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Link href={`/crm/leads/${match.lead.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                      <Icon icon="solar:eye-linear" className="w-3 h-3 mr-1" />
                      View Contact
                    </Button>
                  </Link>
                  {onMerge && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { onMerge(match.lead); setShowDetails(false); }}
                      className="flex-1 h-8 text-xs"
                    >
                      <Icon icon="solar:link-linear" className="w-3 h-3 mr-1" />
                      Update This
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            {onIgnore && (
              <Button
                variant="default"
                onClick={() => { onIgnore(); setShowDetails(false); }}
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                Create New Contact
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
