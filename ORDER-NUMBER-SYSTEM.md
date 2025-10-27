# Order Number System

## Overview
The order number system generates unique identifiers for each order across all environments.

## Format
```
CVL-[ENV]-[STORE]-[YYYYMMDD]-[SEQUENCE]
```

### Examples
- Production: `CVL-PROD-PHENOMS-20250127-000001`
- Preview/Staging: `CVL-PREVIEW-PHENOMS-20250127-000001`
- Local Development: `CVL-LOCAL-PHENOMS-20250127-487392`

## Components

### 1. Environment Prefix
- **PROD** - Production environment (vercel.com main domain)
- **PREVIEW** - Vercel preview deployments (staging branch)
- **DEV** - Development on Vercel (other branches)
- **LOCAL** - Local development machine

### 2. Store Slug
- Uppercase store identifier (e.g., PHENOMS, HOOKS, DEFAULT)

### 3. Date
- Format: YYYYMMDD (e.g., 20250127 for January 27, 2025)

### 4. Sequence Number
- 6-digit sequential number **globally unique across ALL environments**
- Based on OrderSequence sheet row number (atomic, no race conditions)
- First order (any environment): 000001
- Second order (any environment): 000002
- Third order (any environment): 000003
- Environment prefix differentiates which is prod vs preview vs dev
- LOCAL uses timestamp-based numbers to avoid conflicts

## How It Works

### Production & Preview (Vercel)
1. **OrderSequence Sheet** in the Config spreadsheet tracks all sequences
2. Columns: `Timestamp | Environment | Sequence`
3. When generating a number:
   - Append new row with timestamp and environment
   - Google Sheets assigns a row number atomically (no race condition)
   - Sequence = row number - 1 (subtract header row)
   - Update the sequence column with the calculated value
4. This provides an audit trail and **guarantees uniqueness across all environments**

### Local Development
- Uses timestamp-based sequences (`Date.now() % 1000000`)
- Avoids conflicts with production/preview
- No Google Sheets write required

## Setup

### Config Spreadsheet
The system will automatically create an `OrderSequence` tab if it doesn't exist with headers:
```
Timestamp | Environment | Sequence
```

No manual setup is required - the first order will initialize the sheet.

## Benefits

1. **Globally Unique** - All sequences are unique across environments (no duplicates ever)
2. **No Race Conditions** - Google Sheets assigns row numbers atomically
3. **Audit Trail** - Every sequence number is recorded with timestamp and environment
4. **Environment Tracking** - Easy to see which orders came from PROD vs PREVIEW
5. **Automatic Recovery** - If sheet doesn't exist, it's created automatically
6. **Fallback Safety** - If Google Sheets fails, uses timestamp-based fallback

## Customer-Facing Display

Customers see only the **last 6 digits** for simplicity:
- Full: `CVL-PROD-PHENOMS-20250127-000042`
- Displayed: `000042`

The full order number is stored in the Orders sheet and PDF invoices for admin tracking.

## Troubleshooting

### Duplicate Numbers
- **Impossible** - Google Sheets atomically assigns row numbers
- Each order gets a unique sequence based on its row position
- No race condition possible

### Missing OrderSequence Sheet
- System will create it automatically on first order
- Check that the service account has edit permissions on Config spreadsheet

### Local Development
- Always uses timestamp-based numbers
- Will appear as `CVL-LOCAL-...` with random-looking sequence numbers
- This is intentional to avoid conflicts with production data

