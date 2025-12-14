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

const categoryColors: Record<string, string> = {
  welcome: 'bg-info-muted text-info-muted-foreground',
  promotional: 'bg-primary/10 text-primary',
  followup: 'bg-success-muted text-success-muted-foreground',
  reminder: 'bg-warning-muted text-warning-muted-foreground',
  abandoned_cart: 'bg-destructive-muted text-destructive-muted-foreground',
  special_offer: 'bg-warning-muted text-warning-muted-foreground',
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

export default function TemplateCard({ template, onPreview }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {template.type === 'email' ? (
              <Mail className="h-4 w-4 text-muted-foreground" />
            ) : (
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant="outline" className={categoryColors[template.category]}>
              {categoryLabels[template.category]}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex flex-wrap gap-1 mb-4">
          {template.industry.map((ind) => (
            <Badge key={ind} variant="secondary" className="text-xs">
              {industryLabels[ind]}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => onPreview(template)} 
            className="flex-1"
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
