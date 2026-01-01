'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function CompanySwitcher() {
  const { company, agencyCompanies, isAgencyUser, switchCompany, appUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't render if not an agency user or no companies to switch between
  if (!isAgencyUser || agencyCompanies.length <= 1) {
    return null;
  }

  const handleSwitch = async (companyId: string) => {
    if (companyId === company?.id) {
      setIsOpen(false);
      return;
    }
    
    setIsSwitching(true);
    await switchCompany(companyId);
    setIsSwitching(false);
    setIsOpen(false);
  };

  const isPrimaryCompany = (companyId: string) => companyId === appUser?.companyId;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 sm:h-9 gap-1.5 sm:gap-2 text-xs sm:text-sm max-w-[140px] sm:max-w-[200px]"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon icon="solar:buildings-2-linear" className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{company?.name || 'Select Company'}</span>
          <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] sm:w-[280px]">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5" />
          Switch Client Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {agencyCompanies.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => handleSwitch(c.id)}
            className={cn(
              "flex items-center justify-between gap-2 cursor-pointer py-2",
              c.id === company?.id && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0",
                c.id === company?.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {c.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                {isPrimaryCompany(c.id) && (
                  <p className="text-[10px] text-muted-foreground">Your Agency</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {isPrimaryCompany(c.id) && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  Home
                </Badge>
              )}
              {c.id === company?.id && (
                <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
          <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 mr-2" />
          {agencyCompanies.length} client{agencyCompanies.length !== 1 ? 's' : ''} connected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
