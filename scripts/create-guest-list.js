// Create Guest List Table and Import Guests
// Run with: DATABASE_URL="..." npx tsx scripts/create-guest-list.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Guest list with family groupings
// family_group is used to determine who can RSVP for each other
// Guests with same family_group can RSVP for each other
// Special families (Wilson, Billcliff, Puha, Kane) have separate family_groups
const guests = [
    // === WILSON FAMILY - Sam's Side (family_group: wilson_sam) ===
    { name: "Samuel Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Kevin Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Sharon Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Joshua Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Paul Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Angela Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Daniel Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Emma Wilson", family_group: "wilson_sam", side: "groom" },
    { name: "Matthew Wilson", family_group: "wilson_sam", side: "groom" },

    // === WILSON FAMILY - Other (family_group: wilson_other) ===
    { name: "Graeme Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Mary Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Sarah Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Michael Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Rebecca Wilson", family_group: "wilson_other", side: "groom" },
    { name: "James Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Emily Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Thomas Wilson", family_group: "wilson_other", side: "groom" },
    { name: "Lucy Wilson", family_group: "wilson_other", side: "groom" },

    // === BILLCLIFF FAMILY - Beatrice's Immediate (family_group: billcliff_bea) ===
    { name: "Beatrice Billcliff", family_group: "billcliff_bea", side: "bride" },
    { name: "Trevor Billcliff", family_group: "billcliff_bea", side: "bride" },
    { name: "Joanna Billcliff", family_group: "billcliff_bea", side: "bride" },
    { name: "Olivia Billcliff", family_group: "billcliff_bea", side: "bride" },
    { name: "Sophie Billcliff", family_group: "billcliff_bea", side: "bride" },

    // === BILLCLIFF FAMILY - Extended (family_group: billcliff_ext) ===
    { name: "Richard Billcliff", family_group: "billcliff_ext", side: "bride" },
    { name: "Christine Billcliff", family_group: "billcliff_ext", side: "bride" },
    { name: "Andrew Billcliff", family_group: "billcliff_ext", side: "bride" },
    { name: "Jennifer Billcliff", family_group: "billcliff_ext", side: "bride" },
    { name: "David Billcliff", family_group: "billcliff_ext", side: "bride" },

    // === PUHA FAMILY 1 (family_group: puha_1) ===
    { name: "Tane Puha", family_group: "puha_1", side: "bride" },
    { name: "Aroha Puha", family_group: "puha_1", side: "bride" },

    // === PUHA FAMILY 2 (family_group: puha_2) ===
    { name: "Wiremu Puha", family_group: "puha_2", side: "bride" },
    { name: "Mere Puha", family_group: "puha_2", side: "bride" },

    // === KANE FAMILY 1 (family_group: kane_1) ===
    { name: "Patrick Kane", family_group: "kane_1", side: "groom" },
    { name: "Margaret Kane", family_group: "kane_1", side: "groom" },

    // === KANE FAMILY 2 (family_group: kane_2) ===
    { name: "Sean Kane", family_group: "kane_2", side: "groom" },
    { name: "Siobhan Kane", family_group: "kane_2", side: "groom" },

    // === MILLER FAMILY (family_group: miller) ===
    { name: "John Miller", family_group: "miller", side: "groom" },
    { name: "Susan Miller", family_group: "miller", side: "groom" },
    { name: "Rachel Miller", family_group: "miller", side: "groom" },
    { name: "Ben Miller", family_group: "miller", side: "groom" },

    // === OTHER GUESTS (each with unique family groups based on surname) ===
    { name: "Chris Thompson", family_group: "thompson", side: "groom" },
    { name: "Lisa Thompson", family_group: "thompson", side: "groom" },

    { name: "Mark Taylor", family_group: "taylor", side: "bride" },
    { name: "Amy Taylor", family_group: "taylor", side: "bride" },

    { name: "James Brown", family_group: "brown", side: "groom" },
    { name: "Sarah Brown", family_group: "brown", side: "groom" },

    { name: "David Jones", family_group: "jones", side: "bride" },
    { name: "Michelle Jones", family_group: "jones", side: "bride" },

    { name: "Ryan Davis", family_group: "davis", side: "groom" },
    { name: "Kate Davis", family_group: "davis", side: "groom" },

    { name: "Tom Anderson", family_group: "anderson", side: "bride" },
    { name: "Emma Anderson", family_group: "anderson", side: "bride" },

    { name: "Peter White", family_group: "white", side: "groom" },
    { name: "Laura White", family_group: "white", side: "groom" },

    { name: "Robert Harris", family_group: "harris", side: "bride" },
    { name: "Claire Harris", family_group: "harris", side: "bride" },

    { name: "Steve Clark", family_group: "clark", side: "groom" },
    { name: "Jenny Clark", family_group: "clark", side: "groom" },

    { name: "Mike Lewis", family_group: "lewis", side: "bride" },
    { name: "Anna Lewis", family_group: "lewis", side: "bride" },

    { name: "Dan Walker", family_group: "walker", side: "groom" },
    { name: "Sophie Walker", family_group: "walker", side: "groom" },

    { name: "Alex Green", family_group: "green", side: "bride" },
    { name: "Olivia Green", family_group: "green", side: "bride" },

    { name: "Nick Hall", family_group: "hall", side: "groom" },

    { name: "Jessica Young", family_group: "young", side: "bride" },

    { name: "Matt King", family_group: "king", side: "groom" },

    { name: "Hannah Scott", family_group: "scott", side: "bride" },
];

