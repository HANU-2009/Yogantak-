import React from 'react';
import { ShieldCheck, Leaf, PenTool } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-neutral-900 tracking-tight">About Yogantak</h1>
        <p className="text-neutral-500 text-sm mt-2 font-medium">Crafting premium, sustainable protection for your devices.</p>
      </div>
      
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3d70f5]"></span> Our Mission
          </h2>
          <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">
            At Yogantak, we believe that device protection should never compromise on aesthetics or environmental responsibility. Founded with a vision to redefine the modern phone case, our mission is to craft protective shells that are as beautiful as they are durable. We blend cutting-edge materials with minimalist design to create accessories that perfectly complement your premium devices.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d70f5]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#3d70f5]" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base">Military-Grade Protection</h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-normal">Engineered with robust shock-absorbing materials designed to withstand severe impact.</p>
          </div>
          
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d70f5]/10 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-[#3d70f5]" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base">Bespoke Design</h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-normal">Minimalist aesthetic crafted with meticulous attention to detail and premium textures.</p>
          </div>
          
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d70f5]/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-[#3d70f5]" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base">Sustainable Vision</h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-normal">Committed to environmental accountability with biodegradable and ethically sourced options.</p>
          </div>
        </div>

        <section className="pt-6 border-t border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3d70f5]"></span> India Operations
          </h2>
          <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">
            Yogantak operates as a fully compliant e-commerce entity within India. We are dedicated to providing seamless, secure, and rapid delivery of our premium products nationwide, fully adhering to local regulations and taxation norms.
          </p>
        </section>
      </div>
    </div>
  );
}
