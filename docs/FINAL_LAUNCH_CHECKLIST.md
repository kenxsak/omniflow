# 🚀 OmniFlow Final Launch Checklist

**App URL:** https://omniflow-xi.vercel.app  
**Last Updated:** December 29, 2025

---

## ☑️ CHECKLIST OVERVIEW

| # | Task | Status | Priority |
|---|------|--------|----------|
| 1 | Buffer API Credentials | ⬜ Pending | 🔴 Critical |
| 2 | Stripe Live Keys | ⬜ Pending | 🔴 Critical |
| 3 | Razorpay Live Keys | ⬜ Pending | 🔴 Critical |
| 4 | Stripe Webhook (Production) | ⬜ Pending | 🔴 Critical |
| 5 | Razorpay Webhook (Production) | ⬜ Pending | 🔴 Critical |
| 6 | Firebase Indexes Deploy | ⬜ Pending | 🔴 Critical |
| 7 | Cron Job Setup | ⬜ Pending | 🔴 Critical |
| 8 | Vercel Environment Variables | ⬜ Pending | 🔴 Critical |
| 9 | Test All Features | ⬜ Pending | 🟡 High |
| 10 | Final Deployment | ⬜ Pending | 🟢 Final |

---

## 🔴 CRITICAL TASKS

### 1. Buffer API Credentials
**Status:** ⬜ Pending

Get credentials from Buffer Developer Portal:

1. Go to: https://buffer.com/developers/apps
2. Click "Create App"
3. Fill in:
   - **App Name:** OmniFlow
   - **Callback URL:** `https://omniflow-xi.vercel.app/api/auth/buffer/callback`
   - **Website:** `https://omniflow-xi.vercel.app`
4. Copy credentials and add to `.env`:
   ```
   BUFFER_CLIENT_ID=your_client_id_here
   BUFFER_CLIENT_SECRET=your_client_secret_here
   ```

---

### 2. Stripe Live Keys
**Status:** ⬜ Pending

Get live keys from Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/apikeys
2. Toggle to "Live mode" (top right)
3. Copy keys and update `.env`:
   ```
   # Replace test keys with live keys
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
   ```

**Current (Test):**
- `sk_test_51SRu15SuJGx4G7hCaZQlbcWzWfLJ1Eobje7pgm3jWnKARRaDfMgicGsWmgbAyz15xBRKHKPQN66KI60V7Y52C3Q600Yyy1ID6b`
- `pk_test_51SRu15SuJGx4G7hCmJqZp9mNsXxaYIzn4J12faGbLBINOWzGHyY5LQeINyf0fFTjrRPpgukBWFEtpp546D0lwgim00GQUiLMjX`

---

### 3. Razorpay Live Keys
**Status:** ⬜ Pending

Get live keys from Razorpay Dashboard:

1. Go to: https://dashboard.razorpay.com/app/keys
2. Switch to "Live Mode"
3. Generate new API keys
4. Update `.env`:
   ```
   # Replace test keys with live keys
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   ```

**Current (Test):**
- `rzp_test_Re2dxdKb617edl`

---

### 4. Stripe Webhook (Production)
**Status:** ⬜ Pending

Set up production webhook:

1. Go to: https://dashboard.stripe.com/webhooks
2. Switch to "Live mode"
3. Click "Add endpoint"
4. Configure:
   - **Endpoint URL:** `https://omniflow-xi.vercel.app/api/webhooks/stripe`
   - **Events to listen:**
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
5. Copy "Signing secret" and update `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx
   ```

---

### 5. Razorpay Webhook (Production)
**Status:** ⬜ Pending

Set up production webhook:

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Switch to "Live Mode"
3. Click "Add New Webhook"
4. Configure:
   - **Webhook URL:** `https://omniflow-xi.vercel.app/api/webhooks/razorpay`
   - **Secret:** Create a strong secret
   - **Events:**
     - `payment.captured`
     - `payment.failed`
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.cancelled`
5. Update `.env`:
   ```
   RAZORPAY_WEBHOOK_SECRET=your_strong_webhook_secret
   ```

---

### 6. Firebase Indexes Deploy
**Status:** ⬜ Pending

Deploy Firestore indexes (required for queries to work):

```bash
# Login to Firebase (if not already)
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy security rules
firebase deploy --only firestore:rules
```

Expected output:
```
✔  firestore: deployed indexes
✔  firestore: deployed rules
```

---

### 7. Cron Job Setup
**Status:** ⬜ Pending

Set up free cron job at cron-job.org:

1. Go to: https://cron-job.org/en/
2. Create free account
3. Click "CREATE CRONJOB"
4. Configure:
   - **Title:** OmniFlow Automations
   - **URL:** `https://omniflow-xi.vercel.app/api/cron/run-all`
   - **Schedule:** Every 5 minutes
   - **Execution schedule:** `*/5 * * * *`
5. Go to "Advanced" tab:
   - **Request Method:** GET
   - **Request Headers:** Add header:
     - **Name:** `x-cron-secret`
     - **Value:** `a1b2c3d4-super-secret-key-5e6f7g8h-9i0j`
