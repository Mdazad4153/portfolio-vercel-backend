const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Helper to convert snake_case to camelCase
const toCamelCase = (contact) => ({
    id: contact.id,
    _id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    subject: contact.subject,
    message: contact.message,
    isRead: contact.is_read,
    isReplied: contact.is_replied,
    replyMessage: contact.reply_message,
    repliedAt: contact.replied_at,
    createdAt: contact.created_at,
    updatedAt: contact.updated_at
});

// Helper function to sanitize input (strip HTML tags)
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '').trim();
};

// Email transporter setup
const createTransporter = () => {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return null;
};

// @route   GET /api/contact
// @desc    Get all contacts (admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(contacts.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/contact/:id
// @desc    Get single contact
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data: contact, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json(toCamelCase(contact));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/contact
// @desc    Submit contact form
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message, website } = req.body;

        // Honeypot check - if website field is filled, it's likely a bot
        if (website && website.trim() !== '') {
            return res.status(200).json({ message: 'Thank you for your message!' });
        }

        // Input validation
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters' });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        if (!subject || subject.trim().length < 3) {
            return res.status(400).json({ message: 'Subject must be at least 3 characters' });
        }
        if (!message || message.trim().length < 10) {
            return res.status(400).json({ message: 'Message must be at least 10 characters' });
        }

        // Sanitize inputs
        const sanitizedData = {
            name: sanitizeInput(name),
            email: sanitizeInput(email),
            phone: sanitizeInput(phone || ''),
            subject: sanitizeInput(subject),
            message: sanitizeInput(message)
        };

        // Create contact
        const { data: contact, error } = await supabase
            .from('contacts')
            .insert(sanitizedData)
            .select()
            .single();

        if (error) throw error;

        // Try to send email notification
        const transporter = createTransporter();
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: process.env.EMAIL_USER,
                    subject: `New Contact: ${sanitizedData.subject}`,
                    html: `
                        <h2>New Contact Form Submission</h2>
                        <p><strong>Name:</strong> ${sanitizedData.name}</p>
                        <p><strong>Email:</strong> ${sanitizedData.email}</p>
                        <p><strong>Phone:</strong> ${sanitizedData.phone || 'Not provided'}</p>
                        <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
                        <p><strong>Message:</strong></p>
                        <p>${sanitizedData.message}</p>
                    `
                });
            } catch (emailError) {
                console.error('Email notification failed:', emailError.message);
            }
        }

        res.status(201).json({
            message: 'Message sent successfully!',
            contact: toCamelCase(contact)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/contact/:id/read
// @desc    Mark message as read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { data: contact, error } = await supabase
            .from('contacts')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json(toCamelCase(contact));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/contact/:id/reply
// @desc    Reply to message
router.put('/:id/reply', authMiddleware, async (req, res) => {
    try {
        const { replyMessage } = req.body;

        // Get contact first
        const { data: contact, error: fetchError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Update contact
        const { data: updatedContact, error } = await supabase
            .from('contacts')
            .update({
                is_replied: true,
                reply_message: replyMessage,
                replied_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Try to send reply email
        const transporter = createTransporter();
        if (transporter && contact.email) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: contact.email,
                    subject: `Re: ${contact.subject}`,
                    html: `
                        <h2>Response to Your Message</h2>
                        <p>Dear ${contact.name},</p>
                        <p>${replyMessage}</p>
                        <hr>
                        <p><em>This is in response to your message:</em></p>
                        <blockquote>${contact.message}</blockquote>
                    `
                });
            } catch (emailError) {
                console.error('Reply email failed:', emailError.message);
            }
        }

        res.json({
            message: 'Reply sent successfully!',
            contact: toCamelCase(updatedContact)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
