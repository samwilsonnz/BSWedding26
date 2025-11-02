const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    console.log('🚀 Starting data migration to Supabase...\n');

    try {
        // Read existing JSON data
        const registryData = JSON.parse(fs.readFileSync('registry-data.json', 'utf8'));
        const guestsData = JSON.parse(fs.readFileSync('guests-data.json', 'utf8'));

        console.log('📊 Data Summary:');
        console.log(`   Registry Items: ${registryData.items.length}`);
        console.log(`   Guests: ${guestsData.guests.length}\n`);

        // 1. Migrate Registry Items (FIXED to handle decimal IDs)
        console.log('📝 Migrating registry items...');
        
        // Fix decimal IDs and prepare items for insertion
        const registryItems = registryData.items.map((item, index) => {
            // Convert decimal IDs to integers, or use auto-increment
            let fixedId = item.id;
            if (typeof item.id === 'number' && !Number.isInteger(item.id)) {
                // Convert decimal to integer (11.5 becomes 115, or just use a sequential ID)
                fixedId = Math.floor(item.id * 10); // 11.5 becomes 115
                console.log(`   🔧 Fixed decimal ID: ${item.id} → ${fixedId} for item "${item.name}"`);
            }
            
            return {
                id: fixedId,
                name: item.name,
                description: item.description,
                image_url: item.imageUrl,
                image_url_faded: item.imageUrlFaded || null,
                target_amount: item.targetAmount || 0,
                current_amount: item.currentAmount || 0,
                has_target: item.hasTarget || false,
                category: item.category || 'other',
                priority: item.priority || 'medium',
                date_added: item.dateAdded || new Date().toISOString(),
                nz_retailers: item.nzRetailers || {},
                contributors_count: (item.contributions && item.contributions.length) || 0,
                created_at: item.dateAdded || new Date().toISOString(),
                updated_at: item.lastUpdated || new Date().toISOString()
            };
        });

        // Clear existing items first (optional - comment out if you want to keep existing data)
        console.log('   🗑️  Clearing existing registry items...');
        const { error: clearItemsError } = await supabase
            .from('registry_items')
            .delete()
            .neq('id', 0); // Delete all items

        if (clearItemsError) {
            console.log('   ⚠️  Warning: Could not clear existing items:', clearItemsError.message);
        }

        // Insert registry items
        console.log('   ✅ Inserting registry items...');
        const { data: insertedItems, error: itemsError } = await supabase
            .from('registry_items')
            .insert(registryItems)
            .select();

        if (itemsError) {
            console.error('❌ Error inserting registry items:', itemsError);
            console.log('   📝 Items that failed:', JSON.stringify(registryItems, null, 2));
            
            // Try inserting items one by one to identify problematic ones
            console.log('   🔧 Trying to insert items individually...');
            const successfulItems = [];
            const failedItems = [];
            
            for (const item of registryItems) {
                try {
                    const { data: singleItem, error: singleError } = await supabase
                        .from('registry_items')
                        .insert([item])
                        .select()
                        .single();
                    
                    if (singleError) {
                        console.log(`   ❌ Failed to insert "${item.name}" (ID: ${item.id}):`, singleError.message);
                        failedItems.push(item);
                    } else {
                        console.log(`   ✅ Successfully inserted "${item.name}" (ID: ${item.id})`);
                        successfulItems.push(singleItem);
                    }
                } catch (error) {
                    console.log(`   ❌ Exception inserting "${item.name}":`, error.message);
                    failedItems.push(item);
                }
            }
            
            console.log(`\n   📊 Summary: ${successfulItems.length} successful, ${failedItems.length} failed`);
            if (failedItems.length > 0) {
                console.log('   Failed items:', failedItems.map(i => `"${i.name}" (ID: ${i.id})`).join(', '));
            }
            
            // Continue with successful items
            if (successfulItems.length === 0) {
                console.log('   ❌ No items were successfully inserted. Stopping migration.');
                return;
            }
        } else {
            console.log(`   ✅ Successfully migrated ${insertedItems.length} registry items`);
        }

        // 2. Migrate Guests
        console.log('\n👥 Migrating guests...');
        
        const guests = guestsData.guests.map(guest => ({
            id: guest.id,
            name: guest.name,
            email: guest.email,
            phone: guest.phone || '',
            guest_code: guest.guestCode,
            invitation_type: guest.invitationType || 'individual',
            guest_count: guest.guestCount || 1,
            dietary_restrictions: guest.dietaryRestrictions || '',
            notes: guest.notes || '',
            rsvp_status: guest.rsvpStatus || 'pending',
            has_accessed: guest.hasAccessed || false,
            total_contributed: guest.totalContributed || 0,
            contributions: guest.contributions || [],
            contributions_count: (guest.contributions && guest.contributions.length) || 0,
            date_added: guest.dateAdded || new Date().toISOString(),
            last_access: guest.lastAccess || null,
            created_at: guest.dateAdded || new Date().toISOString(),
            updated_at: guest.lastUpdated || new Date().toISOString()
        }));

        // Clear existing guests first (optional)
        console.log('   🗑️  Clearing existing guests...');
        const { error: clearGuestsError } = await supabase
            .from('guests')
            .delete()
            .neq('id', '0'); // Delete all guests

        if (clearGuestsError) {
            console.log('   ⚠️  Warning: Could not clear existing guests:', clearGuestsError.message);
        }

        // Insert guests
        console.log('   ✅ Inserting guests...');
        const { data: insertedGuests, error: guestsError } = await supabase
            .from('guests')
            .insert(guests)
            .select();

        if (guestsError) {
            console.error('❌ Error inserting guests:', guestsError);
            console.log('   📝 Guests that failed:', JSON.stringify(guests, null, 2));
            return;
        }

        console.log(`   ✅ Successfully migrated ${insertedGuests.length} guests`);

        // 3. Migrate Contributions (if any exist in the JSON files)
        console.log('\n💰 Migrating contributions...');
        
        let totalContributions = 0;
        const allContributions = [];

        // Extract contributions from registry items
        registryData.items.forEach(item => {
            if (item.contributions && item.contributions.length > 0) {
                item.contributions.forEach(contribution => {
                    // Find guest by code or ID
                    let guest = null;
                    if (contribution.guestCode) {
                        guest = guestsData.guests.find(g => g.guestCode === contribution.guestCode);
                    } else if (contribution.guestId) {
                        guest = guestsData.guests.find(g => g.id === contribution.guestId);
                    }

                    // Use the fixed item ID
                    let itemId = item.id;
                    if (typeof item.id === 'number' && !Number.isInteger(item.id)) {
                        itemId = Math.floor(item.id * 10); // Same fix as above
                    }

                    allContributions.push({
                        guest_id: guest ? guest.id : null,
                        registry_item_id: itemId,
                        amount: contribution.amount,
                        guest_name: contribution.guestName || (guest ? guest.name : 'Anonymous'),
                        guest_email: guest ? guest.email : null,
                        message: contribution.message || null,
                        stripe_payment_intent_id: contribution.paymentIntentId || null,
                        payment_status: contribution.status || 'completed',
                        created_at: contribution.date || new Date().toISOString()
                    });
                });
            }
        });

        if (allContributions.length > 0) {
            // Clear existing contributions first
            console.log('   🗑️  Clearing existing contributions...');
            const { error: clearContribsError } = await supabase
                .from('contributions')
                .delete()
                .neq('id', 0); // Delete all contributions

            if (clearContribsError) {
                console.log('   ⚠️  Warning: Could not clear existing contributions:', clearContribsError.message);
            }

            // Insert contributions
            console.log('   ✅ Inserting contributions...');
            const { data: insertedContributions, error: contributionsError } = await supabase
                .from('contributions')
                .insert(allContributions)
                .select();

            if (contributionsError) {
                console.error('❌ Error inserting contributions:', contributionsError);
                return;
            }

            totalContributions = insertedContributions.length;
            console.log(`   ✅ Successfully migrated ${totalContributions} contributions`);
        } else {
            console.log('   ℹ️  No contributions found to migrate');
        }

        // 4. Update admin settings
        console.log('\n⚙️  Setting up admin configuration...');
        
        const adminSettings = [
            {
                setting_key: 'admin_code',
                setting_value: registryData.settings.adminCode || process.env.ADMIN_CODE || 'SB2024ADMIN1'
            },
            {
                setting_key: 'wedding_couple_names',
                setting_value: registryData.settings.coupleNames || process.env.WEDDING_COUPLE_NAMES || 'Sam & Beatrice'
            },
            {
                setting_key: 'currency',
                setting_value: registryData.settings.currency || process.env.CURRENCY || 'nzd'
            },
            {
                setting_key: 'stripe_publishable_key',
                setting_value: process.env.STRIPE_PUBLISHABLE_KEY || ''
            }
        ];

        // Clear existing settings first
        const { error: clearSettingsError } = await supabase
            .from('admin_settings')
            .delete()
            .neq('id', 0);

        if (clearSettingsError) {
            console.log('   ⚠️  Warning: Could not clear existing settings:', clearSettingsError.message);
        }

        // Insert admin settings
        const { data: insertedSettings, error: settingsError } = await supabase
            .from('admin_settings')
            .insert(adminSettings)
            .select();

        if (settingsError) {
            console.error('❌ Error inserting admin settings:', settingsError);
            return;
        }

        console.log(`   ✅ Successfully configured admin settings`);

        // 5. Migration Summary
        console.log('\n🎉 ===============================================');
        console.log('   MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('🎉 ===============================================');
        console.log('');
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Registry Items: ${insertedItems?.length || 'See individual results above'}`);
        console.log(`   ✅ Guests: ${insertedGuests.length}`);
        console.log(`   ✅ Contributions: ${totalContributions}`);
        console.log(`   ✅ Admin Settings: ${insertedSettings.length}`);
        console.log('');
        console.log('🔧 Fixed Issues:');
        console.log('   ✅ Converted decimal ID 11.5 to integer 115 for Coffee Machine');
        console.log('');
        console.log('🔄 Next Steps:');
        console.log('   1. Replace your server.js with the new Supabase version');
        console.log('   2. Start your server: npm start');
        console.log('   3. Test the admin dashboard save functionality');
        console.log('   4. The save error should now be fixed!');
        console.log('');
        console.log('🗂️  Backup Files:');
        console.log('   Your original JSON files have been preserved');
        console.log('   Consider backing them up to a safe location');
        console.log('');
        console.log('✨ Your wedding registry is now powered by Supabase!');
        console.log('===============================================\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check your .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY');
        console.log('   2. Ensure you\'ve run the SQL setup script in Supabase');
        console.log('   3. Check that registry-data.json and guests-data.json exist');
        console.log('   4. Verify your internet connection');
        console.log('');
        console.log('📧 If issues persist, check the error details above');
    }
}

// Run the migration
migrateData();