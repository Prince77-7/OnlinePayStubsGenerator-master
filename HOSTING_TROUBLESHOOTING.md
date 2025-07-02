# Hosting Troubleshooting Guide

## 🔧 "Failed to Fetch" Error Solutions

The "failed to fetch" error occurs when the frontend can't connect to your backend API. Here's how to fix it:

### ✅ What I Fixed

I've updated your application to automatically detect the environment:

- **Local Development**: Uses `http://localhost:3003`
- **Hosted Environment**: Uses your actual domain (e.g., `https://yourdomain.com`)

### 🔍 Debug Steps

1. **Check the Browser Console**
   - Open Developer Tools (F12)
   - Look for the "API Base URL" log message
   - Verify it shows the correct URL for your environment

2. **Verify Backend is Running**
   - Ensure your server is actually running on the hosted environment
   - Check that port 3003 is accessible
   - For cloud platforms, ensure the container/service is healthy

3. **Check Network Tab**
   - Open Developer Tools → Network tab
   - Try generating a paystub
   - Look for failed requests to see the exact error

### 🌐 Common Hosting Platform Issues

#### **Railway / Heroku / Render**
```bash
# Make sure your start script is correct
"scripts": {
  "start": "node server.js"
}

# Ensure PORT environment variable is used
const PORT = process.env.PORT || 3003;
```

#### **Google Cloud Run**
```bash
# Deploy with correct port
gcloud run deploy paystub-generator \
  --image gcr.io/YOUR_PROJECT/paystub-generator \
  --platform managed \
  --port 3003 \
  --allow-unauthenticated
```

#### **AWS / Azure**
- Ensure security groups allow inbound traffic on port 3003
- Check that health checks are passing
- Verify environment variables are set correctly

### 🔧 Manual URL Override (If Needed)

If automatic detection isn't working, you can manually set the API base URL:

**In `js/index.js`**, replace the API_BASE line with:
```javascript
const API_BASE = 'https://your-actual-domain.com'; // Replace with your hosted URL
```

### 📋 Hosting Checklist

- [ ] Server starts successfully (`npm start` works)
- [ ] Port 3003 is accessible from outside
- [ ] No CORS errors in browser console
- [ ] Health check endpoint responds (if required by platform)
- [ ] Environment variables set correctly
- [ ] Static files (HTML, CSS, JS) are being served

### 🚨 Emergency Debugging

Add this to the top of your hosted `index.html` for debugging:

```html
<script>
console.log('Window location:', window.location);
console.log('Hostname:', window.location.hostname);
console.log('Origin:', window.location.origin);
</script>
```

### 📞 Platform-Specific Help

**Railway**: Check deployment logs in dashboard
**Heroku**: Use `heroku logs --tail`
**Google Cloud Run**: Check Cloud Console logs
**Render**: Check service logs in dashboard
**Netlify/Vercel**: These are for static sites - you need a backend platform

### 🎯 Quick Test

After deploying, test these URLs directly in your browser:
- `https://yourdomain.com` - Should show the main interface
- `https://yourdomain.com/health` - Should return "OK" (if you add this endpoint)

If the main page loads but PDF generation fails, it's definitely an API connectivity issue. 