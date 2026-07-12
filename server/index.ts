import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db, initSchema } from './db.js';
import { adminAuth } from './firebase.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import https from 'https';

// Initialize DB schema on startup
initSchema();

// ── Helper: decode a Firebase JWT payload without verifying signature (dev-mode fallback) ──
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// ── Shared helper: upsert user into DB and return user + cart ──
function syncUserToDB(email: string, name: string): { user: any; cart: any[] } {
  // Determine if this user should be granted admin credentials
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : [];

  const defaultAdmins = [
    'sonpureachintya@gmail.com'
  ];

  const isAdmin = envAdmins.includes(email.toLowerCase()) || defaultAdmins.includes(email.toLowerCase());
  const targetRole = isAdmin ? 'admin' : 'customer';

  const selectQuery = db.prepare('SELECT * FROM users WHERE email = ?');
  let user = selectQuery.get(email) as any;

  if (!user) {
    const fullName = name || email.split('@')[0];
    const insert = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, 'firebase_managed', ?, ?)
    `);
    const info = insert.run(email, fullName, targetRole);
    const userId = Number(info.lastInsertRowid);
    user = { id: userId, email, full_name: fullName, role: targetRole };
  } else if (user.role !== targetRole) {
    const update = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    update.run(targetRole, user.id);
    user.role = targetRole;
    console.log(`[SQLITE] Promoted user ${email} to ${targetRole} role.`);
  }

  const cartQuery = db.prepare('SELECT cart_items FROM carts WHERE user_id = ?');
  const cartData = cartQuery.get(user.id) as any;
  const cart = cartData ? JSON.parse(cartData.cart_items) : [];

  return {
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    cart
  };
}

// ── Helper: format a product row from DB into the API response shape ──
function formatProduct(product: any) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: product.price,
    basePrice: product.price,        // backward compat alias
    stock: product.stock ?? 0,
    category: product.category || 'general',
    rating: product.rating ?? 5.0,
    reviewsCount: product.reviews_count ?? 0,
    image: product.image_data || product.image_url || '',
    image_data: product.image_data || '',
    image_url: product.image_url || '',
    // Legacy empty arrays so old cart/checkout components don't crash
    models: [],
    materials: [],
    colors: [],
    tags: [],
    features: [],
    magsafe: false,
    bestseller: false,
    ecoFriendly: false,
    createdAt: product.created_at
  };
}

const app = express();

// Increase body size limit to 20MB to support base64 image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic Rate Limiting
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const limitTime = 60 * 1000; // 1 minute
  const maxRequests = 200; // increased for image uploads

  let tracking = ipRequestCounts.get(ip);
  if (!tracking || now > tracking.resetTime) {
    tracking = { count: 1, resetTime: now + limitTime };
  } else {
    tracking.count++;
  }
  ipRequestCounts.set(ip, tracking);

  if (tracking.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
});

// Auth Middleware
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    fullName: string;
  };
}

async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    let email: string | undefined;

    if (adminAuth) {
      // Production path — full Firebase token verification
      const decodedToken = await adminAuth.verifyIdToken(token);
      email = decodedToken.email?.toLowerCase();
    } else {
      // Development fallback — decode JWT without verifying signature
      const payload = decodeJwtPayload(token);
      if (payload) {
        email = (payload.email || '').toLowerCase();
      }
    }

    if (!email) {
      res.status(403).json({ error: 'Token missing email claim' });
      return;
    }

    // Look up the user in our local SQLite database by email
    const userQuery = db.prepare('SELECT id, email, role, full_name as fullName FROM users WHERE email = ?');
    const user = userQuery.get(email) as any;

    if (!user) {
      // Auto-sync unknown user on token validation
      const { user: syncedUser } = syncUserToDB(email, '');
      req.user = {
        id: syncedUser.id,
        email: syncedUser.email,
        role: syncedUser.role,
        fullName: syncedUser.fullName
      };
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }
  next();
}

// ==========================================
// 1. FIREBASE AUTHENTICATION SYNC
// ==========================================

// POST /api/auth/sync — Called after Firebase client-side sign-in with a Firebase ID token
app.post('/api/auth/sync', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    let email: string | undefined;
    let name: string | undefined;

    if (adminAuth) {
      // Production path — full Firebase Admin SDK verification
      const decodedToken = await adminAuth.verifyIdToken(token);
      email = decodedToken.email?.toLowerCase();
      name = decodedToken.name;
    } else {
      // Dev-mode fallback: decode JWT payload without signature verification
      console.warn('[DEV MODE] Firebase Admin SDK not available — using unverified JWT decode for /api/auth/sync');
      const payload = decodeJwtPayload(token);
      if (!payload) {
        res.status(400).json({ error: 'Could not decode token payload' });
        return;
      }
      email = (payload.email || '').toLowerCase();
      name = payload.name;
    }

    if (!email) {
      res.status(400).json({ error: 'Token missing email claim' });
      return;
    }

    const { user, cart } = syncUserToDB(email, name || '');
    res.json({ user, cart });

  } catch (error) {
    console.error('Sync Error:', error);
    res.status(403).json({ error: 'Invalid or expired Firebase token' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/google — Google OAuth callback handler
app.post('/api/auth/google', async (req, res) => {
  const { token, isMock, email: mockEmail, name: mockName } = req.body;

  try {
    let email: string;
    let name: string;

    if (isMock) {
      if (!mockEmail) {
        res.status(400).json({ error: 'Mock email is required' });
        return;
      }
      email = mockEmail.toLowerCase();
      name = mockName || 'Google User';
    } else if (token) {
      // Decode Google ID token payload
      const payload = decodeJwtPayload(token);
      if (!payload) {
        res.status(400).json({ error: 'Invalid Google credential token' });
        return;
      }
      email = (payload.email || '').toLowerCase();
      name = payload.name || '';
    } else {
      res.status(400).json({ error: 'No token or mock data provided' });
      return;
    }

    const { user, cart } = syncUserToDB(email, name);
    const sessionToken = isMock
      ? Buffer.from(JSON.stringify({ email, name, iat: Date.now(), mock: true })).toString('base64')
      : token;

    res.json({ token: sessionToken, user, cart });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: error.message || 'Google auth failed' });
  }
});

// POST /api/auth/microsoft — Microsoft OAuth callback handler
app.post('/api/auth/microsoft', async (req, res) => {
  const { accessToken, isMock, email: mockEmail, name: mockName } = req.body;

  try {
    let email: string;
    let name: string;

    if (isMock) {
      if (!mockEmail) {
        res.status(400).json({ error: 'Mock email is required' });
        return;
      }
      email = mockEmail.toLowerCase();
      name = mockName || 'Microsoft User';
    } else if (accessToken) {
      // Fetch Microsoft Graph profile with the access token
      const msProfile = await new Promise<any>((resolve, reject) => {
        const options = {
          hostname: 'graph.microsoft.com',
          path: '/v1.0/me',
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` }
        };
        const msReq = https.request(options, (msRes) => {
          let data = '';
          msRes.on('data', (chunk: string) => data += chunk);
          msRes.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Invalid Microsoft profile response')); }
          });
        });
        msReq.on('error', reject);
        msReq.end();
      });
      email = (msProfile.mail || msProfile.userPrincipalName || '').toLowerCase();
      name = msProfile.displayName || '';
    } else {
      res.status(400).json({ error: 'No access token or mock data provided' });
      return;
    }

    const { user, cart } = syncUserToDB(email, name);
    const sessionToken = Buffer.from(JSON.stringify({ email, name, iat: Date.now() })).toString('base64');
    res.json({ token: sessionToken, user, cart });

  } catch (error: any) {
    console.error('Microsoft auth error:', error);
    res.status(500).json({ error: error.message || 'Microsoft auth failed' });
  }
});

