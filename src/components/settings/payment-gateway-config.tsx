"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  DollarSign, 
  IndianRupee,
  ExternalLink,
  Copy,
  Loader2,
  AlertTriangle,
  Shield,
  Globe,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GatewayStatus {
  configured: boolean;
  publicKeyPresent: boolean;
  secretKeyPresent: boolean;
  webhookSecretPresent?: boolean;
}

export default function PaymentGatewayConfig() {
  const { toast } = useToast();
  const [stripeStatus, setStripeStatus] = useState<GatewayStatus>({ configured: false, publicKeyPresent: false, secretKeyPresent: false });
  const [razorpayStatus, setRazorpayStatus] = useState<GatewayStatus>({ configured: false, publicKeyPresent: false, secretKeyPresent: false });
  const [isLoading, setIsLoading] = useState(true);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingRazorpay, setTestingRazorpay] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const stripeWebhookUrl = `${appUrl}/api/webhooks/stripe`;
  const razorpayWebhookUrl = `${appUrl}/api/webhooks/razorpay`;

  useEffect(() => {
    checkPaymentGatewayStatus();
  }, []);

  const checkPaymentGatewayStatus = async () => {
    setIsLoading(true);
    try {
      const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
      setStripeStatus({
        configured: !!stripePublicKey,
        publicKeyPresent: !!stripePublicKey,
        secretKeyPresent: true,
        webhookSecretPresent: true
      });

      const razorpayPublicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      setRazorpayStatus({
        configured: !!razorpayPublicKey,
        publicKeyPresent: !!razorpayPublicKey,
        secretKeyPresent: true,
        webhookSecretPresent: true
      });
    } catch (error) {
      console.error('Error checking payment gateway status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const testStripeConnection = async () => {
    setTestingStripe(true);
    try {
      if (stripeStatus.publicKeyPresent) {
        toast({
          title: 'Stripe Configuration Detected',
          description: 'Stripe public key is present. Test a payment on the pricing page to verify full setup.',
        });
      } else {
        toast({
          title: 'Stripe Not Configured',
          description: 'Please add Stripe API keys to Replit Secrets',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Could not verify Stripe configuration',
        variant: 'destructive',
      });
    } finally {
      setTestingStripe(false);
    }
  };

  const testRazorpayConnection = async () => {
    setTestingRazorpay(true);
    try {
      if (razorpayStatus.publicKeyPresent) {
        toast({
          title: 'Razorpay Configuration Detected',
          description: 'Razorpay public key is present. Test a payment on the pricing page to verify full setup.',
        });
      } else {
        toast({
          title: 'Razorpay Not Configured',
          description: 'Please add Razorpay API keys to Replit Secrets',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Could not verify Razorpay configuration',
        variant: 'destructive',
      });
    } finally {
      setTestingRazorpay(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-3 sm:p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base sm:text-lg">Payment Gateway Configuration</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Loading payment gateway status...</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Status Overview */}
      <Card className="p-3 sm:p-4">
        <CardHeader className="p-0 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-1.5 text-base sm:text-lg">
                <Shield className="h-4 w-4 text-primary" />
                Payment Gateways
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">Stripe and Razorpay setup</CardDescription>
            </div>
            <Button 
              onClick={checkPaymentGatewayStatus} 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto h-8 text-xs"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-3">
            {/* Stripe Status Card */}
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
              <div className={`p-2 rounded-full shrink-0 ${stripeStatus.configured ? 'bg-success/10' : 'bg-muted'}`}>
                <DollarSign className={`h-4 w-4 ${stripeStatus.configured ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <h3 className="text-sm font-semibold">Stripe</h3>
                  {stripeStatus.configured ? (
                    <Badge variant="default" className="bg-success text-success-foreground text-[10px] px-1.5 py-0">
                      <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <XCircle className="mr-0.5 h-2.5 w-2.5" />
                      Not Set
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">International (USD, EUR, GBP)</p>
                <Button 
                  onClick={testStripeConnection} 
                  size="sm" 
                  variant="outline"
                  disabled={testingStripe || !stripeStatus.configured}
                  className="h-7 text-[11px] w-full sm:w-auto"
                >
                  {testingStripe ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Testing...</>
                  ) : (
                    <><CreditCard className="mr-1 h-3 w-3" /> Test Connection</>
                  )}
                </Button>
              </div>
            </div>

            {/* Razorpay Status Card */}
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
              <div className={`p-2 rounded-full shrink-0 ${razorpayStatus.configured ? 'bg-success/10' : 'bg-muted'}`}>
                <IndianRupee className={`h-4 w-4 ${razorpayStatus.configured ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <h3 className="text-sm font-semibold">Razorpay</h3>
                  {razorpayStatus.configured ? (
                    <Badge variant="default" className="bg-success text-success-foreground text-[10px] px-1.5 py-0">
                      <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <XCircle className="mr-0.5 h-2.5 w-2.5" />
                      Not Set
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">India payments (INR)</p>
                <Button 
                  onClick={testRazorpayConnection} 
                  size="sm" 
                  variant="outline"
                  disabled={testingRazorpay || !razorpayStatus.configured}
                  className="h-7 text-[11px] w-full sm:w-auto"
                >
                  {testingRazorpay ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Testing...</>
                  ) : (
                    <><CreditCard className="mr-1 h-3 w-3" /> Test Connection</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {(!stripeStatus.configured || !razorpayStatus.configured) && (
            <Alert className="mt-3 p-2.5 sm:p-3">
              <AlertTriangle className="h-3.5 w-3.5" />
              <AlertDescription className="text-[11px] sm:text-xs ml-2">
                <strong>Setup Required:</strong> Add API keys to <strong>Replit Secrets</strong> to enable payments.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="stripe" className="w-full">
        <TabsList className="w-full h-auto p-1 grid grid-cols-2 gap-1">
          <TabsTrigger value="stripe" className="text-[11px] sm:text-xs h-8 px-2">
            <DollarSign className="mr-1 h-3 w-3" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="razorpay" className="text-[11px] sm:text-xs h-8 px-2">
            <IndianRupee className="mr-1 h-3 w-3" />
            Razorpay
          </TabsTrigger>
        </TabsList>

        {/* Stripe Configuration */}
        <TabsContent value="stripe" className="mt-3">
          <Card className="p-3 sm:p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm sm:text-base">Stripe Configuration</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">Setup for international payments</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3 sm:space-y-4">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  Required API Keys
                </h4>
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg space-y-1.5 font-mono text-[10px] sm:text-xs overflow-x-auto">
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">STRIPE_SECRET_KEY=</span>
                    <span className="text-primary">sk_test_...</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">NEXT_PUBLIC_STRIPE_PUBLIC_KEY=</span>
                    <span className="text-primary">pk_test_...</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">STRIPE_WEBHOOK_SECRET=</span>
                    <span className="text-primary">whsec_...</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Webhook URL</h4>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={stripeWebhookUrl}
                    readOnly
                    className="flex-1 min-w-0 px-2 py-1.5 border rounded-md bg-muted font-mono text-[10px] sm:text-xs truncate"
                  />
                  <Button
                    onClick={() => copyToClipboard(stripeWebhookUrl, 'Stripe Webhook URL')}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Add to Stripe Dashboard → Webhooks
                </p>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Webhook Events</h4>
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg">
                  <ul className="space-y-0.5 text-[10px] sm:text-xs list-disc list-inside text-muted-foreground">
                    <li>checkout.session.completed</li>
                    <li>invoice.paid</li>
                    <li>invoice.payment_failed</li>
                    <li>customer.subscription.deleted</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Quick Links</h4>
                <div className="flex flex-col sm:flex-row flex-wrap gap-1.5 sm:gap-2">
                  <Button variant="outline" size="sm" asChild className="h-7 text-[10px] sm:text-xs w-full sm:w-auto justify-start">
                    <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Create Account
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-[10px] sm:text-xs w-full sm:w-auto justify-start">
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Get API Keys
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-[10px] sm:text-xs w-full sm:w-auto justify-start">
                    <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Setup Webhooks
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Razorpay Configuration */}
        <TabsContent value="razorpay" className="mt-3">
          <Card className="p-3 sm:p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm sm:text-base">Razorpay Configuration</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">Setup for Indian payments</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3 sm:space-y-4">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  Required API Keys
                </h4>
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg space-y-1.5 font-mono text-[10px] sm:text-xs overflow-x-auto">
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">RAZORPAY_KEY_ID=</span>
                    <span className="text-primary">rzp_test_...</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">RAZORPAY_KEY_SECRET=</span>
                    <span className="text-primary">your_secret_key</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">NEXT_PUBLIC_RAZORPAY_KEY_ID=</span>
                    <span className="text-primary">rzp_test_...</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-muted-foreground">RAZORPAY_WEBHOOK_SECRET=</span>
                    <span className="text-primary">your_webhook_secret</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Webhook URL</h4>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={razorpayWebhookUrl}
                    readOnly
                    className="flex-1 min-w-0 px-2 py-1.5 border rounded-md bg-muted font-mono text-[10px] sm:text-xs truncate"
                  />
                  <Button
                    onClick={() => copyToClipboard(razorpayWebhookUrl, 'Razorpay Webhook URL')}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Add to Razorpay Dashboard → Webhooks
                </p>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Webhook Events</h4>
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg">
                  <ul className="space-y-0.5 text-[10px] sm:text-xs list-disc list-inside text-muted-foreground">
                    <li>payment.captured</li>
                    <li>payment.failed</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Quick Links</h4>
                <div className="flex flex-col sm:flex-row flex-wrap gap-1.5 sm:gap-2">
                  <Button variant="outline" size="sm" asChild className="h-7 text-[10px] sm:text-xs w-full sm:w-auto justify-start">
                    <a href="https://dashboard.razorpay.com/signup" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Create Account
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-[10px] sm:text-xs w-full sm:w-auto justify-start">
                    <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Get API Keys
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-[10px] sm:text-xs w-full sm:w-auto justify-start">
                    <a href="https://dashboard.razorpay.com/app/webhooks" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Setup Webhooks
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Testing Instructions */}
      <Card className="p-3 sm:p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm sm:text-base">Testing Payments</CardTitle>
          <CardDescription className="text-[11px] sm:text-xs">Test payment flows before going live</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3 sm:space-y-4">
          {/* Stripe Test Cards - Mobile Card View */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Stripe Test Cards</h4>
            
            {/* Mobile: Card View */}
            <div className="sm:hidden space-y-2">
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="font-mono text-[11px] mb-1">4242 4242 4242 4242</div>
                <div className="text-[10px] text-muted-foreground">✅ Success</div>
              </div>
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="font-mono text-[11px] mb-1">4000 0000 0000 0002</div>
                <div className="text-[10px] text-muted-foreground">❌ Decline</div>
              </div>
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="font-mono text-[11px] mb-1">4000 0025 0000 3155</div>
                <div className="text-[10px] text-muted-foreground">🔐 3D Secure</div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Use any future expiry date and any 3-digit CVV
              </p>
            </div>

            {/* Desktop: Table View */}
            <div className="hidden sm:block bg-muted p-3 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 font-medium">Card Number</th>
                    <th className="text-left py-1.5 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 font-mono">4242 4242 4242 4242</td>
                    <td className="py-1.5">✅ Success</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-mono">4000 0000 0000 0002</td>
                    <td className="py-1.5">❌ Decline</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-mono">4000 0025 0000 3155</td>
                    <td className="py-1.5">🔐 3D Secure</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-2">
                Use any future expiry date and any 3-digit CVV
              </p>
            </div>
          </div>

          {/* Razorpay Test Cards - Mobile Card View */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold mb-1.5">Razorpay Test Cards</h4>
            
            {/* Mobile: Card View */}
            <div className="sm:hidden space-y-2">
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="font-mono text-[11px] mb-1">5267 3181 8797 5449</div>
                <div className="text-[10px] text-muted-foreground">✅ Success</div>
              </div>
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="font-mono text-[11px] mb-1">4111 1111 1111 1111</div>
                <div className="text-[10px] text-muted-foreground">✅ Success</div>
              </div>
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="font-mono text-[11px] mb-1">Any 16 digits</div>
                <div className="text-[10px] text-muted-foreground">✅ Success (test mode)</div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Use OTP: 123456 for test transactions
              </p>
            </div>

            {/* Desktop: Table View */}
            <div className="hidden sm:block bg-muted p-3 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 font-medium">Card Number</th>
                    <th className="text-left py-1.5 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 font-mono">5267 3181 8797 5449</td>
                    <td className="py-1.5">✅ Success</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-mono">4111 1111 1111 1111</td>
                    <td className="py-1.5">✅ Success</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-mono">Any 16 digits</td>
                    <td className="py-1.5">✅ Success (test mode)</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-2">
                Use OTP: 123456 for test transactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
