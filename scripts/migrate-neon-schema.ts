import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('[MIGRATE] Running Neon database migrations...');

  try {
    // 1. Drop foreign key constraint on orders.user_id if present
    await pool.query("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;");
    await pool.query("ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;");
    console.log('✅ orders.user_id converted to TEXT');
  } catch (e: any) {
    console.log('orders.user_id notice:', e.message);
  }

  try {
    // 2. Convert id in order_items to TEXT
    await pool.query("ALTER TABLE order_items ALTER COLUMN id TYPE TEXT USING id::text;");
    console.log('✅ order_items.id converted to TEXT');
  } catch (e: any) {
    console.log('order_items.id notice:', e.message);
  }

  try {
    // 3. Drop any restrictive foreign key on order_items.order_id if it references old table
    await pool.query("ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;");
    console.log('✅ order_items_order_id_fkey constraint adjusted');
  } catch (e: any) {
    console.log('fkey constraint notice:', e.message);
  }

  // Verify columns now
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  console.log('Current orders columns:', res.rows);

  const resItems = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  console.log('Current order_items columns:', resItems.rows);

  await pool.end();
}

migrate();
