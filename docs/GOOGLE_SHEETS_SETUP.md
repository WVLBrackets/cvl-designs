# Google Sheets Setup Guide

This guide walks you through setting up Google Sheets integration for CVL Designs.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "CVL Designs")
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - Name: "CVL Designs Service Account"
   - Description: "Service account for CVL Designs website"
4. Click "Create and Continue"
5. Skip optional steps and click "Done"

## Step 3: Generate Service Account Key

1. Click on the newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create" - a JSON file will download
6. **Keep this file secure!** It contains sensitive credentials

## Step 4: Extract Credentials

From the downloaded JSON file, you'll need:
- `client_email` → This is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → This is your `GOOGLE_PRIVATE_KEY`

## Step 5: Create Google Sheets

Create 4 Google Sheets with the following structure:

### 5.1 Config Sheet

**Sheet Name:** CVL Designs Config

**Headers (Row 1):**
| key | value | type |

**Example Data:**
| key | value | type |
|-----|-------|------|
| siteName | CVL Designs | string |
| customizationPrice | 10 | number |
| sizingChartURL | https://example.com/sizing | string |

### 5.2 Products Sheet

**Sheet Name:** CVL Designs Products

**Headers (Row 1):**
| id | name | category | price | status | description | availableSizes |

**Example Data:**
| id | name | category | price | status | description | availableSizes |
|----|------|----------|-------|--------|-------------|----------------|
| youth-tshirt-ss-dri | Youth Dri-Fit T-Shirt Short Sleeve | youth | 15 | PROD | Moisture-wicking performance tee | S,M,L,XL |
| youth-tshirt-ls-dri | Youth Dri-Fit T-Shirt Long Sleeve | youth | 15 | PROD | Long sleeve moisture-wicking tee | S,M,L,XL |
| youth-tshirt-ss-cotton | Youth Cotton T-Shirt Short Sleeve | youth | 15 | PROD | Classic comfortable cotton tee | S,M,L,XL |
| youth-tshirt-ls-cotton | Youth Cotton T-Shirt Long Sleeve | youth | 15 | PROD | Long sleeve cotton tee | S,M,L,XL |
| youth-crewneck | Youth Crewneck Sweatshirt | youth | 25 | PROD | Warm crewneck sweatshirt | S,M,L,XL |
| youth-hoodie | Youth Hoodie | youth | 28 | PROD | Comfortable hoodie with pockets | S,M,L,XL |
| youth-compression | Youth Compression Short Sleeve | youth | 25 | PROD | Athletic compression shirt | S,M,L,XL |
| youth-quarter-zip | Youth 1/4 Zip Pullover | youth | 28 | PROD | Quarter zip athletic pullover | S,M,L,XL |
| adult-tshirt-ss-dri | Adult Dri-Fit T-Shirt Short Sleeve | adult | 15 | PROD | Moisture-wicking performance tee | S,M,L,XL,2XL,3XL |
| adult-tshirt-ls-dri | Adult Dri-Fit T-Shirt Long Sleeve | adult | 15 | PROD | Long sleeve moisture-wicking tee | S,M,L,XL,2XL,3XL |
| adult-tshirt-ss-cotton | Adult Cotton T-Shirt Short Sleeve | adult | 15 | PROD | Classic comfortable cotton tee | S,M,L,XL,2XL,3XL |
| adult-tshirt-ls-cotton | Adult Cotton T-Shirt Long Sleeve | adult | 15 | PROD | Long sleeve cotton tee | S,M,L,XL,2XL,3XL |
| adult-crewneck | Adult Crewneck Sweatshirt | adult | 28 | PROD | Warm crewneck sweatshirt | S,M,L,XL,2XL,3XL |
| adult-hoodie | Adult Hoodie | adult | 28 | PROD | Comfortable hoodie with pockets | S,M,L,XL,2XL,3XL |
| adult-polo | Adult Performance Polo | adult | 20 | PROD | Professional polo shirt | S,M,L,XL,2XL,3XL |
| adult-compression | Adult Compression Short Sleeve | adult | 28 | PROD | Athletic compression shirt | S,M,L,XL,2XL,3XL |
| adult-quarter-zip | Adult 1/4 Zip Pullover | adult | 28 | PROD | Quarter zip athletic pullover | S,M,L,XL,2XL,3XL |

