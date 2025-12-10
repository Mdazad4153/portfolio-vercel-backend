const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
    institution: {
        type: String,
        required: true
    },
    degree: {
        type: String,
        required: true
    },
    field: {
        type: String,
        required: true
    },
    startYear: {
        type: String,
        required: true
    },
    endYear: {
        type: String,
        default: 'Present'
    },
    websiteUrl: {
        type: String,
        default: ''
    },
    grade: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    isCurrent: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Education', educationSchema);
