// Verify Email Configuration
require('dotenv').config();

console.log('🔍 Email Configuration Verification\n');
console.log('='.repeat(60));

const checks = {
    resendKey: !!process.env.RESEND_API_KEY,
    notificationEmail: !!process.env.NOTIFICATION_EMAIL,
    siteUrl: !!process.env.SITE_URL,
    weddingPassword: !!process.env.WEDDING_PASSWORD
};

console.log('\n📋 Configuration Status:');
console.log(`   RESEND_API_KEY:      ${checks.resendKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   NOTIFICATION_EMAIL:  ${checks.notificationEmail ? '✅ ' + process.env.NOTIFICATION_EMAIL : '❌ Missing'}`);
console.log(`   SITE_URL:            ${checks.siteUrl ? '✅ ' + process.env.SITE_URL : '❌ Missing'}`);
console.log(`   WEDDING_PASSWORD:    ${checks.weddingPassword ? '✅ Set' : '❌ Missing'}`);

const allConfigured = Object.values(checks).every(c => c === true);

console.log('\n' + '='.repeat(60));
if (allConfigured) {
    console.log('✅ All email configuration variables are set!');
    console.log('\n📧 Email sending functions:');
    console.log('   - sendRsvpNotification(): Sends RSVP alerts to couple');
    console.log('   - sendGuestRsvpConfirmation(): Sends confirmation to guest');
    console.log('\n💡 To test email sending:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Visit the website and RSVP as a test guest');
    console.log('   3. Check ' + process.env.NOTIFICATION_EMAIL + ' for emails');
} else {
    console.log('❌ Some email configuration is missing!');
    console.log('   Please check your .env file.');
    process.exit(1);
}
console.log('='.repeat(60));
