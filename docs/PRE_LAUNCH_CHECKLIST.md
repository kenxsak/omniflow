# OmniFlow Pre-Launch Checklist

## 🔴 CRITICAL - Must Fix Before Launch

### 1. Missing Environment Variables
Your `.env` is missing these important variables:

```bash
# App URL (REQUIRED for OAuth callbacks)
NEXT_PUBLIC_APP_URL=https://omniflow-xi.vercel.app

# Buffer Integration (REQUIRED for social media publishing)
BUFFER_CLIENT_ID=your_buffer_client_id
BUFFER_CLIENT_SECRET=your_buffer_client_secret
```

**How to get Buffer credentials:**
1. Go to https://buffer.com/developers/apps
2. Create a new application
3. Set callback URL to: `https://omniflow-xi.vercel.app/api/auth/buffer/callback`
4. Copy Client ID and Client Secret

---

### 2. Firebase Deployment

Run these commands to deploy Firebase configurations:

```bash
# Deploy Firestore indexes (REQUIRED - queries will fail without this)
firebase deploy --only firestore:indexes

# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

---

### 3. Cron Job Setup (REQUIRED for automations)

Set up a free cron job at https://cron-job.org:

1. Create account at cron-job.org
2. Add new cron job:
   - **URL:** `https://omniflow-xi.vercel.app/api/cron/run-all`
   - **Schedule:** Every 5 minutes (`*/5 * * * *`)
   - **HTTP Method:** GET
   - **Headers:** Add `x-cron-secret: a1b2c3d4-super-secret-key-5e6f7g8h-9i0j`

This enables:
- Scheduled email campaigns
- Workflow automations
- Scheduled social media posts
- Appointment reminders

---

## 🟡 RECOMMENDED - Should Do Before Launch

### 4. Vercel Environment Variables

Ensure ALL these are set in Vercel Dashboard → Settings → Environment Variables:

**Firebase (Already configured ✅):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Payments (Already configured ✅):**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_WEBHOOK_SECRET`

**AI & Utilities (Already configured ✅):**
- `GEMINI_API_KEY`
- `IMGBB_API_KEY`
- `ENCRYPTION_KEY`
- `NEXT_PUBLIC_ENCRYPTION_KEY`

**Security (Already configured ✅):**
- `CRON_SECRET`
- `NEXT_PUBLIC_SUPERADMIN_EMAIL`

**Missing - Add these:**
- `NEXT_PUBLIC_APP_URL` = `https://omniflow-xi.vercel.app`
- `BUFFER_CLIENT_ID` = (from Buffer Developer Portal)
- `BUFFER_CLIENT_SECRET` = (from Buffer Developer Portal)

---

### 5. Payment Webhooks

**Stripe Webhook:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://omniflow-xi.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

**Razorpay Webhook:**
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add endpoint: `https://omniflow-xi.vercel.app/api/webhooks/razorpay`
3. Select events: `payment.captured`, `subscription.*`
4. Set secret to match `RAZORPAY_WEBHOOK_SECRET`

---

## 🟢 OPTIONAL - Nice to Have

### 6. Production Keys

When ready for real payments, switch to live keys:
- Stripe: Change `sk_test_` to `sk_live_` and `pk_test_` to `pk_live_`
- Razorpay: Change `rzp_test_` to `rzp_live_`

### 7. Custom Domain

If using custom domain:
1. Add domain in Vercel
2. Update `NEXT_PUBLIC_APP_URL`
3. Update all OAuth callback URLs (Buffer, etc.)
4. Update webhook URLs (Stripe, Razorpay)

### 8. Monitoring

Consider setting up:
- Firebase Performance Monitoring
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)

---

## ✅ Quick Verification Steps

After completing the above, verify:

1. **Login/Signup works** - Create a test account
2. **Dashboard loads** - No white screens or errors
3. **AI features work** - Try generating content
4. **Payments work** - Test with Stripe/Razorpay test cards
5. **Buffer connects** - Go to Settings → Connected Accounts
6. **Cron runs** - Check `/api/cron/run-all` returns success

---

## 📋 Summary

| Item | Status | Priority |
|------|--------|----------|
| NEXT_PUBLIC_APP_URL | ✅ Added | Critical |
| Buffer credentials | ⚠️ Placeholders added - need real keys | Critical |
| Firebase indexes | ⚠️ Run: `firebase deploy --only firestore:indexes` | Critical |
| Cron job setup | ❌ Manual setup needed | Critical |
| Payment webhooks | ⚠️ Verify in Stripe/Razorpay dashboards | High |
| Production keys | ⏳ Later | Low |

---

## 🚀 Launch Command

Once everything is ready:

```bash
# Commit and push to trigger Vercel deployment
git add .
git commit -m "Pre-launch configuration complete"
git push origin main
```

Your app will be live at: https://omniflow-xi.vercel.app
