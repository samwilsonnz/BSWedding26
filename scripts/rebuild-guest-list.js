// Rebuild guest list from Notion - EXACT names
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Full guest list from Notion (excluding bride & groom)
const guests = [
    // Billcliff Parents
    { name: "Kirsten Billcliff", family_group: "billcliff_parents", side: "bride" },
    { name: "Brent Billcliff", family_group: "billcliff_parents", side: "bride" },

    // Edward & Lydia
    { name: "Edward Billcliff", family_group: "billcliff_edward", side: "bride" },
    { name: "Lydia Hau", family_group: "billcliff_edward", side: "bride" },

    // Ann Wilson's family
    { name: "Ann Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "John Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "James Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "Thomas Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "George Wilson", family_group: "wilson_ann", side: "groom" },

    // Solo - Anneke
    { name: "Anneke Veenis-Petzer", family_group: "veenis_petzer", side: "groom" },

    // Nuttall family
    { name: "Jasmine Nuttall", family_group: "nuttall", side: "groom" },
    { name: "Elisha Nuttall", family_group: "nuttall", side: "groom" },

    // Cameron Bunz & Poppy Stavrou
    { name: "Cameron Bunz", family_group: "bunz_stavrou", side: "groom" },
    { name: "Poppy Stavrou", family_group: "bunz_stavrou", side: "groom" },

    // Griffiths
    { name: "Stewart Griffiths", family_group: "griffiths", side: "groom" },
    { name: "Kathryn Griffiths", family_group: "griffiths", side: "groom" },

    // Solo - Jenny Taylor
    { name: "Jenny Taylor", family_group: "taylor_jenny", side: "bride" },

    // Solo - Ross Billcliff
    { name: "Ross Billcliff", family_group: "billcliff_ross", side: "bride" },

    // Burgess
    { name: "Cherie Burgess", family_group: "burgess", side: "bride" },
    { name: "Kevin Burgess", family_group: "burgess", side: "bride" },

    // Marty & Catherine Billcliff
    { name: "Marty Billcliff", family_group: "billcliff_marty", side: "bride" },
    { name: "Catherine Billcliff", family_group: "billcliff_marty", side: "bride" },

    // Derek & Louise Billcliff
    { name: "Derek Billcliff", family_group: "billcliff_derek", side: "bride" },
    { name: "Louise Billcliff", family_group: "billcliff_derek", side: "bride" },

    // Woods
    { name: "Emma Woods", family_group: "woods", side: "groom" },
    { name: "Duncan Woods", family_group: "woods", side: "groom" },

    // Peter & Gaynor Wilson
    { name: "Gaynor Wilson", family_group: "wilson_peter", side: "groom" },
    { name: "Peter Wilson", family_group: "wilson_peter", side: "groom" },

    // Kane - Wendy & John
    { name: "Wendy Kane", family_group: "kane_wendy", side: "groom" },
    { name: "John Kane", family_group: "kane_wendy", side: "groom" },

    // Mark Wilson's family
    { name: "Mark Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Amelia Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Zach Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Carlos Wilson", family_group: "wilson_mark", side: "groom" },

    // Kent Wilson's family
    { name: "Kent Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Felicity Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Hadley Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Olivia Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Jonty Wilson", family_group: "wilson_kent", side: "groom" },

    // Kane - Allan & Katie
    { name: "Allan Kane", family_group: "kane_allan", side: "groom" },
    { name: "Katie Kane", family_group: "kane_allan", side: "groom" },

    // Salisbury
    { name: "Sierra Salisbury", family_group: "salisbury", side: "groom" },
    { name: "Brian Salisbury", family_group: "salisbury", side: "groom" },

    // Hopper
    { name: "Sam Hopper", family_group: "hopper", side: "groom" },
    { name: "Keagan Hopper", family_group: "hopper", side: "groom" },

    // Solo - Michael Burson
    { name: "Michael Burson", family_group: "burson", side: "groom" },

    // O'Bery
    { name: "Petra O'Bery", family_group: "obery", side: "groom" },
    { name: "Jason O'Bery", family_group: "obery", side: "groom" },

    // Holah
    { name: "Timmy Holah", family_group: "holah", side: "groom" },
    { name: "Sarah Holah", family_group: "holah", side: "groom" },

    // Slade
    { name: "Nick Slade", family_group: "slade", side: "groom" },
    { name: "Anna Slade", family_group: "slade", side: "groom" },

    // Sam Utting & Zara Thompson
    { name: "Sam Utting", family_group: "utting_thompson", side: "groom" },
    { name: "Zara Thompson", family_group: "utting_thompson", side: "groom" },

    // Solo - Zach Wain
    { name: "Zach Wain", family_group: "wain", side: "groom" },

    // Solo - Cameron Boag
    { name: "Cameron Boag", family_group: "boag", side: "groom" },

    // Winders
    { name: "Debbie Winders", family_group: "winders", side: "groom" },
    { name: "Jason Winders", family_group: "winders", side: "groom" },

    // Shore
    { name: "Pam Shore", family_group: "shore", side: "bride" },
    { name: "Scott Shore", family_group: "shore", side: "bride" },

    // McCarthy
    { name: "Rosie McCarthy", family_group: "mccarthy", side: "bride" },
    { name: "Georgia McCarthy", family_group: "mccarthy", side: "bride" },

    // Puha - Denis & Stacey
    { name: "Denis Puha", family_group: "puha_denis", side: "groom" },
    { name: "Stacey Puha", family_group: "puha_denis", side: "groom" },

    // Puha - Terry & Sara
    { name: "Terry Puha", family_group: "puha_terry", side: "groom" },
    { name: "Sara Puha", family_group: "puha_terry", side: "groom" },

    // Miller family
    { name: "Lizzo Miller", family_group: "miller", side: "bride" },
    { name: "Glen Miller", family_group: "miller", side: "bride" },
    { name: "Josh Miller", family_group: "miller", side: "bride" },
    { name: "Sarah Miller", family_group: "miller", side: "bride" },

    // Solo - Sofia Kennedy
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

async function rebuildGuestList() {
    console.log('🔄 Rebuilding guest list from Notion...\n');

    // Clear existing guests
    console.log('🗑️  Clearing existing guests...');
    const { error: deleteError } = await supabase
        .from('guest_list')
        .delete()
        .neq('id', 0);

    if (deleteError) {
        console.error('Delete error:', deleteError);
    }

    // Insert new guests
    console.log('👥 Adding ' + guests.length + ' guests...\n');

    const guestsWithNormalized = guests.map(g => ({
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
        console.error('Insert error:', insertError);
        return;
    }

    console.log('✅ Successfully added ' + inserted.length + ' guests!\n');

    // Show summary
    const byFamily = {};
    inserted.forEach(g => {
        if (!byFamily[g.family_group]) byFamily[g.family_group] = [];
        byFamily[g.family_group].push(g.name);
    });

    console.log('📋 Family Groups (' + Object.keys(byFamily).length + '):');
    Object.keys(byFamily).sort().forEach(fam => {
        console.log('  ' + fam + ': ' + byFamily[fam].join(', '));
    });

    console.log('\n📊 Summary:');
    console.log('  Total: ' + inserted.length);
    console.log('  Bride side: ' + inserted.filter(g => g.side === 'bride').length);
    console.log('  Groom side: ' + inserted.filter(g => g.side === 'groom').length);
}

rebuildGuestList();
