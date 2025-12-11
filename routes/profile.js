const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to convert snake_case to camelCase for response
const toCamelCase = (profile) => {
    if (!profile) return null;
    return {
        id: profile.id,
        name: profile.name,
        fullName: profile.full_name,
        title: profile.title,
        tagline: profile.tagline,
        bio: profile.bio,
        about: profile.about,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        profileImage: profile.profile_image,
        resumeUrl: profile.resume_url,
        socialLinks: profile.social_links,
        typingTexts: profile.typing_texts,
        stats: profile.stats,
        isAvailable: profile.is_available,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
    };
};

// Helper to convert camelCase to snake_case for database
const toSnakeCase = (data) => {
    const result = {};
    if (data.name !== undefined) result.name = data.name;
    if (data.fullName !== undefined) result.full_name = data.fullName;
    if (data.title !== undefined) result.title = data.title;
    if (data.tagline !== undefined) result.tagline = data.tagline;
    if (data.bio !== undefined) result.bio = data.bio;
    if (data.about !== undefined) result.about = data.about;
    if (data.email !== undefined) result.email = data.email;
    if (data.phone !== undefined) result.phone = data.phone;
    if (data.address !== undefined) result.address = data.address;
    if (data.profileImage !== undefined) result.profile_image = data.profileImage;
    if (data.resumeUrl !== undefined) result.resume_url = data.resumeUrl;
    if (data.socialLinks !== undefined) result.social_links = data.socialLinks;
    if (data.typingTexts !== undefined) result.typing_texts = data.typingTexts;
    if (data.stats !== undefined) result.stats = data.stats;
    if (data.isAvailable !== undefined) result.is_available = data.isAvailable;
    return result;
};

// @route   GET /api/profile
// @desc    Get profile
router.get('/', async (req, res) => {
    try {
        let { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) throw error;

        let profile = profiles && profiles.length > 0 ? profiles[0] : null;

        // Create default profile if none exists
        if (!profile) {
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({})
                .select()
                .single();

            if (createError) throw createError;
            profile = newProfile;
        }

        res.json(toCamelCase(profile));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/profile
// @desc    Update profile
router.put('/', authMiddleware, async (req, res) => {
    try {
        // Get existing profile
        let { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        const updateData = toSnakeCase(req.body);

        let profile;
        if (!profiles || profiles.length === 0) {
            // Create new profile
            const { data, error } = await supabase
                .from('profiles')
                .insert(updateData)
                .select()
                .single();
            if (error) throw error;
            profile = data;
        } else {
            // Update existing profile
            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profiles[0].id)
                .select()
                .single();
            if (error) throw error;
            profile = data;
        }

        res.json(toCamelCase(profile));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/profile/image
// @desc    Upload profile image to Supabase Storage
router.post('/image', authMiddleware, upload.single('profileImage'), async (req, res) => {
    try {
        console.log('📸 Profile image upload request received');
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate unique filename
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `profile-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        console.log('📤 Uploading to Supabase Storage:', filePath);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-media')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Supabase upload error:', uploadError);
            throw uploadError;
        }

        console.log('✅ File uploaded to Supabase:', uploadData);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-media')
            .getPublicUrl(filePath);

        console.log('🔗 Public URL:', publicUrl);

        // Update profile in database
        let { data: profiles } = await supabase
            .from('profiles')
            .select('id, profile_image')
            .limit(1);

        // Delete old image from storage if exists
        if (profiles && profiles[0] && profiles[0].profile_image) {
            const oldImagePath = profiles[0].profile_image.split('/portfolio-media/').pop();
            if (oldImagePath && oldImagePath.startsWith('profiles/')) {
                console.log('🗑️ Deleting old image:', oldImagePath);
                await supabase.storage
                    .from('portfolio-media')
                    .remove([oldImagePath]);
            }
        }

        let profile;
        if (!profiles || profiles.length === 0) {
            const { data, error } = await supabase
                .from('profiles')
                .insert({ profile_image: publicUrl })
                .select()
                .single();
            if (error) throw error;
            profile = data;
        } else {
            const { data, error } = await supabase
                .from('profiles')
                .update({ profile_image: publicUrl })
                .eq('id', profiles[0].id)
                .select()
                .single();
            if (error) throw error;
            profile = data;
        }

        console.log('✅ Profile updated with new image URL');

        res.json({
            message: 'Image uploaded successfully',
            imageUrl: profile.profile_image
        });
    } catch (error) {
        console.error('❌ Profile Image Upload Error:', error);
        res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
    }
});

// @route   POST /api/profile/resume
// @desc    Upload resume
router.post('/resume', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
        console.log('📄 Resume upload request received');

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate unique filename
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `resume-${Date.now()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        console.log('📤 Uploading resume to Supabase Storage:', filePath);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-media')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Supabase upload error:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-media')
            .getPublicUrl(filePath);

        console.log('🔗 Resume Public URL:', publicUrl);

        // Update profile in database
        let { data: profiles } = await supabase
            .from('profiles')
            .select('id, resume_url')
            .limit(1);

        // Delete old resume from storage if exists
        if (profiles && profiles[0] && profiles[0].resume_url) {
            const oldResumePath = profiles[0].resume_url.split('/portfolio-media/').pop();
            if (oldResumePath && oldResumePath.startsWith('resumes/')) {
                console.log('🗑️ Deleting old resume:', oldResumePath);
                await supabase.storage
                    .from('portfolio-media')
                    .remove([oldResumePath]);
            }
        }

        let profile;
        if (!profiles || profiles.length === 0) {
            const { data, error } = await supabase
                .from('profiles')
                .insert({ resume_url: publicUrl })
                .select()
                .single();
            if (error) throw error;
            profile = data;
        } else {
            const { data, error } = await supabase
                .from('profiles')
                .update({ resume_url: publicUrl })
                .eq('id', profiles[0].id)
                .select()
                .single();
            if (error) throw error;
            profile = data;
        }

        console.log('✅ Resume uploaded successfully');

        res.json({
            message: 'Resume uploaded successfully',
            resumeUrl: profile.resume_url
        });
    } catch (error) {
        console.error('❌ Resume Upload Error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            details: error.statusCode || error.status || 'Unknown'
        });
    }
});

// @route   DELETE /api/profile/image
// @desc    Remove profile image from Supabase Storage
router.delete('/image', authMiddleware, async (req, res) => {
    try {
        let { data: profiles } = await supabase
            .from('profiles')
            .select('id, profile_image')
            .limit(1);

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Delete from Supabase Storage if exists
        if (profiles[0].profile_image) {
            const imagePath = profiles[0].profile_image.split('/portfolio-media/').pop();
            if (imagePath && imagePath.startsWith('profiles/')) {
                console.log('🗑️ Deleting image from storage:', imagePath);
                const { error: deleteError } = await supabase.storage
                    .from('portfolio-media')
                    .remove([imagePath]);

                if (deleteError) {
                    console.error('⚠️ Storage delete error:', deleteError);
                }
            }
        }

        // Remove from database
        const { error } = await supabase
            .from('profiles')
            .update({ profile_image: null })
            .eq('id', profiles[0].id);

        if (error) throw error;

        console.log('✅ Profile image removed');
        res.json({ message: 'Profile image removed successfully' });
    } catch (error) {
        console.error('❌ Delete Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/profile/resume
// @desc    Remove resume
router.delete('/resume', authMiddleware, async (req, res) => {
    try {
        let { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const { error } = await supabase
            .from('profiles')
            .update({ resume_url: null })
            .eq('id', profiles[0].id);

        if (error) throw error;

        res.json({ message: 'Resume removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
