# Social Media Publishing Setup Guide (Super Admin)

This guide walks you through setting up direct social media publishing for OmniFlow. Once configured, your users can connect their social accounts and publish directly from the platform.

---

## Overview

| Platform | Direct Publish | Scheduling | App Review Required |
|----------|---------------|------------|---------------------|
| Facebook | ✅ | ✅ | Yes (for production) |
| Instagram | ✅ | ✅ | Yes (via Facebook) |
| LinkedIn | ✅ | ✅ | No |
| Twitter/X | ✅ | ✅ | No |

**Without API Setup:** Users can still use "Quick Publish" which copies content and opens the platform.

---

## 1. Facebook & Instagram Setup

Facebook and Instagram use the same Meta developer platform.

### Step 1: Create Meta Developer Account

1. Go to https://developers.facebook.com/
2. Click **"Get Started"** or **"My Apps"**
3. Log in with your Facebook account
4. Accept the developer terms

### Step 2: Create a New App

1. Click **"Create App"**
2. Select **"Other"** → **"Business"**
3. Enter app details:
   - **App Name:** `OmniFlow Social Publisher`
   - **App Contact Email:** Your business email
4. Click **"Create App"**

### Step 3: Add Facebook Login Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"**
4. Enter your site URL: `https://omniflow-xi.vercel.app`
5. Click **"Save"** → **"Continue"**

### Step 4: Configure OAuth Settings

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. Add Valid OAuth Redirect URIs:
   ```
   https://omniflow-xi.vercel.app/api/auth/social/facebook
   ```
3. Enable these settings:
   - ✅ Client OAuth Login
   - ✅ Web OAuth Login
   - ✅ Enforce HTTPS
4. Click **"Save Changes"**

### Step 5: Get Your Credentials

1. Go to **Settings** → **Basic** (left sidebar)
2. Copy these values:
   - **App ID** → `FACEBOOK_APP_ID`
   - **App Secret** (click "Show") → `FACEBOOK_APP_SECRET`

### Step 6: Request Permissions (For Production)

For development/testing, you can use your own accounts immediately. For production (other users), you need app review:

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `pages_show_list` - See list of Pages
   - `pages_read_engagement` - Read Page content
   - `pages_manage_posts` - Create and manage posts
   - `instagram_basic` - Access Instagram account
   - `instagram_content_publish` - Publish to Instagram

**Note:** App review typically takes 1-2 weeks. Provide clear use case descriptions.

### Step 7: Add to Vercel Environment

In Vercel Dashboard → Settings → Environment Variables:

```
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

---

## 2. LinkedIn Setup

### Step 1: Create LinkedIn Developer Account

1. Go to https://www.linkedin.com/developers/
2. Click **"Create App"**
3. Log in with your LinkedIn account

### Step 2: Create App

Fill in the form:
- **App Name:** `OmniFlow Social Publisher`
- **LinkedIn Page:** Select or create a company page
- **Privacy Policy URL:** `https://omniflow-xi.vercel.app/privacy`
- **App Logo:** Upload your logo (100x100px)

Click **"Create App"**

### Step 3: Verify Your App

1. Go to **Settings** tab
2. Click **"Verify"** next to your company page
3. Follow the verification steps (usually involves admin approval)

### Step 4: Configure OAuth

1. Go to **Auth** tab
2. Add OAuth 2.0 Redirect URLs:
   ```
   https://omniflow-xi.vercel.app/api/auth/social/linkedin
   ```
3. Copy your credentials:
   - **Client ID** → `LINKEDIN_CLIENT_ID`
   - **Client Secret** (click eye icon) → `LINKEDIN_CLIENT_SECRET`

### Step 5: Request Products

1. Go to **Products** tab
2. Request access to:
   - **Share on LinkedIn** - Required for posting
   - **Sign In with LinkedIn using OpenID Connect** - For authentication

These are usually approved instantly.

### Step 6: Add to Vercel Environment

