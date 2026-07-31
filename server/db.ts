import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { seedNeonDatabaseIfEmpty } from './seedProducts.js';

// Ensure .env is loaded before connecting
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error('[POSTGRES] DATABASE_URL is not set in .env!');
} else {
  console.log('[POSTGRES] Connecting to Neon Database...');
}

export const db = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'general',
        image_data TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Ensure rich schema columns exist in Neon database
    const columnsToAdd = [
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS models TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS magsafe INTEGER DEFAULT 0;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller INTEGER DEFAULT 0;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS eco_friendly INTEGER DEFAULT 0;"
    ];
    for (const sql of columnsToAdd) {
      await db.query(sql).catch(() => {});
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        expires_at TIMESTAMP,
        active INTEGER DEFAULT 1
      );
    `);

    await db.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);');

    // Auto-seed default catalog if Neon database is empty
    await seedNeonDatabaseIfEmpty(db);

    console.log('[POSTGRES] Schema initialized and synced successfully.');
  } catch (error) {
    console.error('[POSTGRES] Error initializing schema:', error);
  }
}


db.on('error', (err) => { console.error('[POSTGRES] Pool error:', err.message); });