**Notes:**
- `status` can be `PROD` (visible in both dev and prod) or `PREVIEW` (dev only)
- `availableSizes` is comma-separated, no spaces
- `category` must be either `youth` or `adult`

### 5.3 Orders - Dev Sheet

**Sheet Name:** CVL Designs Orders - Dev

**Headers (Row 1):**
| Order Date | Environment | Email | Parent First Name | Parent Last Name | Phone Number | Product Name | Size | Back Customization | Customization Name | Customization Number | Item Price | Customization Price | Item Total | Order Total |

*Leave this sheet empty - headers will be auto-created on first order if needed.*

### 5.4 Orders - Prod Sheet

**Sheet Name:** CVL Designs Orders - Prod

**Headers (Row 1):**
| Order Date | Environment | Email | Parent First Name | Parent Last Name | Phone Number | Product Name | Size | Back Customization | Customization Name | Customization Number | Item Price | Customization Price | Item Total | Order Total |

*Leave this sheet empty - headers will be auto-created on first order if needed.*

## Step 6: Share Sheets with Service Account

For each of the 4 sheets:

1. Click the "Share" button in the top right
2. Add your Service Account email (from Step 4)
3. Set permissions:
   - **Config Sheet**: Viewer
   - **Products Sheet**: Viewer
   - **Orders - Dev Sheet**: Editor
   - **Orders - Prod Sheet**: Editor
4. Uncheck "Notify people" (it's a service account)
5. Click "Share"

## Step 7: Get Sheet IDs

For each sheet:

1. Open the Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Copy the `SHEET_ID_HERE` part
4. Save these IDs for your environment variables:
   - Config Sheet → `GOOGLE_SHEET_CONFIG_ID`
   - Products Sheet → `GOOGLE_SHEET_PRODUCTS_ID`
   - Orders Dev Sheet → `GOOGLE_SHEET_ORDERS_DEV_ID`
   - Orders Prod Sheet → `GOOGLE_SHEET_ORDERS_PROD_ID`

## Step 8: Configure Environment Variables

Create a `.env` file in your project root:

```env
NODE_ENV=development
NEXT_PUBLIC_SITE_ENV=development

GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here (with actual line breaks as \n)\n-----END PRIVATE KEY-----\n"

GOOGLE_SHEET_CONFIG_ID=your-config-sheet-id
GOOGLE_SHEET_PRODUCTS_ID=your-products-sheet-id
GOOGLE_SHEET_ORDERS_DEV_ID=your-dev-orders-sheet-id
GOOGLE_SHEET_ORDERS_PROD_ID=your-prod-orders-sheet-id
```

**Important:** The private key must have `\n` for line breaks. When copying from the JSON file, keep the `\n` characters as literal `\n` (not actual line breaks).

## Step 9: Test the Integration

1. Run your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Check that products load correctly
4. Try submitting a test order
5. Verify the order appears in your Dev Orders sheet

## Troubleshooting

### "Permission denied" errors
- Double-check that you shared each sheet with the Service Account email
- Verify the Service Account has the correct permissions (Viewer/Editor)

### "Invalid credentials" errors
- Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` is correct
- Check that `GOOGLE_PRIVATE_KEY` includes `\n` for line breaks
- Ensure the private key is wrapped in quotes in the `.env` file

### Products not loading
- Check that the Products Sheet has the correct headers
- Verify the `status` column values are exactly `PROD` or `PREVIEW`
- Ensure `GOOGLE_SHEET_PRODUCTS_ID` is correct

### Orders not submitting
- Check that Orders sheets are shared with Editor permissions
- Verify `GOOGLE_SHEET_ORDERS_DEV_ID` and `GOOGLE_SHEET_ORDERS_PROD_ID` are correct
- Check browser console and server logs for specific errors

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Keep Service Account key secure** - treat it like a password
3. **Orders sheets should be private** - only you should have access
4. **Use separate Dev/Prod sheets** - prevents test orders mixing with real orders
5. **Rotate credentials periodically** if needed for security

## Support

If you encounter issues, check the main README troubleshooting section or contact your developer.
