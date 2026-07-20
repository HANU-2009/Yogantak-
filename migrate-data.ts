import dotenv from 'dotenv';
dotenv.config();
import { db } from './server/db.js';
import { adminDb } from './server/firebase.js';

async function migrateData() {
  if (!adminDb) {
    console.error('Firebase Admin SDK is not initialized. Check your .env credentials.');
    process.exit(1);
  }

  console.log('--- Starting Data Migration from Postgres to Firestore ---');

  try {
    // 1. Migrate Users, Carts, and Wishlists
    console.log('Fetching users from Postgres...');
    const usersRes = await db.query('SELECT * FROM users');
    const users = usersRes.rows;

    for (const user of users) {
      console.log(`Migrating user: ${user.email}...`);
      
      // Get cart
      const cartRes = await db.query('SELECT cart_items FROM carts WHERE user_id = $1', [user.id]);
      const cartData = cartRes.rows[0];
      const cart = cartData ? JSON.parse(cartData.cart_items) : [];

      // Get wishlist
      const wishlistRes = await db.query('SELECT product_id FROM wishlist WHERE user_id = $1', [user.id]);
      const wishlist = wishlistRes.rows.map((row: any) => row.product_id);

      const userDoc = {
        id: user.email,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
        cart: cart,
        wishlist: wishlist
      };

      await adminDb.collection('users').doc(user.email.toLowerCase()).set(userDoc);
    }
    console.log(`Migrated ${users.length} users (with carts and wishlists).`);

    // 2. Migrate Orders & Order Items
    console.log('Fetching orders from Postgres...');
    const ordersRes = await db.query('SELECT * FROM orders');
    const orders = ordersRes.rows;

    for (const order of orders) {
      console.log(`Migrating order: ${order.id}...`);

      const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      const items = itemsRes.rows.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price,
        customConfig: item.custom_config ? (typeof item.custom_config === 'string' ? JSON.parse(item.custom_config) : item.custom_config) : null
      }));

      const orderDoc = {
        id: order.id,
        userId: order.email, // using email as ID
        email: order.email,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        shippingName: order.shipping_name,
        shippingAddress: order.shipping_address,
        shippingCity: order.shipping_city,
        shippingState: order.shipping_state,
        shippingZip: order.shipping_zip,
        shippingCountry: order.shipping_country,
        couponCode: order.coupon_code || null,
        paymentId: order.payment_id || null,
        createdAt: new Date(order.created_at).toISOString(),
        items: items
      };

      await adminDb.collection('orders').doc(order.id).set(orderDoc);
    }
    console.log(`Migrated ${orders.length} orders (with items).`);

    // 3. Migrate Reviews
    console.log('Fetching reviews from Postgres...');
    const reviewsRes = await db.query('SELECT * FROM reviews');
    const reviews = reviewsRes.rows;

    for (const review of reviews) {
      const reviewDoc = {
        productId: review.product_id,
        reviewerName: review.reviewer_name,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.created_at).toISOString()
      };
      // Firestore assigns a random ID automatically
      await adminDb.collection('reviews').add(reviewDoc);
    }
    console.log(`Migrated ${reviews.length} reviews.`);

    // 4. Migrate Newsletter Subscribers
    console.log('Fetching newsletter subscribers from Postgres...');
    const subsRes = await db.query('SELECT * FROM newsletter_subscribers');
    const subscribers = subsRes.rows;

    for (const sub of subscribers) {
      const subDoc = {
        email: sub.email,
        createdAt: new Date(sub.created_at).toISOString()
      };
      await adminDb.collection('newsletter_subscribers').doc(sub.email.toLowerCase()).set(subDoc);
    }
    console.log(`Migrated ${subscribers.length} newsletter subscribers.`);

    // 5. DROP TABLES IN POSTGRES
    console.log('--- Data migration complete. Dropping Postgres tables... ---');
    await db.query(`
      DROP TABLE IF EXISTS 
        order_items, 
        orders, 
        carts, 
        wishlist, 
        reviews, 
        users, 
        newsletter_subscribers 
      CASCADE;
    `);
    console.log('Postgres user tables dropped successfully.');

    console.log('--- FULL MIGRATION SUCCESSFUL ---');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Let Firebase auth initialize before we use it
setTimeout(() => {
  migrateData();
}, 2000);
