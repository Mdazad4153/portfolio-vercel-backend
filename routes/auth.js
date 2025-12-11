const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper function to generate JWT token
const generateToken = (admin) => {
    return jwt.sign(
        { id: admin.id, email: admin.email, tokenVersion: admin.token_version || 0 },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register a new admin (First time setup or adding more admins)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const { data: existingAdmin, error: searchError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new admin
        const { data: newAdmin, error: insertError } = await supabase
            .from('admins')
            .insert([{
                name,
                email,
                password: hashedPassword,
                role: 'admin'
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // Generate token
        const token = generateToken(newAdmin);

        res.status(201).json({
            message: 'Admin registered successfully',
            token,
            admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login admin & Track Session
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

        // Check for admin
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if account is locked
        if (admin.lock_until && new Date(admin.lock_until) > new Date()) {
            return res.status(403).json({
                message: `Account locked. Try again later.`,
                lockUntil: admin.lock_until
            });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            // Increment logic attempts
            const attempts = (admin.login_attempts || 0) + 1;
            let updateData = { login_attempts: attempts };

            // Lock account after 5 failed attempts
            if (attempts >= 5) {
                updateData.lock_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
            }

            await supabase.from('admins').update(updateData).eq('id', admin.id);

            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Login successful - Reset failures & update last login
        await supabase
            .from('admins')
            .update({
                login_attempts: 0,
                lock_until: null,
                last_login: new Date().toISOString()
            })
            .eq('id', admin.id);

        const token = generateToken(admin);

        // --- SESSION TRACKING START ---
        // Create a hash of the token to identify this session later
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        try {
            // Attempt to insert session (fails silently if table doesn't exist to prevent login break)
            await supabase.from('admin_sessions').insert({
                admin_id: admin.id,
                token_hash: tokenHash,
                ip_address: ip,
                user_agent: userAgent,
                device_info: parseUserAgent(userAgent), // Simple parser helper below
                expires_at: expiresAt.toISOString()
            });
        } catch (sessionErr) {
            console.warn('Session tracking skipped (Table might be missing):', sessionErr.message);
        }
        // --- SESSION TRACKING END ---

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
// @desc    Get current admin info
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id, name, email, role, created_at, last_login')
            .eq('id', req.admin.id)
            .single();

        if (error) throw error;
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/auth/sessions
// @desc    Get active sessions for current admin
router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('admin_sessions')
            .select('*')
            .eq('admin_id', req.admin.id)
            .order('last_active', { ascending: false });

        if (error) {
            // If table doesn't exist, return empty array instead of crashing
            if (error.code === '42P01') return res.json([]);
            throw error;
        }

        res.json(sessions);
    } catch (error) {
        console.error('Session Fetch Error:', error);
        res.status(500).json({
            message: `DB Error: ${error.message} (Code: ${error.code || 'N/A'})`
        });
    }
});

// @desc    Logout sessions (All or others)
router.delete('/sessions', authMiddleware, async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const currentTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        let query = supabase.from('admin_sessions').delete().eq('admin_id', req.admin.id);

        // If 'all' is not true, exclude current session (Logout Others)
        if (req.query.all !== 'true') {
            query = query.neq('token_hash', currentTokenHash);
        }

        const { error } = await query;

        if (error) throw error;

        const msg = req.query.all === 'true'
            ? 'Logged out from all devices successfully'
            : 'All other sessions logged out successfully';

        res.json({ message: msg });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out sessions', error: error.message });
    }
});

// @route   DELETE /api/auth/sessions/:sessionId
// @desc    Revoke a specific session
router.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('admin_sessions')
            .delete()
            .eq('id', req.params.sessionId)
            .eq('admin_id', req.admin.id);

        if (error) throw error;
        res.json({ message: 'Session revoked' });
    } catch (error) {
        res.status(500).json({ message: 'Error revoking session', error: error.message });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change admin password
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', req.admin.id)
            .single();

        if (error) throw error;

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Increment token version to force logout on all devices
        const newTokenVersion = (admin.token_version || 0) + 1;

        await supabase
            .from('admins')
            .update({
                password: hashedPassword,
                token_version: newTokenVersion
            })
            .eq('id', req.admin.id);

        // Also clear all sessions from DB
        await supabase.from('admin_sessions').delete().eq('admin_id', req.admin.id);

        res.json({ message: 'Password changed successfully. All other sessions have been logged out.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Enhanced User-Agent Parser with detailed device detection
function parseUserAgent(ua) {
    if (!ua) return { summary: 'Unknown Device', browser: 'Unknown', os: 'Unknown', deviceType: 'desktop' };

    const userAgent = ua.toLowerCase();

    // Detect Browser
    let browser = 'Unknown Browser';
    let browserVersion = '';

    if (userAgent.includes('edg/')) {
        const match = userAgent.match(/edg\/([\d.]+)/);
        browser = 'Microsoft Edge';
        browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('chrome/') && !userAgent.includes('edg')) {
        const match = userAgent.match(/chrome\/([\d.]+)/);
        browser = 'Google Chrome';
        browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('firefox/')) {
        const match = userAgent.match(/firefox\/([\d.]+)/);
        browser = 'Mozilla Firefox';
        browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('safari/') && !userAgent.includes('chrome')) {
        const match = userAgent.match(/version\/([\d.]+)/);
        browser = 'Safari';
        browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('opera') || userAgent.includes('opr/')) {
        const match = userAgent.match(/(?:opera|opr)\/([\d.]+)/);
        browser = 'Opera';
        browserVersion = match ? match[1] : '';
    }

    // Detect Operating System
    let os = 'Unknown OS';
    let osVersion = '';

    if (userAgent.includes('windows nt 10.0')) {
        os = 'Windows 10/11';
    } else if (userAgent.includes('windows nt 6.3')) {
        os = 'Windows 8.1';
    } else if (userAgent.includes('windows nt 6.2')) {
        os = 'Windows 8';
    } else if (userAgent.includes('windows nt 6.1')) {
        os = 'Windows 7';
    } else if (userAgent.includes('windows')) {
        os = 'Windows';
    } else if (userAgent.includes('mac os x')) {
        const match = userAgent.match(/mac os x ([\d_]+)/);
        os = 'macOS';
        osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (userAgent.includes('android')) {
        const match = userAgent.match(/android ([\d.]+)/);
        os = 'Android';
        osVersion = match ? match[1] : '';
    } else if (userAgent.includes('iphone')) {
        const match = userAgent.match(/os ([\d_]+)/);
        os = 'iOS (iPhone)';
        osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (userAgent.includes('ipad')) {
        const match = userAgent.match(/os ([\d_]+)/);
        os = 'iOS (iPad)';
        osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (userAgent.includes('linux')) {
        os = 'Linux';
    } else if (userAgent.includes('cros')) {
        os = 'Chrome OS';
    }

    // Detect Device Type
    let deviceType = 'desktop';
    if (userAgent.includes('mobile') || userAgent.includes('android')) {
        deviceType = 'mobile';
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
        deviceType = 'tablet';
    }

    // Build summary
    let summary = '';
    if (deviceType === 'mobile') {
        summary = `📱 ${browser} on ${os}`;
    } else if (deviceType === 'tablet') {
        summary = `📲 ${browser} on ${os}`;
    } else {
        summary = `💻 ${browser} on ${os}`;
    }

    return {
        summary,
        browser,
        browserVersion: browserVersion.split('.')[0] || '', // Major version only
        os,
        osVersion,
        deviceType,
        fullUA: ua
    };
}

// @route   POST /api/auth/reset-password
// @desc    Reset password using secret code
router.post('/reset-password', async (req, res) => {
    try {
        const { email, secretCode, newPassword } = req.body;
        const SECRET_CODE = process.env.PASSWORD_RESET_SECRET || '41534153';

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

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Increment token version
        const newTokenVersion = (admin.token_version || 0) + 1;

        await supabase
            .from('admins')
            .update({
                password: hashedPassword,
                login_attempts: 0,
                lock_until: null,
                token_version: newTokenVersion
            })
            .eq('id', admin.id);

        res.json({ message: 'Password reset successfully. Please login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
