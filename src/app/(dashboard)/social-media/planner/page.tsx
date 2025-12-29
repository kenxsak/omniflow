'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Content Planner has been merged into Content Hub
// Redirect users to Content Hub
export default function SocialMediaPlannerPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/social-media/content-hub');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
