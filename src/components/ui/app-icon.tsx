'use client';

import { Icon as IconifyIcon } from '@iconify/react';
import { cn } from '@/lib/utils';

// Tabler icon mapping - consistent enterprise SaaS look
const iconMap: Record<string, string> = {
  // Dashboard & Navigation
  'dashboard': 'tabler:layout-dashboard',
  'home': 'tabler:home',
  'menu': 'tabler:menu-2',
  'search': 'tabler:search',
  'settings': 'tabler:settings',
  'logout': 'tabler:logout',
  'login': 'tabler:login',
  
  // Users & Contacts
  'users': 'tabler:users',
  'user': 'tabler:user',
  'user-plus': 'tabler:user-plus',
  'user-check': 'tabler:user-check',
  'team': 'tabler:users-group',
  'contacts': 'tabler:address-book',
  
  // Communication
  'mail': 'tabler:mail',
  'mail-send': 'tabler:mail-forward',
  'message': 'tabler:message',
  'message-circle': 'tabler:message-circle',
  'phone': 'tabler:phone',
  'send': 'tabler:send',
  'inbox': 'tabler:inbox',
  
  // Business & CRM
  'briefcase': 'tabler:briefcase',
  'building': 'tabler:building',
  'pipeline': 'tabler:git-branch',
  'deal': 'tabler:receipt',
  'target': 'tabler:target',
  'trophy': 'tabler:trophy',
  'award': 'tabler:award',
  'medal': 'tabler:medal',
  
  // Finance
  'dollar': 'tabler:currency-dollar',
  'currency': 'tabler:coin',
  'credit-card': 'tabler:credit-card',
  'wallet': 'tabler:wallet',
  'receipt': 'tabler:receipt',
  
  // Calendar & Time
  'calendar': 'tabler:calendar',
  'calendar-event': 'tabler:calendar-event',
  'clock': 'tabler:clock',
  'schedule': 'tabler:calendar-time',
  
  // Tasks & Productivity
  'task': 'tabler:checkbox',
  'tasks': 'tabler:list-check',
  'clipboard': 'tabler:clipboard-check',
  'checklist': 'tabler:checklist',
  'check': 'tabler:check',
  'check-circle': 'tabler:circle-check',
  
  // Charts & Analytics
  'chart': 'tabler:chart-bar',
  'chart-line': 'tabler:chart-line',
  'chart-pie': 'tabler:chart-pie',
  'trending-up': 'tabler:trending-up',
  'trending-down': 'tabler:trending-down',
  'analytics': 'tabler:chart-dots',
  'report': 'tabler:report-analytics',
  
  // Marketing & Campaigns
  'campaign': 'tabler:speakerphone',
  'megaphone': 'tabler:speakerphone',
  'broadcast': 'tabler:broadcast',
  'rocket': 'tabler:rocket',
  
  // AI & Tech
  'sparkles': 'tabler:sparkles',
  'ai': 'tabler:brain',
  'magic': 'tabler:wand',
  'robot': 'tabler:robot',
  'bolt': 'tabler:bolt',
  'zap': 'tabler:bolt',
  
  // Actions
  'plus': 'tabler:plus',
  'plus-circle': 'tabler:circle-plus',
  'minus': 'tabler:minus',
  'edit': 'tabler:pencil',
  'delete': 'tabler:trash',
  'trash': 'tabler:trash',
  'copy': 'tabler:copy',
  'download': 'tabler:download',
  'upload': 'tabler:upload',
  'refresh': 'tabler:refresh',
  'filter': 'tabler:filter',
  'sort': 'tabler:arrows-sort',
  'share': 'tabler:share',
  
  // Arrows & Navigation
  'arrow-right': 'tabler:arrow-right',
  'arrow-left': 'tabler:arrow-left',
  'arrow-up': 'tabler:arrow-up',
  'arrow-down': 'tabler:arrow-down',
  'arrow-up-right': 'tabler:arrow-up-right',
  'arrow-down-right': 'tabler:arrow-down-right',
  'chevron-right': 'tabler:chevron-right',
  'chevron-left': 'tabler:chevron-left',
  'chevron-down': 'tabler:chevron-down',
  'chevron-up': 'tabler:chevron-up',
  'external-link': 'tabler:external-link',
  
  // Status & Alerts
  'success': 'tabler:circle-check',
  'warning': 'tabler:alert-triangle',
  'error': 'tabler:circle-x',
  'info': 'tabler:info-circle',
  'help': 'tabler:help-circle',
  'alert': 'tabler:alert-circle',
  'x': 'tabler:x',
  'x-circle': 'tabler:circle-x',
  'circle': 'tabler:circle',
  
  // View & Display
  'eye': 'tabler:eye',
  'eye-off': 'tabler:eye-off',
  'grid': 'tabler:grid-dots',
  'list': 'tabler:list',
  'layers': 'tabler:stack-2',
  
  // Files & Documents
  'file': 'tabler:file',
  'file-text': 'tabler:file-text',
  'folder': 'tabler:folder',
  'document': 'tabler:file-description',
  'image': 'tabler:photo',
  
  // Social & Links
  'link': 'tabler:link',
  'globe': 'tabler:world',
  'location': 'tabler:map-pin',
  'video': 'tabler:video',
  
  // Digital Card
  'id-card': 'tabler:id',
  'card': 'tabler:id-badge-2',
  'qr': 'tabler:qrcode',
  
  // Workflow & Automation
  'workflow': 'tabler:git-merge',
  'automation': 'tabler:robot',
  'integration': 'tabler:plug-connected',
  
  // Misc
  'star': 'tabler:star',
  'heart': 'tabler:heart',
  'bell': 'tabler:bell',
  'bookmark': 'tabler:bookmark',
  'tag': 'tabler:tag',
  'lock': 'tabler:lock',
  'unlock': 'tabler:lock-open',
  'key': 'tabler:key',
  'shield': 'tabler:shield-check',
  'gift': 'tabler:gift',
  'crown': 'tabler:crown',
  'loader': 'tabler:loader-2',
  'more-vertical': 'tabler:dots-vertical',
  'more-horizontal': 'tabler:dots',
  'grip': 'tabler:grip-vertical',
  'sun': 'tabler:sun',
  'moon': 'tabler:moon',
};

export interface AppIconProps {
  /** Icon name from the mapping or direct tabler icon name */
  name: string;
  /** Icon size in pixels (default: 18) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible title for the icon */
  title?: string;
  /** Whether the icon is purely decorative (default: true) */
  decorative?: boolean;
}

export function AppIcon({
  name,
  size = 18,
  className,
  title,
  decorative = true,
}: AppIconProps) {
  // Get the mapped icon or use direct tabler icon name
  const iconName = iconMap[name] || (name.startsWith('tabler:') ? name : `tabler:${name}`);

  return (
    <IconifyIcon
      icon={iconName}
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden={decorative}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : title}
    />
  );
}

// Export commonly used icon components for convenience
export function DashboardIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="dashboard" className={className} size={size} />;
}

export function UsersIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="users" className={className} size={size} />;
}

export function MailIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="mail" className={className} size={size} />;
}

export function CalendarIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="calendar" className={className} size={size} />;
}

export function TaskIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="task" className={className} size={size} />;
}

export function SettingsIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="settings" className={className} size={size} />;
}

export function SparklesIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="sparkles" className={className} size={size} />;
}

export function ChartIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="chart" className={className} size={size} />;
}

export function LoaderIcon({ className, size }: Omit<AppIconProps, 'name'>) {
  return <AppIcon name="loader" className={cn('animate-spin', className)} size={size} />;
}

export default AppIcon;
