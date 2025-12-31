'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Eye } from 'lucide-react';
import type { Template } from '@/types/templates';

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
}

// Category colors with inline styles for reliable rendering
const getCategoryStyle = (category: string): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    welcome: { backgroundColor: '#dbeafe', color: '#1d4ed8' }, // blue
    promotional: { backgroundColor: '#f3e8ff', color: '#7c3aed' }, // purple
    followup: { backgroundColor: '#d1fae5', color: '#059669' }, // emerald
    reminder: { backgroundColor: '#fef3c7', color: '#d97706' }, // amber
    abandoned_cart: { backgroundColor: '#fee2e2', color: '#dc2626' }, // rose
    special_offer: { backgroundColor: '#fce7f3', color: '#db2777' }, // pink
  };
  return styles[category] || { backgroundColor: '#f3f4f6', color: '#6b7280' };
};

// Dark mode category colors
const getCategoryStyleDark = (category: string): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    welcome: { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }, // blue
    promotional: { backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }, // purple
    followup: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }, // emerald
    reminder: { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }, // amber
    abandoned_cart: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }, // rose
    special_offer: { backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }, // pink
  };
  return styles[category] || { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af' };
};

// Industry badge colors
const getIndustryStyle = (industry: string): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    general: { backgroundColor: '#f3f4f6', color: '#4b5563' },
    restaurant: { backgroundColor: '#fef3c7', color: '#92400e' },
    ecommerce: { backgroundColor: '#dbeafe', color: '#1e40af' },
    realestate: { backgroundColor: '#d1fae5', color: '#065f46' },
    salon: { backgroundColor: '#fce7f3', color: '#9d174d' },
    coaching: { backgroundColor: '#e0e7ff', color: '#3730a3' },
    service: { backgroundColor: '#ccfbf1', color: '#0f766e' },
  };
  return styles[industry] || { backgroundColor: '#f3f4f6', color: '#6b7280' };
};

const categoryLabels: Record<string, string> = {
  welcome: 'Welcome',
  promotional: 'Promotional',
  followup: 'Follow-up',
  reminder: 'Reminder',
  abandoned_cart: 'Abandoned Cart',
  special_offer: 'Special Offer',
};

const industryLabels: Record<string, string> = {
  general: 'General',
  restaurant: 'Restaurant',
  ecommerce: 'E-commerce',
  realestate: 'Real Estate',
  salon: 'Salon',
  coaching: 'Coaching',
  service: 'Service',
};

// Icon colors by type
const getIconColor = (type: string): string => {
  return type === 'email' ? '#3b82f6' : '#0d9488'; // blue for email, teal for SMS
};

export default function TemplateCard({ template, onPreview }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col group hover:border-stone-400 dark:hover:border-stone-600">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {template.type === 'email' ? (
              <Mail className="h-4 w-4" style={{ color: getIconColor('email') }} />
            ) : (
              <MessageSquare className="h-4 w-4" style={{ color: getIconColor('sms') }} />
            )}
            <span 
              className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
              style={getCategoryStyle(template.category)}
            >
              {categoryLabels[template.category]}
            </span>
          </div>
        </div>
        <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex flex-wrap gap-1 mb-4">
          {template.industry.map((ind) => (
            <span 
              key={ind} 
              className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
              style={getIndustryStyle(ind)}
            >
              {industryLabels[ind]}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => onPreview(template)} 
            className="flex-1 bg-stone-800 hover:bg-stone-700 dark:bg-stone-200 dark:hover:bg-stone-300 dark:text-stone-900"
            size="sm"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview & Use
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
