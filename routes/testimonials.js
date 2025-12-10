const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (testimonial) => ({
    id: testimonial.id,
    _id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    company: testimonial.company,
    image: testimonial.image,
    content: testimonial.content,
    rating: testimonial.rating,
    order: testimonial.order,
    isVisible: testimonial.is_visible,
    createdAt: testimonial.created_at,
    updatedAt: testimonial.updated_at
});

// @route   GET /api/testimonials
// @desc    Get all testimonials
router.get('/', async (req, res) => {
    try {
        const { data: testimonials, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(testimonials.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/testimonials/:id
// @desc    Get single testimonial
router.get('/:id', async (req, res) => {
    try {
        const { data: testimonial, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        res.json(toCamelCase(testimonial));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/testimonials
// @desc    Create testimonial
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, role, company, image, content, rating, order, isVisible } = req.body;

        const { data: testimonial, error } = await supabase
            .from('testimonials')
            .insert({
                name,
                role: role || '',
                company: company || '',
                image: image || '',
                content,
                rating: rating || 5,
                order: order || 0,
                is_visible: isVisible !== undefined ? isVisible : true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(testimonial));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/testimonials/:id
// @desc    Update testimonial
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, role, company, image, content, rating, order, isVisible } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (company !== undefined) updateData.company = company;
        if (image !== undefined) updateData.image = image;
        if (content !== undefined) updateData.content = content;
        if (rating !== undefined) updateData.rating = rating;
        if (order !== undefined) updateData.order = order;
        if (isVisible !== undefined) updateData.is_visible = isVisible;

        const { data: testimonial, error } = await supabase
            .from('testimonials')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        res.json(toCamelCase(testimonial));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete testimonial
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('testimonials')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
