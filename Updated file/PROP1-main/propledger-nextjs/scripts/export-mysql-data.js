// Script to export data from MySQL to JSON files
// Run with: node scripts/export-mysql-data.js

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'propledger_db',
};

async function exportData() {
    let connection;

    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(config);
        console.log('Connected successfully!');

        // Create export directory
        const exportDir = path.join(__dirname, 'mysql-export');
        await fs.mkdir(exportDir, { recursive: true });

        // Tables to export
        const tables = [
            'users',
            'agents',
            'properties',
            'manager_messages',
            'user_tokens',
            'token_transactions',
            'payment_methods'
        ];

        const exportData = {};

        for (const table of tables) {
            try {
                console.log(`Exporting ${table}...`);
                const [rows] = await connection.execute(`SELECT * FROM ${table}`);
                exportData[table] = rows;
                console.log(`  ✓ Exported ${rows.length} rows from ${table}`);
            } catch (error) {
                console.log(`  ⚠ Table ${table} not found or error: ${error.message}`);
                exportData[table] = [];
            }
        }

        // Save to JSON file
        const exportFile = path.join(exportDir, 'mysql-data.json');
        await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
        console.log(`\n✓ Data exported successfully to: ${exportFile}`);

        // Print summary
        console.log('\n=== Export Summary ===');
        for (const [table, data] of Object.entries(exportData)) {
            console.log(`${table}: ${data.length} records`);
        }

    } catch (error) {
        console.error('Error exporting data:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nMySQL connection closed.');
        }
    }
}

exportData();
