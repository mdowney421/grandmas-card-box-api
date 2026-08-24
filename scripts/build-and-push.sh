#!/usr/bin/env bash
set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID="783354083701"
REPOSITORY="grandmas-card-box-api-lambda"
REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
TAG="$(git rev-parse --short HEAD)"

cd "$(dirname "$0")"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker build --platform linux/amd64 -f Dockerfile.lambda \
  -t "$REGISTRY/$REPOSITORY:$TAG" \
  -t "$REGISTRY/$REPOSITORY:latest" .

docker push "$REGISTRY/$REPOSITORY:$TAG"
docker push "$REGISTRY/$REPOSITORY:latest"

echo ""
echo "Pushed: $REGISTRY/$REPOSITORY:$TAG"
echo "Update the Lambda function in the AWS console with this image URI (or the :latest tag)."
