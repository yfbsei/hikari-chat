// scripts/migrate.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../src/lib/server/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
	try {
		console.log('🚀 Starting database migrations...');
		
		// Read and execute the schema file
		const schemaPath = path.join(__dirname, '../src/lib/server/schema.sql');
		const schema = fs.readFileSync(schemaPath, 'utf8');
		
		// Split the schema into individual statements
		const statements = schema
			.split(';')
			.map(stmt => stmt.trim())
			.filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
		
		console.log(`📄 Found ${statements.length} SQL statements to execute`);
		
		// Execute each statement
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			
			try {
				await db.query(statement);
				console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
			} catch (error) {
				// Some statements might fail if they already exist (like CREATE EXTENSION)
				if (error.code === '42710' || error.code === '42P07') {
					console.log(`⚠️  Statement ${i + 1}/${statements.length} already exists, skipping...`);
				} else {
					console.error(`❌ Error executing statement ${i + 1}:`, error.message);
					console.error('Statement:', statement.substring(0, 100) + '...');
					throw error;
				}
			}
		}
		
		// Create migrations tracking table if it doesn't exist
		await db.query(`
			CREATE TABLE IF NOT EXISTS migrations (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);
		
		// Record this migration
		await db.query(
			'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
			['initial_schema']
		);
		
		console.log('🎉 All migrations completed successfully!');
		
		// Test the database by creating a test user
		console.log('🧪 Testing database with sample data...');
		
		// Check if test user already exists
		const existingUser = await db.query(
			'SELECT id FROM users WHERE email = $1',
			['test@hikarichat.com']
		);
		
		if (existingUser.rows.length === 0) {
			const bcrypt = await import('bcryptjs');
			const hashedPassword = await bcrypt.hash('testpassword123', 12);
			
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
		
	} catch (error) {
		console.error('💥 Migration failed:', error);
		process.exit(1);
	} finally {
		await db.end();
	}
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runMigrations();
}