# OmniFlow Final Launch Checklist

## ✅ Completed Items

### Environment Variables (Vercel)
- [x] `NEXT_PUBLIC_APP_URL` - https://omniflow-xi.vercel.app
- [x] `ENCRYPTION_KEY` - Set
- [x] `NEXT_PUBLIC_ENCRYPTION_KEY` - Set
- [x] `CRON_SECRET` - Set
- [x] Firebase credentials - All set
- [x] Stripe test keys - Set
- [x] Razorpay test keys - Set

### Cron Jobs (cron-job.org)
- [x] Job created: "OmniFlow Automations"
- [x] URL: `https://omniflow-xi.vercel.app/api/cron/run-all`
- [x] Schedule: Every 5 minutes (`*/5 * * * *`)
- [x] Header: `x-cron-secret: a1b2c3d4-super-secret-key-5e6f7g8h-9i0j`
- [x] Status: Active

### Social Media
- [x] Copy & Paste publishing (works with all platforms)
- [x] AI content generation
- [x] Content Hub for saving posts
- [x] Removed misleading scheduling UI (Copy & Paste doesn't support auto-posting)
- Note: Buffer API closed since 2019, using universal Copy & Paste approach
- Future: Auto-scheduling via Publer API (~$9/month for users) if requested

---

## ⏳ Before Going Live (Production)

### Payment Gateway - LIVE Keys
Replace test keys with live keys in Vercel:

**Stripe:**
- [ ] `STRIPE_SECRET_KEY` - Get from https://dashboard.stripe.com/apikeys (Live mode)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` - Get from same page
- [ ] `STRIPE_WEBHOOK_SECRET` - Create new webhook for production URL

**Razorpay:**
- [ ] `RAZORPAY_KEY_ID` - Get from https://dashboard.razorpay.com/app/keys (Live mode)
- [ ] `RAZORPAY_KEY_SECRET` - Get from same page
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Same as RAZORPAY_KEY_ID
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Set up webhook in Razorpay dashboard

### Webhook Setup

**Stripe Webhook:**
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://omniflow-xi.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

**Razorpay Webhook:**
1. Go to https://dashboard.razorpay.com/app/webhooks
2. Add webhook URL: `https://omniflow-xi.vercel.app/api/webhooks/razorpay`
3. Select events:
   - `payment.captured`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
4. Set secret and update `RAZORPAY_WEBHOOK_SECRET`

### Firebase (Optional but Recommended)
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Review Firestore security rules

---

## 🧪 Testing Checklist

### Before Launch
- [ ] Test user signup flow
- [ ] Test user login flow
- [ ] Test payment flow (use test cards)
- [ ] Test lead creation
- [ ] Test email/SMS sending (with user's own API keys)
- [ ] Test workflow automation
- [ ] Test social media content creation
- [ ] Test landing page builder

### Test Payment Cards
**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Razorpay:**
- Success: `4111 1111 1111 1111`

---

## 📝 Quick Reference

**App URL:** https://omniflow-xi.vercel.app
**Super Admin:** support@worldmart.in
**Cron Job:** Every 5 minutes via cron-job.org

**Key Features:**
- BYOK Model (Bring Your Own Keys) for AI, Email, SMS, WhatsApp
- Social Media: AI content creation + Copy/Paste to any platform
- Workflow Automation: Runs every 5 minutes via cron
- Landing Pages: Drag & drop builder with AI assist