6. Save and enable

**This enables:**
- Scheduled email campaigns
- Workflow automations
- Social media scheduled posts
- Appointment reminders
- Follow-up sequences

---

### 8. Vercel Environment Variables
**Status:** ⬜ Pending

Add ALL environment variables to Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add each variable from `.env`:

**Required Variables:**
```
NEXT_PUBLIC_APP_URL=https://omniflow-xi.vercel.app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD4wYeXu9G4CD4t2jd8c8H75Af_fvF26Ig
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=omniflow-39htq.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=omniflow-39htq
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=omniflow-39htq.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=61458127409
NEXT_PUBLIC_FIREBASE_APP_ID=1:614581274094:web:5cc0c500dbc685e3cc3aff
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@omniflow-39htq.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=AIzaSyAe0RdINXmYNq7jx2ttAkcPa7HintUjal0
IMGBB_API_KEY=936eb597d493e25b083e173b43a8ec1a
ENCRYPTION_KEY=oJLk7E5XeLld/A7iZoJ+9jzGYzsbCjvys4GkrKwNxWY=
NEXT_PUBLIC_ENCRYPTION_KEY=oJLk7E5XeLld/A7iZoJ+9jzGYzsbCjvys4GkrKwNxWY=
CRON_SECRET=a1b2c3d4-super-secret-key-5e6f7g8h-9i0j
NEXT_PUBLIC_SUPERADMIN_EMAIL=support@worldmart.in

# Payment Keys (USE LIVE KEYS!)
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Buffer
BUFFER_CLIENT_ID=xxxxx
BUFFER_CLIENT_SECRET=xxxxx
```

**Important:** After adding variables, redeploy the app!

---

## 🟡 HIGH PRIORITY

### 9. Test All Features
**Status:** ⬜ Pending

Before going live, test these features:

**Authentication:**
- [ ] Sign up with new email
- [ ] Login with existing account
- [ ] Password reset flow
- [ ] Super admin access (support@worldmart.in)

**Payments:**
- [ ] Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Razorpay checkout (use test mode)
- [ ] Subscription upgrade/downgrade
- [ ] Webhook receives events

**Core Features:**
- [ ] Create lead
- [ ] Create deal
- [ ] Send email (requires user API keys)
- [ ] Send SMS (requires user API keys)
- [ ] AI content generation
- [ ] Social media content creation
- [ ] Buffer connection (Settings → Connected Accounts)
- [ ] Landing page creation
- [ ] Workflow builder

**Settings:**
- [ ] Company profile update
- [ ] User API key setup
- [ ] Team member invite

---

## 🟢 FINAL STEP

### 10. Final Deployment
**Status:** ⬜ Pending

After completing all above:

```bash
# Commit all changes
git add .
git commit -m "Production launch configuration"
git push origin main
```

Vercel will automatically deploy. Verify at: https://omniflow-xi.vercel.app

---

## 📋 QUICK REFERENCE

### Environment Variables Summary

| Variable | Current Status | Action Needed |
|----------|---------------|---------------|
| `NEXT_PUBLIC_APP_URL` | ✅ Set | None |
| `BUFFER_CLIENT_ID` | ⬜ Empty | Get from Buffer |
| `BUFFER_CLIENT_SECRET` | ⬜ Empty | Get from Buffer |
| `STRIPE_SECRET_KEY` | ⚠️ Test key | Replace with live |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | ⚠️ Test key | Replace with live |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Test | Create live webhook |
| `RAZORPAY_KEY_ID` | ⚠️ Test key | Replace with live |
| `RAZORPAY_KEY_SECRET` | ⚠️ Test key | Replace with live |
| `RAZORPAY_WEBHOOK_SECRET` | ⚠️ Weak | Create strong secret |

### Important URLs

| Service | URL |
|---------|-----|
| App | https://omniflow-xi.vercel.app |
| Vercel Dashboard | https://vercel.com/dashboard |
| Firebase Console | https://console.firebase.google.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| Razorpay Dashboard | https://dashboard.razorpay.com |
| Buffer Developers | https://buffer.com/developers/apps |
| Cron-job.org | https://cron-job.org |

### Webhook URLs (for payment providers)

| Provider | Webhook URL |
|----------|-------------|
| Stripe | `https://omniflow-xi.vercel.app/api/webhooks/stripe` |
| Razorpay | `https://omniflow-xi.vercel.app/api/webhooks/razorpay` |

---

## ✅ COMPLETION TRACKER

Mark each item as you complete it:

```
[ ] 1. Buffer API Credentials
[ ] 2. Stripe Live Keys
[ ] 3. Razorpay Live Keys
[ ] 4. Stripe Webhook (Production)
[ ] 5. Razorpay Webhook (Production)
[ ] 6. Firebase Indexes Deploy
[ ] 7. Cron Job Setup
[ ] 8. Vercel Environment Variables
[ ] 9. Test All Features
[ ] 10. Final Deployment
```

---

**🎉 Once all items are checked, your app is ready for production!**
