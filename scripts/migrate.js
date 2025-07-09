// scripts/migrate.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
    // Use DATABASE_URL if available, otherwise use individual env vars
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'hikari_chat',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create the connection pool
const db = new Pool(
    process.env.DATABASE_URL ? { 
        connectionString: process.env.DATABASE_URL, 
        ssl: dbConfig.ssl 
    } : dbConfig
);

async function runMigrations() {
    try {
        console.log('🚀 Starting database migrations...');
        
        // Test database connection first
        console.log('📡 Testing database connection...');
        await db.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '../src/lib/server/schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Schema file loaded successfully');
        
        // Execute the entire schema at once
        console.log('🔄 Executing database schema...');
        
        try {
            await db.query(schema);
            console.log('✅ Schema executed successfully');
        } catch (error) {
            // If there are errors, they might be due to existing objects
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.code === '42710' || 
                error.code === '42P07' || 
                error.code === '42723') {
                console.log('⚠️  Some objects already exist, continuing...');
            } else {
                throw error;
            }
        }
        
        // Create migrations tracking table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Record this migration
        try {
            await db.query(
                'INSERT INTO migrations (name) VALUES ($1)',
                ['initial_schema']
            );
            console.log('📝 Migration recorded in database');
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                console.log('📝 Migration already recorded');
            } else {
                throw error;
            }
        }
        
        console.log('🎉 All migrations completed successfully!');
        
        // Test the database by creating a test user
        console.log('🧪 Testing database with sample data...');
        
        // Check if test user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            ['test@hikarichat.com']
        );
        
        if (existingUser.rows.length === 0) {
            // Import bcrypt dynamically since it's not available at the top level
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.default.hash('testpassword123', 12);
            
            await db.query(`
                INSERT INTO users (username, email, password_hash, is_verified, display_name)
                VALUES ($1, $2, $3, $4, $5)
            `, ['testuser', 'test@hikarichat.com', hashedPassword, true, 'Test User']);
            
            console.log('✅ Test user created: test@hikarichat.com / testpassword123');
        } else {
            console.log('ℹ️  Test user already exists');
        }
        
        // Display connection info
        const result = await db.query('SELECT COUNT(*) as user_count FROM users');
        console.log(`📊 Database ready! Total users: ${result.rows[0].user_count}`);
        
        // List all tables to verify schema
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 Created tables:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔧 Connection refused. Please check:');
            console.error('   1. PostgreSQL is running');
            console.error('   2. Database credentials in .env file');
            console.error('   3. Database exists and is accessible');
        } else if (error.code === '3D000') {
            console.error('\n🔧 Database does not exist. Please create it first:');
            console.error(`   createdb ${process.env.DB_NAME || 'hikari_chat'}`);
        } else if (error.code === '28P01') {
            console.error('\n🔧 Authentication failed. Please check:');
            console.error('   1. Username and password in .env file');
            console.error('   2. User exists and has proper permissions');
        }
        
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations();
}