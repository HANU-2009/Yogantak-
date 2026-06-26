import React from 'react';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-serif font-bold text-white mb-6 uppercase tracking-wider text-center">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Contact Information */}
        <div className="bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm space-y-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Get in Touch</h2>
            <p className="text-neutral-400 text-sm">
              We are here to assist you with any inquiries regarding our products, orders, or bespoke services.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-[#adc6ff]/10 rounded-lg">
                <Building2 className="w-5 h-5 text-[#adc6ff]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Business Name</h3>
                <p className="text-neutral-300 text-sm">Yogantak</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-[#adc6ff]/10 rounded-lg">
                <Mail className="w-5 h-5 text-[#adc6ff]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Email Address</h3>
                <p className="text-neutral-300 text-sm">concierge@yogantak.com</p>
                <p className="text-neutral-500 text-xs mt-1">We aim to reply within 24 hours.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-[#adc6ff]/10 rounded-lg">
                <Phone className="w-5 h-5 text-[#adc6ff]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Mobile Number</h3>
                <p className="text-neutral-300 text-sm">+91 98765 43210</p>
                <p className="text-neutral-500 text-xs mt-1">Available Mon-Fri, 10am to 6pm IST.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-[#adc6ff]/10 rounded-lg">
                <MapPin className="w-5 h-5 text-[#adc6ff]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Physical Address</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Yogantak Headquarters<br />
                  123 Tech Park Avenue, Block C<br />
                  Bengaluru, Karnataka 560001<br />
                  India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (UI only for illustration) */}
        <div className="bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Send us a message</h3>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Full Name</label>
              <input type="text" className="w-full bg-black/40 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#adc6ff]" placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Email Address</label>
              <input type="email" className="w-full bg-black/40 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#adc6ff]" placeholder="jane@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Message</label>
              <textarea rows={4} className="w-full bg-black/40 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#adc6ff] resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="w-full py-3 bg-[#adc6ff] text-[#002e69] hover:bg-[#adc6ff]/90 font-bold text-xs uppercase tracking-widest rounded-lg transition-all mt-4 cursor-pointer">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
