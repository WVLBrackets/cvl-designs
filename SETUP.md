# CVL Designs - Setup Guide

This guide will help you get CVL Designs up and running.

## What Has Been Built

A complete custom apparel ordering system with:

✅ **Google Sheets-Based CMS** - Products, design options, customization options, and config all managed via Google Sheets  
✅ **Multi-Step Order Form** - Beautiful, intuitive interface for customers to place orders  
✅ **Design Options** - Customers can select predefined designs (Texas Blueprint, The Blueprint, logos, etc.)  
✅ **Customization Options** - Customers can add player names and numbers  
✅ **Environment Support** - Separate Dev/Prod environments with PREVIEW product testing  
✅ **Order Management** - Orders saved to Google Sheets (separate sheets for dev/prod)  
✅ **Email Invoices** - 3 professional invoice templates sent via Gmail  
✅ **Payment Options** - Display Venmo, Zelle, and CashApp information  
✅ **Image Support** - Product, design, customization, and sizing chart images  
✅ **Mobile Responsive** - Works beautifully on desktop and mobile devices  

## Prerequisites

Before you begin, make sure you have:

- [x] Node.js 18+ installed
- [x] A Google account with access to Google Sheets
- [x] A Gmail account for sending order confirmations
- [x] Your product images ready to upload

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Google Sheets

### A. Create Google Cloud Project & Service Account

Follow the detailed guide in `docs/GOOGLE_SHEETS_SETUP.md`.

Quick summary:
1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the JSON credentials file

### B. Create Your Google Sheets

You need 4 Google Sheets:

1. **Config Sheet**
2. **Products Sheet** (with "Products" and "Reference Data" tabs)
3. **Orders - Dev Sheet**
4. **Orders - Prod Sheet**

**Important:** Your Products sheet should already have the structure you showed me:
- Products tab with all product data
- Reference Data tab with Design Options (A1:F12) and Customization Options (G1:L12)

### C. Share Sheets with Service Account

Share all 4 sheets with your service account email:
- Config & Products: **Viewer** access
- Orders (both): **Editor** access

## Step 3: Set Up Gmail for Emails

### A. Enable 2-Factor Authentication

1. Go to Google Account settings
2. Enable 2-Factor Authentication

### B. Create App-Specific Password

1. Go to https://myaccount.google.com/apppasswords
2. Create a new app password for "Mail"
3. Copy the 16-character password

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Environment
NODE_ENV=development
NEXT_PUBLIC_SITE_ENV=development

# Google Service Account (from your JSON file)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"

# Google Sheet IDs (from the URL of each sheet)
GOOGLE_SHEET_CONFIG_ID=your-config-sheet-id
GOOGLE_SHEET_PRODUCTS_ID=your-products-sheet-id
GOOGLE_SHEET_ORDERS_DEV_ID=your-dev-orders-sheet-id
GOOGLE_SHEET_ORDERS_PROD_ID=your-prod-orders-sheet-id

# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

**Important:** Replace all placeholder values with your actual credentials.

## Step 5: Add Images

Place your images in the correct folders:

```
public/
  images/
    brand/
      VL Design Logo.png  ← Already moved here
    product/
      Item/               ← Product images (e.g., tshirt.png)
      Design/             ← Design option images
      Customizations/     ← Customization option images
      Sizing/             ← Sizing chart PDFs/images
```

The image filenames should match what's in your Google Sheets.

## Step 6: Verify Your Google Sheets Structure

### Config Sheet

Should have columns: `Attribute | Value | Description`

Example:
| Attribute | Value | Description |
|-----------|-------|-------------|
| Name | Caryn Vander Laan | Owner name |
| BusinessName | Caryn VL Designs | Business name |
| WelcomeMsg | Welcome, please fill out... | Welcome message |
| Footer | Copyright 2024... | Footer text |
| ContactMePhone | 3105625010 | Contact phone |
| ContactMeEmail | carynvanderlaan@gmail.com | Contact email |

### Products Sheet - Products Tab

