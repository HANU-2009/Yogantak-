import React from 'react';

export default function ReturnsPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-neutral-900 tracking-tight">Returns, Refunds & Cancellation Policy</h1>
        <p className="text-neutral-500 text-sm mt-2 font-medium">Clear guidelines on returns, exchanges, and refund timelines.</p>
      </div>
      
      <div className="space-y-8 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-sm text-neutral-600">
        
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 1. Cancellation Rules
          </h2>
          <p className="text-sm leading-relaxed">
            You may cancel your order at any time before it has been dispatched from our warehouse. Typically, orders are dispatched within 24 hours of confirmation. To cancel, please contact us immediately at <strong>concierge@yogantak.com</strong> with your Order ID. Once an order is dispatched, it cannot be cancelled, but you may initiate a return upon receipt according to our return policy below.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 2. Return Eligibility & Period
          </h2>
          <p className="text-sm leading-relaxed">
            We offer a hassle-free <strong>7-day return policy</strong> from the date of delivery. To be eligible for a return, the item must be unused, in the same condition that you received it, and in its original packaging with all tags attached.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 3. Exceptions & Non-Returnable Items
          </h2>
          <p className="text-sm leading-relaxed">
            Please note that custom or personalized products are final sale and <strong>non-returnable</strong> unless they arrive defective or damaged due to a manufacturing fault. Items purchased during clearance sales or using specific promotional codes may also be exempt from returns.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 4. Return Shipping
          </h2>
          <p className="text-sm leading-relaxed">
            For defective or incorrect items delivered, Yogantak will arrange and cover the cost of return shipping. For voluntary returns (e.g., change of mind, incorrect model ordered by customer), the customer is responsible for paying the return shipping costs. We recommend using a trackable shipping service.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 5. Refund Timeline & Method
          </h2>
          <p className="text-sm leading-relaxed">
            Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed within <strong>5-7 business days</strong>. The credit will automatically be applied to your original method of payment (e.g., Credit Card, UPI, Net Banking via Razorpay). Please allow additional time for your bank to reflect the transaction.
          </p>
        </section>

      </div>
    </div>
  );
}
