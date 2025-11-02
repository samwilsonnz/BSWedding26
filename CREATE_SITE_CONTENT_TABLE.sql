-- Site Content Table for Wedding Registry
-- This stores all editable text content for the wedding website

CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    content_key VARCHAR(100) UNIQUE NOT NULL,
    content_value TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    section VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_site_content_key ON site_content(content_key);
CREATE INDEX idx_site_content_section ON site_content(section);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access (guests can view)
CREATE POLICY "Allow public read access to site content"
ON site_content FOR SELECT TO public USING (true);

-- Allow admin updates (you'll need to set up admin authentication)
CREATE POLICY "Allow admin updates to site content"
ON site_content FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow admin insert to site content"
ON site_content FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default content values
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
-- Hero Section
('hero_title', 'Samuel & Beatrice', 'text', 'hero', 'Main title on hero section'),
('hero_date', 'March 14th, 2026', 'text', 'hero', 'Wedding date display'),
('hero_location', 'Christchurch, New Zealand', 'text', 'hero', 'Wedding location'),
('hero_subtitle', 'Join us as we celebrate our love', 'text', 'hero', 'Hero subtitle text'),

-- About Section
('about_title', 'Our Love Story', 'text', 'about', 'About section title'),
('about_text', 'Samuel and Beatrice met in [year] and have been inseparable ever since. Join us as we celebrate our love and commitment to each other on our special day.', 'textarea', 'about', 'About section main text'),

-- Schedule Section
('schedule_title', 'Wedding Day Schedule', 'text', 'schedule', 'Schedule section title'),
('schedule_ceremony_time', '2:00 PM', 'text', 'schedule', 'Ceremony time'),
('schedule_ceremony_title', 'Ceremony', 'text', 'schedule', 'Ceremony title'),
('schedule_ceremony_desc', 'Join us for our wedding ceremony', 'text', 'schedule', 'Ceremony description'),
('schedule_reception_time', '5:00 PM', 'text', 'schedule', 'Reception time'),
('schedule_reception_title', 'Reception', 'text', 'schedule', 'Reception title'),
('schedule_reception_desc', 'Dinner, drinks, and dancing to follow', 'text', 'schedule', 'Reception description'),
('schedule_venue_name', 'TBC - Venue Name', 'text', 'schedule', 'Venue name'),
('schedule_venue_address', 'Address TBC', 'text', 'schedule', 'Venue address'),

-- Accommodation Section
('accommodation_title', 'Accommodation & Travel', 'text', 'accommodation', 'Accommodation section title'),
('accommodation_hotels_title', 'Recommended Hotels', 'text', 'accommodation', 'Hotels subsection title'),
('accommodation_hotels_text', 'Hotels TBC - Details coming soon', 'textarea', 'accommodation', 'Hotel recommendations'),
('accommodation_airport_title', 'Getting There', 'text', 'accommodation', 'Airport info title'),
('accommodation_airport_name', 'Christchurch International Airport (CHC)', 'text', 'accommodation', 'Airport name'),
('accommodation_airport_distance', 'Approximately 20-30 minutes drive', 'text', 'accommodation', 'Airport distance'),
('accommodation_parking_title', 'Parking', 'text', 'accommodation', 'Parking section title'),
('accommodation_parking_text', 'TBC - Details coming soon', 'text', 'accommodation', 'Parking details'),

-- FAQ Section
('faq_title', 'Frequently Asked Questions', 'text', 'faq', 'FAQ section title'),
('faq_rsvp_q', 'When is the RSVP deadline?', 'text', 'faq', 'RSVP question'),
('faq_rsvp_a', 'Please RSVP by February 14th, 2026. You can RSVP using the form on this website or by contacting us directly.', 'textarea', 'faq', 'RSVP answer'),
('faq_attire_q', 'What should I wear?', 'text', 'faq', 'Attire question'),
('faq_attire_a', 'The dress code is semi-formal/cocktail attire. Think dressy but comfortable - you''ll want to dance the night away!', 'textarea', 'faq', 'Attire answer'),
('faq_kids_q', 'Are children welcome?', 'text', 'faq', 'Children question'),
('faq_kids_a', 'We love your little ones, but we''ve decided to make our wedding an adults-only celebration. We hope this gives you a chance to enjoy a night off!', 'textarea', 'faq', 'Children answer'),
('faq_diet_q', 'What about dietary requirements?', 'text', 'faq', 'Diet question'),
('faq_diet_a', 'Please let us know about any dietary restrictions or allergies when you RSVP. We''ll work with our caterer to accommodate your needs.', 'textarea', 'faq', 'Diet answer'),
('faq_plus_q', 'Can I bring a plus-one?', 'text', 'faq', 'Plus one question'),
('faq_plus_a', 'Due to venue capacity, we can only accommodate guests formally invited. If you have a plus-one, it will be indicated on your invitation.', 'textarea', 'faq', 'Plus one answer'),
('faq_photos_q', 'Will there be a photographer?', 'text', 'faq', 'Photos question'),
('faq_photos_a', 'Yes! We''ll have a professional photographer. We''d love for you to be present in the moment, but feel free to take photos during the reception. Please share them in our gallery!', 'textarea', 'faq', 'Photos answer'),
('faq_gifts_q', 'What about gifts?', 'text', 'faq', 'Gifts question'),
('faq_gifts_a', 'Your presence is the best present! If you wish to give a gift, we''ve set up a registry on this website for your convenience.', 'textarea', 'faq', 'Gifts answer'),
('faq_contact_q', 'How can I contact you with questions?', 'text', 'faq', 'Contact question'),
('faq_contact_a', 'Feel free to reach out to us directly via email or phone. We''re happy to help with any questions!', 'textarea', 'faq', 'Contact answer'),
('faq_dance_q', 'Will there be dancing?', 'text', 'faq', 'Dancing question'),
('faq_dance_a', 'Absolutely! We''ll have music and a dance floor. Get ready to dance the night away with us!', 'textarea', 'faq', 'Dancing answer'),

-- Registry Section
('registry_title', 'Wedding Registry', 'text', 'registry', 'Registry section title'),
('registry_subtitle', 'Your presence means the world to us', 'text', 'registry', 'Registry subtitle'),
('registry_description', 'If you wish to honor us with a gift, we''ve created a registry below. Every contribution helps us start our new life together.', 'textarea', 'registry', 'Registry description'),

-- Gallery Section
('gallery_title', 'Photo Gallery', 'text', 'gallery', 'Gallery section title'),
('gallery_subtitle', 'Share your memories with us', 'text', 'gallery', 'Gallery subtitle'),
('gallery_upload_text', 'Upload your photos from the wedding', 'text', 'gallery', 'Upload button text')

ON CONFLICT (content_key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_content_updated_at_trigger
    BEFORE UPDATE ON site_content
    FOR EACH ROW
    EXECUTE FUNCTION update_site_content_updated_at();
