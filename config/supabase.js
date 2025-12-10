// ===========================================
// SUPABASE CLIENT CONFIGURATION
// ===========================================
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for server-side

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test connection
const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase connection error:', error.message);
        } else {
            console.log('✅ Supabase Connected Successfully');
            console.log(`🔗 URL: ${supabaseUrl}`);
        }
    } catch (err) {
        console.error('❌ Supabase connection failed:', err.message);
    }
};

// Export supabase client and test function
module.exports = { supabase, testConnection };
