const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/backup
// @desc    Export all data as JSON
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Fetch all data from all tables
        const [
            { data: profiles },
            { data: skills },
            { data: education },
            { data: projects },
            { data: certificates },
            { data: services },
            { data: blogs },
            { data: testimonials },
            { data: contacts },
            { data: settings }
        ] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('skills').select('*'),
            supabase.from('education').select('*'),
            supabase.from('projects').select('*'),
            supabase.from('certificates').select('*'),
            supabase.from('services').select('*'),
            supabase.from('blogs').select('*'),
            supabase.from('testimonials').select('*'),
            supabase.from('contacts').select('*'),
            supabase.from('settings').select('*')
        ]);

        const backup = {
            exportedAt: new Date().toISOString(),
            version: '3.0.0',
            database: 'Supabase',
            data: {
                profile: profiles && profiles.length > 0 ? profiles[0] : null,
                skills: skills || [],
                education: education || [],
                projects: projects || [],
                certificates: certificates || [],
                services: services || [],
                blogs: blogs || [],
                testimonials: testimonials || [],
                contacts: contacts || [],
                settings: settings && settings.length > 0 ? settings[0] : null
            }
        };

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=portfolio-backup-${new Date().toISOString().split('T')[0]}.json`);

        res.json(backup);
    } catch (error) {
        res.status(500).json({ message: 'Backup failed', error: error.message });
    }
});

// @route   GET /api/backup/stats
// @desc    Get backup stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [
            { count: profiles },
            { count: skills },
            { count: education },
            { count: projects },
            { count: certificates },
            { count: services },
            { count: blogs },
            { count: testimonials },
            { count: contacts }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('skills').select('*', { count: 'exact', head: true }),
            supabase.from('education').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('certificates').select('*', { count: 'exact', head: true }),
            supabase.from('services').select('*', { count: 'exact', head: true }),
            supabase.from('blogs').select('*', { count: 'exact', head: true }),
            supabase.from('testimonials').select('*', { count: 'exact', head: true }),
            supabase.from('contacts').select('*', { count: 'exact', head: true })
        ]);

        res.json({
            totalRecords: (profiles || 0) + (skills || 0) + (education || 0) + (projects || 0) +
                (certificates || 0) + (services || 0) + (blogs || 0) + (testimonials || 0) + (contacts || 0),
            breakdown: {
                profiles: profiles || 0,
                skills: skills || 0,
                education: education || 0,
                projects: projects || 0,
                certificates: certificates || 0,
                services: services || 0,
                blogs: blogs || 0,
                testimonials: testimonials || 0,
                contacts: contacts || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get stats', error: error.message });
    }
});

module.exports = router;
