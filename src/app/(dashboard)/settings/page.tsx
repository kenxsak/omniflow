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
            <TabsList className="rounded-t-xl">
              <TabsTrigger value="companies">
                <Icon icon="solar:buildings-2-linear" className="h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="payment-gateways">
                <Icon icon="solar:card-linear" className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="plans">
                <Icon icon="solar:list-linear" className="h-4 w-4" />
                Plans
              </TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="mt-4 sm:mt-6">
              <AdminManager />
            </TabsContent>

            <TabsContent value="payment-gateways" className="mt-4 sm:mt-6">
              <PaymentGatewayConfig />
            </TabsContent>

            <TabsContent value="plans" className="mt-4 sm:mt-6">
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
          <TabsList className="rounded-t-xl">
            <TabsTrigger value="company">
              <Icon icon="solar:buildings-2-linear" className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <Icon icon="solar:card-linear" className="h-4 w-4" />
              My Plan
            </TabsTrigger>
            {(isAdmin || isManager) && (
              <TabsTrigger value="users">
                <Icon icon="solar:users-group-two-rounded-linear" className="h-4 w-4" />
                Team
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="integrations">
                <Icon icon="solar:link-minimalistic-2-linear" className="h-4 w-4" />
                API Keys
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="webhooks">
                <Icon icon="solar:programming-linear" className="h-4 w-4" />
                Webhooks
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="company" className="mt-4 sm:mt-6">
            <CompanyProfile />
          </TabsContent>

          <TabsContent value="subscription" className="mt-4 sm:mt-6">
            <SubscriptionDetails />
          </TabsContent>

          {(isAdmin || isManager) && (
            <TabsContent value="users" className="mt-4 sm:mt-6">
              <UserManager />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="integrations" className="mt-4 sm:mt-6">
              <SimpleIntegrations />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="webhooks" className="mt-4 sm:mt-6">
              <WebhookInfo />
            </TabsContent>
          )}
        </Tabs>
      </Animated>
    </div>
  );
}
