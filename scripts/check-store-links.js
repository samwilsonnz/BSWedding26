require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getStoreLinks() {
    const { data, error } = await supabase.from("registry_items").select("name, store_link, target_amount").order("name");
    if (error) { console.error("Error:", error); return; }
    if (!data || data.length === 0) { console.log("No items found"); return; }

    console.log("Items with store links:\n");
    data.filter(i => i.store_link).forEach(i => {
        console.log(i.name);
        console.log("  Link: " + i.store_link);
        console.log("  Current price: $" + i.target_amount);
        console.log("");
    });

    console.log("\nStores used:");
    const stores = [...new Set(data.filter(i => i.store_link).map(i => {
        try { return new URL(i.store_link).hostname; } catch(e) { return "invalid"; }
    }))];
    stores.forEach(s => console.log("  - " + s));
}
getStoreLinks();
