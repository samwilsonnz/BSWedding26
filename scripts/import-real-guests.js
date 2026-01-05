// Import Real Guest List - Sam & Beatrice's Wedding
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Real guest list with proper family groupings
// Total: 71 guests (excludes Beatrice and Samuel - they're getting married!)
const realGuests = [
    // ==========================================
    // WILSON FAMILIES (4 separate groups)
    // ==========================================

    // Wilson Group 1: Ann's family
    { name: "Ann Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "John Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "George Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "Thomas Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "James Wilson", family_group: "wilson_ann", side: "groom" },

    // Wilson Group 2: Peter & Gaynor
    { name: "Peter Wilson", family_group: "wilson_peter", side: "groom" },
    { name: "Gaynor Wilson", family_group: "wilson_peter", side: "groom" },

    // Wilson Group 3: Mark's family
    { name: "Mark Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Amelia Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Carlos Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Zach Wilson", family_group: "wilson_mark", side: "groom" },

    // Wilson Group 4: Kent's family
    { name: "Kent Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Felicity Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Hadley Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Olivia Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Jonty Wilson", family_group: "wilson_kent", side: "groom" },

    // ==========================================
    // KANE FAMILIES (2 separate groups)
    // ==========================================

    // Kane Group 1: Wendy & John
    { name: "Wendy Kane", family_group: "kane_wendy", side: "groom" },
    { name: "John Kane", family_group: "kane_wendy", side: "groom" },

    // Kane Group 2: Allan & Katie
    { name: "Allan Kane", family_group: "kane_allan", side: "groom" },
    { name: "Katie Kane", family_group: "kane_allan", side: "groom" },

    // ==========================================
    // PUHA FAMILIES (2 separate groups)
    // ==========================================

    // Puha Group 1: Terry & Sara
    { name: "Terry Puha", family_group: "puha_terry", side: "groom" },
    { name: "Sara Puha", family_group: "puha_terry", side: "groom" },

    // Puha Group 2: Denis & Stacy
    { name: "Denis Puha", family_group: "puha_denis", side: "groom" },
    { name: "Stacy Puha", family_group: "puha_denis", side: "groom" },

    // ==========================================
    // BILLCLIFF FAMILIES (5 separate groups)
    // ==========================================

    // Billcliff Group 1: Ross (solo)
    { name: "Ross Billcliff", family_group: "billcliff_ross", side: "bride" },

    // Billcliff Group 2: Marty & Catherine
    { name: "Marty Billcliff", family_group: "billcliff_marty", side: "bride" },
    { name: "Catherine Billcliff", family_group: "billcliff_marty", side: "bride" },

    // Billcliff Group 3: Derek & Louise
    { name: "Derek Billcliff", family_group: "billcliff_derek", side: "bride" },
    { name: "Louise Billcliff", family_group: "billcliff_derek", side: "bride" },

    // Billcliff Group 4: Edward & Lydia Hau
    { name: "Edward Billcliff", family_group: "billcliff_edward", side: "bride" },
    { name: "Lydia Hau", family_group: "billcliff_edward", side: "bride" },

    // Billcliff Group 5: Kirsten & Brent (Beatrice's parents)
    { name: "Kirsten Billcliff", family_group: "billcliff_parents", side: "bride" },
    { name: "Brent Billcliff", family_group: "billcliff_parents", side: "bride" },

    // ==========================================
    // SPECIFIED COUPLES (mixed surnames)
    // ==========================================

    // Sam Utting & Zara Thompson
    { name: "Sam Utting", family_group: "utting_thompson", side: "groom" },
    { name: "Zara Thompson", family_group: "utting_thompson", side: "groom" },

    // Cameron Bunz & Poppy Stavrou
    { name: "Cameron Bunz", family_group: "bunz_stavrou", side: "groom" },
    { name: "Poppy Stavrou", family_group: "bunz_stavrou", side: "groom" },

    // Stewart & Kathryn Griffiths
    { name: "Stewart Griffiths", family_group: "griffiths", side: "groom" },
    { name: "Kathryn Griffiths", family_group: "griffiths", side: "groom" },

    // Cherie & Kevin Burgess
    { name: "Cherie Burgess", family_group: "burgess", side: "bride" },
    { name: "Kevin Burgess", family_group: "burgess", side: "bride" },

    // ==========================================
    // AUTO-GROUPED BY SAME SURNAME
    // ==========================================

    // Nuttall family
    { name: "David Nuttall", family_group: "nuttall", side: "groom" },
    { name: "Lisa Nuttall", family_group: "nuttall", side: "groom" },

    // Woods family
    { name: "Tony Woods", family_group: "woods", side: "groom" },
    { name: "Vicky Woods", family_group: "woods", side: "groom" },

    // Salisbury family
    { name: "John Salisbury", family_group: "salisbury", side: "groom" },
    { name: "Katrina Salisbury", family_group: "salisbury", side: "groom" },

    // Hopper family
    { name: "Brendon Hopper", family_group: "hopper", side: "groom" },
    { name: "Ruth Hopper", family_group: "hopper", side: "groom" },

    // O'Bery family
    { name: "Tyrone O'Bery", family_group: "obery", side: "groom" },
    { name: "Kelly O'Bery", family_group: "obery", side: "groom" },

    // Holah family
    { name: "Scott Holah", family_group: "holah", side: "groom" },
    { name: "Jo Holah", family_group: "holah", side: "groom" },

    // Slade family
    { name: "Simon Slade", family_group: "slade", side: "groom" },
    { name: "Sarah Slade", family_group: "slade", side: "groom" },

    // Winders family
    { name: "Ross Winders", family_group: "winders", side: "groom" },
    { name: "Sarah Winders", family_group: "winders", side: "groom" },

    // Shore family
    { name: "Michael Shore", family_group: "shore", side: "bride" },
    { name: "Michelle Shore", family_group: "shore", side: "bride" },

    // McCarthy family
    { name: "Scott McCarthy", family_group: "mccarthy", side: "bride" },
    { name: "Tash McCarthy", family_group: "mccarthy", side: "bride" },

    // Miller family
    { name: "Wayne Miller", family_group: "miller", side: "bride" },
    { name: "Nicole Miller", family_group: "miller", side: "bride" },

    // ==========================================
    // SOLO GUESTS
    // ==========================================
    { name: "Anneke Veenis-Petzer", family_group: "veenis_petzer", side: "groom" },
    { name: "Jenny Taylor", family_group: "taylor_jenny", side: "bride" },
    { name: "Michael Burson", family_group: "burson", side: "groom" },
    { name: "Zach Wain", family_group: "wain", side: "groom" },
    { name: "Cameron Boag", family_group: "boag", side: "groom" },
    { name: "Sofia Kennedy", family_group: "kennedy", side: "bride" },
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
    console.log('🎊 Importing Real Guest List');
    console.log('============================\n');

    // Check if table exists
    console.log('📋 Checking guest_list table...');
    const { data: checkData, error: checkError } = await supabase
        .from('guest_list')
        .select('count')
        .limit(1);

    if (checkError) {
        console.error('❌ guest_list table not found. Please run the SQL migration first.');
        console.log('See: scripts/guest-list-table.sql');
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

    // Insert real guests
    console.log('👥 Inserting real guests...');

    const guestsWithNormalized = realGuests.map(g => ({
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
    console.log(`   Total Guests: ${inserted.length}`);
    console.log(`   Bride's side: ${inserted.filter(g => g.side === 'bride').length}`);
    console.log(`   Groom's side: ${inserted.filter(g => g.side === 'groom').length}`);

    const families = [...new Set(inserted.map(g => g.family_group))];
    console.log(`   Family groups: ${families.length}`);

    // Group breakdown
    console.log('\n📋 Family Group Breakdown:');

    const groupCounts = {};
    inserted.forEach(g => {
        if (!groupCounts[g.family_group]) {
            groupCounts[g.family_group] = [];
        }
        groupCounts[g.family_group].push(g.name);
    });

    // Wilson families
    console.log('\n   Wilson Families (4 separate):');
    Object.keys(groupCounts).filter(k => k.startsWith('wilson')).forEach(k => {
        console.log(`     - ${k}: ${groupCounts[k].join(', ')}`);
    });

    // Kane families
    console.log('\n   Kane Families (2 separate):');
    Object.keys(groupCounts).filter(k => k.startsWith('kane')).forEach(k => {
        console.log(`     - ${k}: ${groupCounts[k].join(', ')}`);
    });

    // Puha families
    console.log('\n   Puha Families (2 separate):');
    Object.keys(groupCounts).filter(k => k.startsWith('puha')).forEach(k => {
        console.log(`     - ${k}: ${groupCounts[k].join(', ')}`);
    });

    // Billcliff families
    console.log('\n   Billcliff Families (5 separate):');
    Object.keys(groupCounts).filter(k => k.startsWith('billcliff')).forEach(k => {
        console.log(`     - ${k}: ${groupCounts[k].join(', ')}`);
    });

    // Others
    console.log('\n   Other Groups:');
    Object.keys(groupCounts)
        .filter(k => !k.startsWith('wilson') && !k.startsWith('kane') && !k.startsWith('puha') && !k.startsWith('billcliff'))
        .forEach(k => {
            console.log(`     - ${k}: ${groupCounts[k].join(', ')}`);
        });

    console.log('\n✅ Import complete! Ready for RSVPs.');
}

main().catch(console.error);
