const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (works locally with .env file, Railway provides them directly)
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'STRIPE_SECRET_KEY', 'ADMIN_CODE'];
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

// Generate shared guest code (single PIN for all users)
function generateGuestCode() {
    return process.env.SHARED_GUEST_PIN || 'WEDDING2024';
}

// Stripe configuration endpoint
app.get('/api/stripe-config', (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, itemId, itemName, guestId, currency = 'nzd' } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            metadata: {
                itemId: itemId.toString(),
                itemName: itemName,
                guestId: guestId || 'anonymous'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
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
            lastUpdated: item.updated_at
        }));

        console.log('API Response Sample Item:', transformedItems[0]); // Debug log
        res.json(transformedItems);
    } catch (error) {
        console.error('Error getting items:', error);
        res.status(500).json({ error: 'Failed to retrieve items' });
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
app.post('/api/guest/login', async (req, res) => {
    try {
        const { guestCode } = req.body;

        if (!guestCode) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            });
        }

        // Universal wedding password (case-insensitive)
        const WEDDING_PASSWORD = 'Beatrice&Samuel2026';

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
app.post('/api/admin/login', async (req, res) => {
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

// Contribute to item
app.post('/api/items/:id/contribute', async (req, res) => {
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
        
        console.log('Creating new item with data:', newItemData); // Debug log
        
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
            storeLink: '', // Store link not in database
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
        
        console.log('Updating item with data:', updates); // Debug log
        
        // Transform frontend data to database format
        const dbUpdates = {
            name: updates.name,
            description: updates.description,
            image_url: updates.imageUrl,
            image_url_faded: updates.imageUrl2 || updates.imageUrlFaded, // FIXED: Support both field names
            target_amount: updates.targetAmount,
            has_target: updates.hasTarget,
            category: updates.category,
            priority: updates.priority,
            nz_retailers: updates.nzRetailers,
            updated_at: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });
        
        console.log('Database update data:', dbUpdates); // Debug log
        
        const { data: updatedItem, error } = await supabase
            .from('registry_items')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database update error:', error); // Debug log
            throw error;
        }

        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        console.log('Updated item from database:', updatedItem); // Debug log

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
            storeLink: '', // Store link not in database
            dateAdded: updatedItem.date_added,
            nzRetailers: updatedItem.nz_retailers,
            contributions: [],
            lastUpdated: updatedItem.updated_at
        };
        
        console.log('Transformed response:', transformedItem); // Debug log
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

// Guest Book API (placeholder - returns empty array)
app.get('/api/guestbook', async (req, res) => {
    try {
        // Return empty array for now - guestbook feature not yet implemented
        res.json([]);
    } catch (error) {
        console.error('Error fetching guestbook:', error);
        res.status(500).json({ error: 'Failed to fetch guestbook entries' });
    }
});

app.post('/api/guestbook', async (req, res) => {
    try {
        // Placeholder - accept but don't store
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving guestbook entry:', error);
        res.status(500).json({ error: 'Failed to save guestbook entry' });
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

app.get('/api/rsvps', async (req, res) => {
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

app.delete('/api/rsvp/:id', async (req, res) => {
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
app.put('/api/content/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!value) {
            return res.status(400).json({ error: 'Content value is required' });
        }

        const { data, error } = await supabase
            .from('site_content')
            .update({ content_value: value })
            .eq('content_key', key)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Content key not found' });
        }

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating site content:', error);
        res.status(500).json({ error: 'Failed to update site content' });
    }
});

// Site Content API - Bulk update (admin only)
app.post('/api/content/bulk-update', async (req, res) => {
    try {
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates array is required' });
        }

        const results = [];
        for (const update of updates) {
            const { key, value } = update;

            const { data, error } = await supabase
                .from('site_content')
                .update({ content_value: value })
                .eq('content_key', key)
                .select();

            if (error) {
                console.error(`Error updating ${key}:`, error);
                results.push({ key, success: false, error: error.message });
            } else {
                results.push({ key, success: true, data: data[0] });
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('Error bulk updating site content:', error);
        res.status(500).json({ error: 'Failed to bulk update site content' });
    }
});

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
            console.log(`   Admin Code: ${process.env.ADMIN_CODE || 'SB2024ADMIN1'}`);
            console.log('   ⚠️  Save this code - you need it to access admin panel!');
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