Should have these columns (starting at row 4):
- A: Product Name
- B: Display Name format
- C: Status (Public/Draft)
- D: Base Price
- E: Category
- F: Image filename
- G-N: Size checkboxes
- O: Sizing Chart filename
- P: Design Required (True/False)
- Q: Design Selection Mode (Single/Multi/None)
- R-AA: Design Options checkboxes (1-10)
- AB: Customization Required (True/False)
- AC: Customization Selection Mode (Single/Multi/None)
- AD-AM: Customization Options checkboxes (1-10)

### Products Sheet - Reference Data Tab

**Design Options Table (A1:F12):**
- A: Number (1-10)
- B: Title
- C: Short abbreviation
- D: Price
- E: Image filename
- F: Attrib5 (unused)

**Customization Options Table (G1:L12):**
- G: Number (1-10)
- H: Title
- I: Short abbreviation
- J: Price
- K: Image filename
- L: Attrib5 (unused)

**Categories Table (M:N):**
- M: Category ID
- N: Category Name

## Step 7: Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 8: Test the Order Flow

1. **Fill out customer information**
   - Email, parent names, phone number

2. **Click "Add Product"**
   - Select a product from the list
   - Choose a size
   - Select design options (if available)
   - Select customization options (if available)
   - Enter player name/number if required

3. **Add to Order**
   - Review the item in your order summary
   - Add more items or proceed to submit

4. **Submit Order**
   - Order saves to Orders - Dev Sheet
   - Confirmation email sent with invoice
   - Payment options displayed

## Step 9: Deploy to Production

### A. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - CVL Designs order system"
git remote add origin your-repo-url
git push -u origin main
```

### B. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Add all environment variables
4. **Set `NEXT_PUBLIC_SITE_ENV=production` for production**
5. Deploy!

### C. Test Production

- Visit your production URL
- Submit a test order
- Verify it goes to Orders - Prod Sheet
- Verify email is sent

## Customization Options

### Change Invoice Template

Edit `app/api/orders/submit/route.ts`:

```typescript
// Change the last parameter to 1, 2, or 3
const emailResult = await sendOrderConfirmation(order, config, 2)
```

Invoice versions:
- **1**: Clean & Artistic (default)
- **2**: Playful Professional
- **3**: Bold & Bright

### Add QR Codes for Payment

1. Generate QR codes for Venmo, Zelle, and CashApp
2. Save as PNG files
3. Update `components/PaymentOptions.tsx` to display actual images instead of placeholders

### Update Colors

Edit `tailwind.config.js` to change the primary color scheme.

## Troubleshooting

### Products Not Loading

- Check `GOOGLE_SHEET_PRODUCTS_ID` is correct
- Verify Service Account has Viewer access to Products sheet
- Check product Status column is "Public" or "Draft"
- Look at browser console for errors

### Orders Not Submitting

- Check `GOOGLE_SHEET_ORDERS_DEV_ID` / `GOOGLE_SHEET_ORDERS_PROD_ID`
- Verify Service Account has Editor access to Orders sheets
- Check `NEXT_PUBLIC_SITE_ENV` environment variable
- Look at server logs (Vercel function logs)

### Emails Not Sending

- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are correct
- Check that 2FA is enabled on Gmail account
- Ensure app password is still valid
- Check Vercel function logs for email errors

### Images Not Displaying

- Verify image filename in Google Sheet matches actual file
- Check file is in correct folder (Item/Design/Customizations/Sizing)
- Ensure image path is correct

### Preview Products Showing in Production

- Check `NEXT_PUBLIC_SITE_ENV=production` in Vercel
- Verify product Status is "Public" not "Draft"
- Clear Vercel cache and redeploy

## Support

For additional help:
- Check `README.md` for project overview
- See `docs/GOOGLE_SHEETS_SETUP.md` for detailed Google Sheets setup
- See `docs/DEPLOYMENT.md` for deployment options
- See `docs/USAGE.md` for managing products and orders

## Next Steps

Once everything is working:

1. ✅ Add all your product images
2. ✅ Add your payment QR codes
3. ✅ Customize colors/branding
4. ✅ Test with real orders in development
5. ✅ Deploy to production
6. ✅ Share the link with customers!

Congratulations! Your custom apparel ordering system is ready! 🎉