```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

---

## 3. Twitter/X Setup

### Step 1: Create Twitter Developer Account

1. Go to https://developer.twitter.com/
2. Click **"Sign up"** or **"Developer Portal"**
3. Log in with your Twitter account
4. Apply for developer access (free tier available)

### Step 2: Create a Project

1. In Developer Portal, click **"+ Create Project"**
2. Enter project details:
   - **Project Name:** `OmniFlow`
   - **Use Case:** Select "Making a bot" or "Building tools for Twitter users"
3. Click **"Next"**

### Step 3: Create an App

1. **App Name:** `OmniFlow Social Publisher`
2. Click **"Complete"**

### Step 4: Configure OAuth 2.0

1. Go to your app → **Settings** tab
2. Scroll to **User authentication settings**
3. Click **"Set up"**
4. Configure:
   - **App permissions:** Read and write
   - **Type of App:** Web App, Automated App or Bot
   - **Callback URI:**
     ```
     https://omniflow-xi.vercel.app/api/auth/social/twitter
     ```
   - **Website URL:** `https://omniflow-xi.vercel.app`
5. Click **"Save"**

### Step 5: Get OAuth 2.0 Credentials

1. Go to **Keys and tokens** tab
2. Under **OAuth 2.0 Client ID and Client Secret**:
   - Click **"Regenerate"** if needed
   - Copy **Client ID** → `TWITTER_CLIENT_ID`
   - Copy **Client Secret** → `TWITTER_CLIENT_SECRET`

### Step 6: Add to Vercel Environment

```
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
```

**Note:** Twitter free tier allows 1,500 tweets/month across all users.

---

## 4. Add All Environment Variables to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables (for all environments: Production, Preview, Development):

| Variable | Value |
|----------|-------|
| `FACEBOOK_APP_ID` | Your Facebook App ID |
| `FACEBOOK_APP_SECRET` | Your Facebook App Secret |
| `LINKEDIN_CLIENT_ID` | Your LinkedIn Client ID |
| `LINKEDIN_CLIENT_SECRET` | Your LinkedIn Client Secret |
| `TWITTER_CLIENT_ID` | Your Twitter Client ID |
| `TWITTER_CLIENT_SECRET` | Your Twitter Client Secret |
| `NEXT_PUBLIC_APP_URL` | `https://omniflow-xi.vercel.app` |

After adding, click **"Redeploy"** to apply changes.

---

## 5. Testing the Integration

### Test Facebook/Instagram:

1. Log into OmniFlow as a test user
2. Go to **Social Media** → **Planner** → **Publish** tab
3. Click **"Facebook"** to connect
4. Authorize with your Facebook account
5. Select a Page to connect
6. Create content and click **"Direct Publish"**

### Test LinkedIn:

1. Click **"LinkedIn"** to connect
2. Authorize with your LinkedIn account
3. Create content and publish

### Test Twitter:

1. Click **"X (Twitter)"** to connect
2. Authorize with your Twitter account
3. Create content and publish

---

## 6. Troubleshooting

### "App not configured" Error
- Verify environment variables are set in Vercel
- Redeploy after adding variables

### "Invalid redirect URI" Error
- Check that callback URLs match exactly (including https://)
- No trailing slashes

### Facebook "App in Development Mode"
- Only admins/testers can use the app
- Add test users: App Dashboard → Roles → Add Testers
- For public access, submit for App Review

### LinkedIn "Unauthorized" Error
- Verify company page is verified
- Check that "Share on LinkedIn" product is approved

### Twitter Rate Limits
- Free tier: 1,500 tweets/month
- Consider Basic tier ($100/month) for higher limits

---

## 7. Production Checklist

Before going live:

- [ ] Facebook App Review approved
- [ ] LinkedIn company page verified
- [ ] Twitter developer account approved
- [ ] All environment variables set in Vercel Production
- [ ] Tested with real accounts
- [ ] Privacy policy URL configured on all platforms
- [ ] Terms of service URL configured

---

## 8. User Experience

Once configured, your users will see:

1. **Social Media → Planner → Publish tab**
   - "Connect" buttons for each platform
   - One-click OAuth connection

2. **When Creating Content**
   - "Direct Publish" buttons for connected accounts
   - "Quick Publish" (copy & open) for non-connected platforms

3. **Content Calendar**
   - Schedule posts for future publishing
   - Cron job processes scheduled posts every 5 minutes

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify environment variables in Vercel
3. Check platform developer dashboards for API errors
4. Review OAuth callback URLs match exactly

---

*Last Updated: December 2024*
