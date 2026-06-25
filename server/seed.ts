import { db, initSchema } from './db';
import { hashPassword } from './auth';
import { PRODUCTS, PHONE_MODELS } from '../src/data/products';

console.log('Initializing database schema...');
initSchema();

console.log('Seeding initial data...');

// 1. Seed Users
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (email, password_hash, full_name, role)
  VALUES (?, ?, ?, ?)
`);

insertUser.run('admin@yogantak.com', hashPassword('adminpassword123'), 'Yogantak Administrator', 'admin');
insertUser.run('client@yogantak.com', hashPassword('password123'), 'John Doe', 'customer');

console.log('Seeded users (admin@yogantak.com, client@yogantak.com).');

// 2. Seed Coupons
const insertCoupon = db.prepare(`
  INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, min_purchase, expires_at)
  VALUES (?, ?, ?, ?, ?)
`);

insertCoupon.run('WELCOME10', 'flat', 500.0, 3000.0, '2027-12-31 23:59:59');
insertCoupon.run('YOGANTAK20', 'percent', 20.0, 4000.0, '2027-12-31 23:59:59');
insertCoupon.run('FREESHIP', 'flat', 150.0, 0.0, '2027-12-31 23:59:59');

console.log('Seeded discount coupons.');

// 3. Seed Products and Variants
const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (id, name, description, base_price, rating, reviews_count, image, magsafe, bestseller, eco_friendly)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertProductModel = db.prepare(`
  INSERT OR REPLACE INTO product_models (product_id, model)
  VALUES (?, ?)
`);

const insertProductMaterial = db.prepare(`
  INSERT OR REPLACE INTO product_materials (product_id, material)
  VALUES (?, ?)
`);

const insertProductColor = db.prepare(`
  INSERT INTO product_colors (product_id, color_id, color_name, color_value, bg_class, text_contrast)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertProductTag = db.prepare(`
  INSERT OR REPLACE INTO product_tags (product_id, tag)
  VALUES (?, ?)
`);

const insertProductFeature = db.prepare(`
  INSERT INTO product_features (product_id, feature)
  VALUES (?, ?)
`);

const insertInventory = db.prepare(`
  INSERT OR REPLACE INTO inventory (sku, product_id, model, material, color_id, stock, low_stock_threshold)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (product_id, reviewer_name, rating, comment)
  VALUES (?, ?, ?, ?)
`);

// Clear color and feature tables since they use autoincrement primary keys and should not duplicate
db.exec('DELETE FROM product_colors;');
db.exec('DELETE FROM product_features;');
db.exec('DELETE FROM reviews;');

for (const product of PRODUCTS) {
  // Product row
  insertProduct.run(
    product.id,
    product.name,
    product.description,
    product.basePrice,
    product.rating,
    product.reviewsCount,
    product.image,
    product.magsafe ? 1 : 0,
    product.bestseller ? 1 : 0,
    product.ecoFriendly ? 1 : 0
  );

  // Models
  for (const model of product.models) {
    insertProductModel.run(product.id, model);
  }

  // Materials
  for (const material of product.materials) {
    insertProductMaterial.run(product.id, material);
  }

  // Colors
  for (const color of product.colors) {
    insertProductColor.run(
      product.id,
      color.id,
      color.name,
      color.value,
      color.bgClass,
      color.textContrast
    );
  }

  // Tags
  for (const tag of product.tags) {
    insertProductTag.run(product.id, tag);
  }

  // Features
  for (const feature of product.features) {
    insertProductFeature.run(product.id, feature);
  }

  // Generate SKU stock in inventory for all combinations
  // Format: SKU = PROD_ID-MODEL_CODE-MAT_CODE-COL_CODE
  for (const model of product.models) {
    for (const material of product.materials) {
      for (const color of product.colors) {
        const modelCode = model.replace(/\s+/g, '').substring(0, 8).toUpperCase();
        const matCode = material.replace(/\s+/g, '').substring(0, 6).toUpperCase();
        const colCode = color.id.toUpperCase();
        const sku = `${product.id.substring(0, 6).toUpperCase()}-${modelCode}-${matCode}-${colCode}`;
        
        // Random stock level between 5 and 20. Make sienna-leather forest green low stock for alerts verification.
        let stock = Math.floor(Math.random() * 15) + 6;
        if (product.id === 'sienna-leather' && color.id === 'charcoal') {
          stock = 2; // trigger low stock alert
        }
        
        insertInventory.run(sku, product.id, model, material, color.id, stock, 3);
      }
    }
  }

  // Mock Reviews
  insertReview.run(product.id, 'Alice Vance', 5, 'Absolutely gorgeous case, tactile feedback is outstanding!');
  insertReview.run(product.id, 'Michael T.', 4, 'Very good quality casing, the leather feels extremely premium.');
  insertReview.run(product.id, 'Emma Watson', 5, 'Perfect fit and the MagSafe alignment is very strong.');
}

console.log('Seeded products, variants, inventory SKUs, and reviews.');
console.log('Database seeding completed successfully!');
