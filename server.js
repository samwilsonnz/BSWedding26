const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Load environment variables (works locally with .env file, Railway provides them directly)
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'STRIPE_SECRET_KEY', 'ADMIN_CODE', 'WEDDING_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('SUPABASE') || k.startsWith('STRIPE') || k === 'ADMIN_CODE'));
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
console.log('   - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
console.log('   - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓' : '✗');
console.log('   - ADMIN_CODE:', process.env.ADMIN_CODE ? '✓' : '✗');

// Initialize Stripe with your live key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Resend email setup (optional - for email notifications)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// SSE clients for live admin feed
const sseClients = new Set();

// Broadcast event to all connected SSE clients
function broadcastEvent(eventType, data) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        client.write(message);
    });
}

// Email notification helper
async function sendContributionNotification(contribution) {
    if (!resend || !process.env.NOTIFICATION_EMAIL) {
        console.log('📧 Email notifications not configured (set RESEND_API_KEY and NOTIFICATION_EMAIL)');
        return;
    }

    try {
        const { guestName, itemName, amount, message } = contribution;

        await resend.emails.send({
            from: 'Wedding Registry <onboarding@resend.dev>',  // Use your verified domain in production
            to: process.env.NOTIFICATION_EMAIL,
            subject: `💝 New Contribution: $${amount.toFixed(2)} from ${guestName}`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1e3a5f, #2c5282); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                        <h1 style="color: #d4af37; margin: 0; font-family: cursive;">New Contribution!</h1>
                    </div>
                    <div style="background: #faf8f5; padding: 30px; border-radius: 0 0 15px 15px;">
                        <p style="color: #1e3a5f; font-size: 18px; margin-bottom: 20px;">
                            <strong>${guestName}</strong> just contributed to your registry!
                        </p>
                        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #d4af37; margin-bottom: 20px;">
                            <p style="margin: 0 0 10px 0;"><strong>Item:</strong> ${itemName}</p>
                            <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> <span style="color: #28a745; font-size: 24px;">$${amount.toFixed(2)}</span></p>
                            ${message ? `<p style="margin: 0; font-style: italic; color: #4a5568;">"${message}"</p>` : ''}
                        </div>
                        <p style="color: #718096; font-size: 14px; margin: 0;">
                            View all contributions in your <a href="${process.env.SITE_URL || 'https://bswedding26.com'}/admin" style="color: #1e3a5f;">admin dashboard</a>.
                        </p>
                    </div>
                </div>
            `
        });

        console.log('📧 Contribution notification email sent successfully');
    } catch (error) {
        console.error('📧 Failed to send email notification:', error);
    }
}

// RSVP email notification helper
async function sendRsvpNotification(rsvp) {
    if (!resend || !process.env.NOTIFICATION_EMAIL) {
        console.log('📧 Email notifications not configured (set RESEND_API_KEY and NOTIFICATION_EMAIL)');
        return;
    }

    try {
        const { name, email, attending, guestCount, dietary, message } = rsvp;
        const attendingText = attending === 'yes' ? 'Attending' : attending === 'no' ? 'Not Attending' : 'Maybe';
        const attendingColor = attending === 'yes' ? '#28a745' : attending === 'no' ? '#dc3545' : '#ffc107';

        await resend.emails.send({
            from: 'Wedding Registry <onboarding@resend.dev>',
            to: process.env.NOTIFICATION_EMAIL,
            subject: `📋 New RSVP: ${name} - ${attendingText}`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1e3a5f, #2c5282); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                        <h1 style="color: #d4af37; margin: 0; font-family: cursive;">New RSVP!</h1>
                    </div>
                    <div style="background: #faf8f5; padding: 30px; border-radius: 0 0 15px 15px;">
                        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid ${attendingColor}; margin-bottom: 20px;">
                            <p style="margin: 0 0 15px 0; font-size: 20px;"><strong>${name}</strong></p>
                            <p style="margin: 0 0 10px 0;">
                                <strong>Status:</strong>
                                <span style="color: ${attendingColor}; font-weight: bold; font-size: 18px;">${attendingText}</span>
                            </p>
                            ${attending === 'yes' ? `<p style="margin: 0 0 10px 0;"><strong>Guests:</strong> ${guestCount}</p>` : ''}
                            ${email ? `<p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>` : ''}
                            ${dietary ? `<p style="margin: 0 0 10px 0;"><strong>Dietary:</strong> ${dietary}</p>` : ''}
                            ${message ? `<p style="margin: 0; font-style: italic; color: #4a5568; padding-top: 10px; border-top: 1px solid #eee;">"${message}"</p>` : ''}
                        </div>
                        <p style="color: #718096; font-size: 14px; margin: 0;">
                            View all RSVPs in your <a href="${process.env.SITE_URL || 'https://bswedding26.com'}/admin" style="color: #1e3a5f;">admin dashboard</a>.
                        </p>
                    </div>
                </div>
            `
        });

        console.log('📧 RSVP notification email sent successfully');
    } catch (error) {
        console.error('📧 Failed to send RSVP email notification:', error);
    }
}

