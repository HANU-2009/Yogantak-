import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-neutral-300">
      <h1 className="text-4xl font-serif font-bold text-white mb-8 uppercase tracking-wider">Privacy Policy</h1>
      
      <div className="space-y-8 bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
        
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">1. Introduction</h2>
          <p className="text-sm leading-relaxed">
            Welcome to Yogantak. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase, in accordance with applicable Indian laws, including the Information Technology Act, 2000.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">2. Data We Collect</h2>
          <ul className="list-disc list-inside text-sm leading-relaxed space-y-2">
            <li><strong>Identity & Contact Data:</strong> Name, email address, shipping and billing addresses, and mobile number.</li>
            <li><strong>Financial Data:</strong> We <strong>do not</strong> store your raw card numbers or CVV. All payments are processed via a secure, RBI-compliant third-party gateway (Razorpay).</li>
            <li><strong>Transaction Data:</strong> Details about payments to and from you, and other details of products you have purchased from us.</li>
            <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type, and version.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">3. Why We Collect Your Data</h2>
          <p className="text-sm leading-relaxed">
            We use your data primarily to fulfill our contractual obligations to you, such as processing your order, delivering products, and managing payments. We also use your data to improve our website, personalize your experience, and send you important service updates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">4. How We Use Your Data</h2>
          <p className="text-sm leading-relaxed">
            Your data is used to register you as a customer, process and deliver orders (including managing payments and fees), collect money owed to us, and notify you about changes to our terms or privacy policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">5. Sharing with Third Parties</h2>
          <p className="text-sm leading-relaxed">
            We only share your personal data with trusted third parties necessary to fulfill your order, including:
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
            <li>Payment gateways (e.g., Razorpay) to process your transactions securely.</li>
            <li>Logistics and courier partners to deliver your products.</li>
            <li>IT and system administration service providers.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            We do not sell, rent, or trade your personal information to third parties for marketing purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">6. Data Security</h2>
          <p className="text-sm leading-relaxed">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. Sensitive information like payment details is encrypted via Secure Socket Layer (SSL) technology.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#adc6ff]">7. User Rights and Consent</h2>
          <p className="text-sm leading-relaxed">
            By using our website, you consent to our collection and use of your data as described in this policy. You have the right to request access to the personal data we hold about you, request corrections, or request deletion of your data, subject to certain legal exceptions. To exercise these rights, please contact us at concierge@yogantak.com.
          </p>
        </section>

      </div>
    </div>
  );
}
