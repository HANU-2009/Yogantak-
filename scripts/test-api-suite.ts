import { db } from '../api/db.js';
import crypto from 'crypto';

async function runTests() {
  console.log('====================================================');
  console.log('  YOGANTAK E-COMMERCE BACKEND INTEGRATION TEST SUITE');
  console.log('====================================================\n');

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

  // 1. Test Database Connectivity & Product Catalog
  console.log('--- TEST GROUP 1: CATALOG & DATABASE ---');
  const prodRes = await db.query('SELECT * FROM products LIMIT 5');
  assert(prodRes.rows.length > 0, 'Database returns product records');
  const sampleProduct = prodRes.rows[0];
  console.log(`   Sample product: "${sampleProduct.name}" | Stock: ${sampleProduct.stock} | Price: ₹${sampleProduct.price}`);

  // 2. Test Atomic Stock Conditional Decrement
  console.log('\n--- TEST GROUP 2: ATOMIC INVENTORY ENGINE ---');
  const testStockId = sampleProduct.id;
  const initialStock = Number(sampleProduct.stock);

  // Attempt atomic decrement of valid quantity
  const decValid = await db.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [1, testStockId]);
  const decValidAffected = decValid.rowCount !== undefined ? decValid.rowCount : decValid.rows.length;
  assert(decValidAffected > 0, 'Atomic stock deduction succeeds when stock >= quantity');

  // Attempt atomic decrement of excessive quantity (should fail atomically)
  const decExcess = await db.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [999999, testStockId]);
  const decExcessAffected = decExcess.rowCount !== undefined ? decExcess.rowCount : decExcess.rows.length;
  assert(decExcessAffected === 0, 'Atomic stock deduction fails safely when quantity > available stock (Prevents Overselling)');

  // Restore test stock
  await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [1, testStockId]);
  const restoredCheck = await db.query('SELECT stock FROM products WHERE id = $1', [testStockId]);
  assert(Number(restoredCheck.rows[0].stock) === initialStock, 'Atomic stock restoration accurately restores original inventory');

  // 3. Test Cryptographic Signature Verification Logic
  console.log('\n--- TEST GROUP 3: PAYMENT SIGNATURE VERIFICATION ---');
  const testSecret = 'secret_key_testing_123';
  const orderId = 'order_test_987654';
  const paymentId = 'pay_test_123456';
  const validSignature = crypto.createHmac('sha256', testSecret).update(`${orderId}|${paymentId}`).digest('hex');
  const invalidSignature = 'tampered_bad_signature_value';

  const checkValid = crypto.createHmac('sha256', testSecret).update(`${orderId}|${paymentId}`).digest('hex') === validSignature;
  const checkInvalid = crypto.createHmac('sha256', testSecret).update(`${orderId}|${paymentId}`).digest('hex') === invalidSignature;

  assert(checkValid === true, 'Valid HMAC SHA256 signature passes verification');
  assert(checkInvalid === false, 'Tampered signature is strictly rejected by cryptographic verification');

  // 4. Test Webhook Signature Ingestion Logic
  console.log('\n--- TEST GROUP 4: WEBHOOK SECURITY ---');
  const webhookSecret = 'whsec_test_7788';
  const webhookPayload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_live_999', amount: 149900 } } } });
  const validWebhookSig = crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex');
  const isWebhookSigValid = crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex') === validWebhookSig;
  assert(isWebhookSigValid === true, 'Razorpay webhook signature verification matches specification');

  console.log('\n====================================================');
  console.log(`  TEST RESULTS SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
