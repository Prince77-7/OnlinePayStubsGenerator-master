# Cloudflare Container Deployment Guide

This Pay Stub Generator application has been configured for deployment to **Cloudflare Containers**, which provides the perfect environment for running Puppeteer-based PDF generation.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Docker**: Make sure Docker is running locally
4. **Authentication**: Login to Cloudflare
   ```bash
   wrangler login
   ```

## Deployment Steps

### Option 1: Quick Deploy (Recommended)
```bash
./deploy.sh
```

### Option 2: Manual Deploy
```bash
# Deploy to Cloudflare
wrangler deploy
```

## Configuration Files

- **`Dockerfile`** - Containerizes the Node.js app with Puppeteer support
- **`wrangler.toml`** - Cloudflare configuration
- **`src/index.js`** - Worker that manages the container
- **`.dockerignore`** - Excludes unnecessary files from container build

## How It Works

1. **Container Setup**: Your app runs in a Linux container with Chrome browser
2. **Worker Bridge**: A Cloudflare Worker manages container instances and routes traffic
3. **Auto-scaling**: Cloudflare automatically scales containers based on demand
4. **Global Distribution**: Containers deploy globally for low latency

## API Endpoints

Once deployed, your app will be available at your Cloudflare URL:

- **`GET /`** - Web interface for creating pay stubs
- **`POST /render-pdf`** - Generate single PDF from JSON data
- **`POST /render-multiple-pdfs`** - Generate combined PDF from array of pay stub data

## Environment Configuration

The container is configured with:
- **Port**: 3000 (internal)
- **Internet Access**: Disabled for security
- **Browser**: Chrome with optimized flags for container environment
- **Graceful Shutdown**: Handles SIGTERM/SIGINT signals properly

## Benefits of Cloudflare Containers

✅ **Global Edge Deployment** - Low latency worldwide  
✅ **Auto-scaling** - Handles traffic spikes automatically  
✅ **Built-in Security** - DDoS protection and WAF  
✅ **Cost Effective** - Pay only for active container time  
✅ **Zero Configuration** - No server management required  
✅ **Puppeteer Support** - Full browser automation capabilities  

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Ensure Docker is running locally during deployment
   - Check that all dependencies are in package.json

2. **PDF generation fails**
   - Container includes all necessary browser dependencies
   - Puppeteer is configured with optimized flags for containers

3. **Deployment fails**
   - Verify you're authenticated: `wrangler whoami`
   - Check Wrangler CLI is latest version: `npm update -g wrangler`

### Logs and Monitoring

Monitor your container through:
- Cloudflare Dashboard → Workers → Your App
- Real-time logs during development
- Performance metrics and analytics

## Cost Estimation

Cloudflare Containers pricing (as of 2024):
- **Free Tier**: Limited container time for development
- **Paid Plans**: $0.000024/request + container runtime costs
- **No idle costs**: Pay only when container is actively processing requests

## Support

For issues with:
- **Application Logic**: Check server.js and your pay stub data
- **Container Deployment**: Review Dockerfile and wrangler.toml
- **Cloudflare Platform**: Check [Cloudflare Docs](https://developers.cloudflare.com/containers/) 