// ===========================================
// CREATE SUPABASE AUTH ADMIN USER
// ===========================================
// Run: node create-supabase-admin.js
// This script creates an admin user in Supabase Auth
// ===========================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase Config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

// Create Supabase Admin Client (with service role key for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// ===========================================
// ADMIN USER CONFIGURATION
// ===========================================
const ADMIN_CONFIG = {
    email: 'azad79900@gmail.com',      // Change to your admin email
    password: 'Admin@2024',             // Change to a strong password (min 6 chars)
    name: 'Md Azad',                    // Admin display name

    // Backup admin (optional - set to null to skip)
    backup: {
        email: 'admin@mdazad.com',
        password: 'Admin@2024',
        name: 'Admin'
    }
};

// ===========================================
// CREATE ADMIN USER FUNCTION
// ===========================================
async function createSupabaseAuthUser(email, password, name) {
    console.log(`\n📧 Creating Supabase Auth user: ${email}`);

    try {
        // Check if user already exists
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('   ❌ Error listing users:', listError.message);
            return null;
        }

        const existingUser = existingUsers.users.find(u => u.email === email);

        if (existingUser) {
            console.log(`   ⚠️ User already exists: ${email}`);
            console.log(`   📋 User ID: ${existingUser.id}`);
            return existingUser;
        }

        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,  // Auto-confirm email (no verification needed)
            user_metadata: {
                name: name,
                role: 'admin'
            }
        });

        if (error) {
            console.error(`   ❌ Failed to create user: ${error.message}`);
            return null;
        }

        console.log(`   ✅ User created successfully!`);
        console.log(`   📋 User ID: ${data.user.id}`);
        console.log(`   📧 Email: ${data.user.email}`);

        return data.user;

    } catch (err) {
        console.error(`   ❌ Error:`, err.message);
        return null;
    }
}

// ===========================================
// LINK AUTH USER TO ADMINS TABLE (Optional)
// ===========================================
async function linkToAdminsTable(authUser, name) {
    if (!authUser) return false;

    console.log(`\n🔗 Linking to admins table...`);

    try {
        // Check if admin record exists
        const { data: existingAdmin, error: checkError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', authUser.email)
            .single();

        if (existingAdmin) {
            // Update existing record with Supabase user ID
            const { error: updateError } = await supabase
                .from('admins')
                .update({
                    supabase_user_id: authUser.id,
                    name: name
                })
                .eq('email', authUser.email);

            if (updateError) {
                console.log(`   ⚠️ Could not update admins table: ${updateError.message}`);
            } else {
                console.log(`   ✅ Updated existing admin record with Supabase Auth ID`);
            }
        } else {
            // Create new admin record
            // Note: Password field might be required by schema, using placeholder
            const { error: insertError } = await supabase
                .from('admins')
                .insert({
                    email: authUser.email,
                    name: name,
                    supabase_user_id: authUser.id,
                    password: 'SUPABASE_AUTH_USER', // Placeholder - auth handled by Supabase
                    role: 'admin'
                });

            if (insertError) {
                console.log(`   ⚠️ Could not insert into admins table: ${insertError.message}`);
            } else {
                console.log(`   ✅ Created new admin record linked to Supabase Auth`);
            }
        }

        return true;
    } catch (err) {
        console.log(`   ⚠️ Linking skipped: ${err.message}`);
        return false;
    }
}

// ===========================================
// MAIN FUNCTION
// ===========================================
async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  SUPABASE AUTH ADMIN CREATION SCRIPT       ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`\n🔗 Supabase URL: ${supabaseUrl}`);

    // Create main admin
    const mainAdmin = await createSupabaseAuthUser(
        ADMIN_CONFIG.email,
        ADMIN_CONFIG.password,
        ADMIN_CONFIG.name
    );

    if (mainAdmin) {
        await linkToAdminsTable(mainAdmin, ADMIN_CONFIG.name);
    }

    // Create backup admin (if configured)
    if (ADMIN_CONFIG.backup) {
        const backupAdmin = await createSupabaseAuthUser(
            ADMIN_CONFIG.backup.email,
            ADMIN_CONFIG.backup.password,
            ADMIN_CONFIG.backup.name
        );

        if (backupAdmin) {
            await linkToAdminsTable(backupAdmin, ADMIN_CONFIG.backup.name);
        }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║                 SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n🎉 Admin creation complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   ─────────────────────────────────────────');
    console.log(`   Email:    ${ADMIN_CONFIG.email}`);
    console.log(`   Password: ${ADMIN_CONFIG.password}`);
    console.log('   ─────────────────────────────────────────');

    if (ADMIN_CONFIG.backup) {
        console.log('\n📋 Backup Admin:');
        console.log('   ─────────────────────────────────────────');
        console.log(`   Email:    ${ADMIN_CONFIG.backup.email}`);
        console.log(`   Password: ${ADMIN_CONFIG.backup.password}`);
        console.log('   ─────────────────────────────────────────');
    }

    console.log('\n✅ You can now login to the admin panel with these credentials!');
    console.log('🌐 Admin Panel: http://localhost:3000/admin.html\n');
}

// Run
main().catch(console.error);
