-- ADD ALL EDITABLE CONTENT KEYS TO DATABASE
-- Run this in Supabase SQL Editor to enable all text editing via admin

-- ===========================================
-- ABOUT SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('about_title', 'Our Love Story', 'text', 'about', 'About Section Title'),
('about_text_1', 'We are thrilled to share this special moment with you! Samuel and Beatrice are excited to begin their journey together as husband and wife, and we couldn''t imagine celebrating without our closest family and friends.', 'textarea', 'about', 'First Paragraph'),
('about_text_2', 'Our love story is one of adventure, laughter, and endless support for one another. From our first meeting to this moment, every step has brought us closer together.', 'textarea', 'about', 'Second Paragraph'),
('about_text_3', 'Thank you for being part of our lives and our celebration. Your presence means everything to us.', 'textarea', 'about', 'Third Paragraph')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- SCHEDULE SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('schedule_title', 'Wedding Day Schedule', 'text', 'schedule', 'Schedule Section Title'),
('schedule_ceremony_title', 'Ceremony', 'text', 'schedule', 'Ceremony Event Title'),
('schedule_ceremony_time', '2:00 PM', 'text', 'schedule', 'Ceremony Time'),
('schedule_ceremony_desc', 'Join us as we exchange our vows and begin our journey together. The ceremony will be held in a beautiful outdoor setting.', 'textarea', 'schedule', 'Ceremony Description'),
('schedule_cocktail_title', 'Cocktail Hour', 'text', 'schedule', 'Cocktail Hour Title'),
('schedule_cocktail_time', '3:30 PM', 'text', 'schedule', 'Cocktail Hour Time'),
('schedule_cocktail_desc', 'Enjoy drinks and hors d''oeuvres while we take photos. Mingle with other guests and celebrate!', 'textarea', 'schedule', 'Cocktail Hour Description'),
('schedule_reception_title', 'Reception', 'text', 'schedule', 'Reception Title'),
('schedule_reception_time', '5:00 PM', 'text', 'schedule', 'Reception Time'),
('schedule_reception_desc', 'Dinner, speeches, and celebration! We''ll share our first dance and cut the cake together.', 'textarea', 'schedule', 'Reception Description'),
('schedule_dancing_title', 'Dancing & Party', 'text', 'schedule', 'Dancing Event Title'),
('schedule_dancing_time', '7:00 PM', 'text', 'schedule', 'Dancing Time'),
('schedule_dancing_desc', 'Let''s dance the night away! The dance floor will be open and the party continues late into the evening.', 'textarea', 'schedule', 'Dancing Description')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- ACCOMMODATION SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('accommodation_title', 'Accommodation & Travel', 'text', 'accommodation', 'Accommodation Section Title'),
('accommodation_intro', 'We want to make sure you have a comfortable stay! Here are some accommodation options near our venue.', 'textarea', 'accommodation', 'Accommodation Introduction Text')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- FAQ SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('faq_title', 'Frequently Asked Questions', 'text', 'faq', 'FAQ Section Title')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- REGISTRY SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('registry_title', 'Wedding Registry', 'text', 'registry', 'Registry Section Title'),
('registry_description', 'Thank you for being part of our special day! Instead of traditional gifts, we''ve created this registry where you can contribute towards items that will help us build our new home together. Every contribution, no matter the size, means the world to us and brings us one step closer to our dreams.', 'textarea', 'registry', 'Registry Introduction Text')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- GALLERY SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('gallery_title', 'Our Photo Gallery', 'text', 'gallery', 'Gallery Section Title'),
('gallery_upload_btn', 'Share Your Photos', 'text', 'gallery', 'Upload Button Text'),
('gallery_upload_desc', 'Help us capture memories from the celebration', 'text', 'gallery', 'Upload Description'),
('gallery_upload_info', 'Photos are automatically optimized for fast uploads', 'text', 'gallery', 'Upload Info Text'),
('gallery_placeholder', 'No photos yet. Be the first to share!', 'text', 'gallery', 'Empty Gallery Placeholder')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- FOOTER SECTION
-- ===========================================
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
('footer_message', 'Thank you for celebrating with us!', 'text', 'footer', 'Footer Thank You Message'),
('footer_names', 'Samuel & Beatrice', 'text', 'footer', 'Couple Names'),
('footer_copyright', 'Made with love | © 2026', 'text', 'footer', 'Copyright Text')
ON CONFLICT (content_key) DO UPDATE SET
    content_value = EXCLUDED.content_value,
    content_type = EXCLUDED.content_type,
    section = EXCLUDED.section,
    description = EXCLUDED.description;

-- ===========================================
-- VERIFICATION
-- ===========================================
SELECT content_key, section, description, LEFT(content_value, 40) as preview
FROM site_content
ORDER BY section, content_key;