// Send RSVP confirmation email to guest (with website link and password)
async function sendGuestRsvpConfirmation(guest) {
    if (!resend) {
        console.log('📧 Resend not configured - skipping guest confirmation email');
        return;
    }

    if (!guest.email) {
        console.log('📧 No email provided for guest - skipping confirmation');
        return;
    }

    try {
        const { name, email, attending } = guest;
        const attendingText = attending === 'yes' ? "We can't wait to see you" :
                             attending === 'no' ? "We're sorry you can't make it" :
                             "Thanks for letting us know you're still deciding";

        const siteUrl = process.env.SITE_URL || 'https://bswedding26.com';
        const password = process.env.WEDDING_PASSWORD || 'Beatrice&Samuel2026';

        await resend.emails.send({
            from: 'Sam & Beatrice Wedding <onboarding@resend.dev>',
            to: email,
            subject: `RSVP Confirmed - Sam & Beatrice's Wedding`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                    <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <img src="${siteUrl}/Photos/Bridge%20Photo.PNG" alt="Sam & Beatrice" style="width: 100%; height: 280px; object-fit: cover; display: block;">
                        <div style="background: linear-gradient(135deg, #1e3a5f, #2c5282); padding: 25px; text-align: center;">
                            <h1 style="color: #d4af37; margin: 0; font-size: 26px;">Sam & Beatrice</h1>
                            <p style="color: white; margin: 10px 0 0 0; font-size: 15px;">March 14th, 2026</p>
                        </div>
                        <div style="padding: 30px;">
                            <h2 style="color: #1e3a5f; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]}!</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                Your RSVP has been received. ${attendingText}!
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

        console.log(`📧 Guest confirmation email sent to ${email}`);
    } catch (error) {
        console.error('📧 Failed to send guest confirmation email:', error);
    }
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://js.stripe.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://unpkg.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            connectSrc: [
                "'self'",
                "https://api.stripe.com",
                "https://js.stripe.com",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com",
                process.env.SUPABASE_URL
            ].filter(Boolean)
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting configuration
const rateLimiterGeneral = new RateLimiterMemory({
    points: 100, // requests
    duration: 60, // per 60 seconds
});

const rateLimiterAuth = new RateLimiterMemory({
    points: 5, // 5 login attempts
    duration: 60 * 15, // per 15 minutes
});

const rateLimiterPayment = new RateLimiterMemory({
    points: 10, // 10 payment attempts
    duration: 60 * 5, // per 5 minutes
});

// Rate limiting middleware
const rateLimitMiddleware = (limiter) => async (req, res, next) => {
    try {
        await limiter.consume(req.ip);
        next();
    } catch (err) {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
};

// Middleware - FIXED: Increased payload limits for base64 images
app.use(cors());

// Stripe webhook needs raw body (keep this BEFORE the json middleware)
app.use('/api/stripe-webhook', express.raw({type: 'application/json'}));

// FIXED: Increased limits to handle base64 images in database
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static('public'));

// Helper function to find guest by code
async function findGuestByCode(guestCode) {
    try {
        const { data: guest, error } = await supabase
            .from('guests')
            .select('*')
            .eq('guest_code', guestCode.toUpperCase())
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error finding guest:', error);
            return null;
        }

        return guest;
    } catch (error) {
        console.error('Error in findGuestByCode:', error);
        return null;
    }
}

// Generate unique guest code (6 character alphanumeric)
function generateGuestCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Stripe configuration endpoint
app.get('/api/stripe-config', (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});

// Create payment intent (with Payment Element support)
app.post('/api/create-payment-intent', rateLimitMiddleware(rateLimiterPayment), async (req, res) => {
    try {
        const { amount, itemId, itemName, guestId, currency = 'nzd' } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            payment_method_types: ['card'], // Card includes Apple Pay & Google Pay when enabled
            metadata: {
                itemId: itemId.toString(),
                itemName: itemName,
                guestId: guestId || 'anonymous'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload image to Supabase Storage
app.post('/api/upload-image', async (req, res) => {
    try {
        const { image, filename } = req.body;

        if (!image || !filename) {
            return res.status(400).json({ error: 'Image and filename are required' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}-${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('registry-images')
            .upload(uniqueFilename, buffer, {
                contentType: image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error('Supabase storage error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('registry-images')
            .getPublicUrl(uniqueFilename);

        res.json({
            success: true,
            url: publicUrl,
            path: data.path
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }
});

// API Routes

// Get all registry items
app.get('/api/items', async (req, res) => {
    try {
        // Now we can include image URLs safely since they're Storage URLs (not base64)
        // Note: watchlist_count may not exist in older schemas - handled gracefully
        const { data: items, error} = await supabase
            .from('registry_items')
            .select('id, name, description, image_url, image_url_faded, target_amount, current_amount, has_target, category, priority, date_added, nz_retailers, updated_at, contributors_count')
            .order('date_added', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Transform data to match frontend expectations
        const transformedItems = (items || []).map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            imageUrl: item.image_url, // Now safe to include (Storage URLs)
            imageUrl2: item.image_url_faded, // Now safe to include (Storage URLs)
            imageUrlFaded: item.image_url_faded, // Now safe to include (Storage URLs)
            targetAmount: item.target_amount,
            currentAmount: item.current_amount || 0,
            hasTarget: item.has_target,
            category: item.category,
            priority: item.priority,
            storeLink: item.nz_retailers?.link || null, // Extract from nz_retailers
            dateAdded: item.date_added,
            nzRetailers: item.nz_retailers || {},
            contributions: [], // Not included in this query
            contributorsCount: item.contributors_count || 0,
            watchlistCount: 0, // Will be populated once watchlist_count column exists
            lastUpdated: item.updated_at
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Error getting items:', error);
        res.status(500).json({ error: 'Failed to retrieve items' });
    }
});

// Add item to watchlist (increment count)
// Note: Requires watchlist_count column in registry_items table
app.post('/api/items/:id/watchlist/add', async (req, res) => {
    try {
        const { id } = req.params;

        // Try to update watchlist count - will fail gracefully if column doesn't exist
        const { error: updateError } = await supabase.rpc('increment_watchlist', { item_id: parseInt(id) });

        if (updateError) {
            // Column may not exist - just return success silently
            console.log('Watchlist update skipped (column may not exist)');
        }

        res.json({ success: true });
    } catch (error) {
        // Don't fail the request - watchlist is optional
        res.json({ success: true });
    }
});

// Remove item from watchlist (decrement count)
// Note: Requires watchlist_count column in registry_items table
app.post('/api/items/:id/watchlist/remove', async (req, res) => {
    try {
        const { id } = req.params;

        // Try to update watchlist count - will fail gracefully if column doesn't exist
        const { error: updateError } = await supabase.rpc('decrement_watchlist', { item_id: parseInt(id) });

        if (updateError) {
            // Column may not exist - just return success silently
            console.log('Watchlist update skipped (column may not exist)');
        }

        res.json({ success: true });
    } catch (error) {
        // Don't fail the request - watchlist is optional
        res.json({ success: true });
    }
});

// Get item images by ID (returns Storage URLs)
app.get('/api/items/:id/images', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: item, error } = await supabase
            .from('registry_items')
            .select('id, image_url, image_url_faded')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error getting item images:', error);
            throw error;
        }

        // Return Storage URLs (or base64 for legacy items)
        res.json({
            id: item.id,
            imageUrl: item.image_url,
            imageUrl2: item.image_url_faded,
            imageUrlFaded: item.image_url_faded
        });
    } catch (error) {
        console.error('Error getting item images:', error);
        res.status(500).json({ error: 'Failed to retrieve item images' });
    }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
    try {
        // Get items stats
        const { data: items, error: itemsError } = await supabase
            .from('registry_items')
            .select('current_amount, target_amount, has_target');

        if (itemsError) throw itemsError;

        // Get guests stats
        const { data: guestsStats, error: guestsError } = await supabase
            .from('guests')
            .select('total_contributed, has_accessed');

        if (guestsError) throw guestsError;

        // Get contributions count
        const { count: contributionsCount, error: contributionsError } = await supabase
            .from('contributions')
            .select('*', { count: 'exact', head: true });

        if (contributionsError) throw contributionsError;

        const totalRaised = items?.reduce((sum, item) => sum + (item.current_amount || 0), 0) || 0;
        const totalContributions = contributionsCount || 0;
        const averageContribution = totalContributions > 0 ? totalRaised / totalContributions : 0;
        const completedItems = items?.filter(item => item.has_target && (item.current_amount || 0) >= item.target_amount).length || 0;
        
        const stats = {
            totalRaised,
            totalContributions,
            averageContribution,
            completedItems,
            totalItems: items?.length || 0,
            progressPercentage: items?.length > 0 ? (completedItems / items.length) * 100 : 0,
            totalGuests: guestsStats?.length || 0,
            guestsWithAccess: guestsStats?.filter(g => g.has_accessed).length || 0
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
});

// Guest authentication route (ORIGINAL - keeping for compatibility)
app.post('/api/guest/auth', async (req, res) => {
    try {
        const { guestCode } = req.body;
        
        if (!guestCode) {
            return res.status(400).json({ error: 'Guest code is required' });
        }
        
        const guest = await findGuestByCode(guestCode.toUpperCase());
        
        if (!guest) {
            return res.status(404).json({ error: 'Invalid guest code' });
        }
        
        // Update guest access
        const { error: updateError } = await supabase
            .from('guests')
            .update({ 
                has_accessed: true, 
                last_access: new Date().toISOString() 
            })
            .eq('id', guest.id);

        if (updateError) {
            console.error('Error updating guest access:', updateError);
        }
        
        res.json({
            success: true,
            guest: {
                id: guest.id,
                name: guest.name,
                guestCode: guest.guest_code,
                hasAccessed: true
            }
        });
    } catch (error) {
        console.error('Error in guest authentication:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Guest login route - UNIVERSAL PASSWORD
app.post('/api/guest/login', rateLimitMiddleware(rateLimiterAuth), async (req, res) => {
    try {
        const { guestCode } = req.body;

        if (!guestCode) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            });
        }

        // Universal wedding password from environment (case-insensitive)
        const WEDDING_PASSWORD = process.env.WEDDING_PASSWORD || 'CHANGE_ME';

        if (guestCode.trim().toLowerCase() !== WEDDING_PASSWORD.toLowerCase()) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }

        // Return success with universal guest access
        res.json({
            success: true,
            guest: {
                id: 'universal',
                name: 'Wedding Guest',
                email: '',
                guestCode: WEDDING_PASSWORD,
                guestCount: 1,
                totalContributed: 0,
                isUniversalAccess: true
            }
        });

    } catch (error) {
        console.error('Error during guest login:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
});

// Admin login with 12-character code
app.post('/api/admin/login', rateLimitMiddleware(rateLimiterAuth), async (req, res) => {
    try {
        const { adminCode, password } = req.body;
        const inputCode = adminCode || password;
        
        if (!inputCode) {
            return res.status(400).json({ error: 'Admin code is required' });
        }
        
        // Get admin code from environment or use default
        const storedCode = process.env.ADMIN_CODE || 'SB2024ADMIN1';
        
        if (inputCode.toUpperCase() === storedCode.toUpperCase()) {
            res.json({ success: true, token: 'admin-authenticated' });
        } else {
            res.status(401).json({ error: 'Invalid admin code' });
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ error: 'Admin login failed' });
    }
});

// Middleware to protect admin routes
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer admin-authenticated') {
        next();
    } else {
        res.status(401).json({ error: 'Admin authentication required' });
    }
};

// Get all guests (admin only)
app.get('/api/admin/guests', requireAdmin, async (req, res) => {
    try {
        const { data: guests, error } = await supabase
            .from('guests')
            .select('*')
            .order('date_added', { ascending: true });

        if (error) throw error;

        // Transform data to match frontend expectations
        const transformedGuests = (guests || []).map(guest => ({
            id: guest.id,
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            guestCode: guest.guest_code,
            invitationType: guest.invitation_type,
            guestCount: guest.guest_count,
            dietaryRestrictions: guest.dietary_restrictions,
            notes: guest.notes,
            rsvpStatus: guest.rsvp_status,
            hasAccessed: guest.has_accessed,
            totalContributed: guest.total_contributed || 0,
            contributionsCount: guest.contributions_count || 0,
            dateAdded: guest.date_added,
            lastAccess: guest.last_access
        }));

        res.json(transformedGuests);
    } catch (error) {
        console.error('Error getting guests:', error);
        res.status(500).json({ error: 'Failed to retrieve guests' });
    }
});

// Add new guest (admin only)
app.post('/api/admin/guests', requireAdmin, async (req, res) => {
    try {
        const {
            name, email, phone, invitationType, guestCount,
            dietaryRestrictions, notes
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if email already exists (only if email provided)
        if (email) {
            const { data: existingGuest } = await supabase
                .from('guests')
                .select('email')
                .eq('email', email.toLowerCase())
                .single();

            if (existingGuest) {
                return res.status(400).json({ error: 'Guest with this email already exists' });
            }
        }
        
        const newGuestData = {
            name: name.trim(),
            email: email ? email.toLowerCase().trim() : null,
            phone: phone || '',
            guest_code: generateGuestCode(),
            invitation_type: invitationType || 'individual',
            guest_count: guestCount || 1,
            dietary_restrictions: dietaryRestrictions || '',
            notes: notes || '',
            rsvp_status: 'pending',
            has_accessed: false,
            total_contributed: 0,
            contributions_count: 0,
            date_added: new Date().toISOString(),
            last_access: null
        };
        
        const { data: newGuest, error } = await supabase
            .from('guests')
            .insert([newGuestData])
            .select()
            .single();

        if (error) throw error;

        // Transform response
        const transformedGuest = {
            id: newGuest.id,
            name: newGuest.name,
            email: newGuest.email,
            phone: newGuest.phone,
            guestCode: newGuest.guest_code,
            invitationType: newGuest.invitation_type,
            guestCount: newGuest.guest_count,
            dietaryRestrictions: newGuest.dietary_restrictions,
            notes: newGuest.notes,
            rsvpStatus: newGuest.rsvp_status,
            hasAccessed: newGuest.has_accessed,
            totalContributed: newGuest.total_contributed,
            contributionsCount: newGuest.contributions_count || 0,
            dateAdded: newGuest.date_added,
            lastAccess: newGuest.last_access
        };
        
        res.json(transformedGuest);
    } catch (error) {
        console.error('Error adding guest:', error);
        res.status(500).json({ error: 'Failed to add guest' });
    }
});

// Update guest (admin only)
app.put('/api/admin/guests/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Transform frontend data to database format
        const dbUpdates = {
            name: updates.name,
            email: updates.email,
            phone: updates.phone,
            invitation_type: updates.invitationType,
            guest_count: updates.guestCount,
            dietary_restrictions: updates.dietaryRestrictions,
            notes: updates.notes,
            rsvp_status: updates.rsvpStatus,
            updated_at: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });
        
        const { data: updatedGuest, error } = await supabase
            .from('guests')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!updatedGuest) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        // Transform response
        const transformedGuest = {
            id: updatedGuest.id,
            name: updatedGuest.name,
            email: updatedGuest.email,
            phone: updatedGuest.phone,
            guestCode: updatedGuest.guest_code,
            invitationType: updatedGuest.invitation_type,
            guestCount: updatedGuest.guest_count,
            dietaryRestrictions: updatedGuest.dietary_restrictions,
            notes: updatedGuest.notes,
            rsvpStatus: updatedGuest.rsvp_status,
            hasAccessed: updatedGuest.has_accessed,
            totalContributed: updatedGuest.total_contributed,
            contributionsCount: updatedGuest.contributions_count || 0,
            dateAdded: updatedGuest.date_added,
            lastAccess: updatedGuest.last_access
        };
        
        res.json(transformedGuest);
    } catch (error) {
        console.error('Error updating guest:', error);
        res.status(500).json({ error: 'Failed to update guest' });
    }
});

// Delete guest (admin only)
app.delete('/api/admin/guests/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('guests')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        res.json({ success: true, message: 'Guest deleted successfully' });
    } catch (error) {
        console.error('Error deleting guest:', error);
        res.status(500).json({ error: 'Failed to delete guest' });
    }
});

// Get contribution tracking report (admin only) - FIXED: Variable name error
app.get('/api/admin/contributions-report', requireAdmin, async (req, res) => {
    try {
        // Get all contributions with guest and item details
        const { data: contributions, error: contributionsError } = await supabase
            .from('contributions')
            .select(`
                *,
                guests (id, name, email, guest_code),
                registry_items (id, name)
            `)
            .order('created_at', { ascending: false });

        if (contributionsError) throw contributionsError;

        // Get all guests
        const { data: guests, error: guestsError } = await supabase
            .from('guests')
            .select('*');

        if (guestsError) throw guestsError;

        // Calculate contribution summary
        const guestContributions = (guests || []).map(guest => {
            // FIXED: Renamed variable to avoid conflict
            const guestContributionsList = (contributions || []).filter(
                c => c.guest_id === guest.id
            );
            
            const guestContributionsFormatted = guestContributionsList.map(contribution => ({
                itemId: contribution.registry_item_id,
                itemName: contribution.registry_items?.name || 'Unknown Item',
                amount: contribution.amount,
                date: contribution.created_at
            }));
            
            const totalContributed = guestContributionsList.reduce((sum, c) => sum + (c.amount || 0), 0);
            
            return {
                id: guest.id,
                name: guest.name,
                email: guest.email,
                guestCode: guest.guest_code,
                contributions: guestContributionsFormatted,
                totalContributed,
                contributionCount: guestContributionsFormatted.length
            };
        });
        
        const totalRaised = (contributions || []).reduce((sum, c) => sum + (c.amount || 0), 0);
        const guestsWhoContributed = guestContributions.filter(g => g.totalContributed > 0).length;
        const averageContributionPerGuest = guestContributions.length > 0 ? 
            totalRaised / guestContributions.length : 0;

        const summary = {
            totalRaised,
            guestsWhoContributed,
            averageContributionPerGuest
        };
        
        res.json({
            summary,
            guestContributions: guestContributions.sort((a, b) => b.totalContributed - a.totalContributed)
        });
    } catch (error) {
        console.error('Error generating contribution report:', error);
        res.status(500).json({ error: 'Failed to generate contribution report' });
    }
});

// Generate QR codes for all guests (admin only)
app.post('/api/admin/generate-qr-codes', requireAdmin, async (req, res) => {
    try {
        const { data: guests, error } = await supabase
            .from('guests')
            .select('id, name, guest_code');

        if (error) throw error;

        const baseUrl = req.get('host');
        
        res.json({
            success: true,
            message: `QR codes prepared for ${guests?.length || 0} guests`,
            baseUrl: `http://${baseUrl}/guest/`,
            guests: (guests || []).map(guest => ({
                name: guest.name,
                guestCode: guest.guest_code,
                qrUrl: `http://${baseUrl}/guest/${guest.guest_code}`
            }))
        });
    } catch (error) {
        console.error('Error generating QR codes:', error);
        res.status(500).json({ error: 'Failed to generate QR codes' });
    }
});

// Guest access route
app.get('/guest/:guestCode', async (req, res) => {
    try {
        const { guestCode } = req.params;
        const guest = await findGuestByCode(guestCode.toUpperCase());
        
        if (!guest) {
            return res.status(404).send('Invalid guest code. Please check your invitation.');
        }
        
        // Mark guest as accessed
        const { error } = await supabase
            .from('guests')
            .update({ 
                has_accessed: true, 
                last_access: new Date().toISOString() 
            })
            .eq('guest_code', guestCode.toUpperCase());

        if (error) {
            console.error('Error updating guest access:', error);
        }
        
        // Redirect to main registry with guest context
        res.redirect(`/?guest=${guestCode.toUpperCase()}`);
    } catch (error) {
        console.error('Error in guest access:', error);
        res.status(500).send('Access error. Please try again.');
    }
});

// Record contribution after Payment Element success
app.post('/api/contributions', rateLimitMiddleware(rateLimiterPayment), async (req, res) => {
    try {
        const { itemId, guestId, guestName, amount, paymentIntentId, message } = req.body;
        const contributionAmount = parseFloat(amount);

        // Only use guestId if it's a valid integer (not "universal" or other string)
        const validGuestId = guestId && !isNaN(parseInt(guestId)) ? parseInt(guestId) : null;

        if (!contributionAmount || contributionAmount <= 0) {
            return res.status(400).json({ error: 'Invalid contribution amount' });
        }

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID is required' });
        }

        // Verify the payment intent succeeded
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({ error: 'Payment has not been completed' });
            }
        } catch (stripeError) {
            console.error('Error verifying payment:', stripeError);
            return res.status(400).json({ error: 'Could not verify payment' });
        }

        // Get item details
        const { data: item, error: itemError } = await supabase
            .from('registry_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (itemError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Create contribution record
        const { data: contribution, error: contributionError } = await supabase
            .from('contributions')
            .insert({
                registry_item_id: itemId,
                guest_id: validGuestId,
                guest_name: guestName || 'Anonymous',
                amount: contributionAmount,
                message: message || null,
                stripe_payment_intent_id: paymentIntentId
            })
            .select()
            .single();

        if (contributionError) {
            console.error('Error creating contribution:', contributionError);
            throw contributionError;
        }

        // Update item current amount
        const newCurrentAmount = (item.current_amount || 0) + contributionAmount;
        const isFullyFunded = item.has_target && newCurrentAmount >= item.target_amount;

        await supabase
            .from('registry_items')
            .update({
                current_amount: newCurrentAmount,
                status: isFullyFunded ? 'completed' : item.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);

        // Update guest contribution tracking
        if (validGuestId) {
            const { data: guest } = await supabase
                .from('guests')
                .select('total_contributed, contributions_count')
                .eq('id', validGuestId)
                .single();

            if (guest) {
                await supabase
                    .from('guests')
                    .update({
                        total_contributed: (guest.total_contributed || 0) + contributionAmount,
                        contributions_count: (guest.contributions_count || 0) + 1
                    })
                    .eq('id', validGuestId);
            }
        }

        // Send notification email
        sendContributionNotification({
            guestName: guestName || 'A guest',
            itemName: item.name,
            amount: contributionAmount,
            message: message
        });

        // Broadcast to connected clients
        broadcastEvent('contribution', {
            itemId,
            itemName: item.name,
            amount: contributionAmount,
            guestName: guestName || 'Anonymous'
        });

        res.json({
            success: true,
            contribution: {
                id: contribution.id,
                amount: contribution.amount,
                date: contribution.created_at
            },
            item: {
                id: item.id,
                name: item.name,
                currentAmount: newCurrentAmount,
                targetAmount: item.target_amount,
                isFullyFunded
            }
        });

    } catch (error) {
        console.error('Error recording contribution:', error);
        res.status(500).json({ error: 'Failed to record contribution' });
    }
});

// Contribute to item (legacy endpoint)
app.post('/api/items/:id/contribute', rateLimitMiddleware(rateLimiterPayment), async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, guestCode, paymentMethodId } = req.body;
        const contributionAmount = parseFloat(amount);
        
        if (!contributionAmount || contributionAmount <= 0) {
            return res.status(400).json({ error: 'Invalid contribution amount' });
        }
        
        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Payment method is required' });
        }
        
        // Get the item
        const { data: item, error: itemError } = await supabase
            .from('registry_items')
            .select('*')
            .eq('id', id)
            .single();

        if (itemError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Check if contribution would exceed target
        if (item.has_target && ((item.current_amount || 0) + contributionAmount) > item.target_amount) {
            return res.status(400).json({ 
                error: `Contribution would exceed target. Maximum contribution: $${(item.target_amount - (item.current_amount || 0)).toFixed(2)}` 
            });
        }
        
        // Find guest if provided
        let guest = null;
        if (guestCode) {
            guest = await findGuestByCode(guestCode);
        }
        
        try {
            // Create payment intent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(contributionAmount * 100), // Convert to cents
                currency: process.env.CURRENCY || 'nzd',
                payment_method: paymentMethodId,
                confirm: true,
                return_url: `${req.protocol}://${req.get('host')}/`,
                metadata: {
                    itemId: id.toString(),
                    itemName: item.name,
                    guestCode: guestCode || 'anonymous',
                    guestName: guest ? guest.name : 'Anonymous'
                }
            });
            
            if (paymentIntent.status === 'succeeded') {
                // Payment successful, create contribution record
                const { data: contribution, error: contributionError } = await supabase
                    .from('contributions')
                    .insert([{
                        guest_id: guest ? guest.id : null,
                        registry_item_id: id,
                        amount: contributionAmount,
                        guest_name: guest ? guest.name : 'Anonymous',
                        guest_email: guest ? guest.email : null,
                        message: req.body.message || null,
                        stripe_payment_intent_id: paymentIntent.id,
                        payment_status: 'completed'
                    }])
                    .select()
                    .single();

                if (contributionError) {
                    console.error('Error creating contribution:', contributionError);
                    throw contributionError;
                }

                // Update item current amount
                const { error: updateItemError } = await supabase
                    .from('registry_items')
                    .update({ 
                        current_amount: (item.current_amount || 0) + contributionAmount,
                        contributors_count: (item.contributors_count || 0) + 1
                    })
                    .eq('id', id);

                if (updateItemError) {
                    console.error('Error updating item:', updateItemError);
                }

                // Update guest contribution tracking
                if (guest) {
                    const { error: updateGuestError } = await supabase
                        .from('guests')
                        .update({
                            total_contributed: (guest.total_contributed || 0) + contributionAmount,
                            contributions_count: (guest.contributions_count || 0) + 1
                        })
                        .eq('id', guest.id);

                    if (updateGuestError) {
                        console.error('Error updating guest:', updateGuestError);
                    }
                }

                // Send email notification (async, don't wait for it)
                sendContributionNotification({
                    guestName: guest ? guest.name : 'Anonymous',
                    itemName: item.name,
                    amount: contributionAmount,
                    message: req.body.message || null
                }).catch(err => console.error('Email notification failed:', err));

                // Broadcast to admin live feed
                broadcastEvent('contribution', {
                    guestName: guest ? guest.name : 'Anonymous',
                    itemName: item.name,
                    amount: contributionAmount,
                    message: req.body.message || null,
                    timestamp: new Date().toISOString()
                });

                res.json({
                    success: true,
                    paymentIntent: {
                        id: paymentIntent.id,
                        status: paymentIntent.status
                    },
                    contribution: {
                        id: contribution.id,
                        amount: contribution.amount,
                        date: contribution.created_at,
                        guestName: contribution.guest_name,
                        status: 'completed'
                    },
                    item: {
                        id: item.id,
                        name: item.name,
                        currentAmount: (item.current_amount || 0) + contributionAmount,
                        targetAmount: item.target_amount
                    }
                });
            } else {
                res.status(400).json({
                    error: 'Payment failed',
                    paymentIntent: {
                        id: paymentIntent.id,
                        status: paymentIntent.status
                    }
                });
            }
        } catch (stripeError) {
            console.error('Stripe payment error:', stripeError);
            res.status(400).json({
                error: stripeError.message || 'Payment processing failed'
            });
        }
    } catch (error) {
        console.error('Error processing contribution:', error);
        res.status(500).json({ error: 'Failed to process contribution' });
    }
});

