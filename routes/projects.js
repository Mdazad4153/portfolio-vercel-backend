const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to convert snake_case to camelCase
const toCamelCase = (project) => ({
    id: project.id,
    _id: project.id,
    title: project.title,
    description: project.description,
    longDescription: project.long_description,
    image: project.image,
    images: project.images,
    technologies: project.technologies,
    category: project.category,
    liveUrl: project.live_url,
    githubUrl: project.github_url,
    featured: project.featured,
    order: project.order,
    isVisible: project.is_visible,
    views: project.views,
    completedDate: project.completed_date,
    createdAt: project.created_at,
    updatedAt: project.updated_at
});

// @route   GET /api/projects
// @desc    Get all visible projects (public)
router.get('/', async (req, res) => {
    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('is_visible', true)
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(projects.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/projects/all
// @desc    Get all projects (admin)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(projects.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/projects/:id
// @desc    Get single project (with view counter)
router.get('/:id', async (req, res) => {
    try {
        // Get current project
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Increment view counter
        await supabase
            .from('projects')
            .update({ views: (project.views || 0) + 1 })
            .eq('id', req.params.id);

        res.json(toCamelCase(project));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/projects
// @desc    Create project
router.post('/', authMiddleware, upload.single('projectImage'), async (req, res) => {
    try {
        const { title, description, longDescription, technologies, category, liveUrl, githubUrl, featured, order, isVisible, completedDate } = req.body;

        const image = req.file ? `/uploads/projects/${req.file.filename}` : (req.body.image || '');
        const techs = typeof technologies === 'string' ? technologies.split(',').map(t => t.trim()).filter(t => t) : (technologies || []);

        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                title,
                description,
                long_description: longDescription || '',
                image,
                images: [],
                technologies: techs,
                category: category || 'web',
                live_url: liveUrl || '',
                github_url: githubUrl || '',
                featured: featured === 'true' || featured === true,
                order: order || 0,
                is_visible: isVisible !== undefined ? (isVisible === 'true' || isVisible === true) : true,
                views: 0,
                completed_date: completedDate || new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(project));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/projects/:id
// @desc    Update project
router.put('/:id', authMiddleware, upload.single('projectImage'), async (req, res) => {
    try {
        const { title, description, longDescription, technologies, category, liveUrl, githubUrl, featured, order, isVisible, completedDate } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (longDescription !== undefined) updateData.long_description = longDescription;
        if (req.file) updateData.image = `/uploads/projects/${req.file.filename}`;
        // if (images !== undefined) updateData.images = images; 
        if (technologies !== undefined) updateData.technologies = typeof technologies === 'string' ? technologies.split(',').map(t => t.trim()).filter(t => t) : technologies;
        if (category !== undefined) updateData.category = category;
        if (liveUrl !== undefined) updateData.live_url = liveUrl;
        if (githubUrl !== undefined) updateData.github_url = githubUrl;
        if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
        if (order !== undefined) updateData.order = order;
        if (isVisible !== undefined) updateData.is_visible = isVisible === 'true' || isVisible === true;
        if (completedDate !== undefined) updateData.completed_date = completedDate;

        const { data: project, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(toCamelCase(project));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
