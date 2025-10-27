# Usage Guide

This guide explains how to use and manage CVL Designs after deployment.

## For Site Owner/Administrator

### Managing Products

#### Adding a New Product

1. Open your **Products Google Sheet**
2. Add a new row with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique identifier (no spaces) | `youth-beanie` |
| `name` | Display name | `Youth Winter Beanie` |
| `category` | `youth` or `adult` | `youth` |
| `price` | Base price (number only) | `12` |
| `status` | `PREVIEW` or `PROD` | `PREVIEW` |
| `description` | Optional description | `Warm winter hat` |
| `availableSizes` | Comma-separated sizes | `S,M,L` |

3. **Save the sheet**
4. The product will appear on the site within 5 minutes (due to caching)
5. To force immediate update, redeploy the site in Vercel

#### Testing a New Product Before Going Live

1. Add the product with `status = PREVIEW`
2. It will ONLY show in development environment
3. Test the product (ordering, sizing, pricing)
4. When ready to launch, change `status = PROD`
5. Product now shows in both Dev and Prod environments

#### Removing a Product

**Option 1: Soft Delete (Recommended)**
- Change `status` to `ARCHIVED` or `INACTIVE`
- Product will not show on site
- You can reactivate later by changing back to `PROD`

**Option 2: Hard Delete**
- Delete the row from the sheet
- Product is permanently removed

#### Updating Product Information

1. Open the Products Sheet
2. Edit any column (name, price, description, sizes, etc.)
3. Save the sheet
4. Changes appear within 5 minutes

#### Seasonal or Limited Products

Add custom columns if needed:
- `availableFrom` - Start date
- `availableUntil` - End date
- `inStock` - Yes/No

*Note: These require custom code changes to implement filtering.*

### Managing Orders

#### Viewing Orders

**Development Orders:**
1. Open **Orders - Dev Sheet**
2. All test/development orders appear here

**Production Orders:**
1. Open **Orders - Prod Sheet**
2. All real customer orders appear here

#### Order Information

Each order row contains:
- **Order Date** - When the order was placed
- **Environment** - `development` or `production`
- **Customer Info** - Email, parent names, phone
- **Item Details** - Product, size, customization
- **Pricing** - Item price, customization price, totals

#### Processing Orders

**Suggested Workflow:**

1. Add a "Status" column to your Orders sheet:
   - `NEW` - Just received
   - `IN_PROGRESS` - Being processed
   - `COMPLETED` - Fulfilled
   - `CANCELLED` - Cancelled

2. Add a "Notes" column for internal notes

3. Add a "Tracking Number" column if shipping

4. Sort/filter by status to manage workflow

#### Exporting Orders

1. Click "File" > "Download" in Google Sheets
2. Choose format (Excel, CSV, PDF)
3. Use for inventory management or accounting

#### Order Analysis

**Built-in Google Sheets Features:**
- Sum total revenue: `=SUM(O:O)` (Order Total column)
- Count orders: `=COUNTA(A:A) - 1` (minus header)
- Most popular product: Use pivot tables

**Create a Dashboard Sheet:**
1. Add a new sheet tab called "Dashboard"
2. Use formulas to pull data from Orders sheet
3. Create charts for visual analysis

Example formulas:
```
Total Revenue: =SUM('Orders - Prod'!O:O)
Total Orders: =COUNTA('Orders - Prod'!A:A) - 1
Average Order Value: =AVERAGE('Orders - Prod'!O:O)
```

### Managing Site Configuration

#### Config Sheet Usage

The Config Sheet stores site-wide settings:

| key | value | type |
|-----|-------|------|
| siteName | CVL Designs | string |
| customizationPrice | 10 | number |
| sizingChartURL | https://... | string |

**Adding New Configuration:**
1. Add a row with your key, value, and type
2. Update code if needed to use the new config value

*Note: Config changes require code updates to be utilized. Config sheet is for easy value management, not dynamic feature addition.*

### Common Management Tasks

#### Changing Customization Price

