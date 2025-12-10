-- ===========================================
-- SUPABASE SCHEMA FOR PORTFOLIO
-- Run this in Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. ADMINS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT DEFAULT 'Admin',
    last_login TIMESTAMPTZ,
    login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. PROFILES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT DEFAULT 'Md Azad',
    full_name TEXT DEFAULT 'Md Azad Ansari',
    title TEXT DEFAULT 'Computer Science Student',
    tagline TEXT DEFAULT 'Aspiring Software Developer | CSE Student',
    bio TEXT DEFAULT '',
    about TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT 'Chhapra, Bihar, India',
    profile_image TEXT DEFAULT '',
    resume_url TEXT DEFAULT '',
    -- Social Links as JSONB
    social_links JSONB DEFAULT '{
        "github": "",
        "linkedin": "",
        "twitter": "",
        "instagram": "",
        "facebook": "",
        "youtube": "",
        "whatsapp": "",
        "telegram": ""
    }'::jsonb,
    -- Typing texts as array
    typing_texts TEXT[] DEFAULT ARRAY[]::TEXT[],
    -- Stats as JSONB
    stats JSONB DEFAULT '{
        "projectsCompleted": 0,
        "happyClients": 0,
        "yearsExperience": 0,
        "certificatesEarned": 0
    }'::jsonb,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. SKILLS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'other' CHECK (category IN ('frontend', 'backend', 'database', 'tools', 'soft-skills', 'ai', 'office', 'other')),
    proficiency INTEGER DEFAULT 50 CHECK (proficiency >= 0 AND proficiency <= 100),
    icon TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 4. EDUCATION TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT NOT NULL,
    start_year TEXT NOT NULL,
    end_year TEXT DEFAULT 'Present',
    website_url TEXT DEFAULT '',
    grade TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_current BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 5. PROJECTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    technologies TEXT[] DEFAULT ARRAY[]::TEXT[],
    category TEXT DEFAULT 'web' CHECK (category IN ('web', 'mobile', 'desktop', 'api', 'other')),
    live_url TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    featured BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    views INTEGER DEFAULT 0,
    completed_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 6. CERTIFICATES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    date TIMESTAMPTZ,
    credential_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 7. SERVICES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'code',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    price TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 8. BLOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 9. TESTIMONIALS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT DEFAULT '',
    company TEXT DEFAULT '',
    image TEXT DEFAULT '',
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    "order" INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 10. CONTACTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_replied BOOLEAN DEFAULT FALSE,
    reply_message TEXT DEFAULT '',
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 11. SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name TEXT DEFAULT 'Md Azad Portfolio',
    site_description TEXT DEFAULT 'Personal Portfolio Website',
    logo TEXT DEFAULT '',
    favicon TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#6366f1',
    secondary_color TEXT DEFAULT '#8b5cf6',
    accent_color TEXT DEFAULT '#06b6d4',
    default_theme TEXT DEFAULT 'dark' CHECK (default_theme IN ('light', 'dark', 'system')),
    enable_blog BOOLEAN DEFAULT TRUE,
    enable_testimonials BOOLEAN DEFAULT TRUE,
    enable_services BOOLEAN DEFAULT TRUE,
    enable_contact BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    google_analytics_id TEXT DEFAULT '',
    custom_css TEXT DEFAULT '',
    custom_js TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 12. ANALYTICS TABLE (for visitor tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page TEXT NOT NULL,
    visitor_ip TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    referrer TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR BETTER PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_visible ON skills(is_visible);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_visible ON projects(is_visible);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published);
CREATE INDEX IF NOT EXISTS idx_contacts_read ON contacts(is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_page ON analytics(page);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Public read access for portfolio data (except admins, contacts)
CREATE POLICY "Public can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public can view visible skills" ON skills FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view visible education" ON education FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view visible projects" ON projects FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view certificates" ON certificates FOR SELECT USING (true);
CREATE POLICY "Public can view visible services" ON services FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view published blogs" ON blogs FOR SELECT USING (is_published = true AND is_visible = true);
CREATE POLICY "Public can view visible testimonials" ON testimonials FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view settings" ON settings FOR SELECT USING (true);

-- Allow anyone to insert contacts (contact form)
CREATE POLICY "Anyone can submit contact" ON contacts FOR INSERT WITH CHECK (true);

-- Allow service role full access (for admin operations via service key)
CREATE POLICY "Service role full access admins" ON admins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access skills" ON skills FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access education" ON education FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access projects" ON projects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access certificates" ON certificates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access services" ON services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access blogs" ON blogs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access testimonials" ON testimonials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access contacts" ON contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access settings" ON settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access analytics" ON analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Anyone can insert analytics" ON analytics FOR INSERT WITH CHECK (true);

-- ===========================================
-- FUNCTIONS FOR AUTO-UPDATE TIMESTAMPS
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- INSERT DEFAULT DATA
-- ===========================================

-- Insert default profile
INSERT INTO profiles (name, full_name, title, tagline, bio, about, email, is_available)
VALUES (
    'Md Azad',
    'Md Azad Ansari',
    'Computer Science Student',
    'Aspiring Software Developer | CSE Student',
    'Passionate CSE student building things for the web.',
    'I am a Computer Science student passionate about web development and software engineering.',
    '',
    true
) ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (site_name, site_description, default_theme)
VALUES (
    'Md Azad Portfolio',
    'Personal Portfolio Website',
    'dark'
) ON CONFLICT DO NOTHING;

-- ===========================================
-- HELPER FUNCTION: Generate Slug
-- ===========================================
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug for blogs
CREATE OR REPLACE FUNCTION auto_generate_blog_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_auto_slug BEFORE INSERT OR UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION auto_generate_blog_slug();

SELECT 'Schema created successfully!' as status;
