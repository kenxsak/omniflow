import PageTitle from '@/components/ui/page-title';
import { getCompanyIdFromToken } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { CrmWrapper } from './crm-wrapper';

// Force dynamic rendering - this page uses cookies for auth
export const dynamic = 'force-dynamic';

async function getCompanyId() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('firebase-auth-token')?.value;
    if (!authToken) return null;

    return await getCompanyIdFromToken(authToken);
  } catch {
    // Auth check failed - user not logged in
    return null;
  }
}

export default async function CrmPage() {
  const companyId = await getCompanyId();

  if (!companyId) {
    return (
      <div className="space-y-8">
        <PageTitle title="My Contacts" description="People interested in your business" />
        <p className="text-muted-foreground">Please log in to view your contacts.</p>
      </div>
    );
  }

  return <CrmWrapper companyId={companyId} />;
}
