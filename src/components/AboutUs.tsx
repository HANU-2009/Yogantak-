import React from 'react';
import { ShieldCheck, Leaf, PenTool } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-serif font-bold text-white mb-6 uppercase tracking-wider text-center">About Yogantak</h1>
      
      <div className="bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-8 space-y-8 backdrop-blur-sm">
        <section>
          <h2 className="text-xl font-bold text-[#adc6ff] mb-4">Our Mission</h2>
          <p className="text-neutral-300 leading-relaxed text-sm">
            At Yogantak, we believe that device protection should never compromise on aesthetics or environmental responsibility. Founded with a vision to redefine the modern phone case, our mission is to craft protective shells that are as beautiful as they are durable. We blend cutting-edge materials with minimalist design to create accessories that perfectly complement your premium devices.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-800">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#adc6ff]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#adc6ff]" />
            </div>
            <h3 className="font-bold text-white text-sm">Military-Grade Protection</h3>
            <p className="text-xs text-neutral-400">Engineered with robust shock-absorbing materials designed to withstand severe impact.</p>
          </div>
          
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#adc6ff]/10 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-[#adc6ff]" />
            </div>
            <h3 className="font-bold text-white text-sm">Bespoke Design</h3>
            <p className="text-xs text-neutral-400">Minimalist aesthetic crafted with meticulous attention to detail and premium textures.</p>
          </div>
          
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#adc6ff]/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-[#adc6ff]" />
            </div>
            <h3 className="font-bold text-white text-sm">Sustainable Vision</h3>
            <p className="text-xs text-neutral-400">Committed to environmental accountability with biodegradable and ethically sourced options.</p>
          </div>
        </div>

        <section className="pt-6 border-t border-neutral-800">
          <h2 className="text-xl font-bold text-[#adc6ff] mb-4">India Operations</h2>
          <p className="text-neutral-300 leading-relaxed text-sm">
            Yogantak operates as a fully compliant e-commerce entity within India. We are dedicated to providing seamless, secure, and rapid delivery of our premium products nationwide, fully adhering to local regulations and taxation norms.
          </p>
        </section>
      </div>
    </div>
  );
}
