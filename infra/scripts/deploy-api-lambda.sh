#!/bin/bash
set -e

# Deploy API to AWS Lambda using Serverless Framework
# Usage: ./deploy.sh [stage] [region]

STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Deploying Footprints API to Lambda (stage: $STAGE, region: $REGION)..."

cd "$(dirname "$0")/services/api"

# Install serverless if not present
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Install serverless plugins
npm install --save-dev serverless-python-requirements

# Load environment from root .env
export $(grep -v '^#' ../../.env | xargs)

# Deploy via serverless
echo "📡 Deploying Lambda function..."
STAGE=$STAGE serverless deploy --region $REGION --force

echo "✅ Deployment complete!"
echo ""
echo "📋 Get your API endpoint:"
serverless info --region $REGION
