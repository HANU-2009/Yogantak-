import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const API_BASE = 'http://localhost:5000';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runComprehensiveAudit() {
  console.log('========================================================================');
  console.log('   YOGANTAK E-COMMERCE END-TO-END POST-FIX VERIFICATION & AUDIT SUITE   ');
  console.log('========================================================================\n');

  const results: Record<string, 'PASS' | 'FAIL'> = {};
  const issues: string[] = [];

  // Helper for HTTP requests
  async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, json, text };
  }

  // Helper for DB query
  async function dbQuery(sql: string, params: any[] = []) {
    return pool.query(sql, params);
  }

  // -------------------------------------------------------------------------
  // SECTION 1 & 2 & 3: REAL CHECKOUT, DATABASE, AND INVENTORY VERIFICATION
  // -------------------------------------------------------------------------
  console.log('>>> [1, 2, 3] TESTING REAL CHECKOUT, DATABASE, & INVENTORY DEDUCTION...');
  
  // Find a product with stock
  await dbQuery("UPDATE products SET stock = 25 WHERE id = 'prod_1786702589679_2d0mw0' OR stock < 10;");
  const catalogRes = await dbQuery("SELECT id, name, price, stock FROM products WHERE stock >= 5 LIMIT 1;");
  const testProduct = catalogRes.rows[0];
  const stockBefore = Number(testProduct.stock);
  const purchaseQuantity = 2;
  const expectedStockAfter = stockBefore - purchaseQuantity;
  const testCustomerEmail = `e2e.customer.${Date.now()}@yogantak.com`;
  const paymentId = `pay_e2e_${Date.now()}`;

  console.log(`    Selected Product: "${testProduct.name}" (ID: ${testProduct.id})`);
  console.log(`    Stock Before Purchase: ${stockBefore}`);

  // Create real checkout request mimicking frontend CheckoutModal.tsx
  const checkoutPayload = {
    userId: testCustomerEmail,
    email: testCustomerEmail,
    shippingName: 'E2E Verified Customer',
    shippingAddress: '742 Evergreen Terrace',
    shippingCity: 'Bengaluru',
    shippingState: 'Karnataka',
    shippingZip: '560001',
    shippingCountry: 'India',
    shippingPhone: '+919876543210',
    paymentId: paymentId,
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        price: Number(testProduct.price),
        quantity: purchaseQuantity,
        selectedModel: 'iPhone 15 Pro Max',
        selectedMaterial: 'Armor Grade Polycarbonate',
        customConfig: { finish: 'glossy' },
        image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500'
      }
    ]
  };

  const checkoutRes = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify(checkoutPayload)
  });

  if (!checkoutRes.ok || !checkoutRes.json?.success) {
    console.error('❌ Checkout API call failed:', checkoutRes.text);
    results['A. REAL CHECKOUT'] = 'FAIL';
    results['B. DATABASE'] = 'FAIL';
    results['C. INVENTORY'] = 'FAIL';
    issues.push(`Checkout API returned error: ${checkoutRes.text}`);
  } else {
    results['A. REAL CHECKOUT'] = 'PASS';
    const orderId = checkoutRes.json.orderId;
    console.log(`✅ Order successfully created via live API: Order ID = "${orderId}"`);

    // Verify Database records in PostgreSQL
    const orderDbRes = await dbQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
    const itemsDbRes = await dbQuery('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

    const orderRow = orderDbRes.rows[0];
    const itemsRows = itemsDbRes.rows;

    const dbValid = orderRow &&
      orderRow.id === orderId &&
      orderRow.email.toLowerCase() === testCustomerEmail.toLowerCase() &&
      orderRow.payment_id === paymentId &&
      orderRow.status === 'processing' &&
      itemsRows.length === 1 &&
      itemsRows[0].product_id === testProduct.id &&
      itemsRows[0].quantity === purchaseQuantity &&
      itemsRows[0].selected_model === 'iPhone 15 Pro Max';

    if (dbValid) {
      console.log('✅ PostgreSQL database record confirmed in `orders` and `order_items`');
      results['B. DATABASE'] = 'PASS';
    } else {
      console.error('❌ Database mismatch in PostgreSQL:', { orderRow, itemsRows });
      results['B. DATABASE'] = 'FAIL';
      issues.push('PostgreSQL record does not match expected order and items format');
    }

    // Verify Inventory Deduction in PostgreSQL
    const stockCheckRes = await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id]);
    const stockAfter = Number(stockCheckRes.rows[0].stock);
    console.log(`    Stock After Purchase: ${stockAfter} (Expected: ${expectedStockAfter})`);

    if (stockAfter === expectedStockAfter) {
      console.log('✅ Product inventory accurately decreased by purchased quantity in PostgreSQL');
      results['C. INVENTORY'] = 'PASS';
    } else {
      console.error(`❌ Inventory error: Expected ${expectedStockAfter}, got ${stockAfter}`);
      results['C. INVENTORY'] = 'FAIL';
      issues.push(`Inventory was not deducted accurately: Expected ${expectedStockAfter}, got ${stockAfter}`);
    }

    // -------------------------------------------------------------------------
    // SECTION 4: ADMIN VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n>>> [4] TESTING ADMIN ORDER RETRIEVAL FROM POSTGRESQL...');
    const adminOrdersRes = await api('/api/admin/orders');
    if (!adminOrdersRes.ok || !Array.isArray(adminOrdersRes.json)) {
      console.error('❌ Failed to fetch admin orders:', adminOrdersRes.text);
      results['D. ADMIN RESULT'] = 'FAIL';
      issues.push('Admin orders endpoint returned error');
    } else {
      const foundInAdmin = adminOrdersRes.json.find((o: any) => o.id === orderId);
      if (foundInAdmin && foundInAdmin.items && foundInAdmin.items.length > 0 && foundInAdmin.email === testCustomerEmail) {
        console.log(`✅ Newly placed order "${orderId}" successfully retrieved via Admin API from PostgreSQL`);
        results['D. ADMIN RESULT'] = 'PASS';
      } else {
        console.error('❌ Order not found in Admin API response or missing items');
        results['D. ADMIN RESULT'] = 'FAIL';
        issues.push('Admin API did not return newly created order with items');
      }
    }

    // -------------------------------------------------------------------------
    // SECTION 5: CUSTOMER ORDER HISTORY
    // -------------------------------------------------------------------------
    console.log('\n>>> [5] TESTING CUSTOMER ORDER HISTORY...');
    // Create JWT token for the customer
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    // We test optionalAuth with query or bearer
    const customerOrdersRes = await api('/api/orders/history', {
      headers: {
        'Authorization': `Bearer ${createTestToken(testCustomerEmail, 'customer')}`
      }
    });

    if (!customerOrdersRes.ok || !Array.isArray(customerOrdersRes.json)) {
      console.error('❌ Customer order history fetch failed:', customerOrdersRes.text);
      results['E. CUSTOMER ORDER HISTORY'] = 'FAIL';
      issues.push('Customer order history endpoint failed');
    } else {
      const foundInHistory = customerOrdersRes.json.find((o: any) => o.id === orderId);
      if (foundInHistory && foundInHistory.items?.length > 0) {
        console.log(`✅ Order "${orderId}" correctly visible in Customer Order History`);
        results['E. CUSTOMER ORDER HISTORY'] = 'PASS';
      } else {
        console.error('❌ Order not found in customer order history');
        results['E. CUSTOMER ORDER HISTORY'] = 'FAIL';
        issues.push('Order missing from customer order history');
      }
    }

    // -------------------------------------------------------------------------
    // SECTION 6: PAYMENT VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n>>> [6] TESTING CRYPTOGRAPHIC PAYMENT SIGNATURE VERIFICATION...');
    const rzpOrderId = `order_test_${Date.now()}`;
    const rzpPaymentId = `pay_test_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const validSignature = crypto.createHmac('sha256', secret).update(`${rzpOrderId}|${rzpPaymentId}`).digest('hex');

    const verifySuccessRes = await api('/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: validSignature
      })
    });

    const verifyTamperedRes = await api('/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: 'fake_tampered_signature_12345'
      })
    });

    if (verifySuccessRes.json?.verified === true && verifyTamperedRes.json?.verified === false) {
      console.log('✅ Payment signature verification rigorously validates authentic signatures and rejects forged attempts');
      results['F. PAYMENT VERIFICATION'] = 'PASS';
    } else {
      console.error('❌ Payment signature verification failed:', { verifySuccessRes: verifySuccessRes.json, verifyTamperedRes: verifyTamperedRes.json });
      results['F. PAYMENT VERIFICATION'] = 'FAIL';
      issues.push('Payment verification failed to properly validate signatures');
    }

    // -------------------------------------------------------------------------
    // SECTION 7 & 8: CANCELLATION & DOUBLE-CANCELLATION IDEMPOTENCY TEST
    // -------------------------------------------------------------------------
    console.log('\n>>> [7, 8] TESTING CANCELLATION & DOUBLE-CANCELLATION IDEMPOTENCY...');
    const cancelRes1 = await api(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${createTestToken(testCustomerEmail, 'customer')}`
      },
      body: JSON.stringify({ reason: 'E2E Customer Cancellation Test' })
    });

    const stockAfterCancel1 = await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id]);
    const restoredStock = Number(stockAfterCancel1.rows[0].stock);
    console.log(`    Stock After First Cancellation: ${restoredStock} (Expected: ${stockBefore})`);

    // Perform SECOND cancellation attempt on the SAME order (Double-cancellation)
    const cancelRes2 = await api(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${createTestToken(testCustomerEmail, 'customer')}`
      },
      body: JSON.stringify({ reason: 'Duplicate Cancellation Attempt' })
    });

    const stockAfterCancel2 = await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id]);
    const stockAfterSecondCancel = Number(stockAfterCancel2.rows[0].stock);
    console.log(`    Stock After Second Cancellation: ${stockAfterSecondCancel} (Must remain: ${stockBefore})`);

    const refundRows = (await dbQuery('SELECT * FROM refunds WHERE order_id = $1', [orderId])).rows;
    console.log(`    Refund records count for order "${orderId}": ${refundRows.length} (Must be exactly 1)`);

    if (
      cancelRes1.json?.success === true &&
      restoredStock === stockBefore &&
      cancelRes2.json?.success === true &&
      stockAfterSecondCancel === stockBefore &&
      refundRows.length === 1
    ) {
      console.log('✅ Cancellation restores stock exactly once; duplicate cancellation is strictly idempotent');
      results['G. CANCELLATION'] = 'PASS';
    } else {
      console.error('❌ Cancellation test failed:', { cancelRes1: cancelRes1.json, cancelRes2: cancelRes2.json, restoredStock, stockAfterSecondCancel, refundCount: refundRows.length });
      results['G. CANCELLATION'] = 'FAIL';
      issues.push('Cancellation or double-cancellation idempotency failed');
    }

    // -------------------------------------------------------------------------
    // SECTION 9: ADMIN + CUSTOMER DOUBLE-RESTOCK TEST
    // -------------------------------------------------------------------------
    console.log('\n>>> [9] TESTING ADMIN + CUSTOMER DOUBLE-RESTOCK PREVENTION...');
    // The order is already cancelled. Now Admin tries to change status to 'cancelled' again
    await api(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${createTestToken('admin@yogantak.com', 'admin')}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });

    const stockAfterAdminCancel = Number((await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id])).rows[0].stock);
    console.log(`    Stock After Admin Cancels Already-Cancelled Order: ${stockAfterAdminCancel} (Must remain: ${stockBefore})`);

    const totalRefunds = (await dbQuery('SELECT * FROM refunds WHERE order_id = $1', [orderId])).rows.length;
    if (stockAfterAdminCancel === stockBefore && totalRefunds === 1) {
      console.log('✅ Admin status update correctly prevents double inventory restoration and duplicate refunds');
    } else {
      console.error('❌ Admin double-restock bug detected: Inventory restored twice or duplicate refund created!');
      issues.push('Admin status update restored inventory twice on already-cancelled order');
    }

    // -------------------------------------------------------------------------
    // SECTION 10: REFUND LEDGER VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n>>> [10] TESTING REFUND RECORD INTEGRITY...');
    const refundRecord = refundRows[0];
    const refundValid = refundRecord &&
      refundRecord.order_id === orderId &&
      refundRecord.user_email.toLowerCase() === testCustomerEmail.toLowerCase() &&
      Number(refundRecord.amount) > 0 &&
      refundRecord.status &&
      refundRecord.created_at;

    if (refundValid) {
      console.log(`✅ Authoritative Refund Ledger record confirmed in PostgreSQL: ID = ${refundRecord.id}, Status = ${refundRecord.status}, Amount = ₹${refundRecord.amount}`);
      results['H. REFUND'] = 'PASS';
    } else {
      console.error('❌ Refund ledger record missing or invalid in PostgreSQL');
      results['H. REFUND'] = 'FAIL';
      issues.push('Refund record incomplete in database');
    }

    // -------------------------------------------------------------------------
    // SECTION 11: DUPLICATE CHECKOUT TEST
    // -------------------------------------------------------------------------
    console.log('\n>>> [11] TESTING DUPLICATE CHECKOUT IDEMPOTENCY...');
    const duplicateStockBefore = Number((await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id])).rows[0].stock);
    const duplicatePaymentId = `pay_dup_test_${Date.now()}`;

    const dupPayload = {
      ...checkoutPayload,
      paymentId: duplicatePaymentId,
      email: `dup.${Date.now()}@yogantak.com`
    };

    // First checkout call
    const firstDupRes = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify(dupPayload)
    });
    const firstOrderId = firstDupRes.json?.orderId;
    const stockAfterFirst = Number((await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id])).rows[0].stock);

    // Second checkout call with EXACT same paymentId
    const secondDupRes = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify(dupPayload)
    });
    const stockAfterSecond = Number((await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id])).rows[0].stock);

    const dupOrderCount = (await dbQuery('SELECT COUNT(*) as count FROM orders WHERE payment_id = $1', [duplicatePaymentId])).rows[0].count;

    if (
      firstDupRes.ok &&
      secondDupRes.ok &&
      Number(dupOrderCount) === 1 &&
      stockAfterSecond === stockAfterFirst &&
      secondDupRes.json?.orderId === firstOrderId
    ) {
      console.log('✅ Duplicate checkout with same payment ID successfully deduplicated without duplicate stock deduction');
      results['I. DUPLICATE PROTECTION'] = 'PASS';
    } else {
      console.error('❌ Duplicate checkout test failed:', { firstDupRes: firstDupRes.json, secondDupRes: secondDupRes.json, dupOrderCount, stockAfterFirst, stockAfterSecond });
      results['I. DUPLICATE PROTECTION'] = 'FAIL';
      issues.push('Duplicate checkout protection failed to prevent duplicate order or stock deduction');
    }

    // -------------------------------------------------------------------------
    // SECTION 12: PAYMENT FAILURE / INVALID INPUT TEST
    // -------------------------------------------------------------------------
    console.log('\n>>> [12] TESTING OUT OF STOCK / FAILED CHECKOUT SCENARIO...');
    const initialStockForFailTest = Number((await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id])).rows[0].stock);
    
    // Attempt purchase exceeding available stock
    const excessiveQuantity = initialStockForFailTest + 1000;
    const failPayload = {
      ...checkoutPayload,
      email: 'fail.test@yogantak.com',
      paymentId: `pay_fail_${Date.now()}`,
      items: [{ ...checkoutPayload.items[0], quantity: excessiveQuantity }]
    };

    const failRes = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify(failPayload)
    });

    const stockAfterFail = Number((await dbQuery('SELECT stock FROM products WHERE id = $1', [testProduct.id])).rows[0].stock);

    if (failRes.status === 409 && failRes.json?.error?.code === 'OUT_OF_STOCK' && stockAfterFail === initialStockForFailTest) {
      console.log('✅ Out-of-stock / invalid purchase safely rejected with 409 Conflict, preserving stock balance');
    } else {
      console.error('❌ Failed purchase did not reject cleanly or modified stock:', { failRes: failRes.json, stockAfterFail, initialStockForFailTest });
      issues.push('Out-of-stock checkout was not cleanly rejected');
    }
  }

  console.log('\n========================================================================');
  console.log('                         AUDIT RESULTS SUMMARY                          ');
  console.log('========================================================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`  ${key.padEnd(30)}: ${val === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  }
  console.log(`  REMAINING BUGS / ISSUES       : ${issues.length === 0 ? 'NONE (0)' : issues.join(', ')}`);
  console.log('========================================================================\n');

  await pool.end();

  if (issues.length > 0) process.exit(1);
}

function createTestToken(email: string, role: string) {
  // Simple HMAC-SHA256 JWT generator for verification testing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: email,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

runComprehensiveAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
