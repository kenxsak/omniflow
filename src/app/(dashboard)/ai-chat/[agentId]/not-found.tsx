import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function AgentNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
          <Icon icon="solar:robot-bold" className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          The AI agent you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/ai-chat">
          <Button>
            <Icon icon="solar:arrow-left-linear" className="mr-2 h-4 w-4" />
            Back to All Agents
          </Button>
        </Link>
      </div>
    </div>
  );
}
