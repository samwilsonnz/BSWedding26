# Stripe Payment Status

## ⚠️ STRIPE IS IN LIVE MODE - REAL PAYMENTS ENABLED

### Configuration Details

**Mode**: 🔴 **LIVE MODE**

**Keys**:
- Publishable Key: `pk_live_51SlHs...` ✅ Configured
- Secret Key: `sk_live_51SlHs...` ✅ Configured

**Currency**: NZD (New Zealand Dollars)

### What This Means

✅ **ENABLED**: Real credit card payments will be processed
💰 **CHARGES**: Actual money will be charged from guests' cards
💳 **PAYMENT**: Funds will go directly to your Stripe account
📊 **DASHBOARD**: Monitor all transactions at https://dashboard.stripe.com/payments

### Important Notes

1. **Real Money**: This is NOT test mode - real charges will occur
2. **Card Processing**: Guest credit cards will be charged actual amounts
3. **Fees**: Stripe fees apply (typically 2.9% + $0.30 per transaction)
4. **Settlement**: Funds deposited to your bank account per Stripe schedule
5. **Refunds**: Any refunds must be processed through Stripe dashboard

### Testing Before Wedding

If you want to test the payment flow WITHOUT charging real money:

1. **Option A: Use Test Mode Keys**
   - Get test keys from Stripe dashboard
   - Replace in .env file:
     ```
     STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     ```
   - Use test card: 4242 4242 4242 4242

2. **Option B: Make Small Test Payment**
   - Use live mode with a small amount ($1-2)
   - Immediately refund through Stripe dashboard
   - Verify the full payment flow works

### Current Implementation

**Payment Endpoints**:
- `/api/create-payment-intent` - Creates payment
- `/api/stripe-config` - Returns publishable key to frontend
- `/api/stripe-webhook` - Handles payment confirmations (optional)

**Features**:
- Guest contributions to registry items
- Multiple payment amounts supported
- Custom messages with contributions
- Email notifications on successful payment

### Security Features

✅ Stripe payment intents (PCI compliant)
✅ Server-side amount validation
✅ Helmet security headers
✅ HTTPS required in production
✅ Rate limiting enabled

### Monitoring

**Stripe Dashboard**: https://dashboard.stripe.com
- View all payments
- Issue refunds
- Download reports
- Monitor failed payments
- Set up email alerts

### For Guest Contributions

When a guest contributes:
1. Selects registry item and amount
2. Enters payment details (handled by Stripe)
3. Payment processed immediately
4. Funds appear in your Stripe account
5. Guest receives confirmation
6. You receive email notification

### Webhook Configuration (Optional)

For enhanced reliability, set up webhooks:
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://bswedding26.com/api/stripe-webhook`
3. Select events: `payment_intent.succeeded`
4. Copy signing secret to .env: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Refund Policy

If you need to refund a guest:
1. Go to Stripe Dashboard → Payments
2. Find the payment
3. Click "Refund"
4. Select full or partial refund
5. Guest receives refund in 5-10 business days

### Troubleshooting

**Payment Fails**:
- Check Stripe dashboard logs
- Verify card has sufficient funds
- Ensure 3D Secure authentication works
- Check for country restrictions

**Funds Not Appearing**:
- Check payout schedule (usually 2 business days)
- Verify bank account connected in Stripe
- Look for pending/held payments

**Guest Can't Pay**:
- Check CSP headers allow Stripe
- Verify HTTPS is enabled
- Test with different browser
- Check Stripe status page

### Support

- **Stripe Support**: https://support.stripe.com
- **Stripe Status**: https://status.stripe.com
- **Your Dashboard**: https://dashboard.stripe.com

## Quick Reference

```javascript
// Check Stripe mode
const isLive = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
console.log(isLive ? '🔴 LIVE MODE' : '🟢 TEST MODE');
```

**Verification Script**: `node scripts/verify-stripe-config.js`

---

⚠️ **REMINDER**: You are currently using LIVE MODE with real payment processing enabled. Make sure you're ready before sharing the registry link with guests!