async function createGuestListTable() {
    console.log('Creating guest_list table...');

    // First check if table exists by trying to query it
    const { data: existingData, error: checkError } = await supabase
        .from('guest_list')
        .select('count')
        .limit(1);

    if (checkError && checkError.code === '42P01') {
        console.log('Table does not exist, creating via SQL...');
        // Table doesn't exist - we'll need to create it via Supabase dashboard
        // or use raw SQL if we have access
        console.log(`
======================================
PLEASE CREATE THE TABLE IN SUPABASE:
======================================

Go to Supabase Dashboard -> SQL Editor and run:

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

CREATE INDEX IF NOT EXISTS idx_guest_list_normalized_name ON guest_list(normalized_name);
CREATE INDEX IF NOT EXISTS idx_guest_list_family_group ON guest_list(family_group);

======================================
`);
        return false;
    }

    console.log('Table exists or can be accessed.');
    return true;
}

function normalizeName(name) {
    return name.toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z\s]/g, '') // Remove non-letters
        .replace(/\s+/g, ' '); // Normalize whitespace
}

async function importGuests() {
    console.log(`\nImporting ${guests.length} guests...`);

    // Clear existing guests first
    const { error: deleteError } = await supabase
        .from('guest_list')
        .delete()
        .neq('id', 0); // Delete all

    if (deleteError) {
        console.log('Note: Could not clear existing guests (table may be empty):', deleteError.message);
    }

    // Insert guests with normalized names
    const guestsWithNormalized = guests.map(g => ({
        name: g.name,
        normalized_name: normalizeName(g.name),
        family_group: g.family_group,
        side: g.side || 'both',
        has_rsvped: false,
        rsvp_response: null,
        rsvp_guest_count: 1,
        rsvp_dietary: null,
        rsvp_message: null,
        rsvp_date: null,
        rsvp_by: null
    }));

    const { data, error } = await supabase
        .from('guest_list')
        .insert(guestsWithNormalized)
        .select();

    if (error) {
        console.error('Error importing guests:', error);
        return false;
    }

    console.log(`✅ Successfully imported ${data.length} guests!`);

    // Show summary
    const familyGroups = [...new Set(guests.map(g => g.family_group))];
    console.log(`\n📊 Guest List Summary:`);
    console.log(`   Total guests: ${guests.length}`);
    console.log(`   Family groups: ${familyGroups.length}`);
    console.log(`   Bride's side: ${guests.filter(g => g.side === 'bride').length}`);
    console.log(`   Groom's side: ${guests.filter(g => g.side === 'groom').length}`);

    // Show special families
    console.log(`\n🏠 Special Family Groups (separate RSVPs):`);
    console.log(`   Wilson (Sam): ${guests.filter(g => g.family_group === 'wilson_sam').length} guests`);
    console.log(`   Wilson (Other): ${guests.filter(g => g.family_group === 'wilson_other').length} guests`);
    console.log(`   Billcliff (Bea): ${guests.filter(g => g.family_group === 'billcliff_bea').length} guests`);
    console.log(`   Billcliff (Ext): ${guests.filter(g => g.family_group === 'billcliff_ext').length} guests`);
    console.log(`   Puha 1: ${guests.filter(g => g.family_group === 'puha_1').length} guests`);
    console.log(`   Puha 2: ${guests.filter(g => g.family_group === 'puha_2').length} guests`);
    console.log(`   Kane 1: ${guests.filter(g => g.family_group === 'kane_1').length} guests`);
    console.log(`   Kane 2: ${guests.filter(g => g.family_group === 'kane_2').length} guests`);

    return true;
}

async function main() {
    console.log('🎊 Guest List Setup Script');
    console.log('==========================\n');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
        process.exit(1);
    }

    const tableReady = await createGuestListTable();

    if (!tableReady) {
        console.log('\n⚠️  Please create the table first, then run this script again.');
        process.exit(1);
    }

    const imported = await importGuests();

    if (imported) {
        console.log('\n✅ Guest list setup complete!');
        console.log('\nNext steps:');
        console.log('1. Update server.js with guest list API endpoints');
        console.log('2. Update index.html with new auth flow');
        console.log('3. Test the guest lookup functionality');
    } else {
        console.log('\n❌ Guest list setup failed.');
        process.exit(1);
    }
}

main().catch(console.error);
