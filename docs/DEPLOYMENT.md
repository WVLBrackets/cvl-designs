# Deployment Guide

This guide covers deploying CVL Designs to Vercel (recommended) and other platforms.

## Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying Next.js applications.

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/cvl-designs.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New..." > "Project"
4. Import your repository
5. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables

In the Vercel project settings:

1. Go to "Settings" > "Environment Variables"
2. Add the following variables:

**Production Environment:**
```
NEXT_PUBLIC_SITE_ENV=production
NODE_ENV=production

GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GOOGLE_SHEET_CONFIG_ID=your-config-sheet-id
GOOGLE_SHEET_PRODUCTS_ID=your-products-sheet-id
GOOGLE_SHEET_ORDERS_DEV_ID=your-dev-orders-sheet-id
GOOGLE_SHEET_ORDERS_PROD_ID=your-prod-orders-sheet-id
```

**Important Notes:**
- Set `NEXT_PUBLIC_SITE_ENV=production` for production environment
- Copy `GOOGLE_PRIVATE_KEY` exactly as it appears in your JSON file (with `\n` for line breaks)
- All variables should be added to the "Production" environment
- For preview deployments, you can optionally set these to "Preview" environment too

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your site
3. You'll get a URL like `https://cvl-designs.vercel.app`

### Step 5: Custom Domain (Optional)

1. Go to "Settings" > "Domains"
2. Add your custom domain (e.g., `www.cvldesigns.com`)
3. Follow Vercel's instructions to configure DNS
4. Vercel will automatically provision SSL certificate

### Step 6: Verify Deployment

1. Visit your production URL
2. Check that products load correctly
3. Submit a test order
4. Verify it appears in your **Production Orders Sheet** (not Dev)
5. Check that PREVIEW products do NOT show in production

## Development Environment on Vercel

If you want a separate development deployment:

1. Create a new Vercel project from the same repository
2. Set `NEXT_PUBLIC_SITE_ENV=development`
3. Point `GOOGLE_SHEET_ORDERS_DEV_ID` to your Dev Orders Sheet
4. This deployment will show PREVIEW products

## Environment Variables Reference

| Variable | Description | Production Value | Dev Value |
|----------|-------------|------------------|-----------|
| `NEXT_PUBLIC_SITE_ENV` | Environment indicator | `production` | `development` |
| `NODE_ENV` | Node environment | `production` | `development` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | Same for both | Same for both |
| `GOOGLE_PRIVATE_KEY` | Service account private key | Same for both | Same for both |
| `GOOGLE_SHEET_CONFIG_ID` | Config sheet ID | Same for both | Same for both |
| `GOOGLE_SHEET_PRODUCTS_ID` | Products sheet ID | Same for both | Same for both |
| `GOOGLE_SHEET_ORDERS_DEV_ID` | Dev orders sheet ID | Same for both | Same for both |
| `GOOGLE_SHEET_ORDERS_PROD_ID` | Prod orders sheet ID | Same for both | Same for both |

**Key Point:** The difference between Dev and Prod is controlled by `NEXT_PUBLIC_SITE_ENV`. The sheet IDs stay the same, but the app uses different ones based on the environment.

## Continuous Deployment

Once connected to Vercel:

1. **Main branch** deploys to production automatically
2. **Other branches** create preview deployments
3. **Pull requests** get preview URLs automatically

### Recommended Workflow

```
main branch (production) → vercel.app domain
└── develop branch → preview URL
    └── feature branches → preview URLs
```

## Alternative Platforms

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy

### Self-Hosted (Docker)

1. Create a `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t cvl-designs .
   docker run -p 3000:3000 --env-file .env cvl-designs
   ```

### Traditional VPS (e.g., DigitalOcean, AWS)

1. SSH into your server
2. Install Node.js 18+
3. Clone your repository
4. Install dependencies: `npm install`
5. Build the project: `npm run build`
6. Set environment variables in `.env`
7. Use PM2 to run the app:
   ```bash
   npm install -g pm2
   pm2 start npm --name "cvl-designs" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment Checklist

- [ ] Products load correctly
- [ ] PREVIEW products only show in dev environment
- [ ] PROD products show in both environments
- [ ] Test orders go to correct sheet (Dev vs Prod)
- [ ] Contact form fields are required
- [ ] Order submission shows success message
- [ ] Logo displays correctly
- [ ] Mobile responsive
- [ ] SSL certificate active (https://)
- [ ] Custom domain configured (if applicable)

## Monitoring and Maintenance

### Vercel Analytics

Enable Vercel Analytics to track:
- Page views
- Performance metrics
- Error rates

### Error Tracking

Consider adding error tracking:
- Sentry
- LogRocket
- Vercel's built-in error tracking

### Performance

Monitor performance with:
- Vercel Speed Insights
- Google PageSpeed Insights
- Lighthouse

## Rollback Strategy

If something goes wrong:

1. **Via Vercel Dashboard:**
   - Go to "Deployments"
   - Find the last working deployment
   - Click "..." > "Promote to Production"

2. **Via Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Scaling Considerations

The current architecture scales well for:
- Up to 1000 products
- Moderate traffic (1000s of visitors/day)
- ~100 orders per day

For higher scale, consider:
- Adding Redis caching for products
- Moving to a traditional database (PostgreSQL)
- Using Vercel's edge functions
- Implementing rate limiting

## Security Notes

⚠️ **Production Security Checklist:**

- [ ] `.env` file is in `.gitignore`
- [ ] Environment variables are set in Vercel (not in code)
- [ ] Service Account has minimal permissions
- [ ] Orders sheets are private
- [ ] HTTPS is enabled
- [ ] No sensitive data in client-side code
- [ ] API routes validate input

## Troubleshooting Deployment

### Build Errors

**"Module not found":**
- Run `npm install` locally
- Commit `package-lock.json`
- Push changes

**TypeScript errors:**
- Run `npm run build` locally first
- Fix all TypeScript errors
- Push fixes

### Runtime Errors

**"Invalid credentials":**
- Check environment variables in Vercel
- Verify private key format (needs `\n` for line breaks)
- Ensure service account email is correct

**"Sheet not found":**
- Verify sheet IDs are correct
- Check that sheets are shared with service account
- Confirm service account has correct permissions

**Products not loading:**
- Check Vercel function logs
- Verify Google Sheets API is enabled
- Test API route: `your-domain.com/api/products`

### Performance Issues

**Slow page loads:**
- Check Google Sheets API response time
- Consider adding caching
- Verify revalidation settings in page components

## Support

For deployment issues:
- Check Vercel's [documentation](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Contact your developer

## Backup Strategy

**Regular Backups:**
1. Google Sheets auto-saves and has version history
2. Download orders sheet weekly/monthly as backup
3. Keep git repository up to date
4. Consider automated sheet backups via Google Apps Script

**Disaster Recovery:**
1. All code is in Git repository
2. All data is in Google Sheets (Google's infrastructure)
3. Redeploy takes ~5 minutes on Vercel
4. No data loss risk with proper sheet permissions
