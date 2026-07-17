import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updatePrices() {
  try {
    await pool.query('UPDATE products SET price = 10;');
    console.log('Successfully updated all product prices to 10 Rs.');
  } catch (err) {
    console.error('Error updating prices:', err);
  } finally {
    process.exit(0);
  }
}

updatePrices();
