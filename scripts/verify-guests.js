require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function verify() {
    const { data: guests, error } = await supabase.from("guest_list").select("*").order("family_group");
    if (error) { console.error("Error:", error); return; }

    console.log("✅ Total guests:", guests.length);

    // Check for duplicates
    const names = guests.map(g => g.name.toLowerCase().trim());
    const counts = {};
    names.forEach(n => counts[n] = (counts[n] || 0) + 1);
    const dups = Object.entries(counts).filter(([k,v]) => v > 1);

    if (dups.length > 0) {
        console.log("⚠️  Still have duplicates:", dups.length);
        dups.forEach(([name, count]) => console.log("   ", name, ":", count, "times"));
    } else {
        console.log("✅ No duplicates!");
    }

    // Show family groupings
    const byFamily = {};
    guests.forEach(g => {
        if (!byFamily[g.family_group]) byFamily[g.family_group] = [];
        byFamily[g.family_group].push(g.name);
    });

    console.log("\n📋 Family Groups (" + Object.keys(byFamily).length + " total):");
    Object.keys(byFamily).sort().forEach(fam => {
        console.log("  " + fam + ": " + byFamily[fam].join(", "));
    });
}
verify();
