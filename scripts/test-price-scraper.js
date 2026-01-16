// Test price scraper for NZ retail stores
const axios = require('axios');
const cheerio = require('cheerio');

// Test URLs from the registry
const testUrls = [
    { name: 'Briscoes - Sandwich Press', url: 'https://www.briscoes.co.nz/product/1108611/breville-sandwich-press-toast-melt-2-slice-lsg525bss/' },
    { name: 'The Warehouse - Ironing Board', url: 'https://www.thewarehouse.co.nz/p/living-co-ironing-board-plain-assorted/R2883224.html' },
    { name: 'Harvey Norman - KitchenAid', url: 'https://www.harveynorman.co.nz/home-appliances/kitchen-appliances/mixers/kitchenaid-ksm195-artisan-stand-mixer-almond-cream.html' },
    { name: 'PB Tech - HomePod', url: 'https://www.pbtech.co.nz/product/SPKAPP10012/Apple-HomePod-Mini-Smart-Home-WiFi-Speaker---White' },
    { name: 'JB Hi-Fi - Kettle', url: 'https://www.jbhifi.co.nz/products/breville-the-tempset-kettle-cream' },
    { name: 'Kmart - Glasses', url: 'https://www.kmart.co.nz/product/6-everyday-hiball-glasses-42998877/' },
    { name: 'Bunnings - BBQ', url: 'https://www.bunnings.co.nz/jumbuck-1621mm-black-4-burner-griddle-bbq_p0587773' },
    { name: 'Noel Leeming - Espresso', url: 'https://www.noelleeming.co.nz/p/breville-barista-express-espresso-machine/N121455.html' },
];

// Price extraction patterns for each store
const storePatterns = {
    'briscoes.co.nz': {
        selectors: ['.price-sales', '.product-price', '[data-price]', '.price', '.was-price-now'],
        regex: /\$[\d,]+\.?\d*/
    },
    'thewarehouse.co.nz': {
        selectors: ['.price-value', '.product-price', '[data-product-price]', '.price'],
        regex: /\$[\d,]+\.?\d*/
    },
    'harveynorman.co.nz': {
        selectors: ['.price-now', '.product-price', '.price', '[data-price]'],
        regex: /\$[\d,]+\.?\d*/
    },
    'pbtech.co.nz': {
        selectors: ['.price_current', '.ginc', '.price', '[data-price]'],
        regex: /\$[\d,]+\.?\d*/
    },
    'jbhifi.co.nz': {
        selectors: ['.price', '.product-price', '[data-product-price]'],
        regex: /\$[\d,]+\.?\d*/
    },
    'kmart.co.nz': {
        selectors: ['.ProductCard_price', '.price', '[data-price]'],
        regex: /\$[\d,]+\.?\d*/
    },
    'bunnings.co.nz': {
        selectors: ['.price', '.product-price', '[data-price]'],
        regex: /\$[\d,]+\.?\d*/
    },
    'noelleeming.co.nz': {
        selectors: ['.price-primary', '.price', '[data-price]'],
        regex: /\$[\d,]+\.?\d*/
    },
    'farmers.co.nz': {
        selectors: ['.price', '.product-price', '[data-price]'],
        regex: /\$[\d,]+\.?\d*/
    }
};

async function scrapePrice(url) {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const patterns = storePatterns[hostname];

        if (!patterns) {
            return { success: false, error: 'No pattern for store: ' + hostname };
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-NZ,en;q=0.9',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Try each selector
        for (const selector of patterns.selectors) {
            const element = $(selector).first();
            if (element.length) {
                const text = element.text().trim();
                const priceMatch = text.match(patterns.regex);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[0].replace('$', '').replace(',', ''));
                    return { success: true, price, priceText: priceMatch[0], selector };
                }
            }
        }

        // Try to find any price in the page
        const bodyText = $('body').text();
        const allPrices = bodyText.match(/\$\d{1,4}(?:\.\d{2})?/g);
        if (allPrices && allPrices.length > 0) {
            return { success: true, price: parseFloat(allPrices[0].replace('$', '')), priceText: allPrices[0], note: 'Found via regex fallback' };
        }

        return { success: false, error: 'Price not found in HTML' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testAllUrls() {
    console.log('Testing price scraper for NZ stores...\n');

    for (const item of testUrls) {
        console.log(`${item.name}`);
        console.log(`  URL: ${item.url.substring(0, 60)}...`);

        const result = await scrapePrice(item.url);

        if (result.success) {
            console.log(`  ✅ Price: ${result.priceText} ${result.note || ''}`);
        } else {
            console.log(`  ❌ Failed: ${result.error}`);
        }
        console.log('');
    }
}

testAllUrls();
