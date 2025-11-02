-- Create RSVPs table for wedding guests
CREATE TABLE IF NOT EXISTS rsvps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    attending VARCHAR(10) NOT NULL CHECK (attending IN ('yes', 'no', 'maybe')),
    guest_count INTEGER DEFAULT 1,
    dietary_restrictions TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_rsvps_attending ON rsvps(attending);
CREATE INDEX idx_rsvps_created_at ON rsvps(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert RSVPs (guests can RSVP)
CREATE POLICY "Allow public RSVP submissions"
ON rsvps FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read RSVPs (for admin panel)
CREATE POLICY "Allow reading RSVPs"
ON rsvps FOR SELECT
TO public
USING (true);

-- Allow updates (for editing RSVPs)
CREATE POLICY "Allow updating RSVPs"
ON rsvps FOR UPDATE
TO public
USING (true);

-- Allow deletes (for admin)
CREATE POLICY "Allow deleting RSVPs"
ON rsvps FOR DELETE
TO public
USING (true);
