// ===========================================
// SUPABASE SEED SCRIPT
// Run: node seed.js
// ===========================================
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seed() {
    try {
        console.log('🌱 Starting Supabase Seed...\n');

        // 1. Create Admin
        console.log('👤 Creating Admin...');
        const hashedPassword = await bcrypt.hash('Admin@123', 12);
        await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: admin } = await supabase.from('admins').insert({
            email: 'azad79900@gmail.com',
            password: hashedPassword,
            name: 'Md Azad'
        }).select().single();
        console.log('   ✅ Admin created:', admin?.email);

        // 2. Create/Update Profile
        console.log('\n📝 Creating Profile...');
        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: profile } = await supabase.from('profiles').insert({
            name: 'Md Azad',
            full_name: 'Md Azad Ansari',
            title: 'Full Stack Developer',
            tagline: 'Aspiring Software Developer | CSE Student',
            bio: 'Passionate about building web applications and learning new technologies.',
            about: 'I am a Computer Science student passionate about web development and software engineering. I love creating beautiful, functional web applications that solve real-world problems.',
            email: 'azad79900@gmail.com',
            phone: '+91 9876543210',
            address: 'Chhapra, Bihar, India',
            social_links: {
                github: 'https://github.com/mdazad',
                linkedin: 'https://linkedin.com/in/mdazad',
                twitter: '',
                instagram: '',
                youtube: ''
            },
            typing_texts: ['Full Stack Developer', 'UI/UX Enthusiast', 'Problem Solver', 'Tech Explorer'],
            stats: { projectsCompleted: 0, happyClients: 0, yearsExperience: 1, certificatesEarned: 0 },
            is_available: true
        }).select().single();
        console.log('   ✅ Profile created:', profile?.name);

        // 3. Create Skills
        console.log('\n💡 Creating Skills...');
        const skills = [
            { name: 'HTML5', category: 'frontend', proficiency: 95, icon: 'html5', order: 1 },
            { name: 'CSS3', category: 'frontend', proficiency: 90, icon: 'css3', order: 2 },
            { name: 'JavaScript', category: 'frontend', proficiency: 85, icon: 'javascript', order: 3 },
            { name: 'React.js', category: 'frontend', proficiency: 80, icon: 'react', order: 4 },
            { name: 'Node.js', category: 'backend', proficiency: 80, icon: 'nodejs', order: 5 },
            { name: 'Express.js', category: 'backend', proficiency: 75, icon: 'express', order: 6 },
            { name: 'PostgreSQL', category: 'database', proficiency: 70, icon: 'database', order: 7 },
            { name: 'Git', category: 'tools', proficiency: 85, icon: 'git', order: 8 },
            { name: 'Python', category: 'backend', proficiency: 70, icon: 'python', order: 9 },
        ];
        await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: createdSkills } = await supabase.from('skills').insert(skills).select();
        console.log('   ✅ Skills created:', createdSkills?.length);

        // 4. Create Education
        console.log('\n🎓 Creating Education...');
        const education = [
            {
                institution: 'Dr. APJ Abdul Kalam Technical University',
                degree: 'Bachelor of Technology',
                field: 'Computer Science & Engineering',
                start_year: '2022',
                end_year: '2026',
                grade: '8.5 CGPA',
                description: 'Currently pursuing B.Tech in Computer Science with focus on software development.',
                is_current: true,
                order: 1
            },
            {
                institution: 'High School',
                degree: 'Intermediate',
                field: 'Science (PCM)',
                start_year: '2019',
                end_year: '2021',
                grade: '85%',
                description: 'Completed intermediate education with Physics, Chemistry, and Mathematics.',
                is_current: false,
                order: 2
            }
        ];
        await supabase.from('education').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: createdEdu } = await supabase.from('education').insert(education).select();
        console.log('   ✅ Education created:', createdEdu?.length);

        // 5. Create Projects
        console.log('\n🚀 Creating Projects...');
        const projects = [
            {
                title: 'Portfolio Website',
                description: 'A modern, responsive portfolio website built with HTML, CSS, and JavaScript.',
                long_description: 'This portfolio website showcases my skills, projects, and experience. Built with modern web technologies and integrated with a Node.js backend.',
                category: 'web',
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'Node.js', 'PostgreSQL'],
                live_url: 'https://mdazad-portfolio.vercel.app',
                github_url: 'https://github.com/mdazad/portfolio',
                featured: true,
                order: 1,
                views: 0
            },
            {
                title: 'Task Management App',
                description: 'A full-stack task management application with user authentication.',
                long_description: 'Built with React.js and Node.js, this app allows users to create, manage, and track their tasks efficiently.',
                category: 'web',
                technologies: ['React.js', 'Node.js', 'Express.js', 'PostgreSQL', 'JWT'],
                featured: true,
                order: 2,
                views: 0
            }
        ];
        await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: createdProjects } = await supabase.from('projects').insert(projects).select();
        console.log('   ✅ Projects created:', createdProjects?.length);

        // 6. Create Certificates
        console.log('\n📜 Creating Certificates...');
        const certificates = [
            {
                title: 'Web Development Bootcamp',
                issuer: 'Udemy',
                date: new Date('2024-01-15').toISOString(),
                credential_url: 'https://udemy.com/certificate/example',
                description: 'Complete web development course covering HTML, CSS, JavaScript, Node.js',
                order: 1
            },
            {
                title: 'React.js Masterclass',
                issuer: 'Coursera',
                date: new Date('2024-03-20').toISOString(),
                credential_url: 'https://coursera.org/certificate/example',
                description: 'Advanced React.js concepts including hooks, context, and Redux',
                order: 2
            }
        ];
        await supabase.from('certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: createdCerts } = await supabase.from('certificates').insert(certificates).select();
        console.log('   ✅ Certificates created:', createdCerts?.length);

        // 7. Create Services
        console.log('\n🛠️ Creating Services...');
        const services = [
            {
                title: 'Web Development',
                description: 'Custom website development using modern technologies like React, Node.js, and more.',
                icon: 'code',
                features: ['Responsive Design', 'SEO Optimization', 'Fast Loading', 'Modern UI'],
                order: 1
            },
            {
                title: 'API Development',
                description: 'RESTful API design and development with proper documentation.',
                icon: 'server',
                features: ['REST APIs', 'Authentication', 'Database Design', 'Documentation'],
                order: 2
            }
        ];
        await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data: createdServices } = await supabase.from('services').insert(services).select();
        console.log('   ✅ Services created:', createdServices?.length);

        // 8. Update stats
        console.log('\n📊 Updating Stats...');
        const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { count: certCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
        await supabase.from('profiles').update({
            stats: {
                projectsCompleted: projectCount || 0,
                happyClients: 10,
                yearsExperience: 1,
                certificatesEarned: certCount || 0
            }
        }).eq('id', profile.id);
        console.log('   ✅ Stats updated');

        console.log('\n🎉 Seed completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Admin: azad79900@gmail.com / Admin@123');
        console.log('   - Skills:', skills.length);
        console.log('   - Education:', education.length);
        console.log('   - Projects:', projects.length);
        console.log('   - Certificates:', certificates.length);
        console.log('   - Services:', services.length);

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
    }
}

seed();
