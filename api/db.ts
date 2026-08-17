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
const inMemoryOrdersDb: Map<string, any> = new Map();
const inMemoryOrderItemsDb: Map<string, any> = new Map();
const inMemoryRefundsDb: Map<string, any> = new Map();

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
  async query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount?: number }> {
    if (neonPool) {
      try {
        const result = await neonPool.query(text, params);
        return { rows: result.rows || [], rowCount: result.rowCount ?? (result.rows ? result.rows.length : 0) };
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

      if (upperSql.includes('WHERE CATEGORY = $1') && params[0]) {
        list = list.filter(p => p.category?.toLowerCase() === params[0]?.toLowerCase());
      }

      if (upperSql.includes('ORDER BY CREATED_AT DESC')) {
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (upperSql.includes('LIMIT $1') && typeof params[0] === 'number') {
        list = list.slice(0, params[0]);
      } else if (upperSql.includes('LIMIT 5')) {
        list = list.slice(0, 5);
      }

      return { rows: list };
    }

    // 2. INSERT INTO products ...
    if (upperSql.startsWith('INSERT INTO PRODUCTS')) {
      const prod = {
        id: params[0],
        name: params[1],
        description: params[2] || '',
        price: Number(params[3]) || 0,
        stock: Number(params[4]) || 0,
        category: params[5] || 'general',
        image_data: params[6] || '',
        image_url: params[7] || '',
        rating: Number(params[8]) || 5.0,
        reviews_count: Number(params[9]) || 0,
        models: typeof params[10] === 'string' ? params[10] : JSON.stringify(params[10] || []),
        materials: typeof params[11] === 'string' ? params[11] : JSON.stringify(params[11] || []),
        colors: typeof params[12] === 'string' ? params[12] : JSON.stringify(params[12] || []),
        tags: typeof params[13] === 'string' ? params[13] : JSON.stringify(params[13] || []),
        features: typeof params[14] === 'string' ? params[14] : JSON.stringify(params[14] || []),
        magsafe: params[15] ? 1 : 0,
        bestseller: params[16] ? 1 : 0,
        eco_friendly: params[17] ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryProducts.set(prod.id, prod);
      return { rows: [prod], rowCount: 1 };
    }

    // 3. UPDATE products ...
    if (upperSql.startsWith('UPDATE PRODUCTS')) {
      let id = '';
      if (upperSql.includes('WHERE ID = $2')) id = params[1];
      else if (upperSql.includes('WHERE ID = $1')) id = params[0];
      else if (params.length > 0) id = params[params.length - 1];

      const existing = inMemoryProducts.get(id);
      if (existing) {
        if (upperSql.includes('SET STOCK = STOCK - $1') && upperSql.includes('STOCK >= $1')) {
          const qty = Number(params[0]);
          if (Number(existing.stock) >= qty) {
            existing.stock = Number(existing.stock) - qty;
            existing.updated_at = new Date().toISOString();
            inMemoryProducts.set(id, existing);
            return { rows: [existing], rowCount: 1 };
          } else {
            return { rows: [], rowCount: 0 };
          }
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
        return { rows: [existing], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 4. DELETE FROM products ...
    if (upperSql.startsWith('DELETE FROM PRODUCTS')) {
      const id = params[0];
      const prod = inMemoryProducts.get(id);
      if (prod) {
        inMemoryProducts.delete(id);
        return { rows: [prod], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 5. COUPONS
    if (upperSql.includes('FROM COUPONS')) {
      if (upperSql.includes('WHERE CODE = $1') && params[0]) {
        const coupon = inMemoryCoupons.get(params[0].toUpperCase());
        return { rows: coupon ? [coupon] : [] };
      }
      return { rows: Array.from(inMemoryCoupons.values()) };
    }

    // 6. ORDERS
    if (upperSql.startsWith('INSERT INTO ORDERS')) {
      const order = {
        id: params[0],
        user_id: params[1],
        email: params[2],
        status: params[3] || 'processing',
        subtotal: Number(params[4]) || 0,
        discount: Number(params[5]) || 0,
        tax: Number(params[6]) || 0,
        shipping_cost: Number(params[7]) || 0,
        total: Number(params[8]) || 0,
        shipping_name: params[9] || '',
        shipping_address: params[10] || '',
        shipping_city: params[11] || '',
        shipping_state: params[12] || '',
        shipping_zip: params[13] || '',
        shipping_country: params[14] || 'India',
        shipping_phone: params[15] || null,
        coupon_code: params[16] || null,
        payment_id: params[17] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryOrdersDb.set(order.id, order);
      return { rows: [order], rowCount: 1 };
    }

    if (upperSql.includes('FROM ORDERS')) {
      let list = Array.from(inMemoryOrdersDb.values());
      if (upperSql.includes('WHERE ID = $1') && params[0]) {
        const o = inMemoryOrdersDb.get(params[0]);
        return { rows: o ? [o] : [] };
      }
      if (upperSql.includes('WHERE LOWER(EMAIL) = LOWER($1)') || upperSql.includes('WHERE EMAIL = $1')) {
        const email = String(params[0]).toLowerCase();
        list = list.filter(o => String(o.email).toLowerCase() === email || String(o.user_id).toLowerCase() === email);
      }
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { rows: list };
    }

    if (upperSql.startsWith('UPDATE ORDERS')) {
      let id = params[params.length - 1];
      const existing = inMemoryOrdersDb.get(id);
      if (existing) {
        if (upperSql.includes('STATUS = $1')) {
          existing.status = params[0];
          if (params.length > 2) existing.delay_reason = params[1];
          if (params.length > 3) existing.estimated_delivery = params[2];
        } else if (upperSql.includes("STATUS = 'CANCELLED'")) {
          existing.status = 'cancelled';
        }
        existing.updated_at = new Date().toISOString();
        inMemoryOrdersDb.set(id, existing);
        return { rows: [existing], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 7. ORDER ITEMS
    if (upperSql.startsWith('INSERT INTO ORDER_ITEMS')) {
      const item = {
        id: params[0],
        order_id: params[1],
        product_id: params[2],
        product_name: params[3] || '',
        quantity: Number(params[4]) || 1,
        price: Number(params[5]) || 0,
        selected_model: params[6] || null,
        selected_material: params[7] || null,
        custom_config: params[8] || null,
        image_url: params[9] || '',
        created_at: new Date().toISOString()
      };
      inMemoryOrderItemsDb.set(item.id, item);
      return { rows: [item], rowCount: 1 };
    }

    if (upperSql.includes('FROM ORDER_ITEMS')) {
      let list = Array.from(inMemoryOrderItemsDb.values());
      if (upperSql.includes('WHERE ORDER_ID = $1') && params[0]) {
        list = list.filter(i => i.order_id === params[0]);
      }
      return { rows: list };
    }

    // 8. REFUNDS
    if (upperSql.startsWith('INSERT INTO REFUNDS')) {
      const refund = {
        id: params[0],
        order_id: params[1],
        user_email: params[2],
        amount: Number(params[3]) || 0,
        payment_id: params[4],
        razorpay_refund_id: params[5] || params[0],
        status: params[6] || 'REFUNDED',
        reason: params[7],
        gateway_error: params[8] || null,
        refund_method: params[9] || 'Razorpay Gateway',
        idempotency_key: params[10] || null,
        created_at: new Date().toISOString(),
        completed_at: (params[6] === 'REFUNDED' || params[6] === 'completed' || params[6] === 'processed') ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };
      inMemoryRefundsDb.set(refund.id, refund);
      if (refund.razorpay_refund_id) inMemoryRefundsDb.set(refund.razorpay_refund_id, refund);
      return { rows: [refund], rowCount: 1 };
    }

    if (upperSql.startsWith('UPDATE REFUNDS')) {
      let matched: any = null;
      for (const r of inMemoryRefundsDb.values()) {
        if (params.includes(r.id) || params.includes(r.order_id) || params.includes(r.razorpay_refund_id)) {
          matched = r;
          break;
        }
      }
      if (matched) {
        if (upperSql.includes('STATUS = $1')) {
          matched.status = params[0];
          if (params[1]) matched.gateway_error = params[1];
        } else if (upperSql.includes('STATUS =') && upperSql.includes('REFUNDED')) {
          matched.status = 'REFUNDED';
        }
        matched.updated_at = new Date().toISOString();
        inMemoryRefundsDb.set(matched.id, matched);
        return { rows: [matched], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (upperSql.includes('FROM REFUNDS')) {
      let list = Array.from(inMemoryRefundsDb.values());
      if (upperSql.includes('WHERE ORDER_ID = $1') && params[0]) {
        list = list.filter(r => r.order_id === params[0]);
      } else if (upperSql.includes('WHERE PAYMENT_ID = $1') && params[0]) {
        list = list.filter(r => r.payment_id === params[0]);
      } else if (upperSql.includes('WHERE RAZORPAY_REFUND_ID = $1') && params[0]) {
        list = list.filter(r => r.razorpay_refund_id === params[0] || r.id === params[0]);
      } else if (upperSql.includes('WHERE ID = $1') && params[0]) {
        list = list.filter(r => r.id === params[0] || r.razorpay_refund_id === params[0]);
      }
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { rows: list };
    }

    // 9. WEBHOOK EVENTS
    if (upperSql.startsWith('INSERT INTO WEBHOOK_EVENTS')) {
      const evt = { id: params[0], event_name: params[1] || 'unknown', created_at: new Date().toISOString() };
      inMemoryWebhookEventsDb.set(evt.id, evt);
      return { rows: [evt], rowCount: 1 };
    }

    if (upperSql.includes('FROM WEBHOOK_EVENTS')) {
      if (upperSql.includes('WHERE ID = $1') && params[0]) {
        const evt = inMemoryWebhookEventsDb.get(params[0]);
        return { rows: evt ? [evt] : [] };
      }
      return { rows: Array.from(inMemoryWebhookEventsDb.values()) };
    }

    return { rows: [], rowCount: 0 };
  }
};

export async function initSchema() {
  if (!neonPool) return;
  try {
    // 1. Products Table
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
    
    const productColumns = [
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS models TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS magsafe INTEGER DEFAULT 0;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller INTEGER DEFAULT 0;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS eco_friendly INTEGER DEFAULT 0;"
    ];
    for (const sql of productColumns) {
      await neonPool.query(sql).catch(() => {});
    }

    // 2. Coupons Table
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

    // 3. Orders Table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'processing',
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        shipping_cost REAL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        shipping_name TEXT DEFAULT '',
        shipping_address TEXT DEFAULT '',
        shipping_city TEXT DEFAULT '',
        shipping_state TEXT DEFAULT '',
        shipping_zip TEXT DEFAULT '',
        shipping_country TEXT DEFAULT 'India',
        shipping_phone TEXT,
        coupon_code TEXT,
        payment_id TEXT,
        delay_reason TEXT,
        estimated_delivery TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alter legacy column types to robust TEXT
    await neonPool.query("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;").catch(() => {});
    await neonPool.query("ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;").catch(() => {});
    await neonPool.query("ALTER TABLE order_items ALTER COLUMN id TYPE TEXT USING id::text;").catch(() => {});
    await neonPool.query("ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;").catch(() => {});

    const orderColumns = [
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id TEXT;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal REAL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount REAL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax REAL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost REAL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS total REAL DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name TEXT DEFAULT '';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT DEFAULT '';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city TEXT DEFAULT '';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state TEXT DEFAULT '';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT DEFAULT '';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'India';",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delay_reason TEXT;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
    ];
    for (const sql of orderColumns) {
      await neonPool.query(sql).catch(() => {});
    }

    // 4. Order Items Table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT DEFAULT '',
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL DEFAULT 0,
        selected_model TEXT,
        selected_material TEXT,
        custom_config TEXT,
        image_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const orderItemColumns = [
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT DEFAULT '';",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price REAL DEFAULT 0;",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_model TEXT;",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_material TEXT;",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_config TEXT;",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';",
      "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
    ];
    for (const sql of orderItemColumns) {
      await neonPool.query(sql).catch(() => {});
    }

    // 5. Refunds Table
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        user_email TEXT,
        amount REAL NOT NULL DEFAULT 0,
        payment_id TEXT,
        razorpay_refund_id TEXT,
        status TEXT NOT NULL DEFAULT 'REFUNDED',
        reason TEXT,
        gateway_error TEXT,
        refund_method TEXT,
        idempotency_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const refundColumns = [
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS razorpay_refund_id TEXT;",
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS idempotency_key TEXT;",
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS gateway_error TEXT;",
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS refund_method TEXT;",
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;",
      "ALTER TABLE refunds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
    ];
    for (const sql of refundColumns) {
      await neonPool.query(sql).catch(() => {});
    }

    // 6. Webhook Events Table (Database-backed serverless idempotency)
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[POSTGRES] All schemas (products, coupons, orders, order_items, refunds, webhook_events) initialized successfully.');
  } catch (error) {
    console.warn('[POSTGRES] Error initializing schema:', error);
  }
}
