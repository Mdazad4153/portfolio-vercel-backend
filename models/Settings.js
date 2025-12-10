const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'Md Azad Portfolio'
    },
    siteDescription: {
        type: String,
        default: 'Personal Portfolio Website'
    },
    logo: {
        type: String,
        default: ''
    },
    favicon: {
        type: String,
        default: ''
    },
    primaryColor: {
        type: String,
        default: '#6366f1'
    },
    secondaryColor: {
        type: String,
        default: '#8b5cf6'
    },
    accentColor: {
        type: String,
        default: '#06b6d4'
    },
    defaultTheme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark'
    },
    enableBlog: {
        type: Boolean,
        default: true
    },
    enableTestimonials: {
        type: Boolean,
        default: true
    },
    enableServices: {
        type: Boolean,
        default: true
    },
    enableContact: {
        type: Boolean,
        default: true
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    seoKeywords: [{
        type: String
    }],
    googleAnalyticsId: {
        type: String,
        default: ''
    },
    customCss: {
        type: String,
        default: ''
    },
    customJs: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
