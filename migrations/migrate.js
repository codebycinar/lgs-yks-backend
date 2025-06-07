const fs = require('fs');
const path = require('path');
const { query, connectDB } = require('../src/config/database');

const runMigrations = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting database migrations...');

    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get already executed migrations
    const executedResult = await query('SELECT filename FROM migrations ORDER BY id');
    const executedMigrations = executedResult.rows.map(row => row.filename);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`📝 Running migration: ${file}`);
        
        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Execute migration
        await query(migrationSQL);
        
        // Record migration as executed
        await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        
        console.log(`✅ Migration completed: ${file}`);
      } else {
        console.log(`⏭️  Migration already executed: ${file}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();