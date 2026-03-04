# 🚀 EAS Preview Deployment Setup

This guide walks you through setting up **Expo EAS Preview** for automated mobile app builds and distribution.

## What You Get

✅ Every git push builds iOS + Android previews  
✅ Shareable QR codes for testing on real devices  
✅ No need to download APK/IPA files  
✅ Team members can scan and test instantly with Expo Go  
✅ Automated CI/CD for the mobile app  

---

## Step 1: Create Expo Account

1. Go to https://expo.dev
2. Click **Sign Up** (create free account)
3. Verify email
4. Save your **username** (you'll need this)

---

## Step 2: Get Expo Token

**On your machine:**

```bash
npm install -g eas-cli

eas login
# Follow prompts, use your Expo username/password
```

**Verify it worked:**
```bash
eas whoami
# Should print your username
```

**Get your access token:**
```bash
eas secret:create --scope project --name EXPO_TOKEN
# This won't display the token, but registers it
```

**Alternative (simpler): Get token from Expo Dashboard**

1. Go to https://expo.dev/settings/access-tokens
2. Click **Create Token**
3. Name it `GITHUB_ACTIONS`
4. Set expiry: 1 year or never expire
5. Copy the token (long string)

---

## Step 3: Add Token to GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `EXPO_TOKEN`
4. Value: Paste the token from step 2
5. Click **Add secret**

---

## Step 4: Verify Setup

Push a change to `main` branch (any file):

```bash
cd /Users/matthewodea/development/Footprints

git add .
git commit -m "Enable EAS Preview builds"
git push origin main
```

**Watch the build:**

1. Go to GitHub repo → **Actions** tab
2. Click the latest workflow run (`EAS Preview Build & Deploy`)
3. Wait for it to complete (5-15 minutes)
4. When done, click the commit comment link to see the build details

---

## Step 5: Test on Your Phone

Once the build completes:

1. **Install Expo Go**:
   - iOS: App Store → search "Expo Go"
   - Android: Google Play → search "Expo Go"

2. **Open the build link**:
   - Go to https://expo.dev/build-details
   - Find your project (`footprints`)
   - Click the latest build

3. **Scan QR code** with Expo Go
   - Your app loads on your phone
   - Login: `testuser` / `test123`
   - Full flow works: Login → Prompts → Completions → History

---

## Step 6: Share with Team

Each build generates a **unique QR code**. Share:

```
📱 Scan to test Footprints: [QR CODE]
🔗 Link: https://expo.dev/accounts/[username]/projects/footprints/builds
API: https://9fal46jhxe.execute-api.us-east-1.amazonaws.com
```

Anyone with Expo Go can scan and test.

---

## Troubleshooting

### Build fails with "Unauthorized"
- Verify `EXPO_TOKEN` secret is added to GitHub
- Check token hasn't expired (create new one if needed)

### Build fails with "Project not linked"
- Run locally: `cd apps/mobile && eas init`
- Follow prompts to create/link project

### Old version appears on phone
- Expo caches builds
- Reload: Shake phone → click "Reload"
- Or open fresh build link from https://expo.dev/build-details

### Build takes too long
- First build: 10-15 minutes (installs everything)
- Subsequent builds: 5-7 minutes
- You can close browser, GitHub Actions continues building

---

## Next Steps

Once EAS Preview is working:

1. **Iterate on features**: Every push auto-builds
2. **Collect feedback**: Share QR with stakeholders
3. **For app store release**: Run `eas build --platform ios --distribution appstore` (requires Apple dev account)

---

## Architecture

```
┌─────────────┐
│ Git push    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ GitHub Actions Workflow  │
│   (eas-preview.yml)      │
└──────┬─────────┬──────────┘
       │         │
     iOS      Android
       │         │
       ▼         ▼
┌─────────────────────────┐
│  EAS Build Service      │
│  (Expo servers)         │
└──────┬─────────┬────────┘
       │         │
       ▼         ▼
  QR Code   QR Code
       │         │
       └────┬────┘
            ▼
      Expo Go App
      (on phone)
```

---

## Cost

✅ **Free** for preview builds (unlimited)  
💰 ~$40/month if you want to submit to app stores (Sign up for Expo Paid)

For MVP, free tier is perfect.

---

**You're now ready for automated mobile deployments! 🎉**
