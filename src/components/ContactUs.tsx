import React from 'react';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-neutral-900 tracking-tight">Contact Us</h1>
        <p className="text-neutral-500 text-sm mt-2 font-medium">We're here to assist you with any questions or support.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Contact Information */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">Get in Touch</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              We are here to assist you with any inquiries regarding our products, orders, or custom requests.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#3d70f5]/10 rounded-xl shrink-0">
                <Building2 className="w-5 h-5 text-[#3d70f5]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-0.5">Business Name</h3>
                <p className="text-neutral-900 font-semibold text-sm">Yogantak</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#3d70f5]/10 rounded-xl shrink-0">
                <Mail className="w-5 h-5 text-[#3d70f5]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-0.5">Email Address</h3>
                <p className="text-neutral-900 font-semibold text-sm">concierge@yogantak.com</p>
                <p className="text-neutral-400 text-xs mt-0.5">We aim to reply within 24 hours.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#3d70f5]/10 rounded-xl shrink-0">
                <Phone className="w-5 h-5 text-[#3d70f5]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-0.5">Mobile Number</h3>
                <p className="text-neutral-900 font-semibold text-sm">+91 98765 43210</p>
                <p className="text-neutral-400 text-xs mt-0.5">Available Mon-Fri, 10am to 6pm IST.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#3d70f5]/10 rounded-xl shrink-0">
                <MapPin className="w-5 h-5 text-[#3d70f5]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-0.5">Physical Address</h3>
                <p className="text-neutral-700 text-sm leading-relaxed">
                  Yogantak Headquarters<br />
                  123 Tech Park Avenue, Block C<br />
                  Bengaluru, Karnataka 560001<br />
                  India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Send Us a Message</h3>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Full Name</label>
              <input type="text" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors" placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Email Address</label>
              <input type="email" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors" placeholder="jane@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Message</label>
              <textarea rows={4} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="w-full py-3 bg.black bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all mt-4 cursor-pointer shadow-sm active:scale-95">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
