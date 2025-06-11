# AWS Route 53 DNS Setup for kube-composer.com

## DNS Configuration for GitHub Pages

Since you're using AWS Route 53 to manage your domain, you need to create the following DNS records:

### Option 1: Using A Records (Recommended for Apex Domain)

Create **A records** for your apex domain (`kube-composer.com`) pointing to GitHub Pages IP addresses:

```
Type: A
Name: @ (or leave blank for apex domain)
Value: 185.199.108.153
TTL: 300

Type: A  
Name: @ (or leave blank for apex domain)
Value: 185.199.109.153
TTL: 300

Type: A
Name: @ (or leave blank for apex domain) 
Value: 185.199.110.153
TTL: 300

Type: A
Name: @ (or leave blank for apex domain)
Value: 185.199.111.153
TTL: 300
```

### Option 2: Using CNAME (Alternative)

If you prefer CNAME, create:

```
Type: CNAME
Name: @ (or leave blank for apex domain)
Value: same7ammar.github.io
TTL: 300
```

### Optional: WWW Subdomain

If you want `www.kube-composer.com` to also work:

```
Type: CNAME
Name: www
Value: same7ammar.github.io
TTL: 300
```

## Steps in AWS Route 53 Console

1. **Log into AWS Console** and navigate to Route 53
2. **Select your hosted zone** for `kube-composer.com`
3. **Click "Create Record"**
4. **For each A record:**
   - Record name: Leave blank (for apex domain)
   - Record type: A
   - Value: Enter one of the GitHub Pages IP addresses
   - TTL: 300 seconds
   - Click "Create records"
5. **Repeat for all 4 IP addresses**

## GitHub Pages Configuration

After setting up DNS:

1. Go to your GitHub repository: `https://github.com/same7ammar/kube-composer`
2. Navigate to **Settings** → **Pages**
3. In the **Custom domain** field, enter: `kube-composer.com`
4. Check **Enforce HTTPS** (wait for SSL certificate to be issued)
5. Save the settings

## Verification

After DNS propagation (5-30 minutes), verify:

```bash
# Check DNS resolution
nslookup kube-composer.com

# Check if site is accessible
curl -I https://kube-composer.com
```

## Important Notes

- **DNS Propagation**: Changes may take 5-30 minutes to propagate
- **SSL Certificate**: GitHub will automatically issue an SSL certificate for your custom domain
- **HTTPS**: Always use HTTPS for the final URL
- **CNAME File**: The `CNAME` file in your repository tells GitHub which domain to serve

## Troubleshooting

If the site doesn't load:

1. **Check DNS**: Use `nslookup kube-composer.com` to verify DNS resolution
2. **Wait for SSL**: SSL certificate issuance can take up to 24 hours
3. **Clear Cache**: Clear your browser cache and try again
4. **Check GitHub Pages**: Ensure the custom domain is properly set in repository settings

Your site will be available at: **https://kube-composer.com**