import React from 'react';

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-neutral-900 tracking-tight">Terms & Conditions</h1>
        <p className="text-neutral-500 text-sm mt-2 font-medium">Please review the rules and guidelines governing our store.</p>
      </div>
      
      <div className="space-y-8 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-sm text-neutral-600">
        
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 1. Acceptance of Terms
          </h2>
          <p className="text-sm leading-relaxed">
            By accessing and using Yogantak's website, you agree to comply with and be bound by these Terms & Conditions. If you disagree with any part of these terms, you may not access the service.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 2. Use of the Website
          </h2>
          <p className="text-sm leading-relaxed">
            You must be at least 18 years of age to make a purchase on this website. You agree to use the site only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 3. Order Acceptance and Pricing
          </h2>
          <p className="text-sm leading-relaxed">
            All orders placed through the website are subject to acceptance by Yogantak. We reserve the right to refuse or cancel any order for any reason. All prices are listed in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST) unless stated otherwise.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 4. Payment Terms
          </h2>
          <p className="text-sm leading-relaxed">
            Payments are processed securely via our RBI-compliant payment gateway partner (Razorpay). We accept major credit/debit cards, net banking, UPI, and wallets. Yogantak does not store any raw payment card details on our servers. You must ensure that the payment method used belongs to you or you have the authority to use it.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 5. Intellectual Property
          </h2>
          <p className="text-sm leading-relaxed">
            All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of Yogantak and is protected by Indian and international copyright laws. You may not reproduce, duplicate, copy, sell, or exploit any portion of the service without express written permission from us.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 6. Customer Responsibilities
          </h2>
          <p className="text-sm leading-relaxed">
            You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account. You must provide accurate and complete shipping details; Yogantak is not liable for delayed or lost shipments due to incorrect address information.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 7. Liability Limitations
          </h2>
          <p className="text-sm leading-relaxed">
            To the maximum extent permitted by applicable law, Yogantak shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the website or purchase of our products.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3d70f5]"></span> 8. Governing Law
          </h2>
          <p className="text-sm leading-relaxed">
            These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
          </p>
        </section>

      </div>
    </div>
  );
}
