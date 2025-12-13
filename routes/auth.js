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
            // Get real IP (x-forwarded-for for proxies)
            let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
            // Get first IP if multiple
            if (clientIp.includes(',')) {
                clientIp = clientIp.split(',')[0].trim();
            }
            // Remove IPv6 prefix if present
            if (clientIp.startsWith('::ffff:')) {
                clientIp = clientIp.substring(7);
            }

            // Fetch location data from ip-api.com
            let locationData = { city: 'Unknown', country: 'Unknown', isp: 'Unknown', query: clientIp };
            try {
                const ipToLookup = (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'Unknown') ? '' : clientIp;
                const ipApiUrl = ipToLookup ? `http://ip-api.com/json/${ipToLookup}` : 'http://ip-api.com/json/';
                const ipResponse = await fetch(ipApiUrl);
                const ipData = await ipResponse.json();
                if (ipData.status === 'success') {
                    locationData = {
                        city: ipData.city || 'Unknown',
                        country: ipData.country || 'Unknown',
                        region: ipData.regionName || '',
                        isp: ipData.isp || 'Unknown',
                        query: ipData.query || clientIp
                    };
                }
            } catch (ipErr) {
                console.warn('IP lookup failed:', ipErr.message);
            }

            // Parse user agent
            const deviceInfo = parseUserAgent(userAgent);

            // Insert session with detailed info
            await supabase.from('admin_sessions').insert({
                admin_id: admin.id,
                token_hash: tokenHash,
                ip_address: locationData.query || clientIp,
                user_agent: userAgent,
                device_info: {
                    ...deviceInfo,
                    city: locationData.city,
                    country: locationData.country,
                    region: locationData.region,
                    isp: locationData.isp
                },
                expires_at: expiresAt.toISOString()
            });
        } catch (sessionErr) {
            console.warn('Session tracking skipped:', sessionErr.message);
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

// Old GET /sessions route DELETED - using newer version below (line ~507)

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

// @route   POST /api/auth/sync-password
// @desc    Sync password from Supabase Auth to local admins table
// @access  Public (called after Supabase password reset)
router.post('/sync-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Find admin by email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await supabase
            .from('admins')
            .update({
                password: hashedPassword,
                login_attempts: 0,
                lock_until: null
            })
            .eq('id', admin.id);

        console.log('✅ Password synced for:', email);
        res.json({ message: 'Password synced successfully' });
    } catch (error) {
        console.error('Sync password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ===========================================
// SESSION MANAGEMENT ROUTES
// ===========================================

// @route   GET /api/auth/sessions
// @desc    Get all active sessions for current admin
// @access  Protected
router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('admin_sessions')
            .select('*')
            .eq('admin_id', req.admin.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Sessions fetch error:', error);
            return res.status(500).json({ message: 'Failed to fetch sessions' });
        }

        // Get current session token hash to mark it
        const currentToken = req.headers.authorization?.replace('Bearer ', '') || '';
        const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

        // Format sessions for frontend
        const formattedSessions = (sessions || []).map(session => ({
            id: session.id,
            ipAddress: session.ip_address || 'Unknown',
            deviceInfo: session.device_info || {},
            userAgent: session.user_agent || 'Unknown',
            createdAt: session.created_at,
            expiresAt: session.expires_at,
            isCurrent: session.token_hash === currentTokenHash
        }));

        res.json(formattedSessions);
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/auth/sessions/:id
// @desc    Delete a specific session (logout that device)
// @access  Protected
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete session only if it belongs to current admin
        const { error } = await supabase
            .from('admin_sessions')
            .delete()
            .eq('id', id)
            .eq('admin_id', req.admin.id);

        if (error) {
            console.error('Session delete error:', error);
            return res.status(500).json({ message: 'Failed to delete session' });
        }

        res.json({ message: 'Session terminated' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/auth/sessions
// @desc    Logout all other sessions (except current)
// @access  Protected
router.delete('/sessions', authMiddleware, async (req, res) => {
    try {
        // Get current session token hash
        const currentToken = req.headers.authorization?.replace('Bearer ', '') || '';
        const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

        // Delete all sessions except current one
        const { error } = await supabase
            .from('admin_sessions')
            .delete()
            .eq('admin_id', req.admin.id)
            .neq('token_hash', currentTokenHash);

        if (error) {
            console.error('Logout all error:', error);
            return res.status(500).json({ message: 'Failed to logout other sessions' });
        }

        res.json({ message: 'All other sessions terminated' });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

