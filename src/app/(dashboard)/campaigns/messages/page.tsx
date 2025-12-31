"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import SendSmsForm from '@/components/sms/SendSmsForm';
import dynamic from 'next/dynamic';

const BulkSMSCampaigns = dynamic(
  () => import('@/components/sms/bulk-sms-campaigns'),
  { loading: () => <div className="p-4 text-center text-muted-foreground text-sm">Loading bulk SMS...</div> }
);

type SMSProvider = 'fast2sms' | 'msg91' | 'twilio' | 'none';

export default function UnifiedSmsPage() {
  const { company } = useAuth();
  const [defaultProvider, setDefaultProvider] = useState<SMSProvider>('none');
  const [activeTab, setActiveTab] = useState<'ai' | 'bulk'>('bulk');

  useEffect(() => {
    if (!company?.apiKeys) {
      setDefaultProvider('none');
      return;
    }

    if (company.apiKeys.fast2sms) {
      setDefaultProvider('fast2sms');
    } else if (company.apiKeys.msg91) {
      setDefaultProvider('msg91');
    } else if (company.apiKeys.twilio) {
      setDefaultProvider('twilio');
    } else {
      setDefaultProvider('none');
    }
  }, [company?.apiKeys]);

  const getProviderName = () => {
    switch (defaultProvider) {
      case 'fast2sms':
        return 'Fast2SMS';
      case 'msg91':
        return 'MSG91';
      case 'twilio':
        return 'Twilio';
      default:
        return 'None';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Bulk SMS Marketing</h1>
        <p className="text-sm text-muted-foreground">Create and send SMS campaigns to multiple contacts with automatic provider routing</p>
        {/* Provider Status */}
        {defaultProvider !== 'none' && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{getProviderName()} Active</p>
        )}
      </header>

      {/* Alert if no provider is configured */}
      {defaultProvider === 'none' && (
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
          <div className="flex gap-3">
            <Icon icon="solar:danger-triangle-linear" className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground text-sm">SMS Provider Not Configured</h3>
              <p className="text-xs text-muted-foreground mt-1">
                To send bulk SMS campaigns, please configure at least one SMS provider (Fast2SMS, MSG91, or Twilio) in your Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {defaultProvider !== 'none' && (
        <>
          {/* Tabs */}
          <div className="border-b border-stone-200 dark:border-stone-800">
            <nav className="flex gap-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('ai')}
                className={cn(
                  "relative py-2 text-sm font-medium transition-colors",
                  activeTab === 'ai'
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4" style={{ color: activeTab === 'ai' ? '#8b5cf6' : undefined }} />
                  Create with AI
                </span>
                {activeTab === 'ai' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: '#8b5cf6' }} />
                )}
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={cn(
                  "relative py-2 text-sm font-medium transition-colors",
                  activeTab === 'bulk'
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" style={{ color: activeTab === 'bulk' ? '#10b981' : undefined }} />
                  Send Campaign
                </span>
                {activeTab === 'bulk' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: '#10b981' }} />
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'ai' && (
            <SendSmsForm />
          )}

          {activeTab === 'bulk' && (
            <BulkSMSCampaigns defaultProvider={defaultProvider as 'fast2sms' | 'msg91' | 'twilio'} />
          )}
        </>
      )}
    </div>
  );
}