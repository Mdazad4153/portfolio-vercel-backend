const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (cert) => ({
    id: cert.id,
    _id: cert.id,
    title: cert.title,
    issuer: cert.issuer,
    date: cert.date,
    credentialUrl: cert.credential_url,
    description: cert.description,
    order: cert.order,
    createdAt: cert.created_at,
    updatedAt: cert.updated_at
});

// @route   GET /api/certificates
// @desc    Get all certificates (public)
router.get('/', async (req, res) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certificates')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(certificates.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/certificates/all
// @desc    Get all certificates (admin)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certificates')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        res.json(certificates.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/certificates/:id
// @desc    Get single certificate
router.get('/:id', async (req, res) => {
    try {
        const { data: cert, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!cert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        res.json(toCamelCase(cert));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/certificates
// @desc    Create certificate
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, issuer, date, credentialUrl, description, order } = req.body;

        const { data: cert, error } = await supabase
            .from('certificates')
            .insert({
                title,
                issuer,
                date: date || null,
                credential_url: credentialUrl || '',
                description: description || '',
                order: order || 0
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(toCamelCase(cert));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/certificates/:id
// @desc    Update certificate
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, issuer, date, credentialUrl, description, order } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (issuer !== undefined) updateData.issuer = issuer;
        if (date !== undefined) updateData.date = date;
        if (credentialUrl !== undefined) updateData.credential_url = credentialUrl;
        if (description !== undefined) updateData.description = description;
        if (order !== undefined) updateData.order = order;

        const { data: cert, error } = await supabase
            .from('certificates')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!cert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        res.json(toCamelCase(cert));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/certificates/:id
// @desc    Delete certificate
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('certificates')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
