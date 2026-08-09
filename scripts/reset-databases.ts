import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ADMIN_EMAILS = [
  'archanasonpure1@gmail.com',
  'achintyasonpure69@gmail.com',
  'sonpureachintya@gmail.com'
];

async function resetDatabases() {
  console.log('==========================================');
  console.log('RESETTING NEON & FIREBASE DATABASES');
  console.log('==========================================\n');

  // 1. NEON POSTGRESQL CLEANUP
  if (process.env.DATABASE_URL) {
    console.log('[NEON POSTGRES] Purging all tables...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      await pool.query('TRUNCATE TABLE products CASCADE;').catch(err => console.warn('TRUNCATE products notice:', err.message));
      await pool.query('TRUNCATE TABLE coupons CASCADE;').catch(err => console.warn('TRUNCATE coupons notice:', err.message));
      await pool.query('TRUNCATE TABLE system_settings CASCADE;').catch(err => console.warn('TRUNCATE system_settings notice:', err.message));
      console.log('✓ [NEON POSTGRES] Products, coupons, and settings successfully cleared.');
    } catch (err: any) {
      console.error('[NEON POSTGRES] Error during cleanup:', err.message);
    } finally {
      await pool.end();
    }
  } else {
    console.warn('[NEON POSTGRES] DATABASE_URL not set. Skipping Neon cleanup.');
  }

  // 2. FIREBASE FIRESTORE CLEANUP
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    console.log('\n[FIREBASE FIRESTORE] Connecting and purging non-admin data...');
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
      }

      const adminDb = getFirestore();

      // Clear Orders
      const ordersSnapshot = await adminDb.collection('orders').get();
      const orderBatch = adminDb.batch();
      ordersSnapshot.docs.forEach(doc => orderBatch.delete(doc.ref));
      await orderBatch.commit();
      console.log(`✓ [FIREBASE] Cleared ${ordersSnapshot.size} orders.`);

      // Clear Reviews
      const reviewsSnapshot = await adminDb.collection('reviews').get();
      const reviewBatch = adminDb.batch();
      reviewsSnapshot.docs.forEach(doc => reviewBatch.delete(doc.ref));
      await reviewBatch.commit();
      console.log(`✓ [FIREBASE] Cleared ${reviewsSnapshot.size} reviews.`);

      // Clear Coupons
      const couponsSnapshot = await adminDb.collection('coupons').get();
      const couponBatch = adminDb.batch();
      couponsSnapshot.docs.forEach(doc => couponBatch.delete(doc.ref));
      await couponBatch.commit();
      console.log(`✓ [FIREBASE] Cleared ${couponsSnapshot.size} coupons.`);

      // Clear Newsletter Subscribers
      const subSnapshot = await adminDb.collection('newsletter_subscribers').get();
      const subBatch = adminDb.batch();
      subSnapshot.docs.forEach(doc => subBatch.delete(doc.ref));
      await subBatch.commit();
      console.log(`✓ [FIREBASE] Cleared ${subSnapshot.size} newsletter subscribers.`);

      // Clear Users except the 3 admins, and ensure 3 admins exist as 'admin'
      const usersSnapshot = await adminDb.collection('users').get();
      for (const doc of usersSnapshot.docs) {
        const userEmail = doc.id.toLowerCase();
        if (!ADMIN_EMAILS.includes(userEmail)) {
          await doc.ref.delete();
          console.log(`  - Deleted non-admin user: ${userEmail}`);
        }
      }

      // Upsert the 3 Admin accounts in Firebase
      for (const adminEmail of ADMIN_EMAILS) {
        const name = adminEmail.split('@')[0];
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        await adminDb.collection('users').doc(adminEmail).set({
          id: adminEmail,
          email: adminEmail,
          fullName: formattedName,
          role: 'admin',
          cart: [],
          wishlist: [],
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`  + Preserved/Created Admin User: ${adminEmail}`);
      }

      console.log('✓ [FIREBASE] Users collection cleaned up (Only 3 admins remain).');
    } catch (err: any) {
      console.error('[FIREBASE] Error during cleanup:', err.message);
    }
  } else {
    console.warn('[FIREBASE] Credentials not found in .env. Skipping Firebase cleanup.');
  }

  console.log('\n==========================================');
  console.log('DATABASE RESET COMPLETE!');
  console.log('==========================================');
  process.exit(0);
}

resetDatabases().catch(err => {
  console.error('Fatal error resetting databases:', err);
  process.exit(1);
});
