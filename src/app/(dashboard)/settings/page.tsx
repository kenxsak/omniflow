'use client';

import CompanyProfile from '@/components/settings/company-profile';
import PageTitle from '@/components/ui/page-title';
import { Animated } from '@/components/ui/animated';

export default function SettingsPage() {
  return (
    <article className="group space-y-8">
      <header className="relative flex w-full flex-col gap-4 pb-6 border-b">
        <Animated animation="fadeDown">
          <div className="flex justify-between gap-x-8 max-xs:flex-col xs:items-center gap-y-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <h1 className="min-w-0 text-2xl font-semibold truncate">Company Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your company information and settings
                </p>
              </div>
            </div>
          </div>
        </Animated>
      </header>

      <Animated animation="fadeUp">
        <CompanyProfile />
      </Animated>
    </article>
  );
}
