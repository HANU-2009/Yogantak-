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

  // Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      magsafe INTEGER DEFAULT 0,
      bestseller INTEGER DEFAULT 0,
      eco_friendly INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Product Models Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_models (
      product_id TEXT NOT NULL,
      model TEXT NOT NULL,
      PRIMARY KEY (product_id, model),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Product Materials Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_materials (
      product_id TEXT NOT NULL,
      material TEXT NOT NULL,
      PRIMARY KEY (product_id, material),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Product Colors Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      color_id TEXT NOT NULL,
      color_name TEXT NOT NULL,
      color_value TEXT NOT NULL,
      bg_class TEXT NOT NULL,
      text_contrast TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Product Tags Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_tags (
      product_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (product_id, tag),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Product Features Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      feature TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Inventory Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      sku TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      model TEXT NOT NULL,
      material TEXT NOT NULL,
      color_id TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 10,
      low_stock_threshold INTEGER DEFAULT 3,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Coupons Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL, -- 'flat' or 'percent'
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
      status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'shipped', 'cancelled', 'returned'
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
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (coupon_code) REFERENCES coupons(code)
    );
  `);

  // Order Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      selected_model TEXT NOT NULL,
      selected_material TEXT NOT NULL,
      selected_color_id TEXT NOT NULL,
      price REAL NOT NULL,
      custom_config TEXT, -- JSON string for custom lab cases
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
      cart_items TEXT NOT NULL, -- JSON string containing persistent cart items
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

  // Indexes for query performance optimization
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(bestseller);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);');
}
