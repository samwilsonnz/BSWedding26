// Test Email Sending Functionality
require('dotenv').config();
const { Resend } = require('resend');

console.log('🧪 Testing Email Sending Functionality\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 Environment Check:');
console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`   NOTIFICATION_EMAIL: ${process.env.NOTIFICATION_EMAIL || '✗ Missing'}`);
console.log(`   SITE_URL: ${process.env.SITE_URL || '✗ Missing'}`);

if (!process.env.RESEND_API_KEY) {
    console.error('\n❌ RESEND_API_KEY is not set in .env file');
    process.exit(1);
}

if (!process.env.NOTIFICATION_EMAIL) {
    console.error('\n❌ NOTIFICATION_EMAIL is not set in .env file');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Test 1: Send RSVP Notification (to couple)
async function testRsvpNotification() {
    console.log('\n📧 Test 1: Sending RSVP Notification Email');
    console.log('─'.repeat(60));

    try {
        const result = await resend.emails.send({
            from: 'Wedding Registry <onboarding@resend.dev>',
            to: process.env.NOTIFICATION_EMAIL,
            subject: `📋 TEST RSVP: John Smith - Attending`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1e3a5f, #2c5282); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                        <h1 style="color: #d4af37; margin: 0; font-family: cursive;">TEST: New RSVP!</h1>
                    </div>
                    <div style="background: #faf8f5; padding: 30px; border-radius: 0 0 15px 15px;">
                        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                            <p style="margin: 0 0 15px 0; font-size: 20px;"><strong>John Smith</strong></p>
                            <p style="margin: 0 0 10px 0;">
                                <strong>Status:</strong>
                                <span style="color: #28a745; font-weight: bold; font-size: 18px;">Attending</span>
                            </p>
                            <p style="margin: 0 0 10px 0;"><strong>Guests:</strong> 2</p>
                            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> test@example.com</p>
                            <p style="margin: 0 0 10px 0;"><strong>Dietary:</strong> No nuts</p>
                            <p style="margin: 0; font-style: italic; color: #4a5568; padding-top: 10px; border-top: 1px solid #eee;">"We can't wait to celebrate with you!"</p>
                        </div>
                        <p style="color: #718096; font-size: 14px; margin: 0;">
                            This is a test email. View all RSVPs in your <a href="${process.env.SITE_URL || 'https://bswedding26.com'}/admin" style="color: #1e3a5f;">admin dashboard</a>.
                        </p>
                    </div>
                </div>
            `
        });

        console.log(`✅ RSVP notification email sent successfully!`);
        console.log(`   Email ID: ${result.data?.id || result.id}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send RSVP notification email:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Details:`, error);
        return false;
    }
}

// Test 2: Send Guest Confirmation Email
async function testGuestConfirmation() {
    console.log('\n📧 Test 2: Sending Guest Confirmation Email');
    console.log('─'.repeat(60));

    try {
        const siteUrl = process.env.SITE_URL || 'https://bswedding26.com';
        const password = process.env.WEDDING_PASSWORD || 'Beatrice&Samuel2026';

        const result = await resend.emails.send({
            from: 'Sam & Beatrice Wedding <onboarding@resend.dev>',
            to: process.env.NOTIFICATION_EMAIL, // Sending to notification email for testing
            subject: `TEST: RSVP Confirmed - Sam & Beatrice's Wedding`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                    <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #1e3a5f, #2c5282); padding: 25px; text-align: center;">
                            <h1 style="color: #d4af37; margin: 0; font-size: 26px;">Sam & Beatrice</h1>
                            <p style="color: white; margin: 10px 0 0 0; font-size: 15px;">March 14th, 2026</p>
                        </div>
                        <div style="padding: 30px;">
                            <h2 style="color: #1e3a5f; margin: 0 0 15px 0;">Hi John!</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                Your RSVP has been received. We can't wait to see you!<br>
                                <small style="color: #d4af37;"><strong>This is a test email.</strong></small>
                            </p>

                            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #d4af37; margin-bottom: 25px;">
                                <h3 style="color: #1e3a5f; margin: 0 0 12px 0; font-size: 16px;">Wedding Registry Access</h3>
                                <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px;">
                                    <strong>Website:</strong>
                                    <a href="${siteUrl}" style="color: #1e3a5f;">${siteUrl}</a>
                                </p>
                                <p style="color: #4a5568; margin: 0; font-size: 14px;">
                                    <strong>Password:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px;">${password}</code>
                                </p>
                            </div>

                            <div style="text-align: center;">
                                <a href="${siteUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 35px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;">
                                    View Registry
                                </a>
                            </div>

                            <p style="color: #a0aec0; font-size: 13px; text-align: center; margin: 25px 0 0 0;">
                                We can't wait to celebrate with you!
                            </p>
                        </div>
                    </div>
                </div>
            `
        });

        console.log(`✅ Guest confirmation email sent successfully!`);
        console.log(`   Email ID: ${result.data?.id || result.id}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send guest confirmation email:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Details:`, error);
        return false;
    }
}

// Test 3: Verify Resend API Connection
async function testResendConnection() {
    console.log('\n🔌 Test 3: Verifying Resend API Connection');
    console.log('─'.repeat(60));

    try {
        // Send a simple test email
        const result = await resend.emails.send({
            from: 'Wedding Registry Test <onboarding@resend.dev>',
            to: process.env.NOTIFICATION_EMAIL,
            subject: 'TEST: Resend API Connection',
            html: '<p>This is a simple test to verify the Resend API connection is working.</p>'
        });

        console.log(`✅ Resend API connection successful!`);
        console.log(`   API Key is valid and working`);
        return true;
    } catch (error) {
        console.error('❌ Resend API connection failed:');
        console.error(`   Error: ${error.message}`);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.error(`   ⚠️  API key may be invalid or expired`);
        }
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🚀 Starting Email Tests...\n');

    const results = {
        resendConnection: false,
        rsvpNotification: false,
        guestConfirmation: false
    };

    // Test 1: API Connection
    results.resendConnection = await testResendConnection();

    // Only continue if connection works
    if (results.resendConnection) {
        // Test 2: RSVP Notification
        results.rsvpNotification = await testRsvpNotification();

        // Test 3: Guest Confirmation
        results.guestConfirmation = await testGuestConfirmation();
    } else {
        console.log('\n⚠️  Skipping other tests due to API connection failure');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Resend API Connection:    ${results.resendConnection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`RSVP Notification Email:  ${results.rsvpNotification ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Guest Confirmation Email: ${results.guestConfirmation ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r === true);

    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED! Email sending is working correctly.');
        console.log(`\n📬 Check your inbox at ${process.env.NOTIFICATION_EMAIL} for the test emails.`);
    } else {
        console.log('\n⚠️  SOME TESTS FAILED. Please check the errors above.');
    }

    console.log('\n' + '='.repeat(60));

    process.exit(allPassed ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
