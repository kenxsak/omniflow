"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Clock, Eye, Trash2, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { WhatsAppCampaign } from '@/types/messaging';

interface CampaignsTableProps {
  campaigns: WhatsAppCampaign[];
  onView: (campaign: WhatsAppCampaign) => void;
  onDelete: (campaignId: string) => void;
}

const getStatusBadge = (status: WhatsAppCampaign['status'], small?: boolean) => {
  const statusConfig = {
    draft: { variant: 'secondary' as const, icon: Clock },
    scheduled: { variant: 'default' as const, icon: Clock },
    sending: { variant: 'default' as const, icon: Loader2 },
    completed: { variant: 'default' as const, icon: CheckCircle },
    failed: { variant: 'destructive' as const, icon: XCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${small ? 'text-xs px-1.5 py-0.5' : ''}`}>
      <Icon className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function CampaignsTable({ campaigns, onView, onDelete }: CampaignsTableProps) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{campaign.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {campaign.platform?.toUpperCase()}
                    </Badge>
                    {getStatusBadge(campaign.status, true)}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(campaign)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(campaign.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {(campaign as any).recipientCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{campaign.platform?.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell>{(campaign as any).recipientCount || 0}</TableCell>
                <TableCell>
                  {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onView(campaign)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(campaign.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
