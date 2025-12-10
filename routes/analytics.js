const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/analytics/visit
// @desc    Track a page visit (silent)
router.post('/visit', async (req, res) => {
    try {
        const { page } = req.body;
        const visitorIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || '';
        const referrer = req.headers['referer'] || '';

        await supabase.from('analytics').insert({
            page: page || '/',
            visitor_ip: visitorIp,
            user_agent: userAgent.substring(0, 500),
            referrer: referrer.substring(0, 500)
        });

        res.status(200).json({ tracked: true });
    } catch (error) {
        // Silently fail - don't interrupt user experience
        res.status(200).json({ tracked: false });
    }
});

// @route   GET /api/analytics/summary
// @desc    Get analytics summary (admin only)
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Get counts
        const { count: totalVisits } = await supabase
            .from('analytics')
            .select('*', { count: 'exact', head: true });

        const { count: todayVisits } = await supabase
            .from('analytics')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStart);

        const { count: weekVisits } = await supabase
            .from('analytics')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekStart);

        const { count: monthVisits } = await supabase
            .from('analytics')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', monthStart);

        // Get top pages
        const { data: allVisits } = await supabase
            .from('analytics')
            .select('page')
            .gte('created_at', monthStart);

        const pageCounts = {};
        (allVisits || []).forEach(v => {
            pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
        });

        const topPages = Object.entries(pageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([page, count]) => ({ page, count }));

        res.json({
            today: todayVisits || 0,
            thisWeek: weekVisits || 0,
            thisMonth: monthVisits || 0,
            total: totalVisits || 0,
            topPages
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get analytics', error: error.message });
    }
});

// @route   GET /api/analytics/recent
// @desc    Get recent visitors (admin only)
router.get('/recent', authMiddleware, async (req, res) => {
    try {
        const { data: recentVisits, error } = await supabase
            .from('analytics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const visits = (recentVisits || []).map(v => ({
            id: v.id,
            page: v.page,
            ip: v.visitor_ip,
            userAgent: v.user_agent,
            referrer: v.referrer,
            visitedAt: v.created_at
        }));

        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get recent visitors', error: error.message });
    }
});

module.exports = router;
