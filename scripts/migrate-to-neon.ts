import { Pool } from '@neondatabase/serverless';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initNeonProductSchema() {
  console.log('[NEON] Initializing Product-only schema...');
  
  await pool.query(`
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
      models TEXT DEFAULT '[]',
      materials TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      features TEXT DEFAULT '[]',
      magsafe INTEGER DEFAULT 0,
      bestseller INTEGER DEFAULT 0,
      eco_friendly INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      expires_at TIMESTAMP,
      active INTEGER DEFAULT 1
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);');

  console.log('[NEON] Schema initialized successfully for Product Catalog only.');
  process.exit(0);
}

initNeonProductSchema().catch(console.error);