// Mark item as bought in store
app.post('/api/items/:id/bought-in-store', async (req, res) => {
    try {
        const { id } = req.params;
        const { guestCode, amount, guestName: providedGuestName, message } = req.body;

        // Get the item
        const { data: item, error: itemError } = await supabase
            .from('registry_items')
            .select('*')
            .eq('id', id)
            .single();

        if (itemError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Check if this is a gift card and validate voucher cap
        const isGiftCard = item.category === 'Gift Cards' || (item.name && item.name.toLowerCase().includes('gift card'));
        if (isGiftCard) {
            const maxAmount = item.target_amount || 250; // Default $250 (5x$50)
            const currentAmount = item.current_amount || 0;
            const contributionAmount = amount || 0;

            if (currentAmount + contributionAmount > maxAmount) {
                const remaining = maxAmount - currentAmount;
                return res.status(400).json({
                    error: `Cannot exceed 5 vouchers. Only $${remaining} (${Math.floor(remaining/50)} vouchers) remaining.`
                });
            }
        }

        // Get guest if guestCode provided
        let guest = null;
        if (guestCode && guestCode !== 'anonymous') {
            const { data: guestData } = await supabase
                .from('guests')
                .select('*')
                .eq('guest_code', guestCode.toUpperCase())
                .single();
            guest = guestData;
        }

        const contributionAmount = amount || item.target_amount || 0;
        const displayName = providedGuestName || (guest ? guest.name : 'Anonymous');

        // Create contribution record with purchased_in_store status
        const { data: contribution, error: contributionError } = await supabase
            .from('contributions')
            .insert([{
                guest_id: guest ? guest.id : null,
                registry_item_id: parseInt(id),
                amount: contributionAmount,
                guest_name: displayName,
                guest_email: guest ? guest.email : null,
                message: message || 'Purchased in store',
                payment_status: 'purchased_in_store'
            }])
            .select()
            .single();

        if (contributionError) {
            console.error('Error creating contribution:', contributionError);
            throw contributionError;
        }

        // Update item current amount - set to target_amount to mark as complete
        const { error: updateItemError } = await supabase
            .from('registry_items')
            .update({
                current_amount: item.target_amount || ((item.current_amount || 0) + contributionAmount),
                contributors_count: (item.contributors_count || 0) + 1
            })
            .eq('id', id);

        if (updateItemError) {
            console.error('Error updating item:', updateItemError);
        }

        // Update guest contribution tracking if applicable
        if (guest) {
            const { error: updateGuestError } = await supabase
                .from('guests')
                .update({
                    total_contributed: (guest.total_contributed || 0) + contributionAmount,
                    contributions_count: (guest.contributions_count || 0) + 1
                })
                .eq('id', guest.id);

            if (updateGuestError) {
                console.error('Error updating guest:', updateGuestError);
            }
        }

        // Send notification
        sendContributionNotification({
            guestName: displayName,
            itemName: item.name,
            amount: contributionAmount,
            message: `Purchased in store${message ? `: ${message}` : ''}`
        }).catch(err => console.error('Email notification failed:', err));

        // Broadcast to admin live feed
        broadcastEvent('contribution', {
            guestName: displayName,
            itemName: item.name,
            amount: contributionAmount,
            message: 'Purchased in store',
            type: 'store_purchase',
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            contribution: {
                id: contribution.id,
                amount: contribution.amount,
                date: contribution.created_at,
                guestName: contribution.guest_name,
                status: 'purchased_in_store'
            },
            item: {
                id: item.id,
                name: item.name,
                currentAmount: item.target_amount || ((item.current_amount || 0) + contributionAmount),
                targetAmount: item.target_amount
            }
        });
    } catch (error) {
        console.error('Error marking item as bought in store:', error);
        res.status(500).json({ error: 'Failed to mark item as bought in store' });
    }
});

// Undo bought in store
app.post('/api/items/:id/undo-bought-in-store', async (req, res) => {
    try {
        const { id } = req.params;
        const { guestName, guestCode } = req.body;

        // Get the item
        const { data: item, error: itemError } = await supabase
            .from('registry_items')
            .select('*')
            .eq('id', id)
            .single();

        if (itemError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Find the most recent store purchase contribution for this item BY THIS USER
        let query = supabase
            .from('contributions')
            .select('*')
            .eq('registry_item_id', parseInt(id))
            .eq('payment_status', 'purchased_in_store');

        // Filter by guest name if provided
        if (guestName && guestName !== 'Anonymous') {
            query = query.eq('guest_name', guestName);
        }

        const { data: contribution, error: contribError } = await query
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (contribError || !contribution) {
            return res.status(404).json({ error: 'No store purchase found to undo for your account' });
        }

        const contributionAmount = contribution.amount || 0;

        // Delete the contribution
        const { error: deleteError } = await supabase
            .from('contributions')
            .delete()
            .eq('id', contribution.id);

        if (deleteError) {
            console.error('Error deleting contribution:', deleteError);
            throw deleteError;
        }

        // Update item current amount
        const newAmount = Math.max(0, (item.current_amount || 0) - contributionAmount);
        const { error: updateItemError } = await supabase
            .from('registry_items')
            .update({
                current_amount: newAmount,
                contributors_count: Math.max(0, (item.contributors_count || 1) - 1)
            })
            .eq('id', id);

        if (updateItemError) {
            console.error('Error updating item:', updateItemError);
        }

        res.json({
            success: true,
            message: 'Store purchase undone',
            item: {
                id: item.id,
                name: item.name,
                currentAmount: newAmount,
                targetAmount: item.target_amount
            }
        });
    } catch (error) {
        console.error('Error undoing store purchase:', error);
        res.status(500).json({ error: 'Failed to undo store purchase' });
    }
});

// Stripe webhook endpoint
app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } else {
            // For development without webhook secret
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object.id);
            break;
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object.id);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
});

