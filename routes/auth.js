const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper function to generate JWT token
const generateToken = (admin) => {
    return jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register admin (first time only)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if admin already exists
        const { data: existingAdmin } = await supabase
            .from('admins')
            .select('id')
            .limit(1);

        if (existingAdmin && existingAdmin.length > 0) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const { data: admin, error } = await supabase
            .from('admins')
            .insert({
                email,
                password: hashedPassword,
                name: name || 'Admin'
            })
            .select()
            .single();

        if (error) throw error;

        const token = generateToken(admin);

        res.status(201).json({
            message: 'Admin created successfully',
            token,
            admin: { id: admin.id, email: admin.email, name: admin.name }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if locked
        if (admin.lock_until && new Date(admin.lock_until) > new Date()) {
            const waitSeconds = Math.ceil((new Date(admin.lock_until) - new Date()) / 1000);
            return res.status(403).json({ message: `Account locked. Try again in ${waitSeconds} seconds.` });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            // Increment login attempts
            const newAttempts = (admin.login_attempts || 0) + 1;

            // Check if max attempts reached (3)
            if (newAttempts >= 3) {
                const lockUntil = new Date(Date.now() + 30 * 1000); // Lock for 30 seconds
                await supabase
                    .from('admins')
                    .update({ login_attempts: 0, lock_until: lockUntil.toISOString() })
                    .eq('id', admin.id);
                return res.status(403).json({ message: 'Account locked for 30 seconds due to too many failed attempts.' });
            }

            await supabase
                .from('admins')
                .update({ login_attempts: newAttempts })
                .eq('id', admin.id);

            return res.status(400).json({ message: `Invalid credentials. Attempt ${newAttempts} of 3.` });
        }

        // Login successful - Reset lock info and update last login
        await supabase
            .from('admins')
            .update({
                login_attempts: 0,
                lock_until: null,
                last_login: new Date().toISOString()
            })
            .eq('id', admin.id);

        const token = generateToken(admin);

        res.json({
            message: 'Login successful',
            token,
            admin: { id: admin.id, email: admin.email, name: admin.name }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current admin
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id, email, name, last_login, created_at')
            .eq('id', req.admin.id)
            .single();

        if (error) throw error;

        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change admin password
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get admin with password
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', req.admin.id)
            .single();

        if (error) throw error;

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await supabase
            .from('admins')
            .update({ password: hashedPassword })
            .eq('id', req.admin.id);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using secret code
router.post('/reset-password', async (req, res) => {
    try {
        const { email, secretCode, newPassword } = req.body;
        const SECRET_CODE = process.env.PASSWORD_RESET_SECRET || '41534153';

        // Find admin by email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (secretCode !== SECRET_CODE) {
            return res.status(400).json({ message: 'Invalid secret code' });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await supabase
            .from('admins')
            .update({
                password: hashedPassword,
                login_attempts: 0,
                lock_until: null
            })
            .eq('id', admin.id);

        res.json({ message: 'Password reset successfully. Please login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
