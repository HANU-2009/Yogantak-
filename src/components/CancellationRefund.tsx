import React from 'react';

export default function CancellationRefund() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-neutral-300">
      <h1 className="text-4xl font-serif font-bold text-white mb-8 uppercase tracking-wider">Cancellation & Refund Policy</h1>
      
      <div className="space-y-8 bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
        
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">1. Order Cancellation</h2>
          <p className="text-sm leading-relaxed">
            You can request to cancel your order at any time before it has been dispatched from our fulfillment facility. Usually, orders are prepared and shipped within <strong>12 to 24 hours</strong> of confirmation. 
          </p>
          <p className="text-sm leading-relaxed">
            To request a cancellation, please email our support team immediately at <strong>concierge@yogantak.com</strong> with your Order ID. Once an order is handed over to our delivery partners, we cannot cancel it, but you may initiate a return upon receipt of the package according to our return terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">2. Defective, Damaged, or Incorrect Items</h2>
          <p className="text-sm leading-relaxed">
            In the rare event that your product arrives damaged during transit, has a manufacturing defect, or if you receive the wrong product model/color, we will replace it or issue a full refund at no additional cost. 
          </p>
          <p className="text-sm leading-relaxed">
            Please inspect your order upon receipt and contact us within <strong>48 hours</strong> of delivery with clear photographs or a short video of the issue.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">3. Refund Eligibility & Condition</h2>
          <p className="text-sm leading-relaxed">
            To qualify for a refund, returned items must be unused, in their original condition, and in their original packaging with all security tags, protective films, and documentation intact. We cannot accept refunds for products that show signs of usage, scratches, or wear.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">4. Non-Refundable Items</h2>
          <p className="text-sm leading-relaxed">
            Custom-engraved cases, customized leather stampings, or bespoke accessories created to order are final sale and cannot be refunded or cancelled once production starts, unless they arrive damaged or defective.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">5. Refund Processing Timeline</h2>
          <p className="text-sm leading-relaxed">
            Once your returned package is received and inspected by our Quality Assurance laboratory, we will notify you of the approval or rejection of your refund. 
          </p>
          <p className="text-sm leading-relaxed">
            If approved, your refund will be processed immediately. The refund amount will automatically be credited back to your original payment method (Credit/Debit Card, UPI, Net Banking, or Wallet via Razorpay) within <strong>5 to 7 business days</strong>. Please note that individual banking institution settlement periods may vary.
          </p>
        </section>

      </div>
    </div>
  );
}