// Add new item (admin only) - FIXED: Added store_link field
app.post('/api/items', requireAdmin, async (req, res) => {
    try {
        const { name, description, imageUrl, imageUrl2, targetAmount, hasTarget, category, priority, storeLink, nzRetailers } = req.body;
        
        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }
        
        const newItemData = {
            name: name.trim(),
            description: description.trim(),
            image_url: imageUrl || '',
            image_url_faded: imageUrl2 || null, // FIXED: Support dual images
            target_amount: hasTarget ? parseFloat(targetAmount) || 0 : 0,
            current_amount: 0,
            has_target: !!hasTarget,
            category: category || 'other',
            priority: priority || 'medium',
            date_added: new Date().toISOString(),
            nz_retailers: nzRetailers || {},
            contributors_count: 0
        };

        // Handle storeLink -> nz_retailers.link mapping
        if (storeLink) {
            newItemData.nz_retailers.link = storeLink;
        }
        
        const { data: newItem, error } = await supabase
            .from('registry_items')
            .insert([newItemData])
            .select()
            .single();

        if (error) throw error;

        // Transform response
        const transformedItem = {
            id: newItem.id,
            name: newItem.name,
            description: newItem.description,
            imageUrl: newItem.image_url,
            imageUrl2: newItem.image_url_faded, // FIXED: Map dual images
            imageUrlFaded: newItem.image_url_faded, // Keep both for compatibility
            targetAmount: newItem.target_amount,
            currentAmount: newItem.current_amount,
            hasTarget: newItem.has_target,
            category: newItem.category,
            priority: newItem.priority,
            storeLink: newItem.nz_retailers?.link || '', // Extract from nz_retailers
            dateAdded: newItem.date_added,
            nzRetailers: newItem.nz_retailers,
            contributions: []
        };
        
        res.json(transformedItem);
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update item (admin only) - FIXED: Added store_link field mapping
app.put('/api/items/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Transform frontend data to database format
        const dbUpdates = {
            name: updates.name,
            description: updates.description,
            image_url: updates.imageUrl,
            image_url_faded: updates.imageUrl2 || updates.imageUrlFaded, // FIXED: Support both field names
            target_amount: updates.targetAmount,
            current_amount: updates.currentAmount, // Allow resetting current amount
            has_target: updates.hasTarget,
            category: updates.category,
            priority: updates.priority,
            nz_retailers: updates.nzRetailers,
            updated_at: new Date().toISOString()
        };

        // Handle storeLink -> nz_retailers.link mapping
        if (updates.storeLink !== undefined) {
            dbUpdates.nz_retailers = dbUpdates.nz_retailers || {};
            dbUpdates.nz_retailers.link = updates.storeLink;
        }

        // Remove undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });
        
        const { data: updatedItem, error } = await supabase
            .from('registry_items')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Transform response
        const transformedItem = {
            id: updatedItem.id,
            name: updatedItem.name,
            description: updatedItem.description,
            imageUrl: updatedItem.image_url,
            imageUrl2: updatedItem.image_url_faded, // FIXED: Map dual images
            imageUrlFaded: updatedItem.image_url_faded, // Keep both for compatibility
            targetAmount: updatedItem.target_amount,
            currentAmount: updatedItem.current_amount,
            hasTarget: updatedItem.has_target,
            category: updatedItem.category,
            priority: updatedItem.priority,
            storeLink: updatedItem.nz_retailers?.link || '', // Extract from nz_retailers
            dateAdded: updatedItem.date_added,
            nzRetailers: updatedItem.nz_retailers,
            contributions: [],
            lastUpdated: updatedItem.updated_at
        };
        
        res.json(transformedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item (admin only)
app.delete('/api/items/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('registry_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve main registry
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const fs = require('fs');
    let jsStatus = 'unknown';
    let jsWarning = '';
    let dbStatus = 'unknown';
    let dbWarning = '';

    // Check if index.html exists
    try {
        if (fs.existsSync(__dirname + '/public/index.html')) {
            jsStatus = 'index.html found';
        } else {
            jsStatus = 'index.html missing';
            jsWarning = 'index.html is missing, so the main UI and JS will not load.';
        }
    } catch (e) {
        jsStatus = 'error';
        jsWarning = e.message;
    }

    // Check Supabase connection
    try {
        const { data, error } = await supabase
            .from('registry_items')
            .select('count')
            .limit(1);
        
        if (error) {
            dbStatus = 'connection error';
            dbWarning = `Supabase error: ${error.message}`;
        } else {
            dbStatus = 'connected';
        }
    } catch (e) {
        dbStatus = 'connection failed';
        dbWarning = e.message;
    }

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        features: ['guest-tracking', 'qr-codes', 'admin-dashboard', 'stripe-payments', 'supabase-database'],
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        dbWarning,
        jsStatus,
        jsWarning,
        supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
        payloadLimits: '50MB (supports base64 images)',
        welcomeButtonHelp: 'If the welcome buttons are not functioning, check the browser console for JavaScript errors. Ensure index.html is being served and that no critical JS errors are present. Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R). If the problem persists, check for missing or broken script tags in index.html.'
    });
});

// Guest Book API
app.get('/api/guestbook', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('guestbook')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching guestbook:', error);
        // Return empty array if table doesn't exist yet
        res.json([]);
    }
});

