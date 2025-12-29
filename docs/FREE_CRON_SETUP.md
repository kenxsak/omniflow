# Free Cron Job Setup Guide

Since Vercel cron jobs require a Pro plan ($20/month), here's how to set up **FREE** cron jobs using external services.

## You Only Need 1 Cron Job! ✅

We've consolidated all automations into a **single endpoint**:

```
GET /api/cron/run-all
```

This one endpoint handles:
- ✅ Email Automations (drip sequences)
- ✅ Campaign Jobs (bulk Email/SMS/WhatsApp)
- ✅ Workflow Builder automations
- ✅ Scheduled Social Media Posts

---

## Setup with cron-job.org (100% FREE)

### Step 1: Set Environment Variable

In Vercel Dashboard → Settings → Environment Variables:
- **Name:** `CRON_SECRET`
- **Value:** Any random string (e.g., `omniflow_secret_abc123xyz`)

### Step 2: Create Account on cron-job.org

1. Go to https://cron-job.org
2. Sign up for free (no credit card needed)

### Step 3: Create ONE Cron Job

| Setting | Value |
|---------|-------|
| **Title** | OmniFlow Automations |
| **URL** | `https://your-app.vercel.app/api/cron/run-all` |
| **Schedule** | Every 5 minutes (`*/5 * * * *`) |
| **Method** | GET |
| **Header Name** | `Authorization` |
| **Header Value** | `Bearer your-cron-secret-here` |

### Step 4: Test It

Click "Test Run" - you should see:
```json
{
  "success": true,
  "automations": { "success": true, ... },
  "campaigns": { "success": true, ... },
  "workflows": { "success": true, ... },
  "socialPosts": { "success": true, ... }
}
```

---

## That's It! 🎉

Your entire automation system now runs with just **1 free cron job**.

| What Runs | Frequency |
|-----------|-----------|
| Email drip sequences | Every 5 min |
| Bulk campaigns (Email/SMS/WhatsApp) | Every 5 min |
| Workflow automations | Every 5 min |
| Scheduled social media posts | Every 5 min |

---

## Alternative: GitHub Actions

If you prefer GitHub, create `.github/workflows/cron.yml`:

```yaml
name: Run Automations

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Automations
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/run-all" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Troubleshooting

### "Unauthorized" Error
- Verify `CRON_SECRET` in Vercel matches the header value exactly
- Format: `Authorization: Bearer YOUR_SECRET`

### Timeout Issues
- Vercel Hobby has 10s timeout
- If you have many automations, consider Vercel Pro (60s timeout)
- Or use Firebase App Hosting (longer timeouts)
