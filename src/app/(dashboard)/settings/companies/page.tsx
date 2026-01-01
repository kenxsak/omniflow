'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import { getAllAdminsAndCompanies } from '@/lib/saas-data';
import type { Company, AppUser } from '@/types/saas';
import { format, formatDistanceToNow } from 'date-fns';

export default function CompaniesSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{ admin: AppUser; company: Company }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAdminsAndCompanies();
      setCompanies(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load companies', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(({ company, admin }) => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getPlanBadge = (planId: string) => {
    const plan = planId?.toLowerCase() || 'free';
    if (plan.includes('enterprise')) return 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300';
    if (plan.includes('pro')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
    if (plan.includes('starter')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
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
          <h2 className="text-base sm:text-lg font-semibold">All Companies</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Registered organizations on the platform
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-xs sm:text-sm px-2 py-1">
          {companies.length} Companies
        </Badge>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies or admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-sm"
          />
        </div>
        <Button variant="outline" onClick={loadCompanies} className="h-9 sm:h-10 px-3">
          <Icon icon="solar:refresh-linear" className="h-4 w-4" />
          <span className="ml-2 sm:inline hidden">Refresh</span>
        </Button>
      </div>

      {/* Companies List - Card based for mobile */}
      <div className="space-y-2 sm:space-y-3">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <Icon icon="solar:buildings-2-linear" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'No companies match your search' : 'No companies found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map(({ company, admin }) => (
            <Card key={company.id} className="hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Company Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50 flex items-center justify-center shrink-0">
                      <Icon icon="solar:buildings-2-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm truncate">{company.name || 'Unnamed Company'}</h3>
                        <Badge className={`text-[10px] px-1.5 py-0 ${getPlanBadge(company.planId || 'free')}`}>
                          {company.planId?.replace('plan_', '').toUpperCase() || 'FREE'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        <span>{admin.name || 'No name'}</span>
                        <span>•</span>
                        <span>{formatDate(company.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      <Icon icon="solar:eye-linear" className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
