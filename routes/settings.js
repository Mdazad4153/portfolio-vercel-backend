const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Helper to convert snake_case to camelCase
const toCamelCase = (settings) => ({
    id: settings.id,
    siteName: settings.site_name,
    siteDescription: settings.site_description,
    logo: settings.logo,
    favicon: settings.favicon,
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    accentColor: settings.accent_color,
    defaultTheme: settings.default_theme,
    enableBlog: settings.enable_blog,
    enableTestimonials: settings.enable_testimonials,
    enableServices: settings.enable_services,
    enableContact: settings.enable_contact,
    maintenanceMode: settings.maintenance_mode,
    seoKeywords: settings.seo_keywords,
    googleAnalyticsId: settings.google_analytics_id,
    customCss: settings.custom_css,
    customJs: settings.custom_js,
    createdAt: settings.created_at,
    updatedAt: settings.updated_at
});

// Helper to convert camelCase to snake_case
const toSnakeCase = (data) => {
    const result = {};
    if (data.siteName !== undefined) result.site_name = data.siteName;
    if (data.siteDescription !== undefined) result.site_description = data.siteDescription;
    if (data.logo !== undefined) result.logo = data.logo;
    if (data.favicon !== undefined) result.favicon = data.favicon;
    if (data.primaryColor !== undefined) result.primary_color = data.primaryColor;
    if (data.secondaryColor !== undefined) result.secondary_color = data.secondaryColor;
    if (data.accentColor !== undefined) result.accent_color = data.accentColor;
    if (data.defaultTheme !== undefined) result.default_theme = data.defaultTheme;
    if (data.enableBlog !== undefined) result.enable_blog = data.enableBlog;
    if (data.enableTestimonials !== undefined) result.enable_testimonials = data.enableTestimonials;
    if (data.enableServices !== undefined) result.enable_services = data.enableServices;
    if (data.enableContact !== undefined) result.enable_contact = data.enableContact;
    if (data.maintenanceMode !== undefined) result.maintenance_mode = data.maintenanceMode;
    if (data.seoKeywords !== undefined) result.seo_keywords = data.seoKeywords;
    if (data.googleAnalyticsId !== undefined) result.google_analytics_id = data.googleAnalyticsId;
    if (data.customCss !== undefined) result.custom_css = data.customCss;
    if (data.customJs !== undefined) result.custom_js = data.customJs;
    return result;
};

// @route   GET /api/settings
// @desc    Get settings
router.get('/', async (req, res) => {
    try {
        let { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .limit(1);

        if (error) throw error;

        let result = settings && settings.length > 0 ? settings[0] : null;

        // Create default settings if none exists
        if (!result) {
            const { data: newSettings, error: createError } = await supabase
                .from('settings')
                .insert({})
                .select()
                .single();

            if (createError) throw createError;
            result = newSettings;
        }

        res.json(toCamelCase(result));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/settings
// @desc    Update settings
router.put('/', authMiddleware, async (req, res) => {
    try {
        // Get existing settings
        let { data: settings } = await supabase
            .from('settings')
            .select('id')
            .limit(1);

        const updateData = toSnakeCase(req.body);

        let result;
        if (!settings || settings.length === 0) {
            // Create new settings
            const { data, error } = await supabase
                .from('settings')
                .insert(updateData)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Update existing settings
            const { data, error } = await supabase
                .from('settings')
                .update(updateData)
                .eq('id', settings[0].id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        res.json(toCamelCase(result));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
