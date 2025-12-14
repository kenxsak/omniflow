import { AppIcon } from '@/components/ui/app-icon';

export type ActivityType = 'lead' | 'email' | 'ai' | 'crm' | 'settings' | 'task' | 'other';

export interface RecentActivityItemProps {
  description: string;
  time: string;
  type: ActivityType;
}

const typeIcons: Record<ActivityType, string> = {
  lead: 'users',
  email: 'mail',
  ai: 'robot',
  crm: 'settings',
  settings: 'settings',
  task: 'task',
  other: 'alert',
};

export default function RecentActivityItem({ description, time, type }: RecentActivityItemProps) {
  const iconName = typeIcons[type] || 'alert';

  return (
    <li className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">
        <div className="h-8 w-8 rounded-xl bg-muted/80 dark:bg-muted flex items-center justify-center">
          <AppIcon name={iconName} size={16} className="text-foreground" />
        </div>
      </div>
      <div>
        <p className="text-sm text-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </li>
  );
}
