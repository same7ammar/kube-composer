# Netlify Custom Domain Setup for kube-composer.com

## Current Issue
Your custom domain `kube-composer.com` shows a white page while `gorgeous-maamoul-daf273.netlify.app` works fine.

## Solution Steps

### 1. Check Netlify Domain Configuration

1. **Go to Netlify Dashboard**: https://app.netlify.com/sites/gorgeous-maamoul-daf273
2. **Navigate to**: Site settings → Domain management
3. **Verify custom domain**: Ensure `kube-composer.com` is listed as a custom domain
4. **Check SSL certificate**: Make sure HTTPS is enabled and certificate is provisioned

### 2. Update DNS Records in AWS Route 53

You need to point your domain to Netlify's servers. Choose **Option A** (recommended):

#### Option A: CNAME to Netlify (Recommended)
```
Type: CNAME
Name: @ (or leave blank for apex domain)
Value: gorgeous-maamoul-daf273.netlify.app
TTL: 300
```

#### Option B: A Records to Netlify Load Balancer
```
Type: A
Name: @ (or leave blank)
Value: 75.2.60.5
TTL: 300
```

### 3. Configure WWW Subdomain (Optional)
```
Type: CNAME
Name: www
Value: gorgeous-maamoul-daf273.netlify.app
TTL: 300
```

### 4. Verify DNS Propagation

After updating DNS records, wait 5-15 minutes and test:

```bash
# Check DNS resolution
nslookup kube-composer.com

# Should return Netlify's IP or CNAME
# Expected result: gorgeous-maamoul-daf273.netlify.app
```

### 5. Force HTTPS in Netlify

1. In Netlify dashboard → Domain settings
2. Scroll to **HTTPS** section
3. Enable **"Force HTTPS"**
4. Wait for SSL certificate to be issued (can take up to 24 hours)

### 6. Clear Browser Cache

After DNS changes:
1. Clear your browser cache
2. Try accessing in incognito/private mode
3. Test from different devices/networks

## Troubleshooting

### If site still shows white page:

1. **Check Netlify deployment logs**:
   - Go to Deploys tab in Netlify dashboard
   - Verify latest deployment was successful

2. **Verify build output**:
   - Ensure `dist/index.html` exists and has content
   - Check that all assets are properly built

3. **Test direct Netlify URL**:
   - If `gorgeous-maamoul-daf273.netlify.app` works but custom domain doesn't
   - The issue is DNS configuration

4. **Check browser console**:
   - Open developer tools
   - Look for any JavaScript errors
   - Check if assets are loading properly

### Common Issues:

- **DNS not propagated**: Wait longer (up to 48 hours)
- **SSL certificate pending**: Wait for Netlify to issue certificate
- **Wrong DNS records**: Double-check CNAME points to correct Netlify URL
- **Browser cache**: Clear cache or test in incognito mode

## Expected Timeline

- DNS changes: 5-30 minutes
- SSL certificate: Up to 24 hours
- Full propagation: Up to 48 hours

## Verification Commands

```bash
# Test DNS resolution
dig kube-composer.com

# Test HTTP response
curl -I https://kube-composer.com

# Test redirect
curl -I http://kube-composer.com
```

Your site should be accessible at: **https://kube-composer.com**