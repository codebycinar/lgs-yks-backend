const fs = require('fs');
const path = require('path');
const { query, connectDB } = require('../src/config/database');

const runSeeds = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');

    // Create seeds table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of seed files
    const seedsDir = path.join(__dirname);
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get already executed seeds
    const executedResult = await query('SELECT filename FROM seeds ORDER BY id');
    const executedSeeds = executedResult.rows.map(row => row.filename);

    // Run pending seeds
    for (const file of seedFiles) {
      if (!executedSeeds.includes(file)) {
        console.log(`🌱 Running seed: ${file}`);
        
        const seedSQL = fs.readFileSync(path.join(seedsDir, file), 'utf8');
        
        // Execute seed
        await query(seedSQL);
        
        // Record seed as executed
        await query('INSERT INTO seeds (filename) VALUES ($1)', [file]);
        
        console.log(`✅ Seed completed: ${file}`);
      } else {
        console.log(`⏭️  Seed already executed: ${file}`);
      }
    }

    console.log('🎉 All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeeds();