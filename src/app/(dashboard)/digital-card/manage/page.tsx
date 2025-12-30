'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { getFriendlyLoading } from '@/lib/friendly-messages';
import {
  getUserDigitalCards,
  deleteDigitalCard,
} from '@/app/actions/digital-card-actions';
import { DigitalCard } from '@/lib/digital-card-types';
import {
  AlertCircle,
  Plus,
  ExternalLink,
  Share2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QRCodeGenerator from '@/components/digital-card/qr-code-generator';
import { getStoredPlans, getCompanyUsers } from '@/lib/saas-data';
import { Plan } from '@/types/saas';
import { 
  calculateDigitalCardLimit, 
  getDigitalCardLimitDescription,
  getDigitalCardUsagePercentage,
  getDigitalCardLimitStatus
} from '@/lib/plan-helpers';

export default function ManageDigitalCardsPage() {
  const router = useRouter();
  const { appUser, company, firebaseUser } = useAuth();

  const [cards, setCards] = useState<DigitalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    loadCards();
    loadPlanAndUsers();
  }, [appUser, company]);

  const loadPlanAndUsers = async () => {
    if (!company || !appUser) return;

    try {
      // Get all plans and find current plan
      const plans = await getStoredPlans();
      const currentPlan = plans.find(p => p.id === company.planId);
      setPlan(currentPlan || null);

      // Get user count
      const users = await getCompanyUsers(appUser.companyId);
      setUserCount(users.length);
    } catch (err) {
      console.error('Error loading plan and users:', err);
    }
  };

  const loadCards = async () => {
    if (!appUser || !company || !firebaseUser) {
      setLoading(false);
      return;
    }

    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await getUserDigitalCards({ 
        idToken, 
        companyId: company.id 
      });

      if (!result.success) {
        setError(result.error || 'Failed to load digital cards');
        setCards([]);
      } else {
        setCards(result.cards || []);
      }
    } catch (err) {
      console.error('Error loading cards:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCardId || !firebaseUser) return;

    setActionLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await deleteDigitalCard({ idToken, cardId: deleteCardId });

      if (!result.success) {
        setError(result.error || 'Failed to delete card');
      } else {
        await loadCards();
      }
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
      setDeleteCardId(null);
    }
  };

  const copyCardUrl = (username: string) => {
    const url = `${window.location.origin}/card/${username}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(username);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const shareCard = async (username: string) => {
    const url = `${window.location.origin}/card/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my Digital Card',
          url: url
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      copyCardUrl(username);
    }
  };

  if (!appUser || !company) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to manage your digital cards</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{getFriendlyLoading('data/loading')}</p>
        </div>
      </div>
    );
  }

  // Calculate card limits
  const maxCards = plan && userCount > 0 ? calculateDigitalCardLimit(plan, userCount) : 0;
  const currentCards = cards.length;
  const usagePercentage = getDigitalCardUsagePercentage(currentCards, maxCards);
  const limitStatus = getDigitalCardLimitStatus(currentCards, maxCards);
  const limitDescription = plan && userCount > 0 ? getDigitalCardLimitDescription(plan, userCount) : '';

  return (
    <div className="flex flex-col space-y-6 w-full h-full">
      {/* Header - Autosend style */}
      <div className="flex items-start justify-between">
        <div className="w-full space-y-2">
          <p className="text-stone-800 dark:text-stone-200 font-semibold text-lg">Digital Cards</p>
          <p className="text-stone-500 dark:text-stone-400 font-normal text-sm">
            Create and manage your digital business cards from here.
          </p>
        </div>
        <div>
          <Button onClick={() => router.push('/digital-card/create')} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 -ml-1" />
            New Card
          </Button>
        </div>
      </div>

      {/* Card Limit Indicator - Colorful style */}
      {plan && userCount > 0 && (
        <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-6 py-4 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-800 dark:text-stone-200 font-medium text-base">Card Usage</p>
                <p className="text-stone-500 dark:text-stone-400 font-normal text-sm">{limitDescription}</p>
              </div>
              {limitStatus === 'limit_reached' && (
                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700" onClick={() => router.push('/settings/subscription')}>
                  Upgrade Plan
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" className="-mr-1">
                    <path d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-stone-950 px-6 py-4">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-1">
                <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Used</p>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-2xl font-mono">{currentCards}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Limit</p>
                <p className="text-stone-800 dark:text-stone-200 font-semibold text-2xl font-mono">{maxCards}</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      limitStatus === 'limit_reached' ? 'bg-rose-500' :
                      limitStatus === 'warning' ? 'bg-amber-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Usage</p>
                <p className={`font-semibold text-lg font-mono ${
                  limitStatus === 'limit_reached' ? 'text-rose-600 dark:text-rose-400' :
                  limitStatus === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>{Math.round(usagePercentage)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-rose-200 dark:border-rose-800 rounded-2xl bg-rose-50 dark:bg-rose-950/20 px-6 py-4">
          <p className="text-rose-700 dark:text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-gradient-to-br from-white to-blue-50/50 dark:from-stone-950 dark:to-blue-950/20">
          <div className="py-12 px-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg">
              📇
            </div>
            <p className="text-stone-800 dark:text-stone-200 font-semibold text-lg">No digital cards yet</p>
            <p className="text-stone-500 dark:text-stone-400 font-normal text-sm max-w-md mx-auto">
              Create your first digital card to share your business information with customers
            </p>
            <Button onClick={() => router.push('/digital-card/create')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 -ml-1" />
              Create Your First Card
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 flex flex-col justify-between">
              {/* Card Content */}
              <div className="flex flex-col gap-4 p-6">
                {/* Header with name and status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-stone-800 dark:text-stone-200 font-semibold text-sm">{card.businessInfo.name}</p>
                    <p className="text-stone-500 dark:text-stone-400 font-normal text-xs">@{card.username}</p>
                  </div>
                  <span className="flex items-center gap-2">
                    <span className={`size-2.5 border-[1.5px] rounded-full ${
                      card.status === 'active' 
                        ? 'bg-emerald-300 border-emerald-700' 
                        : 'bg-stone-300 border-stone-500'
                    }`} />
                    <span className="text-stone-800 dark:text-stone-200 font-semibold text-xs tracking-[0.48px] font-mono uppercase">
                      {card.status}
                    </span>
                  </span>
                </div>

                {/* Stats row - Colorful */}
                <div className="flex items-center flex-wrap gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Views</p>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-xs font-mono">{card.analytics?.views || 0}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Clicks</p>
                    <p className="text-teal-600 dark:text-teal-400 font-semibold text-xs font-mono">
                      {Object.values(card.analytics?.linkClicks || {}).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Leads</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs font-mono">{card.analytics?.leadsGenerated || 0}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-stone-500 dark:text-stone-400 font-normal text-[10px] font-mono tracking-[0.4px] uppercase">Created</p>
                    <p className="text-stone-600 dark:text-stone-300 font-normal text-xs font-mono">
                      {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(`/card/${card.username}`, '_blank')}
                  >
                    View Card
                    <ExternalLink className="h-3 w-3 -mr-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCardUrl(card.username)}
                  >
                    {copiedUrl === card.username ? 'Copied!' : 'Copy URL'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareCard(card.username)}
                    className="!p-2"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <QRCodeGenerator
                    cardUrl={`${window.location.origin}/card/${card.username}`}
                    cardName={card.businessInfo.name}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>

              {/* Footer action - Autosend style */}
              <button
                onClick={() => router.push(`/digital-card/edit/${card.id}`)}
                className="rounded-b-2xl border-t border-stone-200 dark:border-stone-800 group w-full px-4 py-3 h-[44px] flex items-center font-semibold font-mono text-sm uppercase tracking-[0.56px] cursor-pointer transition-all outline-none bg-stone-100 dark:bg-stone-900 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 justify-between"
              >
                Edit
                <span className="group-hover:translate-x-1 transform-gpu transition-all duration-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteCardId} onOpenChange={(open) => !open && setDeleteCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your digital card
              and all associated analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
