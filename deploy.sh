#!/bin/bash

# Cloudflare Container Deployment Script for Pay Stub Generator
# Make sure you have Wrangler CLI installed and authenticated

echo "🚀 Deploying Pay Stub Generator to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is authenticated
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please authenticate with Cloudflare first:"
    echo "wrangler login"
    exit 1
fi

# Build and deploy
echo "📦 Building and deploying container..."
wrangler deploy

echo "✅ Deployment complete!"
echo ""
echo "Your Pay Stub Generator is now running on Cloudflare!"
echo "Check your Cloudflare dashboard for the deployment URL."
echo ""
echo "API Endpoints:"
echo "  GET  /           - Web interface"
echo "  POST /render-pdf - Generate single PDF"
echo "  POST /render-multiple-pdfs - Generate multiple PDFs" 