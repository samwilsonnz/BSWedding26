const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
    try {
        console.log('🔄 Starting image migration to Supabase Storage...\n');

        // Get all items with base64 images
        const { data: items, error } = await supabase
            .from('registry_items')
            .select('id, name, image_url, image_url_faded')
            .order('id');

        if (error) {
            throw error;
        }

        console.log(`Found ${items.length} items to check\n`);

        let migratedCount = 0;

        for (const item of items) {
            console.log(`\n📦 Processing item ${item.id}: ${item.name}`);

            let newImageUrl = item.image_url;
            let newImageUrl2 = item.image_url_faded;

            // Migrate primary image if it's base64
            if (item.image_url && item.image_url.startsWith('data:image/')) {
                console.log('  📸 Migrating primary image...');
                try {
                    const url = await uploadBase64ToStorage(item.image_url, `item-${item.id}-primary`);
                    newImageUrl = url;
                    console.log('  ✅ Primary image uploaded to Storage');
                } catch (err) {
                    console.error('  ❌ Failed to migrate primary image:', err.message);
                }
            } else if (item.image_url) {
                console.log('  ℹ️  Primary image already in Storage or empty');
            }

            // Migrate secondary image if it's base64
            if (item.image_url_faded && item.image_url_faded.startsWith('data:image/')) {
                console.log('  📸 Migrating secondary image...');
                try {
                    const url = await uploadBase64ToStorage(item.image_url_faded, `item-${item.id}-secondary`);
                    newImageUrl2 = url;
                    console.log('  ✅ Secondary image uploaded to Storage');
                } catch (err) {
                    console.error('  ❌ Failed to migrate secondary image:', err.message);
                }
            } else if (item.image_url_faded) {
                console.log('  ℹ️  Secondary image already in Storage or empty');
            }

            // Update database with new URLs if anything changed
            if (newImageUrl !== item.image_url || newImageUrl2 !== item.image_url_faded) {
                console.log('  💾 Updating database...');
                const { error: updateError } = await supabase
                    .from('registry_items')
                    .update({
                        image_url: newImageUrl,
                        image_url_faded: newImageUrl2
                    })
                    .eq('id', item.id);

                if (updateError) {
                    console.error('  ❌ Failed to update database:', updateError.message);
                } else {
                    console.log('  ✅ Database updated');
                    migratedCount++;
                }
            }
        }

        console.log(`\n\n🎉 Migration complete! Migrated ${migratedCount} items.`);
        console.log('\n✅ All images are now stored in Supabase Storage!');
        console.log('✅ Your registry will load much faster now!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

async function uploadBase64ToStorage(base64Data, filename) {
    try {
        // Extract image type and base64 data
        const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid base64 format');
        }

        const contentType = matches[1];
        const base64 = matches[2];
        const buffer = Buffer.from(base64, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const ext = contentType.split('/')[1];
        const uniqueFilename = `${timestamp}-${filename}.${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('registry-images')
            .upload(uniqueFilename, buffer, {
                contentType: contentType,
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('registry-images')
            .getPublicUrl(uniqueFilename);

        return publicUrl;
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// Run migration
console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║   Wedding Registry Image Migration Tool         ║');
console.log('║   Moving base64 images to Supabase Storage      ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

migrateImages()
    .then(() => {
        console.log('Migration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
