// Setup Guest List Table and Import Sample Guests
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Sample guests for testing (you'll want to replace with real guest list)
const sampleGuests = [
    // Wilson Family - Sam's Side (separate from other Wilsons)
    { name: "Samuel Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Kevin Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Sharon Wilson", family_group: "wilson_sam", side: "groom" },

    // Billcliff Family - Beatrice's Side
    { name: "Beatrice Billcliff", family_group: "billcliff_bea", side: "bride" },
    { name: "Trevor Billcliff", family_group: "billcliff_bea", side: "bride" },
    { name: "Joanna Billcliff", family_group: "billcliff_bea", side: "bride" },

    // Test family for RSVP
    { name: "John Smith", family_group: "smith", side: "groom" },
    { name: "Jane Smith", family_group: "smith", side: "groom" },

    // Other guests
    { name: "Chris Thompson", family_group: "thompson", side: "groom" },
    { name: "Lisa Thompson", family_group: "thompson", side: "groom" },
    { name: "Mark Taylor", family_group: "taylor", side: "bride" },
    { name: "Amy Taylor", family_group: "taylor", side: "bride" },
];

function normalizeName(name) {
    return name.toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ');
}

async function main() {
    console.log('🎊 Guest List Setup');
    console.log('====================\n');

    // First try to check if table exists by inserting a test record
    console.log('📋 Checking if guest_list table exists...');

    const { data: checkData, error: checkError } = await supabase
        .from('guest_list')
        .select('count')
        .limit(1);

    if (checkError) {
        console.log('\n❌ guest_list table does not exist.');
        console.log('\n📝 Please run this SQL in your Supabase Dashboard SQL Editor:\n');
        console.log(`
-- Create the guest_list table
CREATE TABLE IF NOT EXISTS guest_list (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    family_group TEXT NOT NULL,
    side TEXT DEFAULT 'both',
    has_rsvped BOOLEAN DEFAULT false,
    rsvp_response TEXT,
    rsvp_guest_count INTEGER DEFAULT 1,
    rsvp_dietary TEXT,
    rsvp_message TEXT,
    rsvp_date TIMESTAMP WITH TIME ZONE,
    rsvp_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guest_list_normalized_name ON guest_list(normalized_name);
CREATE INDEX IF NOT EXISTS idx_guest_list_family_group ON guest_list(family_group);

-- Enable RLS
ALTER TABLE guest_list ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (for RSVP)
CREATE POLICY "Allow public read" ON guest_list FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON guest_list FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON guest_list FOR INSERT WITH CHECK (true);
        `);
        process.exit(1);
    }

    console.log('✅ Table exists!\n');

    // Clear existing data
    console.log('🗑️  Clearing existing guest data...');
    const { error: deleteError } = await supabase
        .from('guest_list')
        .delete()
        .neq('id', 0);

    if (deleteError) {
        console.log('Note:', deleteError.message);
    }

    // Insert sample guests
    console.log('👥 Inserting sample guests...');

    const guestsWithNormalized = sampleGuests.map(g => ({
        name: g.name,
        normalized_name: normalizeName(g.name),
        family_group: g.family_group,
        side: g.side,
        has_rsvped: false
    }));

    const { data: inserted, error: insertError } = await supabase
        .from('guest_list')
        .insert(guestsWithNormalized)
        .select();

    if (insertError) {
        console.error('❌ Insert error:', insertError);
        process.exit(1);
    }

    console.log(`\n✅ Successfully imported ${inserted.length} guests!\n`);

    // Show summary
    console.log('📊 Guest Summary:');
    console.log(`   Total: ${inserted.length}`);
    console.log(`   Bride's side: ${inserted.filter(g => g.side === 'bride').length}`);
    console.log(`   Groom's side: ${inserted.filter(g => g.side === 'groom').length}`);

    const families = [...new Set(inserted.map(g => g.family_group))];
    console.log(`   Family groups: ${families.length} (${families.join(', ')})`);

    console.log('\n✅ Setup complete! You can now test the guest list auth flow.');
}

main().catch(console.error);