// ── OTP Authentication ──
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const DEMO_OTP = '4821';

app.post('/api/auth/otp/send', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), { code: DEMO_OTP, expiresAt });
  console.log(`[OTP] Code for ${email}: ${DEMO_OTP}`);
  res.json({ success: true, message: 'OTP sent successfully' });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Email and OTP code are required' });
    return;
  }

  const storedOtp = otpStore.get(email.toLowerCase());
  if (!storedOtp) {
    res.status(400).json({ error: 'No OTP requested for this email. Please request a new one.' });
    return;
  }
  if (Date.now() > storedOtp.expiresAt) {
    otpStore.delete(email.toLowerCase());
    res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    return;
  }
  if (storedOtp.code !== code.trim()) {
    res.status(400).json({ error: `Invalid OTP code. Please enter ${DEMO_OTP}.` });
    return;
  }

  otpStore.delete(email.toLowerCase());
  const { user, cart } = syncUserToDB(email.toLowerCase(), '');
  const sessionToken = Buffer.from(JSON.stringify({ email: email.toLowerCase(), iat: Date.now(), method: 'otp' })).toString('base64');
  res.json({ token: sessionToken, user, cart });
});


// ==========================================
// 2. PRODUCT CATALOG APIS (FLAT SCHEMA)
// ==========================================

