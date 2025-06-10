# Manual GitHub Pages Setup Guide

## Step 1: Repository Settings

1. **Go to your GitHub repository**: https://github.com/same7ammar/kube-composer
2. **Click on "Settings"** tab (located at the top of your repository)
3. **Scroll down to "Pages"** in the left sidebar

## Step 2: Configure Source

### Option A: GitHub Actions (Recommended)
1. Under **"Source"**, select **"GitHub Actions"**
2. This will use the workflow file we created (`.github/workflows/deploy.yml`)
3. The deployment will trigger automatically on pushes to main branch

### Option B: Deploy from Branch
1. Under **"Source"**, select **"Deploy from a branch"**
2. Choose **"main"** branch
3. Select **"/ (root)"** folder
4. Click **"Save"**

## Step 3: Verify Workflow File

Make sure you have the workflow file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Setup Pages
      uses: actions/configure-pages@v4
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Step 4: Enable GitHub Actions

1. Go to the **"Actions"** tab in your repository
2. If Actions are disabled, click **"I understand my workflows, go ahead and enable them"**
3. You should see the "Deploy to GitHub Pages" workflow

## Step 5: Trigger Deployment

### Method 1: Push to Main Branch
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Method 2: Manual Trigger
1. Go to **"Actions"** tab
2. Click on **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** button
4. Select **"main"** branch
5. Click **"Run workflow"**

## Step 6: Check Deployment Status

1. Go to **"Actions"** tab
2. You should see a workflow run in progress or completed
3. Click on the workflow run to see details
4. Wait for both "build" and "deploy" jobs to complete

## Step 7: Access Your Site

Once deployment is complete:
- Your site will be available at: `https://same7ammar.github.io/kube-composer/`
- You can find the URL in the Pages settings or in the workflow output

## Troubleshooting

### If GitHub Actions Tab is Missing:
1. Go to repository **Settings**
2. Scroll to **"Actions"** → **"General"**
3. Under **"Actions permissions"**, select **"Allow all actions and reusable workflows"**
4. Click **"Save"**

### If Deployment Fails:
1. Check the **Actions** tab for error messages
2. Ensure all files are committed and pushed
3. Verify the workflow file syntax
4. Check that Pages is enabled in repository settings

### If Site Shows 404:
1. Verify the `base` path in `vite.config.ts` matches your repository name
2. Ensure `homepage` in `package.json` is correct
3. Wait a few minutes for DNS propagation

## Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to the `public` directory with your domain
2. In Pages settings, add your custom domain
3. Configure your domain's DNS to point to GitHub Pages

## Verification

After setup, you should see:
- ✅ Green checkmark in Actions tab
- ✅ Your site accessible at the GitHub Pages URL
- ✅ "github-pages" environment in repository settings