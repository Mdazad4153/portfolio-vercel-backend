const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (service) => ({
    id: service.id,
    _id: service.id,
    title: service.title,
    description: service.description,
    icon: service.icon,
    features: service.features,
    price: service.price,
    order: service.order,
    isVisible: service.is_visible,
    createdAt: service.created_at,
    updatedAt: service.updated_at
});

// @route   GET /api/services
// @desc    Get all visible services (public)
router.get('/', async (req, res) => {
    try {
        const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .eq('is_visible', true)
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(services.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/services/all
// @desc    Get all services (admin)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(services.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/services/:id
// @desc    Get single service
router.get('/:id', async (req, res) => {
    try {
        const { data: service, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(toCamelCase(service));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/services
// @desc    Create service
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, icon, features, price, order, isVisible } = req.body;

        const { data: service, error } = await supabase
            .from('services')
            .insert({
                title,
                description,
                icon: icon || 'code',
                features: features || [],
                price: price || '',
                order: order || 0,
                is_visible: isVisible !== undefined ? isVisible : true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(service));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/services/:id
// @desc    Update service
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, icon, features, price, order, isVisible } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (features !== undefined) updateData.features = features;
        if (price !== undefined) updateData.price = price;
        if (order !== undefined) updateData.order = order;
        if (isVisible !== undefined) updateData.is_visible = isVisible;

        const { data: service, error } = await supabase
            .from('services')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(toCamelCase(service));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/services/:id
// @desc    Delete service
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
