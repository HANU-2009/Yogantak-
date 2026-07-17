import { Pool } from '@neondatabase/serverless';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbPath = path.resolve(process.cwd(), 'data.db');
const sqlite = new DatabaseSync(dbPath);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log('Migrating schema...');
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      shipping_name TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_state TEXT NOT NULL,
      shipping_zip TEXT NOT NULL,
      shipping_country TEXT NOT NULL,
      coupon_code TEXT,
      payment_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      custom_config TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id INTEGER,
      reviewer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlist (
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS carts (
      user_id INTEGER PRIMARY KEY,
      cart_items TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Schema created.');

  // Delete all existing data to prevent PK conflicts on re-run
  const tables = ['users', 'products', 'coupons', 'orders', 'order_items', 'reviews', 'wishlist', 'carts', 'newsletter_subscribers'];
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
  }

  // Data transfer
  for (const table of tables) {
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) continue;
    console.log(`Migrating ${rows.length} rows for table ${table}...`);
    
    for (const row of rows as any[]) {
      const columns = Object.keys(row).join(', ');
      const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(row);
      
      try {
         const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
         await pool.query(query, values);
      } catch(e) {
         console.error(`Failed to insert into ${table}:`, e, row);
      }
    }
  }

  // Handle sequences for SERIAL columns (users, order_items, reviews)
  for (const table of ['users', 'order_items', 'reviews']) {
    try {
      await pool.query(`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id)+1 FROM ${table}), 1), false);`);
    } catch (e) {
      console.warn(`Could not set sequence for ${table}:`, e);
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
