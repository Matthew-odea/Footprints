#!/bin/bash
# Script to create JWT secret in AWS Secrets Manager
# Run this with an AWS account that has secretsmanager:CreateSecret permissions

set -e

REGION="us-east-1"
SECRET_NAME="footprints/jwt-secret"

echo "🔐 Creating JWT secret in AWS Secrets Manager..."

# Generate a secure random secret
JWT_SECRET=$(openssl rand -hex 32)

# Create the secret
aws secretsmanager create-secret \
  --name "$SECRET_NAME" \
  --secret-string "$JWT_SECRET" \
  --region "$REGION" \
  --description "JWT secret for Footprints API authentication" \
  --tags Key=Application,Value=Footprints Key=Environment,Value=Production

echo "✅ Secret created successfully!"
echo "Secret ARN:"
aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" --query 'ARN' --output text

echo ""
echo "📝 Next steps:"
echo "1. Update SAM template with secret ARN"
echo "2. Deploy Lambda function with updated permissions"
echo "3. Test authentication with new secret"
