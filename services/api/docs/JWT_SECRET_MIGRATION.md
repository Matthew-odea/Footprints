# JWT Secret Migration to AWS Secrets Manager

## Overview

The JWT secret has been migrated from a hardcoded environment variable to AWS Secrets Manager for improved security.

## Architecture

### Before
- JWT secret hardcoded as `"change-me"` in `template.yaml`
- Security vulnerability in production
- No secret rotation capability

### After
- JWT secret stored in AWS Secrets Manager
- Lambda has permission to read secret
- Cached in memory for performance
- Fallback to environment variable for local development
- Secret can be rotated without code changes

## Setup Instructions

### 1. Create Secret in AWS Secrets Manager

Run the provided script (requires AWS admin permissions):

```bash
cd services/api/scripts
chmod +x create-jwt-secret.sh
./create-jwt-secret.sh
```

Or manually create the secret:

```bash
# Generate secure random secret
JWT_SECRET=$(openssl rand -hex 32)

# Create in Secrets Manager
aws secretsmanager create-secret \
  --name footprints/jwt-secret \
  --secret-string "$JWT_SECRET" \
  --region us-east-1 \
  --description "JWT secret for Footprints API authentication"
```

### 2. Deploy Lambda with Updated Permissions

The SAM template has been updated to include Secrets Manager permissions:

```bash
cd services/api
sam build
sam deploy --stack-name footprints-api-dev --region us-east-1
```

### 3. Verify Authentication Works

```bash
# Test login endpoint
curl -X POST https://9fal46jhxe.execute-api.us-east-1.amazonaws.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"test"}'

# Should return JWT token
```

## Local Development

For local development, the code falls back to the `JWT_SECRET` environment variable:

```bash
# .env file
JWT_SECRET=your-local-secret-here
```

**Important:** Never commit actual secrets to version control!

## How It Works

1. **Lambda Cold Start:**
   - `_get_jwt_secret()` is called
   - Checks if `JWT_SECRET_NAME` is configured
   - Fetches secret from Secrets Manager using boto3
   - Caches result with `@lru_cache`

2. **Subsequent Requests:**
   - Uses cached secret (no additional Secrets Manager calls)
   - Fast authentication with no latency penalty

3. **Fallback Behavior:**
   - If Secrets Manager is unavailable → uses `JWT_SECRET` env var
   - If JWT_SECRET is "change-me" → logs warning
   - Graceful degradation for local development

## Security Considerations

### ✅ Improvements
- Secret not in source code
- Secret not in CloudFormation outputs
- Can be rotated without deployment
- Audit trail in AWS CloudTrail
- Encrypted at rest

### ⚠️ Considerations
- Lambda needs Secrets Manager permissions
- Secret cached per Lambda instance (cold start overhead ~50ms)
- Must update secret manually (no auto-rotation yet)

## Monitoring

Check CloudWatch Logs for:
- ✅ `JWT secret loaded from Secrets Manager: footprints/jwt-secret`
- ⚠️ `Failed to fetch secret from Secrets Manager: ... Falling back to JWT_SECRET env var.`
- 🚨 `Using default JWT secret 'change-me' - THIS IS INSECURE IN PRODUCTION!`

## Secret Rotation

To rotate the JWT secret:

1. Generate new secret:
   ```bash
   NEW_SECRET=$(openssl rand -hex 32)
   ```

2. Update in Secrets Manager:
   ```bash
   aws secretsmanager update-secret \
     --secret-id footprints/jwt-secret \
     --secret-string "$NEW_SECRET" \
     --region us-east-1
   ```

3. Wait for Lambda cache to expire (or restart function)

**Note:** Rotating the secret will invalidate all existing JWT tokens. Users will need to log in again.

## Troubleshooting

### Issue: "AccessDeniedException" when fetching secret

**Cause:** Lambda execution role lacks Secrets Manager permissions

**Fix:** Ensure SAM template includes:
```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - secretsmanager:GetSecretValue
        Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:footprints/jwt-secret-*'
```

### Issue: Authentication fails after deployment

**Cause:** Secret not created yet, falling back to "change-me"

**Fix:** Run `create-jwt-secret.sh` to create the secret

### Issue: Old tokens invalid after secret rotation

**Cause:** This is expected behavior

**Fix:** Users must log in again to get new tokens signed with new secret

## Cost

AWS Secrets Manager pricing:
- $0.40/month per secret
- $0.05 per 10,000 API calls

For this use case:
- 1 secret = $0.40/month
- API calls: ~0 (cached per Lambda instance)
- **Total: ~$0.40/month**

## Future Improvements

1. **Automatic Rotation:**
   - Set up Lambda rotation function
   - Rotate every 90 days
   - Use dual-secret strategy for zero-downtime rotation

2. **Key Versioning:**
   - Support multiple active keys simultaneously
   - Gradual rollover without invalidating old tokens

3. **Per-Environment Secrets:**
   - Separate secrets for dev/staging/prod
   - Conditional secret names in template

## References

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