1. Open Config Sheet
2. Find `customizationPrice` row
3. Update the `value` column
4. **Note:** Current implementation uses hardcoded values in `lib/constants.ts`
5. To use sheet value, code update is needed

#### Updating Contact Information

Contact info is stored in Orders sheets only.
To add site contact info:
1. Add to Config Sheet: `contactEmail`, `contactPhone`
2. Update UI to display from config

#### Changing Site Branding

**Logo:**
1. Replace `public/VL Design Logo.png` with new logo
2. Keep same filename, or update code references

**Colors:**
1. Edit `tailwind.config.js`
2. Update the `primary` color values
3. Redeploy site

**Site Name:**
1. Update Config Sheet `siteName` value
2. Update in code: `lib/config.ts`

## For Customers

### Placing an Order

1. **Visit the site** - Navigate to the order page
2. **Enter contact information:**
   - Email address
   - Phone number
   - Parent first name
   - Parent last name

3. **Select a product:**
   - Choose from Youth or Adult items
   - See price displayed

4. **Choose size:**
   - Click "View Sizing Chart" for help
   - Select appropriate size

5. **Customize back (optional):**
   - Choose customization type
   - Enter name and/or number if selected
   - See updated price with customization fee

6. **Add to order:**
   - Click "Add to Order"
   - Item appears in Order Summary

7. **Add more items (optional):**
   - Check "Add another item" to add more
   - Repeat steps 3-6

8. **Submit order:**
   - Review order summary
   - Click "Submit Order"
   - Wait for confirmation message

### After Submitting

- You'll see a success message
- The site owner will contact you via email or phone
- Do not refresh or submit again

### Sizing Help

Click the "View Sizing Chart" link when selecting size to see:
- Measurements for each size
- Size recommendations by age/height

*Note: Sizing chart link needs to be configured in Config Sheet or added to the site.*

## Troubleshooting

### Products Not Updating

**Problem:** Made changes to Products Sheet but they don't show on site.

**Solutions:**
1. Wait 5 minutes (cache revalidation period)
2. Force redeploy in Vercel
3. Check that `status` column is `PROD` (or `PREVIEW` for dev)
4. Verify no typos in product data

### Orders Not Appearing

**Problem:** Customer submitted order but it's not in the sheet.

**Solutions:**
1. Check the correct sheet (Dev vs Prod)
2. Verify Google Service Account has Editor access
3. Check Vercel function logs for errors
4. Test with a dev order to confirm integration

### Customer Can't Submit Order

**Problem:** Customer reports error when submitting.

**Solutions:**
1. Check all required fields are filled
2. Verify at least one item is added
3. Check browser console for JavaScript errors
4. Verify Google Sheets API is not rate-limited
5. Test order submission yourself

### Wrong Environment

**Problem:** PREVIEW products showing in production (or vice versa).

**Solutions:**
1. Check `NEXT_PUBLIC_SITE_ENV` in Vercel
2. Should be `production` for prod, `development` for dev
3. Redeploy after changing
4. Clear browser cache

## Best Practices

### Product Management
- ✅ Use PREVIEW status to test new products
- ✅ Keep product IDs consistent (don't change them)
- ✅ Use descriptive names
- ✅ Include all available sizes
- ✅ Set accurate prices

### Order Management
- ✅ Check orders daily
- ✅ Respond to customers promptly
- ✅ Add status/notes columns to track progress
- ✅ Export orders regularly for backup
- ✅ Archive old orders to separate sheet

### Security
- ✅ Keep Orders sheets private
- ✅ Only share with trusted administrators
- ✅ Don't share Service Account credentials
- ✅ Use strong password for Google account
- ✅ Enable 2FA on Google account

### Data Management
- ✅ Don't delete order data (archive instead)
- ✅ Backup orders monthly
- ✅ Keep product history for records
- ✅ Document any custom changes

## Support

For technical issues or questions:
- Check this documentation
- Review troubleshooting section
- Contact your developer
- Check Vercel deployment logs

For customer support:
- Respond to order inquiries via email/phone
- Check Orders sheet for customer details
- Provide order status updates
