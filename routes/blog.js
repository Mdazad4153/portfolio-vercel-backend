const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (blog) => ({
    id: blog.id,
    _id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImage: blog.cover_image,
    category: blog.category,
    tags: blog.tags,
    views: blog.views,
    likes: blog.likes,
    isPublished: blog.is_published,
    publishedAt: blog.published_at,
    isVisible: blog.is_visible,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at
});

// Helper to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

// @route   GET /api/blog
// @desc    Get all blogs
router.get('/', async (req, res) => {
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(blogs.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/blog/:slug
// @desc    Get single blog by slug
router.get('/:slug', async (req, res) => {
    try {
        const { data: blog, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('slug', req.params.slug)
            .single();

        if (error) throw error;
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Increment view counter
        await supabase
            .from('blogs')
            .update({ views: (blog.views || 0) + 1 })
            .eq('id', blog.id);

        res.json(toCamelCase(blog));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/blog
// @desc    Create blog
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, excerpt, content, coverImage, category, tags, isPublished, isVisible } = req.body;

        const slug = generateSlug(title);

        const { data: blog, error } = await supabase
            .from('blogs')
            .insert({
                title,
                slug,
                excerpt,
                content,
                cover_image: coverImage || '',
                category: category || 'General',
                tags: tags || [],
                views: 0,
                likes: 0,
                is_published: isPublished || false,
                published_at: isPublished ? new Date().toISOString() : null,
                is_visible: isVisible !== undefined ? isVisible : true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(blog));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/blog/:id
// @desc    Update blog
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, excerpt, content, coverImage, category, tags, isPublished, isVisible } = req.body;

        const updateData = {};
        if (title !== undefined) {
            updateData.title = title;
            updateData.slug = generateSlug(title);
        }
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (content !== undefined) updateData.content = content;
        if (coverImage !== undefined) updateData.cover_image = coverImage;
        if (category !== undefined) updateData.category = category;
        if (tags !== undefined) updateData.tags = tags;
        if (isPublished !== undefined) {
            updateData.is_published = isPublished;
            if (isPublished) updateData.published_at = new Date().toISOString();
        }
        if (isVisible !== undefined) updateData.is_visible = isVisible;

        const { data: blog, error } = await supabase
            .from('blogs')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.json(toCamelCase(blog));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/blog/:id/like
// @desc    Like a blog
router.post('/:id/like', async (req, res) => {
    try {
        // Get current blog
        const { data: blog, error: fetchError } = await supabase
            .from('blogs')
            .select('likes')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        // Increment likes
        const { data: updatedBlog, error } = await supabase
            .from('blogs')
            .update({ likes: (blog.likes || 0) + 1 })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json(toCamelCase(updatedBlog));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/blog/:id
// @desc    Delete blog
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
