'use client';

import WebhookInfo from '@/components/settings/webhook-info';
import { Animated } from '@/components/ui/animated';

export default function WebhooksPage() {
    return (
        <article className="group space-y-8">
            <header className="relative flex w-full flex-col gap-4 pb-6 border-b">
                <Animated animation="fadeDown">
                    <div className="flex justify-between gap-x-8 max-xs:flex-col xs:items-center gap-y-5">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex min-w-0 flex-col gap-2">
                                <h1 className="min-w-0 text-2xl font-semibold truncate">Webhooks</h1>
                                <p className="text-sm text-muted-foreground">
                                    Configure webhooks for real-time event notifications
                                </p>
                            </div>
                        </div>
                    </div>
                </Animated>
            </header>

            <Animated animation="fadeUp">
                <WebhookInfo />
            </Animated>
        </article>
    );
}
