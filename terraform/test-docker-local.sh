#!/bin/bash

# Script to test Saheli backend Docker image locally

IMAGE_NAME="saheli-backend:local"
CONTAINER_NAME="saheli-backend-test"

echo "🐳 Testing Saheli backend Docker image locally..."

# Build the image
echo "🔨 Building Docker image..."
docker build \
  --tag "$IMAGE_NAME" \
  --file ../backend/Dockerfile \
  ../backend

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed!"
  exit 1
fi

echo "✅ Docker image built successfully!"

# Stop and remove existing container if it exists
echo "🧹 Cleaning up existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Run the container with environment variables
echo "🚀 Starting container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p 4000:4000 \
  -e PORT_SAHELI=4000 \
  -e MONGO_URI_SAHELI="mongodb+srv://Saheli-admin:gouri2004@saheli-cluster.ao4zf1g.mongodb.net/saheli_latest?appName=Saheli-cluster" \
  -e JWT_SECRET_SAHELI="fygmw2bwqxpz64N85Ihzvmw6l3n7JLkMFYTp8gWXc" \
  -e WHATSAPP_ACCESS_TOKEN="EAAru3m9fqy8BQWF9Fl9CH9ICkGSCZBGlRDZCiHT9ZAxjztY1y4F4xNvd3bdyN4y0RF0etUZBg1rr58Ke8bjHX86JJGmR5MZB1D6mdVJLTr2o4Y70vuyhjwwBg2jlIed3NPFnZCsV1AzgEp2hBxxaS2aF7xudQWKbmwTt7D2xhYZAMWQAmfn7m7cp9PeRX44L9yIJD1dHd9rhLmt7kA6VXzAS9IRuqR24EKxfxsnrnNaI6QlqRc0Yvl3ww4HdvINNjr6KjA972uX28Y2kyQHTseAEwZDZD" \
  -e WHATSAPP_PHONE_NUMBER_ID="962032496989811" \
  "$IMAGE_NAME"

if [ $? -ne 0 ]; then
  echo "❌ Failed to start container!"
  exit 1
fi

echo "✅ Container started!"
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check container logs
echo "📋 Container logs:"
docker logs "$CONTAINER_NAME"

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
curl -s http://localhost:4000/health || echo "Health check failed"

# Test root endpoint
echo ""
echo "🌐 Testing root endpoint..."
curl -s http://localhost:4000/ || echo "Root endpoint failed"

echo ""
echo "✅ Container is running!"
echo "📍 API available at: http://localhost:4000"
echo "🏥 Health check: http://localhost:4000/health"
echo ""
echo "To view logs: docker logs -f $CONTAINER_NAME"
echo "To stop container: docker stop $CONTAINER_NAME"
echo "To remove container: docker rm $CONTAINER_NAME"

