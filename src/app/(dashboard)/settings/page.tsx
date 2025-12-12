'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SimpleIntegrations from '@/components/settings/simple-integrations';
import SubscriptionDetails from '@/components/settings/subscription-details';
import UserManager from '@/components/settings/user-manager';
import WebhookInfo from '@/components/settings/webhook-info';
import CompanyProfile from '@/components/settings/company-profile';
import AdminManager from '@/components/settings/admin-manager';
import PaymentGatewayConfig from '@/components/settings/payment-gateway-config';
import PlanManager from '@/components/settings/plan-manager';
import PageTitle from '@/components/ui/page-title';
import { Animated } from '@/components/ui/animated';
import { useAuth } from '@/hooks/use-auth';
import { Icon } from '@iconify/react';

export default function SettingsPage() {
  const { isSuperAdmin, isAdmin, isManager } = useAuth();

  if (isSuperAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-10">
        <Animated animation="fadeDown">
          <PageTitle 
            title="Super Admin Settings" 
            description="Manage platform, companies, and payment gateways"
          />
        </Animated>

        <Animated animation="fadeUp">
          <Tabs defaultValue="companies" className="w-full">
            <div className="sticky top-14 sm:top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/95 backdrop-blur-sm border-b">
              <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
                <TabsTrigger value="companies" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2">
                  <Icon icon="solar:buildings-2-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Companies</span>
                  <span className="xs:hidden">Co.</span>
                </TabsTrigger>
                <TabsTrigger value="payment-gateways" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2">
                  <Icon icon="solar:card-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Payments</span>
                  <span className="xs:hidden">Pay</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2">
                  <Icon icon="solar:list-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Plans</span>
                  <span className="xs:hidden">Plans</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="companies" className="mt-4 sm:mt-6 animate-fade-up">
              <AdminManager />
            </TabsContent>

            <TabsContent value="payment-gateways" className="mt-4 sm:mt-6 animate-fade-up">
              <PaymentGatewayConfig />
            </TabsContent>

            <TabsContent value="plans" className="mt-4 sm:mt-6 animate-fade-up">
              <PlanManager />
            </TabsContent>
          </Tabs>
        </Animated>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      <Animated animation="fadeDown">
        <PageTitle 
          title="Settings" 
          description="Manage your account, subscription, and integrations"
        />
      </Animated>

      <Animated animation="fadeUp">
        <Tabs defaultValue="company" className="w-full">
          <div className="sticky top-14 sm:top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/95 backdrop-blur-sm border-b">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="w-max sm:w-auto inline-flex h-auto gap-1 p-1 bg-muted/50">
                <TabsTrigger value="company" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 py-2 whitespace-nowrap">
                  <Icon icon="solar:buildings-2-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Company</span>
                  <span className="sm:hidden">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 py-2 whitespace-nowrap">
                  <Icon icon="solar:card-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">My Plan</span>
                  <span className="sm:hidden">Plan</span>
                </TabsTrigger>
                {(isAdmin || isManager) && (
                  <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 py-2 whitespace-nowrap">
                    <Icon icon="solar:users-group-two-rounded-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Team</span>
                    <span className="sm:hidden">Team</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="integrations" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 py-2 whitespace-nowrap">
                    <Icon icon="solar:link-minimalistic-2-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">API Keys</span>
                    <span className="sm:hidden">API</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="webhooks" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 py-2 whitespace-nowrap">
                    <Icon icon="solar:programming-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Webhooks</span>
                    <span className="sm:hidden">Hooks</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          </div>

          <TabsContent value="company" className="mt-4 sm:mt-6 animate-fade-up">
            <CompanyProfile />
          </TabsContent>

          <TabsContent value="subscription" className="mt-4 sm:mt-6 animate-fade-up">
            <SubscriptionDetails />
          </TabsContent>

          {(isAdmin || isManager) && (
            <TabsContent value="users" className="mt-4 sm:mt-6 animate-fade-up">
              <UserManager />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="integrations" className="mt-4 sm:mt-6 animate-fade-up">
              <SimpleIntegrations />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="webhooks" className="mt-4 sm:mt-6 animate-fade-up">
              <WebhookInfo />
            </TabsContent>
          )}
        </Tabs>
      </Animated>
    </div>
  );
}
