const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (skill) => ({
    id: skill.id,
    _id: skill.id, // For frontend compatibility
    name: skill.name,
    category: skill.category,
    proficiency: skill.proficiency,
    icon: skill.icon,
    order: skill.order,
    isVisible: skill.is_visible,
    createdAt: skill.created_at,
    updatedAt: skill.updated_at
});

// @route   GET /api/skills
// @desc    Get all visible skills (public)
router.get('/', async (req, res) => {
    try {
        const { data: skills, error } = await supabase
            .from('skills')
            .select('*')
            .eq('is_visible', true)
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(skills.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/skills/all
// @desc    Get all skills including hidden (admin)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const { data: skills, error } = await supabase
            .from('skills')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(skills.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/skills/:id
// @desc    Get single skill
router.get('/:id', async (req, res) => {
    try {
        const { data: skill, error } = await supabase
            .from('skills')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        res.json(toCamelCase(skill));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/skills
// @desc    Create skill
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, category, proficiency, icon, order, isVisible } = req.body;

        const { data: skill, error } = await supabase
            .from('skills')
            .insert({
                name,
                category: category || 'other',
                proficiency: proficiency || 50,
                icon: icon || '',
                order: order || 0,
                is_visible: isVisible !== undefined ? isVisible : true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(skill));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/skills/:id
// @desc    Update skill
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, category, proficiency, icon, order, isVisible } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (proficiency !== undefined) updateData.proficiency = proficiency;
        if (icon !== undefined) updateData.icon = icon;
        if (order !== undefined) updateData.order = order;
        if (isVisible !== undefined) updateData.is_visible = isVisible;

        const { data: skill, error } = await supabase
            .from('skills')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        res.json(toCamelCase(skill));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/skills/:id
// @desc    Delete skill
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('skills')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
