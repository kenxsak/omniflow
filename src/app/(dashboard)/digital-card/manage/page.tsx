'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getFriendlyLoading } from '@/lib/friendly-messages';
import {
  getUserDigitalCards,
  deleteDigitalCard,
  updateCardStatus
} from '@/app/actions/digital-card-actions';
import { DigitalCard } from '@/lib/digital-card-types';
import {
  AlertCircle,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  QrCode,
  BarChart3,
  Copy,
  Share2,
  ArrowUpCircle,
  Sparkles
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

  const toggleCardStatus = async (card: DigitalCard) => {
    if (!firebaseUser) return;

    setActionLoading(true);
    try {
      const newStatus = card.status === 'active' ? 'inactive' : 'active';
      const idToken = await firebaseUser.getIdToken();
      const result = await updateCardStatus({ idToken, cardId: card.id, status: newStatus });

      if (!result.success) {
        setError(result.error || 'Failed to update card status');
      } else {
        await loadCards();
      }
    } catch (err) {
      console.error('Error updating card status:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
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
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Digital Cards</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage your digital business cards
          </p>
        </div>
        <Button onClick={() => router.push('/digital-card/create')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create New Card
        </Button>
      </div>

      {/* Card Limit Indicator */}
      {plan && userCount > 0 && (
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Digital Card Usage
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  {limitDescription}
                </p>
                
                {/* Progress bar */}
                <div className="mb-2">
                  <Progress 
                    value={usagePercentage} 
                    className={`h-2 sm:h-3 ${
                      limitStatus === 'limit_reached' 
                        ? 'bg-red-100' 
                        : limitStatus === 'warning' 
                          ? 'bg-yellow-100' 
                          : 'bg-blue-100'
                    }`}
                  />
                </div>
                
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-[10px] sm:text-xs text-gray-500">
                  <span>
                    <span className={`font-semibold ${
                      limitStatus === 'limit_reached' ? 'text-red-600' :
                      limitStatus === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {currentCards} of {maxCards}
                    </span> cards used
                    {plan.digitalCardsPerUser && plan.digitalCardsPerUser > 0 && (
                      <span className="hidden sm:inline ml-2 text-muted-foreground">
                        • {userCount} team {userCount === 1 ? 'member' : 'members'} × {plan.digitalCardsPerUser} {plan.digitalCardsPerUser === 1 ? 'card' : 'cards'} each
                      </span>
                    )}
                  </span>
                  <span className={`font-medium ${
                    limitStatus === 'limit_reached' ? 'text-red-600' :
                    limitStatus === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {Math.round(usagePercentage)}%
                  </span>
                </div>
              </div>
              
              {limitStatus === 'limit_reached' && (
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => router.push('/settings/subscription')}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>
            
            {/* Pro tip when approaching limit */}
            {plan.id !== 'plan_enterprise' && limitStatus !== 'ok' && (
              <div className="mt-4 p-2 sm:p-3 bg-white rounded-md border border-blue-200">
                <p className="text-xs sm:text-sm text-gray-700">
                  💡 <strong>Pro tip:</strong>{' '}
                  {plan.id === 'plan_free' && 'Upgrade to Starter to add team members - each gets their own card!'}
                  {plan.id === 'plan_starter' && 'Upgrade to Pro - each team member gets 2 cards instead of 1!'}
                  {plan.id === 'plan_pro' && 'Upgrade to Enterprise for 3 cards per team member!'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12">
            <div className="text-center space-y-4">
              <div className="text-5xl sm:text-6xl mb-4">📇</div>
              <h3 className="text-lg sm:text-xl font-semibold">No digital cards yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Create your first digital card to share your business information with customers
              </p>
              <Button onClick={() => router.push('/digital-card/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Card
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">
                      {card.businessInfo.name}
                    </CardTitle>
                    <CardDescription className="truncate text-xs sm:text-sm">
                      @{card.username}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={card.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs shrink-0"
                  >
                    {card.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-2 sm:pt-2">
                <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {card.businessInfo.tagline || card.businessInfo.description}
                </div>

                {card.analytics && (
                  <div className="grid grid-cols-3 gap-2 text-center p-2 sm:p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-lg sm:text-2xl font-bold">{card.analytics.views || 0}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Views</div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold">
                        {Object.values(card.analytics.linkClicks || {}).reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Clicks</div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold">
                        {card.analytics.leadsGenerated || 0}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Leads</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/card/${card.username}`, '_blank')}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/digital-card/edit/${card.id}`)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCardUrl(card.username)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {copiedUrl === card.username ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareCard(card.username)}
                  >
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <QRCodeGenerator
                    cardUrl={`${window.location.origin}/card/${card.username}`}
                    cardName={card.businessInfo.name}
                    variant="ghost"
                    size="sm"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCardStatus(card)}
                    disabled={actionLoading}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    {card.status === 'active' ? (
                      <>
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Deactivate</span>
                        <span className="xs:hidden">Off</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Activate</span>
                        <span className="xs:hidden">On</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteCardId(card.id)}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