app.post('/api/guestbook', async (req, res) => {
    try {
        const { name, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }

        const { data, error } = await supabase
            .from('guestbook')
            .insert([{
                name: name.trim(),
                message: message.trim()
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, entry: data });
    } catch (error) {
        console.error('Error saving guestbook entry:', error);
        res.status(500).json({ error: 'Failed to save guestbook entry' });
    }
});

app.delete('/api/guestbook/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('guestbook')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting guestbook entry:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Gallery Photos API
app.post('/api/gallery/upload', async (req, res) => {
    try {
        const { image, guestName } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const uniqueFilename = `gallery/${timestamp}-${randomStr}.jpg`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('registry-images')
            .upload(uniqueFilename, buffer, {
                contentType: 'image/jpeg',
                upsert: false,
                cacheControl: '3600'
            });

        if (error) {
            console.error('Gallery upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('registry-images')
            .getPublicUrl(uniqueFilename);

        res.json({
            success: true,
            url: publicUrl,
            message: 'Photo uploaded successfully!'
        });
    } catch (error) {
        console.error('Gallery upload error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

app.get('/api/gallery/photos', async (req, res) => {
    try {
        const { data, error } = await supabase.storage
            .from('registry-images')
            .list('gallery', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) throw error;

        const photos = data.map(file => {
            const { data: { publicUrl } } = supabase.storage
                .from('registry-images')
                .getPublicUrl(`gallery/${file.name}`);
            return {
                url: publicUrl,
                name: file.name,
                createdAt: file.created_at
            };
        });

        res.json(photos);
    } catch (error) {
        console.error('Gallery fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

// RSVP API Endpoints
app.post('/api/rsvp', async (req, res) => {
    try {
        const { name, email, phone, attending, guestCount, dietary, message } = req.body;

        if (!name || !attending) {
            return res.status(400).json({ error: 'Name and attendance status are required' });
        }

        const { data, error } = await supabase
            .from('rsvps')
            .insert([{
                name: name.trim(),
                email: email ? email.trim().toLowerCase() : null,
                phone: phone ? phone.trim() : null,
                attending: attending,
                guest_count: guestCount || 1,
                dietary_restrictions: dietary || null,
                message: message || null
            }])
            .select();

        if (error) throw error;

        // Send RSVP email notification
        await sendRsvpNotification({
            name: name.trim(),
            email: email ? email.trim().toLowerCase() : null,
            attending,
            guestCount: guestCount || 1,
            dietary: dietary || null,
            message: message || null
        });

        res.json({
            success: true,
            message: 'RSVP submitted successfully!',
            rsvp: data[0]
        });
    } catch (error) {
        console.error('RSVP submission error:', error);
        res.status(500).json({ error: 'Failed to submit RSVP' });
    }
});

app.get('/api/rsvps', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rsvps')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('RSVP fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch RSVPs' });
    }
});

app.get('/api/rsvp/stats', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rsvps')
            .select('attending, guest_count');

        if (error) throw error;

        const stats = {
            total: data.length,
            attending: data.filter(r => r.attending === 'yes').length,
            notAttending: data.filter(r => r.attending === 'no').length,
            maybe: data.filter(r => r.attending === 'maybe').length,
            totalGuests: data.filter(r => r.attending === 'yes').reduce((sum, r) => sum + (r.guest_count || 1), 0)
        };

        res.json(stats);
    } catch (error) {
        console.error('RSVP stats error:', error);
        res.status(500).json({ error: 'Failed to fetch RSVP stats' });
    }
});

app.delete('/api/rsvp/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('rsvps')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'RSVP deleted successfully' });
    } catch (error) {
        console.error('RSVP delete error:', error);
        res.status(500).json({ error: 'Failed to delete RSVP' });
    }
});

// ============================================
// GUEST LIST AUTHENTICATION & RSVP SYSTEM
// ============================================

// Helper to normalize names for matching
function normalizeNameForLookup(name) {
    return name.toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z\s]/g, '') // Remove non-letters
        .replace(/\s+/g, ' '); // Normalize whitespace
}

// Look up guest by name (with fuzzy matching)
app.post('/api/guest-list/lookup', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Please enter your name' });
        }

        const normalizedInput = normalizeNameForLookup(name);

        // Get all guests
        const { data: guests, error } = await supabase
            .from('guest_list')
            .select('*');

        if (error) throw error;

        // Find exact match first
        let matchedGuest = guests.find(g =>
            normalizeNameForLookup(g.name) === normalizedInput
        );

        // If no exact match, try partial matching
        if (!matchedGuest) {
            // Try matching first + last name separately
            const inputParts = normalizedInput.split(' ');

            matchedGuest = guests.find(g => {
                const guestParts = normalizeNameForLookup(g.name).split(' ');
                // Match if first name matches and last name starts with input
                if (inputParts.length >= 2) {
                    return guestParts[0] === inputParts[0] &&
                           guestParts[guestParts.length - 1].startsWith(inputParts[inputParts.length - 1]);
                }
                // Or if single name matches either first or last
                return guestParts.some(part => part === inputParts[0]);
            });
        }

        if (!matchedGuest) {
            return res.status(404).json({
                error: 'Name not found on guest list. Please check spelling or contact Sam & Beatrice.',
                suggestions: []
            });
        }

        // Get family members who can be RSVPed together
        const { data: familyMembers, error: familyError } = await supabase
            .from('guest_list')
            .select('*')
            .eq('family_group', matchedGuest.family_group);

        if (familyError) throw familyError;

        res.json({
            success: true,
            guest: {
                id: matchedGuest.id,
                name: matchedGuest.name,
                familyGroup: matchedGuest.family_group,
                hasRsvped: matchedGuest.has_rsvped,
                rsvpResponse: matchedGuest.rsvp_response,
                side: matchedGuest.side
            },
            familyMembers: familyMembers.map(fm => ({
                id: fm.id,
                name: fm.name,
                hasRsvped: fm.has_rsvped,
                rsvpResponse: fm.rsvp_response
            })),
            canRsvpForFamily: familyMembers.length > 1
        });

    } catch (error) {
        console.error('Guest lookup error:', error);
        res.status(500).json({ error: 'Failed to look up guest' });
    }
});

// Submit RSVP for guest and/or family members
app.post('/api/guest-list/rsvp', async (req, res) => {
    try {
        const { guestId, attending, email, guestCount, dietary, message, familyRsvps } = req.body;

        if (!guestId || !attending) {
            return res.status(400).json({ error: 'Guest ID and attendance response required' });
        }

        // Get the main guest
        const { data: guest, error: guestError } = await supabase
            .from('guest_list')
            .select('*')
            .eq('id', guestId)
            .single();

        if (guestError || !guest) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        const now = new Date().toISOString();

        // Update main guest's RSVP
        const { error: updateError } = await supabase
            .from('guest_list')
            .update({
                has_rsvped: true,
                rsvp_response: attending,
                rsvp_guest_count: guestCount || 1,
                rsvp_dietary: dietary || null,
                rsvp_message: message || null,
                rsvp_date: now,
                rsvp_by: guest.name
            })
            .eq('id', guestId);

        if (updateError) throw updateError;

        // Send confirmation email to main guest
        if (email) {
            await sendGuestRsvpConfirmation({
                name: guest.name,
                email: email,
                attending: attending
            });
        }

        // If there are family RSVPs, update those too
        if (familyRsvps && Array.isArray(familyRsvps)) {
            for (const familyRsvp of familyRsvps) {
                if (familyRsvp.guestId && familyRsvp.attending) {
                    // Get family member name for email
                    const { data: familyMember } = await supabase
                        .from('guest_list')
                        .select('name')
                        .eq('id', familyRsvp.guestId)
                        .single();

                    await supabase
                        .from('guest_list')
                        .update({
                            has_rsvped: true,
                            rsvp_response: familyRsvp.attending,
                            rsvp_guest_count: 1,
                            rsvp_dietary: familyRsvp.dietary || null,
                            rsvp_date: now,
                            rsvp_by: guest.name // Marked who submitted
                        })
                        .eq('id', familyRsvp.guestId)
                        .eq('family_group', guest.family_group); // Security: only same family

                    // Send confirmation email to family member if email provided
                    if (familyRsvp.email && familyMember) {
                        await sendGuestRsvpConfirmation({
                            name: familyMember.name,
                            email: familyRsvp.email,
                            attending: familyRsvp.attending
                        });
                    }
                }
            }
        }

        // Send notification email to couple
        await sendRsvpNotification({
            name: guest.name,
            email: email || null,
            attending,
            guestCount: guestCount || 1,
            dietary: dietary || null,
            message: message || null
        });

        res.json({
            success: true,
            message: 'RSVP submitted successfully!',
            guest: {
                id: guest.id,
                name: guest.name,
                rsvpResponse: attending
            }
        });

    } catch (error) {
        console.error('RSVP submission error:', error);
        res.status(500).json({ error: 'Failed to submit RSVP' });
    }
});

// Get guest list RSVP stats (public - for countdown display)
app.get('/api/guest-list/stats', async (req, res) => {
    try {
        const { data: guests, error } = await supabase
            .from('guest_list')
            .select('has_rsvped, rsvp_response, rsvp_guest_count');

        if (error) throw error;

        const totalInvited = guests.length;
        const totalRsvped = guests.filter(g => g.has_rsvped).length;
        const attending = guests.filter(g => g.rsvp_response === 'yes');
        const notAttending = guests.filter(g => g.rsvp_response === 'no').length;
        const maybe = guests.filter(g => g.rsvp_response === 'maybe').length;
        const totalAttending = attending.reduce((sum, g) => sum + (g.rsvp_guest_count || 1), 0);
        const pending = totalInvited - totalRsvped;

        res.json({
            totalInvited,
            totalRsvped,
            attending: attending.length,
            notAttending,
            maybe,
            totalAttending,
            pending,
            percentRsvped: totalInvited > 0 ? Math.round((totalRsvped / totalInvited) * 100) : 0
        });

    } catch (error) {
        console.error('Guest list stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Check if guest has already RSVPed (for skip-RSVP flow)
app.get('/api/guest-list/check-rsvp/:guestId', async (req, res) => {
    try {
        const { guestId } = req.params;

        const { data: guest, error } = await supabase
            .from('guest_list')
            .select('id, name, has_rsvped, rsvp_response, family_group')
            .eq('id', guestId)
            .single();

        if (error || !guest) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        res.json({
            hasRsvped: guest.has_rsvped,
            rsvpResponse: guest.rsvp_response,
            name: guest.name
        });

    } catch (error) {
        console.error('RSVP check error:', error);
        res.status(500).json({ error: 'Failed to check RSVP status' });
    }
});

// Admin: Get all guest list entries
app.get('/api/admin/guest-list', requireAdmin, async (req, res) => {
    try {
        const { data: guests, error } = await supabase
            .from('guest_list')
            .select('*')
            .order('family_group')
            .order('name');

        if (error) throw error;

        res.json(guests);

    } catch (error) {
        console.error('Admin guest list error:', error);
        res.status(500).json({ error: 'Failed to fetch guest list' });
    }
});

// Site Content API - Get all content
app.get('/api/content', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('site_content')
            .select('*')
            .order('section', { ascending: true });

        if (error) throw error;

        // Convert to key-value object for easier frontend access
        const contentObj = {};
        data.forEach(item => {
            contentObj[item.content_key] = {
                value: item.content_value,
                type: item.content_type,
                section: item.section,
                description: item.description
            };
        });

        res.json(contentObj);
    } catch (error) {
        console.error('Error fetching site content:', error);
        res.status(500).json({ error: 'Failed to fetch site content' });
    }
});

// Site Content API - Update content (admin only)
app.put('/api/content/:key', requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined || value === null) {
            return res.status(400).json({ error: 'Content value is required' });
        }

        // First get the existing record to get all required fields
        const { data: existing, error: checkError } = await supabase
            .from('site_content')
            .select('*')
            .eq('content_key', key)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (!existing) {
            return res.status(404).json({ error: 'Content key not found' });
        }

        // Use upsert to update (bypasses some RLS issues)
        const { data, error } = await supabase
            .from('site_content')
            .upsert({
                id: existing.id,
                content_key: key,
                content_value: value,
                content_type: existing.content_type,
                section: existing.section,
                description: existing.description
            }, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('Upsert error:', error);
            throw error;
        }

        res.json({ success: true, data: data ? data[0] : { content_key: key, content_value: value } });
    } catch (error) {
        console.error('Error updating site content:', error);
        res.status(500).json({ error: 'Failed to update site content' });
    }
});

