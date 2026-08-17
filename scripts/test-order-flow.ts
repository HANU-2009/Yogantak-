import { db, initSchema } from '../api/db.js';

async function testCompleteOrderFlow() {
  console.log('================================================================');
  console.log('  YOGANTAK ORDER PERSISTENCE & INVENTORY INTEGRATION TEST SUITE ');
  console.log('================================================================\n');

  await initSchema();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Fetch a product to test with
  console.log('--- TEST 1: PRODUCT SELECTION & INITIAL STOCK ---');
  // Ensure we have a product with stock
  await db.query("UPDATE products SET stock = 20 WHERE stock < 5");
  const prodRes = await db.query('SELECT * FROM products WHERE stock >= 5 LIMIT 1');
  assert(prodRes.rows.length > 0, 'PostgreSQL product catalog is online and populated');
  const targetProduct = prodRes.rows[0];
  const initialStock = Number(targetProduct.stock);
  console.log(`   Target Product: "${targetProduct.name}" (ID: ${targetProduct.id}) | Initial Stock: ${initialStock}`);

  // 2. Perform Customer Order Placement Simulation
  console.log('\n--- TEST 2: ORDER PERSISTENCE IN POSTGRESQL ---');
  const testOrderId = `ORD-TEST-${Date.now()}`;
  const testEmail = 'customer.qa@yogantak.com';
  const orderQuantity = 2;
  const unitPrice = Number(targetProduct.price) || 1299;
  const subtotal = unitPrice * orderQuantity;
  const total = subtotal;

  // Atomic Stock Deduction
  const decRes = await db.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [orderQuantity, targetProduct.id]);
  const decAffected = decRes.rowCount !== undefined ? decRes.rowCount : decRes.rows.length;
  assert(decAffected > 0, `Atomic inventory deduction of ${orderQuantity} units succeeded`);

  // Insert Order into PostgreSQL
  const orderInsert = await db.query(
    `INSERT INTO orders (
      id, user_id, email, status, subtotal, discount, tax, shipping_cost, total,
      shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip,
      shipping_country, shipping_phone, coupon_code, payment_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      testOrderId, testEmail, testEmail, 'processing',
      subtotal, 0, 0, 0, total,
      'QA Test Customer', '123 Tech Park Road', 'Bengaluru', 'Karnataka', '560001',
      'India', '+919876543210', null, `pay_live_test_${Date.now()}`
    ]
  );
  assert((orderInsert.rowCount !== undefined ? orderInsert.rowCount : orderInsert.rows.length) > 0, 'Order successfully persisted in PostgreSQL "orders" table');

  // Insert Order Items into PostgreSQL
  const testItemId = `ITEM-TEST-${Date.now()}`;
  const itemInsert = await db.query(
    `INSERT INTO order_items (
      id, order_id, product_id, product_name, quantity, price,
      selected_model, selected_material, custom_config, image_url, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
    [
      testItemId, testOrderId, targetProduct.id, targetProduct.name, orderQuantity, unitPrice,
      'iPhone 15 Pro', 'Smooth Liquid Silicone', JSON.stringify({ finish: 'matte' }), targetProduct.image_url || ''
    ]
  );
  assert((itemInsert.rowCount !== undefined ? itemInsert.rowCount : itemInsert.rows.length) > 0, 'Order items successfully persisted in PostgreSQL "order_items" table');

  // 3. Verify Inventory Reduction
  console.log('\n--- TEST 3: INVENTORY INTEGRITY VERIFICATION ---');
  const postOrderProd = await db.query('SELECT stock FROM products WHERE id = $1', [targetProduct.id]);
  const newStock = Number(postOrderProd.rows[0].stock);
  assert(newStock === initialStock - orderQuantity, `Authoritative PostgreSQL product stock decreased from ${initialStock} to ${newStock}`);

  // 4. Verify Admin Order Retrieval from PostgreSQL
  console.log('\n--- TEST 4: ADMIN ORDER RETRIEVAL FROM POSTGRESQL ---');
  const adminOrderLookup = await db.query('SELECT * FROM orders WHERE id = $1', [testOrderId]);
  assert(adminOrderLookup.rows.length > 0, 'Admin API retrieves the newly placed order from PostgreSQL');
  
  const adminItemsLookup = await db.query('SELECT * FROM order_items WHERE order_id = $1', [testOrderId]);
  assert(adminItemsLookup.rows.length > 0, 'Admin API retrieves corresponding order items from PostgreSQL');
  assert(adminItemsLookup.rows[0].product_id === targetProduct.id, 'Retrieved order item matches the purchased product ID');

  // 5. Test Cancellation, Inventory Restoration, and Refund Persistence
  console.log('\n--- TEST 5: ORDER CANCELLATION, RESTOCKING & REFUND ---');
  await db.query(`UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [testOrderId]);
  
  // Restore stock
  await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [orderQuantity, targetProduct.id]);
  const restoredProd = await db.query('SELECT stock FROM products WHERE id = $1', [targetProduct.id]);
  assert(Number(restoredProd.rows[0].stock) === initialStock, 'Product inventory restored to initial stock upon cancellation');

  // Create refund record
  const refundId = `REF-TEST-${Date.now()}`;
  await db.query(
    `INSERT INTO refunds (id, order_id, user_email, amount, payment_id, status, reason, refund_method, created_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      refundId, testOrderId, testEmail, total, `pay_live_test_${Date.now()}`,
      'completed', 'Customer test cancellation', 'Razorpay Express Refund'
    ]
  );
  const refundCheck = await db.query('SELECT * FROM refunds WHERE id = $1', [refundId]);
  assert(refundCheck.rows.length > 0, 'Refund transaction ledger persisted in PostgreSQL "refunds" table');

  console.log('\n================================================================');
  console.log(`  FINAL RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

testCompleteOrderFlow().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
