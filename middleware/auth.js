const jwt = require('jsonwebtoken');

const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Check if session is valid in DB
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const { data: session, error } = await supabase
            .from('admin_sessions')
            .select('*')
            .eq('token_hash', tokenHash)
            .single();

        if (error || !session) {
            return res.status(401).json({ message: 'Session expired or revoked' });
        }

        req.admin = decoded;
        req.sessionId = session.id; // Attach session ID for reference
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