// Site Content API - Bulk update (admin only)
app.post('/api/content/bulk-update', requireAdmin, async (req, res) => {
    try {
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates array is required' });
        }

        const results = [];
        for (const update of updates) {
            const { key, value } = update;

            // First get the existing record
            const { data: existing } = await supabase
                .from('site_content')
                .select('*')
                .eq('content_key', key)
                .single();

            if (!existing) {
                results.push({ key, success: false, error: 'Key not found' });
                continue;
            }

            // Use upsert to update
            const { data, error } = await supabase
                .from('site_content')
                .upsert({
                    id: existing.id,
                    content_key: key,
                    content_value: value,
                    content_type: existing.content_type,
                    section: existing.section,
                    description: existing.description
                }, { onConflict: 'id' })
                .select();

            if (error) {
                console.error(`Error updating ${key}:`, error);
                results.push({ key, success: false, error: error.message });
            } else {
                results.push({ key, success: true, data: data ? data[0] : null });
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('Error bulk updating site content:', error);
        res.status(500).json({ error: 'Failed to bulk update site content' });
    }
});

// Thank You Messages API - Get pending thank yous (admin only)
app.get('/api/admin/thank-yous', requireAdmin, async (req, res) => {
    try {
        // Get contributions that haven't been thanked yet
        const { data: contributions, error } = await supabase
            .from('contributions')
            .select(`
                id,
                amount,
                guest_name,
                guest_email,
                message,
                created_at,
                thank_you_sent,
                registry_items (id, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform and add template
        const thankYous = (contributions || []).map(c => {
            const template = generateThankYouTemplate(
                c.guest_name || 'Friend',
                c.registry_items?.name || 'our registry',
                c.message
            );
            return {
                id: c.id,
                guestName: c.guest_name || 'Anonymous',
                guestEmail: c.guest_email,
                itemName: c.registry_items?.name || 'Registry Item',
                amount: c.amount,
                message: c.message,
                date: c.created_at,
                thankYouSent: c.thank_you_sent || false,
                template
            };
        });

        // Split into pending and sent
        const pending = thankYous.filter(t => !t.thankYouSent);
        const sent = thankYous.filter(t => t.thankYouSent);

        res.json({ pending, sent, total: thankYous.length });
    } catch (error) {
        console.error('Error fetching thank yous:', error);
        res.status(500).json({ error: 'Failed to fetch thank you list' });
    }
});

// Mark thank you as sent (admin only)
app.post('/api/admin/thank-yous/:id/mark-sent', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('contributions')
            .update({
                thank_you_sent: true,
                thank_you_sent_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ success: true, message: 'Thank you marked as sent' });
    } catch (error) {
        console.error('Error marking thank you as sent:', error);
        res.status(500).json({ error: 'Failed to update thank you status' });
    }
});

// Admin Live Feed SSE Endpoint
app.get('/api/admin/live-feed', requireAdmin, (req, res) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to live feed', timestamp: new Date().toISOString() })}\n\n`);

    // Add client to set
    sseClients.add(res);
    console.log(`📡 Admin live feed client connected. Total clients: ${sseClients.size}`);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`📡 Admin live feed client disconnected. Total clients: ${sseClients.size}`);
    });
});

