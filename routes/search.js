const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// @route   GET /api/search
// @desc    Search across all content
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }

        const searchTerm = q.toLowerCase().trim();

        // Search in projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id, title, description, category, technologies')
            .eq('is_visible', true);

        const matchedProjects = (projects || []).filter(p =>
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            (p.technologies && p.technologies.some(t => t.toLowerCase().includes(searchTerm)))
        ).map(p => ({
            id: p.id,
            type: 'project',
            title: p.title,
            description: p.description.substring(0, 100) + '...',
            category: p.category
        }));

        // Search in skills
        const { data: skills } = await supabase
            .from('skills')
            .select('id, name, category')
            .eq('is_visible', true);

        const matchedSkills = (skills || []).filter(s =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.category.toLowerCase().includes(searchTerm)
        ).map(s => ({
            id: s.id,
            type: 'skill',
            title: s.name,
            category: s.category
        }));

        // Search in blogs
        const { data: blogs } = await supabase
            .from('blogs')
            .select('id, title, excerpt, slug, category')
            .eq('is_published', true)
            .eq('is_visible', true);

        const matchedBlogs = (blogs || []).filter(b =>
            b.title.toLowerCase().includes(searchTerm) ||
            b.excerpt.toLowerCase().includes(searchTerm)
        ).map(b => ({
            id: b.id,
            type: 'blog',
            title: b.title,
            description: b.excerpt.substring(0, 100) + '...',
            slug: b.slug,
            category: b.category
        }));

        // Search in certificates
        const { data: certificates } = await supabase
            .from('certificates')
            .select('id, title, issuer, description');

        const matchedCertificates = (certificates || []).filter(c =>
            c.title.toLowerCase().includes(searchTerm) ||
            c.issuer.toLowerCase().includes(searchTerm) ||
            (c.description && c.description.toLowerCase().includes(searchTerm))
        ).map(c => ({
            id: c.id,
            type: 'certificate',
            title: c.title,
            issuer: c.issuer
        }));

        // Search in services
        const { data: services } = await supabase
            .from('services')
            .select('id, title, description')
            .eq('is_visible', true);

        const matchedServices = (services || []).filter(s =>
            s.title.toLowerCase().includes(searchTerm) ||
            s.description.toLowerCase().includes(searchTerm)
        ).map(s => ({
            id: s.id,
            type: 'service',
            title: s.title,
            description: s.description.substring(0, 100) + '...'
        }));

        const results = {
            query: q,
            totalResults: matchedProjects.length + matchedSkills.length + matchedBlogs.length +
                matchedCertificates.length + matchedServices.length,
            results: {
                projects: matchedProjects,
                skills: matchedSkills,
                blogs: matchedBlogs,
                certificates: matchedCertificates,
                services: matchedServices
            }
        };

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
});

module.exports = router;
