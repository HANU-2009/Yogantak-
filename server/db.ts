import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { DEFAULT_PRODUCTS_SEED } from './seedProducts.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

if (!hasDatabaseUrl) {
  console.warn('[POSTGRES] DATABASE_URL is not set. Operating in resilient in-memory mode.');
} else {
  console.log('[POSTGRES] Connecting to Neon Database...');
}

// In-Memory product & coupon cache for serverless environments without Neon URL configured
const inMemoryProducts: Map<string, any> = new Map(
  DEFAULT_PRODUCTS_SEED.map(p => [p.id, {
    ...p,
    models: JSON.stringify(p.models),
    materials: JSON.stringify(p.materials),
    colors: JSON.stringify(p.colors),
    tags: JSON.stringify(p.tags),
    features: JSON.stringify(p.features),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }])
);

const inMemoryCoupons: Map<string, any> = new Map();

// Configure Neon Pool with strict timeout (3.5s) to avoid Vercel 10s serverless invocation timeouts
let neonPool: Pool | null = null;
if (hasDatabaseUrl) {
  try {
    neonPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3500,
      idleTimeoutMillis: 10000
    });
    neonPool.on('error', (err) => {
      console.warn('[POSTGRES] Pool background notice:', err.message);
    });
  } catch (e) {
    console.warn('[POSTGRES] Failed to create Neon pool:', e);
    neonPool = null;
  }
}

export const db = {
  async query(text: string, params: any[] = []): Promise<{ rows: any[] }> {
    if (neonPool) {
      try {
        const result = await neonPool.query(text, params);
        return { rows: result.rows || [] };
      } catch (err: any) {
        console.warn(`[POSTGRES DB NOTICE] Neon query fallback (${err?.message || 'Connection timeout'}). Using in-memory store.`);
      }
    }

    // In-memory Query Engine Fallback
    const sql = text.trim();
    const upperSql = sql.toUpperCase();

    // 1. SELECT * FROM products ...
    if (upperSql.includes('FROM PRODUCTS')) {
      let list = Array.from(inMemoryProducts.values());

      if (upperSql.includes('WHERE ID = $1') && params[0]) {
        const item = inMemoryProducts.get(params[0]);
        return { rows: item ? [item] : [] };
      }
      if (upperSql.includes('WHERE STOCK <= 5')) {
        list = list.filter(p => Number(p.stock) <= 5);
      }
      if (upperSql.includes('COUNT(')) {
        return { rows: [{ count: list.length }] };
      }
      if (upperSql.includes('ORDER BY STOCK ASC')) {
        list.sort((a, b) => Number(a.stock) - Number(b.stock));
      } else {
        list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
      if (upperSql.includes('LIMIT')) {
        const limitMatch = upperSql.match(/LIMIT\s+(\d+)/);
        if (limitMatch) {
          list = list.slice(0, parseInt(limitMatch[1]));
        }
      }
      return { rows: list };
    }

    // 2. INSERT INTO products ...
    if (upperSql.startsWith('INSERT INTO PRODUCTS')) {
      const [id, name, description, price, stock, category, image_data, image_url, models, materials, colors, tags, features, magsafe, bestseller, eco_friendly] = params;
      const productObj = {
        id: id || `prod_${Date.now()}`,
        name: name || 'Product',
        description: description || '',
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        category: category || 'general',
        image_data: image_data || '',
        image_url: image_url || '',
        models: models || '[]',
        materials: materials || '[]',
        colors: colors || '[]',
        tags: tags || '[]',
        features: features || '[]',
        magsafe: magsafe ? 1 : 0,
        bestseller: bestseller ? 1 : 0,
        eco_friendly: eco_friendly ? 1 : 0,
        rating: 5.0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryProducts.set(productObj.id, productObj);
      return { rows: [productObj] };
    }

    // 3. UPDATE products ...
    if (upperSql.startsWith('UPDATE PRODUCTS')) {
      const id = params[params.length - 1]; // Where id = $last
      const existing = inMemoryProducts.get(id);
      if (existing) {
        if (upperSql.includes('SET STOCK = $1')) {
          existing.stock = Number(params[0]);
        } else if (upperSql.includes('SET STOCK = GREATEST')) {
          existing.stock = Math.max(0, Number(existing.stock) - Number(params[0]));
        } else if (upperSql.includes('SET STOCK = STOCK + $1')) {
          existing.stock = Number(existing.stock) + Number(params[0]);
        } else if (params.length >= 4) {
          existing.name = params[0] || existing.name;
          existing.description = params[1] ?? existing.description;
          existing.price = Number(params[2]) || existing.price;
          existing.category = params[3] || existing.category;
          if (params.length > 5 && typeof params[4] === 'string' && params[4].startsWith('data:')) {
            existing.image_data = params[4];
          }
        }
        existing.updated_at = new Date().toISOString();
        inMemoryProducts.set(id, existing);
        return { rows: [existing] };
      }
      return { rows: [] };
    }

    // 4. DELETE FROM products ...
    if (upperSql.startsWith('DELETE FROM PRODUCTS')) {
      const id = params[0];
      const prod = inMemoryProducts.get(id);
      if (prod) {
        inMemoryProducts.delete(id);
        return { rows: [prod] };
      }
      return { rows: [] };
    }

    // 5. COUPONS
    if (upperSql.includes('FROM COUPONS')) {
      if (upperSql.includes('WHERE CODE = $1') && params[0]) {
        const coupon = inMemoryCoupons.get(params[0].toUpperCase());
        return { rows: coupon ? [coupon] : [] };
      }
      return { rows: Array.from(inMemoryCoupons.values()) };
    }

    return { rows: [] };
  }
};

export async function initSchema() {
  if (!neonPool) return;
  try {
    await neonPool.query(`
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
      await neonPool.query(sql).catch(() => {});
    }

    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        expires_at TIMESTAMP,
        active INTEGER DEFAULT 1
      );
    `);

    console.log('[POSTGRES] Schema initialized successfully.');
  } catch (error) {
    console.warn('[POSTGRES] Error initializing schema:', error);
  }
}
