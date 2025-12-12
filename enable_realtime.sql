-- ===========================================
-- ENABLE SUPABASE REALTIME ON ALL TABLES
-- ===========================================
-- Run this SQL in Supabase SQL Editor to enable real-time updates
-- This allows the frontend to receive live updates when data changes

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable realtime for skills table
ALTER PUBLICATION supabase_realtime ADD TABLE skills;

-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- Enable realtime for education table
ALTER PUBLICATION supabase_realtime ADD TABLE education;

-- Enable realtime for services table
ALTER PUBLICATION supabase_realtime ADD TABLE services;

-- Enable realtime for certificates table
ALTER PUBLICATION supabase_realtime ADD TABLE certificates;

-- Enable realtime for contacts table (for messages)
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- ===========================================
-- VERIFY REALTIME IS ENABLED
-- ===========================================
-- Run this query to verify which tables have realtime enabled:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
