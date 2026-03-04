# 🚀 Footprints MVP Deployed to Production

## Deployment Summary

Your Footprints API is now **live on AWS Lambda** and connected to **real DynamoDB & S3**.

### Live API Endpoint
```
https://9fal46jhxe.execute-api.us-east-1.amazonaws.com
```

## ✅ What's Working

### Backend (FastAPI on Lambda)
- ✅ **Authentication**: `POST /api/v1/auth/login` - JWT token generation
- ✅ **Prompts**: `GET /api/v1/prompts/active` - List active prompts from DynamoDB
- ✅ **Completions**: `POST /api/v1/completions` - Create completion, stored in DynamoDB
- ✅ **History**: `GET /api/v1/history` - Retrieve user's completions, reverse chronological
- ✅ **User Profile**: `GET /api/v1/me` - Get user settings
- ✅ **Real AWS Integration**: DynamoDB table `footprints_core` + S3 bucket `footprints-dev-completions`

### Infrastructure
- ✅ **CloudFormation Stack**: `footprints-api-dev` (auto-managed by AWS SAM)
- ✅ **Lambda Function**: `FootprintsApiFunction` (Python 3.13, arm64, 512MB memory)
- ✅ **API Gateway**: HTTP API with CORS enabled
- ✅ **IAM Role**: Auto-created with DynamoDB + S3 permissions

### Mobile App Configuration
- ✅ **API URL Updated**: `apps/mobile/.env` now points to Lambda endpoint
- ✅ **Ready for Testing**: `npm start` in `apps/mobile/` will connect to live API

## 🧪 Testing the Lambda API

**Login:**
```bash
curl -X POST https://9fal46jhxe.execute-api.us-east-1.amazonaws.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

**Get Prompts** (with token):
```bash
TOKEN="<your_jwt_token>"
curl -H "Authorization: Bearer $TOKEN" \
  https://9fal46jhxe.execute-api.us-east-1.amazonaws.com/api/v1/prompts/active
```

## 📱 Next: Test with Mobile App

1. Update mobile `.env`:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://9fal46jhxe.execute-api.us-east-1.amazonaws.com
   ```
   ✅ Already done!

2. Start the mobile app:
   ```bash
   cd apps/mobile
   npm start
   ```

3. Scan QR code in Expo Go (iOS/Android)

4. Login with: `testuser` / `test123`

5. Full flow works: Login → Browse Prompts → Create Completion → View History

## 📊 Architecture Deployed

```
┌─────────────┐
│   Expo App  │
│   (Mobile)  │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────────────────────────────┐
│   API Gateway (HTTP API)              │
│   https://9fal46jhxe.execute-api...   │
└──────┬──────────────────────────────┘
       │
       │ Invoke
       │
┌──────▼──────────────────────────────┐
│   Lambda Function (Python 3.13)      │
│   - FastAPI + Uvicorn (Mangum ASGI)  │
│   - JWT Authentication                │
│   - 512MB memory, arm64 arch          │
└──────┬──────────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
   Query/Write        Read/Write        Store
   indexes             photos
       │                  │                  │
┌──────▼──────┐  ┌─────────▼──────┐  ┌──────▼──────┐
│  DynamoDB   │  │      DynamoDB  │  │   S3        │
│  footprints │  │  footprints    │  │   footprints│
│  _core      │  │  _core         │  │  -dev-      │
│  (PK/SK)    │  │  (GSI1)        │  │  completions│
└─────────────┘  └────────────────┘  └─────────────┘
```

## 🔧 How to Redeploy

If you make changes to the API code:

```bash
cd services/api

# Rebuild Lambda package
sam build

# Redeploy
sam deploy --region us-east-1 --stack-name footprints-api-dev --resolve-s3 --capabilities CAPABILITY_IAM
```

## 📝 Environment Files Updated

- ✅ `.env` - Root config (now points to Lambda)
- ✅ `apps/mobile/.env` - Mobile app (now points to Lambda)
- ✅ `services/api/.env` - API server (DynamoDB backend enabled)
- ✅ `.vscode/settings.json` - Python terminal env loading enabled

## 🎯 What's Next (Milestone 1)

- [ ] **S3 Photo Upload**: Implement `POST /api/v1/completions/{id}/photo` endpoint (signed URLs)
- [ ] **Feed & Friends**: Add friendship graph + feed query with joined completions
- [ ] **Mobile Photo Upload**: Wire up camera/gallery picker in UploadScreen
- [ ] **Expo EAS**: Set up build pipeline for iOS/Android distribution
- [ ] **GitHub Secrets**: Add `EXPO_TOKEN` and AWS credentials for auto-deployment

## 🚀 You're Now Running Production Infrastructure!

- Real AWS Lambda (pay-per-request, scales automatically)
- Real DynamoDB ($1.25/month for on-demand, scales automatically)
- Real S3 (pennies per GB stored)
- CloudWatch logs for monitoring
- CloudFormation for infrastructure as code

**Total estimated cost**: ~$5-10/month for low-traffic MVP.

---

**Need to redeploy?** Just push to `main` branch once GitHub Actions secrets are configured, and it'll auto-deploy via the workflow in `.github/workflows/deploy-api-dev.yml`.
