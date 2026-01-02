import { LeadsTableClient } from './leads-table-client';
import { getPaginatedLeadsForCompany } from '@/lib/crm/lead-data';
import { getUserFromServerSession } from '@/lib/firebase-admin';
import { getPlanMetadata } from '@/lib/plan-helpers-server';
import { SessionExpiredMessage } from '@/components/auth/session-expired-message';

// Force dynamic rendering - this page uses cookies for auth
export const dynamic = 'force-dynamic';

const INITIAL_PAGE_SIZE = 50;

export default async function LeadsTablePage() {
  const userResult = await getUserFromServerSession();
  
  console.log('[LeadsTablePage] User session result:', JSON.stringify(userResult, null, 2));
  
  if (!userResult.success) {
    // Check if token expired - show refresh prompt
    if (userResult.code === 'TOKEN_EXPIRED') {
      return <SessionExpiredMessage />;
    }
    
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-muted-foreground">Please log in to view your contacts.</p>
      </div>
    );
  }
  
  if (!userResult.user.companyId) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-muted-foreground">Please log in to view your contacts.</p>
      </div>
    );
  }
  
  const { uid, role, companyId } = userResult.user;
  
  console.log(`[LeadsTablePage] Fetching leads for companyId: ${companyId}, uid: ${uid}, role: ${role}`);
  
  const [paginatedResult, planMetadata] = await Promise.all([
    getPaginatedLeadsForCompany(companyId, {
      currentUserId: uid,
      currentUserRole: role as 'superadmin' | 'admin' | 'manager' | 'user',
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
    }),
    getPlanMetadata(companyId)
  ]);

  return (
    <LeadsTableClient 
      initialLeads={paginatedResult.leads}
      totalLeads={paginatedResult.total}
      hasMore={paginatedResult.hasMore}
      pageSize={INITIAL_PAGE_SIZE}
      companyId={companyId}
      planMetadata={planMetadata}
      userRole={role}
      userId={uid}
    />
  );
}
