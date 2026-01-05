const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function createGuestbookTable() {
    console.log('Checking guestbook table...');

    const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .limit(1);

    if (error && error.code === '42P01') {
        console.log('\n❌ Table does not exist. Please create it in Supabase dashboard:\n');
        console.log('Go to: https://supabase.com/dashboard/project/ypxbekwomfqfokzfoasz/sql\n');
        console.log('Run this SQL:\n');
        console.log(`
CREATE TABLE guestbook (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow public read" ON guestbook FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "Allow public insert" ON guestbook FOR INSERT WITH CHECK (true);

-- Allow delete (for admin)
CREATE POLICY "Allow delete" ON guestbook FOR DELETE USING (true);
`);
    } else if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('✅ Guestbook table already exists!');
        console.log('Entries:', data?.length || 0);
    }
}

createGuestbookTable();
