// Check gift ordering
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkOrder() {
    const { data: items } = await supabase.from("registry_items").select("*");

    // Apply same sort logic as frontend
    items.sort((a, b) => {
        const aIsHoneymoon = a.name && a.name.toLowerCase().includes('honeymoon');
        const bIsHoneymoon = b.name && b.name.toLowerCase().includes('honeymoon');
        const aIsGiftCard = (a.name && a.name.toLowerCase().includes('gift card')) || a.category === 'Gift Cards';
        const bIsGiftCard = (b.name && b.name.toLowerCase().includes('gift card')) || b.category === 'Gift Cards';
        const aCompleted = a.has_target && a.current_amount >= a.target_amount;
        const bCompleted = b.has_target && b.current_amount >= b.target_amount;

        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        if (aIsHoneymoon && !bIsHoneymoon) return -1;
        if (!aIsHoneymoon && bIsHoneymoon) return 1;
        if (aIsGiftCard && !bIsGiftCard) return -1;
        if (!aIsGiftCard && bIsGiftCard) return 1;
        const aPrice = a.has_target ? a.target_amount : 999999;
        const bPrice = b.has_target ? b.target_amount : 999999;
        return aPrice - bPrice;
    });

    console.log('GIFT ORDER (as it will display):\n');
    items.forEach((item, i) => {
        const tag = item.name.toLowerCase().includes('honeymoon') ? '🌴 HONEYMOON' :
                    item.name.toLowerCase().includes('gift card') ? '🎁 GIFT CARD' :
                    (item.has_target && item.current_amount >= item.target_amount) ? '✅ COMPLETED' : '';
        const price = item.target_amount ? '$' + item.target_amount : 'Any';
        console.log((i+1).toString().padStart(2) + '. ' + item.name.substring(0,32).padEnd(33) + price.padStart(8) + '  ' + tag);
    });
}

checkOrder();
