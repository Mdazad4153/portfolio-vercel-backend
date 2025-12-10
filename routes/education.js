const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (edu) => ({
    id: edu.id,
    _id: edu.id,
    institution: edu.institution,
    degree: edu.degree,
    field: edu.field,
    startYear: edu.start_year,
    endYear: edu.end_year,
    websiteUrl: edu.website_url,
    grade: edu.grade,
    description: edu.description,
    isCurrent: edu.is_current,
    order: edu.order,
    isVisible: edu.is_visible,
    createdAt: edu.created_at,
    updatedAt: edu.updated_at
});

// @route   GET /api/education
// @desc    Get all visible education (public)
router.get('/', async (req, res) => {
    try {
        const { data: education, error } = await supabase
            .from('education')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(education.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/education/all
// @desc    Get all education (admin)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const { data: education, error } = await supabase
            .from('education')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(education.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/education/:id
// @desc    Get single education
router.get('/:id', async (req, res) => {
    try {
        const { data: edu, error } = await supabase
            .from('education')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!edu) {
            return res.status(404).json({ message: 'Education not found' });
        }

        res.json(toCamelCase(edu));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/education
// @desc    Create education
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { institution, degree, field, startYear, endYear, websiteUrl, grade, description, isCurrent, order, isVisible } = req.body;

        const { data: edu, error } = await supabase
            .from('education')
            .insert({
                institution,
                degree,
                field,
                start_year: startYear,
                end_year: endYear || 'Present',
                website_url: websiteUrl || '',
                grade: grade || '',
                description: description || '',
                is_current: isCurrent || false,
                order: order || 0,
                is_visible: isVisible !== undefined ? isVisible : true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(edu));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/education/:id
// @desc    Update education
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { institution, degree, field, startYear, endYear, websiteUrl, grade, description, isCurrent, order, isVisible } = req.body;

        const updateData = {};
        if (institution !== undefined) updateData.institution = institution;
        if (degree !== undefined) updateData.degree = degree;
        if (field !== undefined) updateData.field = field;
        if (startYear !== undefined) updateData.start_year = startYear;
        if (endYear !== undefined) updateData.end_year = endYear;
        if (websiteUrl !== undefined) updateData.website_url = websiteUrl;
        if (grade !== undefined) updateData.grade = grade;
        if (description !== undefined) updateData.description = description;
        if (isCurrent !== undefined) updateData.is_current = isCurrent;
        if (order !== undefined) updateData.order = order;
        if (isVisible !== undefined) updateData.is_visible = isVisible;

        const { data: edu, error } = await supabase
            .from('education')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!edu) {
            return res.status(404).json({ message: 'Education not found' });
        }

        res.json(toCamelCase(edu));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/education/:id
// @desc    Delete education
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('education')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Education deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
