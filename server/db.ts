import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Define __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve database path at runtime
let sourceDbPath = '';
const possiblePaths = [
  path.resolve(process.cwd(), 'data.db'),
  path.resolve(process.cwd(), 'api', 'data.db'),
  path.resolve(process.cwd(), 'server', 'data.db'),
  path.resolve(__dirname, 'data.db'),
  path.resolve(__dirname, '..', 'data.db'),
  path.resolve(__dirname, '../..', 'data.db'),
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    sourceDbPath = p;
    console.log(`[SQLITE] Located source database at: ${p}`);
    break;
  }
}

if (!sourceDbPath) {
  sourceDbPath = path.resolve(process.cwd(), 'data.db');
  console.warn(`[SQLITE] Source data.db not found. Fallback: ${sourceDbPath}`);
}

let dbPath = sourceDbPath;

if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'data.db');
  if (!fs.existsSync(tmpDbPath)) {
    try {
      fs.copyFileSync(sourceDbPath, tmpDbPath);
      console.log(`[SQLITE] Successfully copied database from ${sourceDbPath} to ${tmpDbPath}`);
    } catch (e) {
      console.error(`[SQLITE] Failed to copy database to ${tmpDbPath}:`, e);
    }
  }
  dbPath = tmpDbPath;
}

export const db = new DatabaseSync(dbPath);

// Initialize DB schema
export function initSchema() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // ── SIMPLIFIED PRODUCTS TABLE ──
  // Single flat table: no separate variant/inventory/SKU tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'general',
      image_data TEXT DEFAULT '', -- Base64 encoded image data URI
      image_url TEXT DEFAULT '',  -- External image URL fallback
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Coupons Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      expires_at DATETIME,
      active INTEGER DEFAULT 1
    );
  `);

  // Orders Table
  db.exec(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Order Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      custom_config TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Reviews Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      user_id INTEGER,
      reviewer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Wishlist Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist (
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Carts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      user_id INTEGER PRIMARY KEY,
      cart_items TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Newsletter Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes for query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);');

  console.log('[SQLITE] Schema initialized successfully.');
}