// GET /api/products — Public product catalog
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as any[];
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product catalog' });
  }
});

// GET /api/products/:id — Single product detail
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Reviews fetch and post
app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  try {
    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { rating, comment, reviewerName } = req.body;

  if (!rating || !comment || !reviewerName) {
    return res.status(400).json({ error: 'Rating, comment and name are required' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO reviews (product_id, reviewer_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(id, reviewerName, rating, comment);

    // Update product overall rating metrics
    const stats = db.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(id) as countReviews
      FROM reviews WHERE product_id = ?
    `).get(id) as any;

    const update = db.prepare(`
      UPDATE products
      SET rating = ?, reviews_count = ?
      WHERE id = ?
    `);
    update.run(Number(stats.avgRating.toFixed(1)), stats.countReviews, id);

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==========================================
// 3. PERSISTENT CART & WISHLIST APIS
// ==========================================

app.get('/api/cart', authenticateToken, (req: AuthRequest, res) => {
  try {
    const query = db.prepare('SELECT cart_items FROM carts WHERE user_id = ?');
    const data = query.get(req.user!.id) as any;
    res.json(data ? JSON.parse(data.cart_items) : []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

app.post('/api/cart', authenticateToken, (req: AuthRequest, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array required' });
  }

  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO carts (user_id, cart_items, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    insert.run(req.user!.id, JSON.stringify(items));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save cart state' });
  }
});

app.get('/api/wishlist', authenticateToken, (req: AuthRequest, res) => {
  try {
    const items = db.prepare('SELECT product_id FROM wishlist WHERE user_id = ?').all(req.user!.id) as any[];
    res.json(items.map(i => i.product_id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

app.post('/api/wishlist', authenticateToken, (req: AuthRequest, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  try {
    const insert = db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)');
    insert.run(req.user!.id, productId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

app.delete('/api/wishlist/:productId', authenticateToken, (req: AuthRequest, res) => {
  const { productId } = req.params;
  try {
    const del = db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?');
    del.run(req.user!.id, productId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete wishlist item' });
  }
});

// ==========================================
// 4. CHECKOUT & COUPON APIS
// ==========================================

app.post('/api/coupons/apply', (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code || cartTotal === undefined) {
    return res.status(400).json({ error: 'Coupon code and cartTotal required' });
  }

  const query = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1');
  const coupon = query.get(code.toUpperCase()) as any;

  if (!coupon) {
    return res.status(400).json({ error: 'Invalid or deactivated coupon code' });
  }

  if (cartTotal < coupon.min_purchase) {
    return res.status(400).json({ error: `Voucher requires a minimum purchase of ₹${coupon.min_purchase}` });
  }

  let discount = 0;
  if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  } else if (coupon.discount_type === 'percent') {
    discount = cartTotal * (coupon.discount_value / 100);
  }

  res.json({
    code: coupon.code,
    discount: Number(discount.toFixed(2)),
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value
  });
});

// ==========================================
// 5. SECURE ORDER PLACEMENT APIS
// ==========================================

app.post('/api/orders', (req, res) => {
  const {
    userId, email, items, subtotal, tax, total,
    shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry,
    couponCode, paymentId
  } = req.body;

  if (!email || !items || !Array.isArray(items) || items.length === 0 || !total) {
    return res.status(400).json({ error: 'Order validation failed: missing required fields' });
  }

  try {
    // Stock verification for each item
    for (const item of items) {
      if (item.product?.id?.startsWith('bespoke-')) continue;
      const prod = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product?.id) as any;
      if (prod && prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.product?.name}" (only ${prod.stock} left)`
        });
      }
    }

    // Deduct stock
    for (const item of items) {
      if (item.product?.id?.startsWith('bespoke-')) continue;
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?')
        .run(item.quantity, item.product?.id);
    }

    // Create unique Order ID
    const orderId = `YGT-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, user_id, email, status, subtotal, tax, total, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, coupon_code, payment_id)
      VALUES (?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderId,
      userId || null,
      email,
      subtotal,
      tax,
      total,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      couponCode || null,
      paymentId || `PAY-MOCK-${Date.now()}`
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price, custom_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertOrderItem.run(
        orderId,
        item.product?.id || 'unknown',
        item.product?.name || 'Product',
        item.quantity,
        item.price,
        item.customConfig ? JSON.stringify(item.customConfig) : null
      );
    }

    // Clear saved cart on purchase if user was authenticated
    if (userId) {
      db.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);
    }

    res.status(201).json({
      success: true,
      orderId,
      estimatedDelivery: '2-3 Business Days via DHL Express'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.get('/api/orders/history', authenticateToken, (req: AuthRequest, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[];

    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
      const enrichedItems = items.map(item => {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as any;
        let finalProduct = product ? formatProduct(product) : {
          id: item.product_id,
          name: item.product_name || 'Product',
          image: '',
          price: item.price
        };

        return {
          id: item.id,
          product: finalProduct,
          quantity: item.quantity,
          selectedModel: item.selected_model || null,
          selectedMaterial: item.selected_material || null,
          selectedColor: { id: 'default', name: 'Default', bgClass: 'bg-gray-900' },
          price: item.price,
          customConfig: item.custom_config ? JSON.parse(item.custom_config) : null
        };
      });

      return {
        id: order.id,
        date: new Date(order.created_at).toLocaleDateString() + ' at ' + new Date(order.created_at).toLocaleTimeString(),
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        shipping: {
          fullName: order.shipping_name,
          addressLine1: order.shipping_address,
          city: order.shipping_city,
          state: order.shipping_state,
          postalCode: order.shipping_zip,
          country: order.shipping_country
        },
        items: enrichedItems
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.post('/api/orders/:id/cancel', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Verify ownership
    if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(id);

    // Restore stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as any[];
    for (const item of items) {
      if (item.product_id?.startsWith('bespoke-')) continue;
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ==========================================
// 6. RAZORPAY PAYMENT GATEWAY
// ==========================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

app.post('/api/payments/razorpay/order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const amountPaise = Number(amount);
    if (isNaN(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1)' });
    }

    const hasKeys = process.env.RAZORPAY_KEY_ID &&
                    process.env.RAZORPAY_KEY_SECRET &&
                    process.env.RAZORPAY_KEY_ID !== 'YOUR_KEY_ID' &&
                    process.env.RAZORPAY_KEY_SECRET !== 'YOUR_KEY_SECRET';

    if (!hasKeys) {
      return res.json({
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        order_id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountPaise,
        currency: currency || 'INR',
        entity: 'order',
        isMock: true
      });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`
    });

    res.json({
      id: (order as any).id,
      order_id: (order as any).id,
      amount: (order as any).amount,
      currency: (order as any).currency,
      entity: (order as any).entity,
      isMock: false
    });

  } catch (err: any) {
    console.error('Razorpay order creation failure:', err);
    res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
  }
});