// Generate thank you template helper
function generateThankYouTemplate(guestName, itemName, guestMessage) {
    let template = `Dear ${guestName},

Thank you so much for your generous contribution toward our ${itemName}.

`;

    if (guestMessage) {
        template += `Your lovely message - "${guestMessage}" - truly touched our hearts.

`;
    }

    template += `We're so grateful to have you as part of our journey, and can't wait to celebrate with you on March 14th, 2026.

With love,
Sam & Beatrice`;

    return template;
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server function
async function startServer() {
    try {
        // Test Supabase connection
        const { data, error } = await supabase
            .from('registry_items')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('⚠️  Supabase connection test failed:', error.message);
            console.log('Please check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
        } else {
            console.log('✅ Supabase connection successful');
        }

        app.listen(PORT, () => {
            console.log('');
            console.log('🎉 ===============================================');
            console.log('   Sam & Beatrice\'s Wedding Registry is LIVE!');
            console.log('🎉 ===============================================');
            console.log('');
            console.log(`🌐 Main Registry: http://localhost:${PORT}`);
            console.log(`🛡️ Admin Dashboard: http://localhost:${PORT}/admin`);
            console.log(`📱 Health Check: http://localhost:${PORT}/api/health`);
            console.log('');
            console.log('🔐 ADMIN ACCESS:');
            console.log('   Admin code configured via ADMIN_CODE env variable');
            console.log('   ⚠️  Check your .env file for the admin code');
            console.log('');
            console.log('✨ FEATURES ENABLED:');
            console.log('   ✅ Beautiful Wedding Registry');
            console.log('   ✅ QR Code Guest Access');
            console.log('   ✅ Real Stripe Payments');
            console.log('   ✅ Admin Dashboard');
            console.log('   ✅ Supabase Database');
            console.log('   ✅ Contribution Tracking');
            console.log('   ✅ Thank You Card Data Export');
            console.log('   ✅ 50MB Payload Support (Base64 Images)');
            console.log('   ✅ DUAL IMAGE SUPPORT - Fixed!'); // NEW
            console.log('   ✅ STORE LINKS - Added!'); // NEW
            console.log('');
            console.log('💳 PAYMENT STATUS:');
            if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
                console.log('   🔴 LIVE PAYMENTS ACTIVE - Real money will be processed!');
            } else {
                console.log('   🟡 TEST MODE - Use test card: 4242 4242 4242 4242');
            }
            console.log('');
            console.log('🗄️ DATABASE STATUS:');
            console.log('   ✅ Supabase Connected');
            console.log(`   📊 Project: ${process.env.SUPABASE_URL ? process.env.SUPABASE_URL.split('//')[1].split('.')[0] : 'Not configured'}`);
            console.log('');
            console.log('🚀 Ready for your wedding guests!');
            console.log('===============================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();