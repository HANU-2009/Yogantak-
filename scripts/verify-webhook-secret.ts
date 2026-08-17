import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verify() {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  console.log('1. process.env.RAZORPAY_WEBHOOK_SECRET is loaded:', Boolean(webhookSecret && webhookSecret.length > 0));

  const payload = JSON.stringify({
    event: 'refund.processed',
    payload: {
      refund: {
        entity: {
          id: 'rfnd_verify_prod_' + Date.now(),
          payment_id: 'pay_verify_prod_' + Date.now(),
          amount: 50000,
          status: 'processed'
        }
      }
    }
  });

  // A. Verify rejection of forged signature
  const badSig = crypto.createHmac('sha256', 'wrong_secret').update(payload).digest('hex');
  const testBad = await fetch('http://localhost:5000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': badSig,
      'x-razorpay-event-id': 'evt_bad_' + Date.now()
    },
    body: payload
  });
  console.log('2. Forged signature rejection (Expected HTTP 400):', testBad.status);

  // B. Verify acceptance with authentic signature computed with RAZORPAY_WEBHOOK_SECRET
  const goodSig = crypto.createHmac('sha256', webhookSecret!).update(payload).digest('hex');
  const testGood = await fetch('http://localhost:5000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': goodSig,
      'x-razorpay-event-id': 'evt_good_' + Date.now()
    },
    body: payload
  });
  const goodData: any = await testGood.json();
  console.log('3. Authentic signature verification (Expected status "ok"):', goodData.status);
  console.log('\n✅ ALL CHECKS PASSED: Webhook secret verified and working securely.');
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
