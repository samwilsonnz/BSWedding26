const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Universal wedding password
const WEDDING_PASSWORD = 'SamBea2026';

// URL that guests will visit
const WEDDING_URL = 'https://bswedding26.com';

// QR code will encode the full URL with password as parameter
const qrData = `${WEDDING_URL}?password=${WEDDING_PASSWORD}`;

// Generate QR code
async function generateUniversalQR() {
    try {
        console.log('🎉 Generating Universal Wedding QR Code...');
        console.log(`Password: ${WEDDING_PASSWORD}`);
        console.log(`URL: ${qrData}`);

        // Generate QR code as PNG
        const qrPath = path.join(__dirname, 'public', 'universal-wedding-qr.png');
        await QRCode.toFile(qrPath, qrData, {
            width: 800,
            margin: 2,
            color: {
                dark: '#1e3a5f',  // Navy blue
                light: '#ffffff'  // White background
            }
        });

        console.log(`✅ QR Code generated: ${qrPath}`);
        console.log('');
        console.log('📋 INSTRUCTIONS:');
        console.log('1. Print this QR code and include it on your wedding invitations');
        console.log('2. Guests can scan it to automatically log in with the password');
        console.log('3. Or share the password: SamBea2026');
        console.log('');
        console.log('🖼️  QR Code saved to: public/universal-wedding-qr.png');

        // Also generate an HTML file to easily view/print the QR code
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samuel & Beatrice - Wedding QR Code</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #faf8f3 0%, #ffffff 50%, #f5f5dc 100%);
            padding: 2rem;
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 25px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 600px;
        }
        h1 {
            color: #1e3a5f;
            margin-bottom: 0.5rem;
            font-size: 2.5rem;
        }
        .date {
            color: #2c5282;
            font-size: 1.3rem;
            margin-bottom: 2rem;
        }
        .qr-code {
            margin: 2rem 0;
            padding: 1rem;
            background: white;
            border: 3px solid #f5f5dc;
            border-radius: 20px;
        }
        .qr-code img {
            width: 100%;
            max-width: 400px;
            height: auto;
        }
        .instructions {
            background: #faf8f3;
            padding: 1.5rem;
            border-radius: 15px;
            border: 2px solid #f5f5dc;
            margin-top: 2rem;
            text-align: left;
        }
        .instructions h3 {
            color: #1e3a5f;
            margin-bottom: 1rem;
        }
        .instructions p {
            color: #2c5282;
            margin-bottom: 0.8rem;
            line-height: 1.6;
        }
        .password-box {
            background: #4a7c9e;
            color: white;
            padding: 1rem;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            margin: 1rem 0;
            letter-spacing: 2px;
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💙 Samuel & Beatrice 💙</h1>
        <p class="date">March 14th, 2026 | Christchurch, New Zealand</p>

        <div class="qr-code">
            <img src="universal-wedding-qr.png" alt="Wedding QR Code">
        </div>

        <div class="instructions">
            <h3>📱 For Your Guests:</h3>
            <p><strong>Option 1:</strong> Scan this QR code with your phone camera to access the wedding registry</p>
            <p><strong>Option 2:</strong> Visit <a href="${WEDDING_URL}" target="_blank">${WEDDING_URL}</a> and enter the password:</p>
            <div class="password-box">${WEDDING_PASSWORD}</div>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #4a7c9e;">
                💡 <em>This QR code can be printed on all your invitations - everyone uses the same code!</em>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const htmlPath = path.join(__dirname, 'public', 'wedding-qr-printable.html');
        fs.writeFileSync(htmlPath, htmlContent);
        console.log('🖨️  Printable HTML created: public/wedding-qr-printable.html');
        console.log('   Open this file in a browser to print your QR code!');

    } catch (error) {
        console.error('❌ Error generating QR code:', error);
    }
}

generateUniversalQR();
