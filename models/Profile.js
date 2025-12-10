const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'Md Azad'
    },
    fullName: {
        type: String,
        default: 'Md Azad Ansari'
    },
    title: {
        type: String,
        default: 'Computer Science Student'
    },
    tagline: {
        type: String,
        default: 'Aspiring Software Developer | CSE Student'
    },
    bio: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: 'Chhapra, Bihar, India'
    },
    profileImage: {
        type: String,
        default: ''
    },
    resumeUrl: {
        type: String,
        default: ''
    },
    socialLinks: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' },
        youtube: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        telegram: { type: String, default: '' }
    },
    typingTexts: [{
        type: String
    }],
    stats: {
        projectsCompleted: { type: Number, default: 0 },
        happyClients: { type: Number, default: 0 },
        yearsExperience: { type: Number, default: 0 },
        certificatesEarned: { type: Number, default: 0 }
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
