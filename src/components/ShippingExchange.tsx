import React from 'react';

export default function ShippingExchange() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-neutral-300">
      <h1 className="text-4xl font-serif font-bold text-white mb-8 uppercase tracking-wider">Shipping & Exchange Policy</h1>
      
      <div className="space-y-8 bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
        
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">1. Shipping Timelines & Delivery</h2>
          <p className="text-sm leading-relaxed">
            We partner with premier logistics networks to provide reliable and secure shipping. Orders are processed and dispatched within <strong>24 hours</strong> of placement. 
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed">
            <li><strong>Domestic Shipping (India):</strong> Delivered within 2 to 5 business days. We offer free standard shipping on all orders.</li>
            <li><strong>International Shipping:</strong> Delivered within 7 to 14 business days depending on customs and logistics routes. Shipping fees will be calculated at checkout.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">2. Order Tracking</h2>
          <p className="text-sm leading-relaxed">
            Once your package is handed over to our shipping carriers, we will email you a tracking reference number and a direct tracking link. You can track your shipment live on our delivery partner's website.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">3. Exchange Terms</h2>
          <p className="text-sm leading-relaxed">
            We offer exchanges within <strong>7 days</strong> of delivery if you ordered the incorrect model size or changed your mind. Items submitted for exchange must be completely unused, undamaged, and returned in their original luxury retail packaging.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">4. Shipping Cost for Exchange</h2>
          <p className="text-sm leading-relaxed">
            For voluntary exchanges (change of mind, choice of different color/model), the customer is responsible for the return shipping fee to our warehouse. We will cover the shipping cost of sending the newly exchanged product back to you.
          </p>
          <p className="text-sm leading-relaxed">
            For exchanges due to transit damage or packing errors, we will coordinate and cover the entirety of the reverse pickup and shipping costs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">5. Exchange Fulfillment</h2>
          <p className="text-sm leading-relaxed">
            Once your returned item arrives at our facility and passes quality inspection, your exchange item will be processed and dispatched within <strong>24 to 48 hours</strong>. You will receive a new tracking email for the replacement order.
          </p>
        </section>

      </div>
    </div>
  );
}