app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (razorpay_signature === 'mock_signature') {
    return res.json({ verified: true, message: 'Mock payment signature accepted' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid payment signature' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Signature verification error' });
  }
});

// Alias for CheckoutModal compatibility
app.post('/api/create-order', async (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt } = req.body;
  if (!amount || typeof amount !== 'number' || amount < 100) {
    return res.status(400).json({ error: 'Amount must be a number >= 100 paise (₹1)' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    } as any);

    res.json({
      order_id: (order as any).id,
      id: (order as any).id,
      amount: (order as any).amount,
      currency: (order as any).currency
    });
  } catch (err: any) {
    console.error('[RAZORPAY] Create order failed:', err);
    res.status(500).json({ error: err?.error?.description || err?.message || 'Failed to create Razorpay order' });
  }
});

app.post('/api/verify-payment', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment verification fields' });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body.toString()).digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({ verified: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ verified: false, error: 'Invalid payment signature' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==========================================
// 7. ADMIN DASHBOARD APIS
// ==========================================

// GET /api/admin/dashboard — Stats overview
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalSales = db.prepare("SELECT SUM(total) as sum FROM orders WHERE status != 'cancelled'").get() as any;
    const totalOrders = db.prepare("SELECT COUNT(id) as count FROM orders").get() as any;
    const totalCustomers = db.prepare("SELECT COUNT(id) as count FROM users WHERE role = 'customer'").get() as any;
    const lowStockItems = db.prepare("SELECT COUNT(id) as count FROM products WHERE stock <= 5").get() as any;

    const salesHistory = db.prepare(`
      SELECT DATE(created_at) as date, SUM(total) as amount, COUNT(id) as count
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `).all() as any[];

    const lowStockList = db.prepare(`
      SELECT id, name, stock, price, image_url, image_data
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC
      LIMIT 10
    `).all() as any[];

    res.json({
      stats: {
        totalRevenue: totalSales.sum || 0.0,
        ordersCount: totalOrders.count || 0,
        customersCount: totalCustomers.count || 0,
        lowStockAlerts: lowStockItems.count || 0
      },
      salesHistory,
      lowStockList: lowStockList.map(p => ({
        ...p,
        image: p.image_data || p.image_url || ''
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate dashboard metrics' });
  }
});

// GET /api/admin/products — Admin full product list with stock
app.get('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as any[];
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product list' });
  }
});

// POST /api/admin/products — Admin adds a new product (with image upload)
app.post('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, stock, category, image_data, image_url } = req.body;

  if (!name || price === undefined || price < 0) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  try {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    db.prepare(`
      INSERT INTO products (id, name, description, price, stock, category, image_data, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      description || '',
      Number(price),
      Number(stock) || 0,
      category || 'general',
      image_data || '',
      image_url || ''
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.status(201).json({ success: true, product: formatProduct(created) });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id — Admin updates product details (including image)
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_data, image_url } = req.body;

  if (!name || price === undefined || Number(price) < 0) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const fieldsToUpdate: string[] = ['name = ?', 'description = ?', 'price = ?', 'category = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [name.trim(), description || '', Number(price), category || 'general'];

    if (image_data !== undefined) {
      fieldsToUpdate.push('image_data = ?');
      values.push(image_data);
    }
    if (image_url !== undefined) {
      fieldsToUpdate.push('image_url = ?');
      values.push(image_url);
    }

    values.push(id);
    db.prepare(`UPDATE products SET ${fieldsToUpdate.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json({ success: true, product: formatProduct(updated) });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PUT /api/admin/products/:id/stock — Admin restocks a product
app.put('/api/admin/products/:id/stock', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || Number(stock) < 0) {
    return res.status(400).json({ error: 'Valid stock quantity required' });
  }

  try {
    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(Number(stock), id);

    const updated = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(id) as any;
    res.json({ success: true, id, stock: updated?.stock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// DELETE /api/admin/products/:id — Admin deletes a product
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /api/admin/orders — All orders
app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
      return { ...order, items };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// PUT /api/admin/orders/:id/status — Update order status
app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status required' });

  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/admin/coupons — All coupons
app.get('/api/admin/coupons', authenticateToken, requireAdmin, (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY code ASC').all();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/admin/coupons — Create new coupon
app.post('/api/admin/coupons', authenticateToken, requireAdmin, (req, res) => {
  const { code, discount_type, discount_value, min_purchase, expires_at } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, type, and discount value required' });
  }

  try {
    db.prepare(`
      INSERT OR REPLACE INTO coupons (code, discount_type, discount_value, min_purchase, expires_at, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(code.toUpperCase(), discount_type, Number(discount_value), Number(min_purchase) || 0, expires_at || null);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// DELETE /api/admin/coupons/:code — Delete coupon
app.delete('/api/admin/coupons/:code', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code.toUpperCase());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Newsletter Subscriber
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email.toLowerCase());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// ==========================================
// 8. STATIC FILES SERVING & ROUTING (PRODUCTION)
// ==========================================

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('Serving production-built assets from:', distPath);
  app.use(express.static(distPath));

  // SPA Fallback: serve index.html for non-api routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  console.log('Static directory dist/ does not exist. Frontend dev proxy server active.');
}

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[YOGANTAK API SERVER] listening on http://localhost:${PORT}`);
  });
}

export default app;
