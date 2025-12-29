'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyzeSEO, getScoreColor, getScoreBgColor, type SEOCheckResult } from '@/lib/seo-checker';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SEOScorePanelProps {
  htmlContent: string;
  onClose?: () => void;
}

export function SEOScorePanel({ htmlContent, onClose }: SEOScorePanelProps) {
  const [targetKeyword, setTargetKeyword] = useState('');
  const [result, setResult] = useState<SEOCheckResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    // Small delay for UX
    setTimeout(() => {
      const analysisResult = analyzeSEO({
        htmlContent,
        targetKeyword: targetKeyword || undefined,
      });
      setResult(analysisResult);
      setIsAnalyzing(false);
    }, 500);
  };

  // Auto-analyze on mount and when htmlContent changes
  useEffect(() => {
    if (htmlContent) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlContent]);

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Icon icon="solar:danger-triangle-bold" className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <Icon icon="solar:close-circle-bold" className="h-4 w-4 text-red-500" />;
    }
  };

  const getImportanceBadge = (importance: 'critical' | 'important' | 'minor') => {
    switch (importance) {
      case 'critical':
        return <Badge variant="destructive" className="text-[9px] h-4">Critical</Badge>;
      case 'important':
        return <Badge variant="default" className="text-[9px] h-4">Important</Badge>;
      case 'minor':
        return <Badge variant="secondary" className="text-[9px] h-4">Minor</Badge>;
    }
  };

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="p-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-2-bold" className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">SEO Score</h3>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <Icon icon="solar:close-circle-linear" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Keyword Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Target Keyword (optional)</Label>
            <Input
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              placeholder="e.g., digital marketing"
              className="h-8 text-sm mt-1"
            />
          </div>
          <Button 
            size="sm" 
            className="h-8 mt-5" 
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Score Display */}
        {result && (
          <>
            <div className={cn(
              "rounded-lg p-4 text-center",
              getScoreBgColor(result.score)
            )}>
              <div className={cn("text-4xl font-bold", getScoreColor(result.score))}>
                {result.score}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={cn("text-2xl font-bold", getScoreColor(result.score))}>
                  {result.grade}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <Progress value={result.score} className="h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-2">{result.summary}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {result.checks.filter(c => c.status === 'pass').length}
                </div>
                <div className="text-[10px] text-muted-foreground">Passed</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {result.checks.filter(c => c.status === 'warning').length}
                </div>
                <div className="text-[10px] text-muted-foreground">Warnings</div>
              </div>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {result.checks.filter(c => c.status === 'fail').length}
                </div>
                <div className="text-[10px] text-muted-foreground">Failed</div>
              </div>
            </div>

            {/* Detailed Checks */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs justify-between">
                  <span>Detailed Analysis</span>
                  <Icon 
                    icon={showDetails ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
                    className="h-3.5 w-3.5" 
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-[300px] mt-2">
                  <div className="space-y-2 pr-3">
                    {/* Critical Issues First */}
                    {result.checks
                      .sort((a, b) => {
                        const order = { critical: 0, important: 1, minor: 2 };
                        return order[a.importance] - order[b.importance];
                      })
                      .map((check) => (
                        <div 
                          key={check.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            check.status === 'pass' && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10",
                            check.status === 'warning' && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10",
                            check.status === 'fail' && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {getStatusIcon(check.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium">{check.name}</span>
                                {getImportanceBadge(check.importance)}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {check.message}
                              </p>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {check.points}/{check.maxPoints} points
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {isAnalyzing && !result && (
          <div className="flex items-center justify-center py-8">
            <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing SEO...</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact SEO Score Badge for inline display
 */
export function SEOScoreBadge({ 
  htmlContent, 
  onClick 
}: { 
  htmlContent: string; 
  onClick?: () => void;
}) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const result = analyzeSEO({ htmlContent });
    setScore(result.score);
  }, [htmlContent]);

  if (score === null) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-7 text-xs gap-1.5", getScoreColor(score))}
      onClick={onClick}
    >
      <Icon icon="solar:chart-2-bold" className="h-3.5 w-3.5" />
      SEO: {score}/100
    </Button>
  );
}
