-- Guest List Table for Wedding Registry
-- Run this in Supabase SQL Editor

-- Create the guest_list table
CREATE TABLE IF NOT EXISTS guest_list (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    family_group TEXT NOT NULL,
    side TEXT DEFAULT 'both',
    has_rsvped BOOLEAN DEFAULT false,
    rsvp_response TEXT, -- 'yes', 'no', 'maybe'
    rsvp_guest_count INTEGER DEFAULT 1,
    rsvp_dietary TEXT,
    rsvp_message TEXT,
    rsvp_date TIMESTAMP WITH TIME ZONE,
    rsvp_by TEXT, -- Name of person who submitted RSVP (for family RSVPs)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_guest_list_normalized_name ON guest_list(normalized_name);
CREATE INDEX IF NOT EXISTS idx_guest_list_family_group ON guest_list(family_group);
CREATE INDEX IF NOT EXISTS idx_guest_list_has_rsvped ON guest_list(has_rsvped);

-- Enable Row Level Security (RLS)
ALTER TABLE guest_list ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for guest lookup)
CREATE POLICY "Allow public read access" ON guest_list
    FOR SELECT USING (true);

-- Allow public insert/update for RSVP submissions
CREATE POLICY "Allow public update for RSVP" ON guest_list
    FOR UPDATE USING (true);

-- Show success message
SELECT 'Guest list table created successfully!' as status;
