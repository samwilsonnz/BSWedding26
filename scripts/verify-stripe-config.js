// Verify Stripe Configuration
require('dotenv').config();

console.log('💳 Stripe Configuration Verification\n');
console.log('='.repeat(60));

// Check keys
const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY;

console.log('\n📋 Stripe Keys Status:');
console.log(`   Publishable Key: ${pubKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   Secret Key:      ${secretKey ? '✅ Set' : '❌ Missing'}`);

if (!pubKey || !secretKey) {
    console.error('\n❌ Stripe keys are missing!');
    process.exit(1);
}

// Determine mode
const isLive = pubKey.startsWith('pk_live') && secretKey.startsWith('sk_live');
const isTest = pubKey.startsWith('pk_test') && secretKey.startsWith('sk_test');

console.log('\n🔍 Stripe Mode:');
if (isLive) {
    console.log('   ⚠️  LIVE MODE - Real payments will be processed!');
    console.log('   💰 Actual money will be charged to credit cards');
    console.log('   📊 Currency: ' + (process.env.CURRENCY || 'nzd').toUpperCase());
} else if (isTest) {
    console.log('   🧪 TEST MODE - Using test payments');
    console.log('   💡 Use test card: 4242 4242 4242 4242');
} else {
    console.log('   ⚠️  MIXED MODE - Keys don\'t match!');
    console.log('   Publishable: ' + pubKey.substring(0, 15) + '...');
    console.log('   Secret: ' + secretKey.substring(0, 15) + '...');
}

// Test Stripe connection
async function testStripeConnection() {
    try {
        const stripe = require('stripe')(secretKey);

        console.log('\n🔌 Testing Stripe API Connection...');

        // Try to list a payment intent (just to verify connection)
        const paymentIntents = await stripe.paymentIntents.list({ limit: 1 });

        console.log('   ✅ Stripe API connection successful!');
        console.log(`   📊 Found ${paymentIntents.data.length} recent payment(s)`);

        if (paymentIntents.data.length > 0) {
            const latest = paymentIntents.data[0];
            console.log(`   💰 Latest payment: $${(latest.amount / 100).toFixed(2)} ${latest.currency.toUpperCase()}`);
            console.log(`   📅 Date: ${new Date(latest.created * 1000).toLocaleDateString()}`);
        }

        return true;
    } catch (error) {
        console.error('   ❌ Stripe API connection failed!');
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

// Run async test
testStripeConnection().then(success => {
    console.log('\n' + '='.repeat(60));

    if (success) {
        console.log('✅ Stripe is properly configured and connected!');

        if (isLive) {
            console.log('\n⚠️  IMPORTANT REMINDERS FOR LIVE MODE:');
            console.log('   1. Real money will be charged');
            console.log('   2. Test thoroughly before sharing with guests');
            console.log('   3. Monitor your Stripe dashboard regularly');
            console.log('   4. Ensure webhook endpoints are set up (optional)');
            console.log('   5. Have a refund policy ready');
            console.log('\n🔗 Stripe Dashboard: https://dashboard.stripe.com/payments');
        } else if (isTest) {
            console.log('\n💡 Test Cards:');
            console.log('   Success: 4242 4242 4242 4242');
            console.log('   Decline: 4000 0000 0000 0002');
            console.log('   3D Secure: 4000 0027 6000 3184');
        }
    } else {
        console.log('⚠️  Stripe configuration has issues');
    }

    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
});
