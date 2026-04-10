// Script to import data from JSON to Supabase
// Run with: node scripts/import-to-supabase.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function importData() {
    try {
        console.log('Loading exported data...');
        const exportFile = path.join(__dirname, 'mysql-export', 'mysql-data.json');
        const fileContent = await fs.readFile(exportFile, 'utf8');
        const data = JSON.parse(fileContent);

        console.log('\n=== Starting Supabase Import ===\n');

        // Note: Users need to be created through Supabase Auth first
        // This script will skip users and focus on other tables

        // Import agents
        if (data.agents && data.agents.length > 0) {
            console.log(`Importing ${data.agents.length} agents...`);
            const { error } = await supabase.from('agents').insert(data.agents);
            if (error) {
                console.error('  ✗ Error importing agents:', error.message);
            } else {
                console.log('  ✓ Agents imported successfully');
            }
        }

        // Import properties
        if (data.properties && data.properties.length > 0) {
            console.log(`Importing ${data.properties.length} properties...`);
            const { error } = await supabase.from('properties').insert(data.properties);
            if (error) {
                console.error('  ✗ Error importing properties:', error.message);
            } else {
                console.log('  ✓ Properties imported successfully');
            }
        }

        // Import manager_messages
        if (data.manager_messages && data.manager_messages.length > 0) {
            console.log(`Importing ${data.manager_messages.length} messages...`);
            const { error } = await supabase.from('manager_messages').insert(data.manager_messages);
            if (error) {
                console.error('  ✗ Error importing messages:', error.message);
            } else {
                console.log('  ✓ Messages imported successfully');
            }
        }

        // Import user_tokens
        if (data.user_tokens && data.user_tokens.length > 0) {
            console.log(`Importing ${data.user_tokens.length} user tokens...`);
            const { error } = await supabase.from('user_tokens').insert(data.user_tokens);
            if (error) {
                console.error('  ✗ Error importing user tokens:', error.message);
            } else {
                console.log('  ✓ User tokens imported successfully');
            }
        }

        // Import token_transactions
        if (data.token_transactions && data.token_transactions.length > 0) {
            console.log(`Importing ${data.token_transactions.length} token transactions...`);
            const { error } = await supabase.from('token_transactions').insert(data.token_transactions);
            if (error) {
                console.error('  ✗ Error importing token transactions:', error.message);
            } else {
                console.log('  ✓ Token transactions imported successfully');
            }
        }

        // Import payment_methods
        if (data.payment_methods && data.payment_methods.length > 0) {
            console.log(`Importing ${data.payment_methods.length} payment methods...`);
            const { error } = await supabase.from('payment_methods').insert(data.payment_methods);
            if (error) {
                console.error('  ✗ Error importing payment methods:', error.message);
            } else {
                console.log('  ✓ Payment methods imported successfully');
            }
        }

        console.log('\n=== Import Complete ===');
        console.log('\nNote: User accounts must be recreated through Supabase Auth.');
        console.log('Users will need to sign up again or you can manually create them in Supabase.');

    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}

importData();
