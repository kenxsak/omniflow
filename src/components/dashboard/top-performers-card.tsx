'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppIcon } from '@/components/ui/app-icon';
import type { TeamPerformer } from '@/app/actions/analytics-dashboard-actions';

interface TopPerformersCardProps {
  performers: TeamPerformer[];
  loading?: boolean;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const rankIcons = ['trophy', 'medal', 'award'];

export function TopPerformersCard({ performers, loading }: TopPerformersCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="trophy" size={16} className="text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold pt-1">Top Performers</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (performers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="trophy" size={16} className="text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
              <CardDescription>Your team leaderboard</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="h-10 w-10 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <AppIcon name="star" size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Close deals to appear on the leaderboard!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showTeamView = performers.length > 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
            <AppIcon name="trophy" size={16} className="text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              {showTeamView ? 'Top Performers' : 'Your Performance'}
            </CardTitle>
            <CardDescription>
              {showTeamView ? 'Team leaderboard by revenue' : 'Keep up the great work!'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performers.map((performer, index) => {
            const rankIcon = rankIcons[index] || 'star';
            
            return (
              <div 
                key={performer.userId}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40 dark:bg-white/[0.04] border-border/50 dark:border-white/[0.04] hover:bg-accent/50"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(performer.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center bg-muted">
                    <AppIcon name={rankIcon} size={12} className="text-foreground" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{performer.userName}</span>
                    {index === 0 && showTeamView && (
                      <Badge variant="outline" className="text-xs">
                        Top Seller
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{performer.dealsWon} deals won</span>
                    <span>{performer.conversionRate.toFixed(0)}% win rate</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 font-semibold">
                    <AppIcon name="dollar" size={14} />
                    {formatCurrency(performer.revenueWon)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(performer.avgDealSize)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
