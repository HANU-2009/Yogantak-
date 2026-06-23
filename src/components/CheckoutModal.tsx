import React, { useState, useEffect } from 'react';
import { CartItem, ShippingDetails, PaymentDetails, Order } from '../types';
import { X, ShieldCheck, Lock, CreditCard, ChevronRight, Check, HelpCircle, ArrowLeft, Loader2, Calendar, FileText, BadgeCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onOrderConfirmed: (order: Order) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onOrderConfirmed
}: CheckoutModalProps) {
  
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 50 ? 0 : 4.99;
  const tax = subtotal * 0.0825; // 8.25% Sales tax
  const total = subtotal + shippingCost + tax;

  // Checkout phase: 'shipping' | 'payment' | 'authorizing' | 'success'
  const [step, setStep] = useState<'shipping' | 'payment' | 'authorizing' | 'success'>('shipping');
  
  // Simulated logs
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Form states
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: ''
  });

  const [payment, setPayment] = useState<PaymentDetails>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveInfo: true
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Real-time Credit card mask
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedVal = formatCardNumber(e.target.value);
    setPayment(prev => ({ ...prev, cardNumber: formattedVal.slice(0, 19) }));
  };

  const formatExpiryDate = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  // Shipping submission validation
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!shipping.fullName.trim()) errors.fullName = 'Full legal name is required';
    if (!shipping.email.trim()) {
      errors.email = 'Secure correspondence email is required';
    } else if (!/\S+@\S+\.\S+/.test(shipping.email)) {
      errors.email = 'Please provide a valid email structure';
    }
    if (!shipping.addressLine1.trim()) errors.addressLine1 = 'Delivery coordinates are required';
    if (!shipping.city.trim()) errors.city = 'City coordinate is required';
    if (!shipping.state.trim()) errors.state = 'State coordinate is required';
    if (!shipping.postalCode.trim()) errors.postalCode = 'Postal zip classification is required';
    if (!shipping.phone.trim()) errors.phone = 'Contact coordinates are required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
      setStep('payment');
    }
  };

  // Payment submission validation & Simulated processing sequence
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanCard = payment.cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 16) errors.cardNumber = 'Card must be exactly 16 credentials';
    if (!payment.cardName.trim()) errors.cardName = 'Name displayed on card is required';
    
    const [month, year] = payment.expiryDate.split('/');
    if (!payment.expiryDate || !month || !year || month.length !== 2 || year.length !== 2) {
      errors.expiryDate = 'Provide MM/YY format';
    }
    if (payment.cvv.length < 3) errors.cvv = 'Provide 3-digit CVV';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
      startSimulatedHandshake();
    }
  };

  const startSimulatedHandshake = () => {
    setStep('authorizing');
    setAuthLogs([]);
    const logs = [
      'Establishing AES-256 Bit Secure Connection...',
      'Verifying shipping parameters with postmasters...',
      'Hashing Card credentials with bank vault standards...',
      'Conducting Visa Secure authentication audits...',
      'Syncing payment authorizations with clearing banks...',
      'Validating order tokens & processing receipt...'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setAuthLogs(prev => [...prev, `[SECURE-PORTAL] - ${log}`]);
        if (index === logs.length - 1) {
          finalizeCheckout();
        }
      }, (index + 1) * 800);
    });
  };

  const finalizeCheckout = () => {
    // Generate secure order records
    const orderNumber = `CORE-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderNumber,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: [...cart],
      shipping,
      subtotal,
      shippingCost,
      tax,
      total,
      paymentMethod: `Card ending in •••• ${payment.cardNumber.slice(-4)}`,
      status: 'processing'
    };

    setCompletedOrder(newOrder);
    setStep('success');
    onOrderConfirmed(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="checkout-modal">
      
      {/* Dark blurry backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={step !== 'authorizing' && step !== 'success' ? onClose : undefined}
      ></div>

      <div className="flex min-h-screen items-center justify-center p-4">
        
        {/* Core checkout frame */}
        <div className="relative w-full max-w-4xl bg-white border border-gray-150 rounded-none shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Main Form Compartment (Col-7) */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
            
            {/* Header / Back Action */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-sans text-lg font-bold uppercase tracking-wider text-black">Secure Portal</h3>
                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-black" />
                  <span>256-Bit SSL Encryption Authorized</span>
                </span>
              </div>
              
              {step !== 'authorizing' && step !== 'success' && (
                <button
                  onClick={onClose}
                  className="p-1 px-2.5 text-gray-400 hover:text-black border border-gray-150 tracking-widest font-mono text-[9px] cursor-pointer"
                >
                  CANCEL
                </button>
              )}
            </div>

            {/* Simulated Stepper Indicators */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-150">
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[9px] font-mono font-bold ${
                  step === 'shipping' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>1</span>
                <span className="text-[10px] font-mono tracking-wider font-bold text-black">Shipping</span>
              </div>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[9px] font-mono font-bold ${
                  step === 'payment' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>2</span>
                <span className="text-[10px] font-mono tracking-wider font-bold text-black">Payment</span>
              </div>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[9px] font-mono font-bold ${
                  step === 'success' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>3</span>
                <span className="text-[10px] font-mono tracking-wider font-bold text-black">Receipt</span>
              </div>
            </div>

            {/* STEP 1: SHIPPING COMPARTMENT */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Full Legal Name</label>
                    <input
                      type="text"
                      value={shipping.fullName}
                      onChange={(e) => setShipping(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="Jane Doe"
                    />
                    {validationErrors.fullName && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.fullName}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Secure Email</label>
                    <input
                      type="email"
                      value={shipping.email}
                      onChange={(e) => setShipping(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="jane.doe@example.com"
                    />
                    {validationErrors.email && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.email}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Billing & Delivery Coordinates</label>
                  <input
                    type="text"
                    value={shipping.addressLine1}
                    onChange={(e) => setShipping(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                    placeholder="123 Serene Boulevard"
                  />
                  {validationErrors.addressLine1 && (
                    <span className="text-[9px] font-mono text-red-500">{validationErrors.addressLine1}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Apartment, Suite (Optional)</label>
                  <input
                    type="text"
                    value={shipping.addressLine2}
                    onChange={(e) => setShipping(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                    placeholder="Floor 4, Penthouse 2B"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">City</label>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) => setShipping(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="San Francisco"
                    />
                    {validationErrors.city && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.city}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">State</label>
                    <input
                      type="text"
                      value={shipping.state}
                      onChange={(e) => setShipping(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="CA"
                    />
                    {validationErrors.state && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.state}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Zip Code</label>
                    <input
                      type="text"
                      value={shipping.postalCode}
                      onChange={(e) => setShipping(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="94103"
                    />
                    {validationErrors.postalCode && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.postalCode}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Country</label>
                    <select
                      value={shipping.country}
                      onChange={(e) => setShipping(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black rounded-none cursor-pointer"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                      <option>Germany</option>
                      <option>France</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Phone Coordinates</label>
                    <input
                      type="text"
                      value={shipping.phone}
                      onChange={(e) => setShipping(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="(415) 555-2673"
                    />
                    {validationErrors.phone && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.phone}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-black hover:opacity-85 text-white font-mono text-xs uppercase tracking-widest mt-6 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lock Delivery Coordinates</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT COMPARTMENT */}
            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-black mb-2 focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Shipping Profile</span>
                </button>

                {/* Digital Card Graphic Mockup */}
                <div className="w-full bg-black text-white p-5 rounded-none border border-neutral-850 flex flex-col justify-between aspect-[1.7/1] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs tracking-widest text-[#E4DCD0]/60">CORECARD SECURE</span>
                    <Lock className="w-4 h-4 text-neutral-400" />
                  </div>

                  <div className="space-y-2.5">
                    <div className="font-mono text-base tracking-[0.25em] text-center min-h-[24px]">
                      {payment.cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-[#E4DCD0]/60 uppercase tracking-widest">
                      <div>
                        <span>Holder: </span>
                        <span className="text-white block font-medium mt-0.5">{payment.cardName || 'JANE DOE'}</span>
                      </div>
                      <div>
                        <span>Expiry: </span>
                        <span className="text-white block font-medium mt-0.5">{payment.expiryDate || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-2 text-[10px] font-mono text-black">
                  <CreditCard className="w-4 h-4 text-black" />
                  <span>We accept major credit card lines, including Apple Pay and Google transactions securely.</span>
                </div>

                {/* Main Card Inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Card Number</label>
                      <input
                        type="text"
                        value={payment.cardNumber}
                        onChange={handleCardInputChange}
                        className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black rounded-none"
                        placeholder="4111 2222 3333 4444"
                      />
                      {validationErrors.cardNumber && (
                        <span className="text-[9px] font-mono text-red-500">{validationErrors.cardNumber}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Name On Card</label>
                      <input
                        type="text"
                        value={payment.cardName}
                        onChange={(e) => setPayment(prev => ({ ...prev, cardName: e.target.value }))}
                        className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                        placeholder="Jane Doe"
                      />
                      {validationErrors.cardName && (
                        <span className="text-[9px] font-mono text-red-500">{validationErrors.cardName}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>Expiration Date</span>
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={payment.expiryDate}
                        onChange={(e) => setPayment(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                        className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black rounded-none"
                        placeholder="MM/YY"
                      />
                      {validationErrors.expiryDate && (
                        <span className="text-[9px] font-mono text-red-500">{validationErrors.expiryDate}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Security Code (CVV)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={payment.cvv}
                        onChange={(e) => setPayment(prev => ({ ...prev, cvv: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                        className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black rounded-none"
                        placeholder="123"
                      />
                      {validationErrors.cvv && (
                        <span className="text-[9px] font-mono text-red-500">{validationErrors.cvv}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payment.saveInfo}
                    onChange={(e) => setPayment(prev => ({ ...prev, saveInfo: e.target.checked }))}
                    className="w-4 h-4 accent-black border-gray-100 rounded-none focus:ring-0"
                    id="savePayment"
                  />
                  <label htmlFor="savePayment" className="text-[11px] font-mono text-gray-400 cursor-pointer selection:bg-none">
                    Remember financial profiles for rapid subsequent shopping
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-black hover:opacity-85 text-white font-mono text-xs uppercase tracking-widest mt-6 cursor-pointer flex items-center justify-center gap-2 rounded-none transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize Secure Charge (${total.toFixed(2)})</span>
                </button>
              </form>
            )}

            {/* STEP 3: PROCESSING LOCK / AUTHORIZING */}
            {step === 'authorizing' && (
              <div className="h-96 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
                <div className="text-center space-y-1">
                  <h4 className="font-sans text-lg font-bold text-black uppercase">Simulating Vault Clearances</h4>
                  <p className="text-xs text-gray-400 font-mono uppercase">Verifying banking handshakes...</p>
                </div>

                <div className="w-full max-w-sm bg-neutral-900 text-green-400 p-4 rounded-none text-[10px] font-mono space-y-1.5 shadow-inner">
                  {authLogs.map((log, i) => (
                    <div key={i} className="animate-fade-in truncate">{log}</div>
                  ))}
                  <div className="animate-pulse">_</div>
                </div>
              </div>
            )}

            {/* STEP 4: ORDER SUCCESS */}
            {step === 'success' && completedOrder && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-black rounded-none flex items-center justify-center mx-auto text-white">
                    <Check className="w-8 h-8 font-bold" />
                  </div>
                  <h4 className="font-sans text-xl font-extrabold text-black uppercase tracking-wider italic">Secure Order Authorized</h4>
                  <p className="text-slate-500 text-xs sm:text-sm font-sans leading-relaxed">
                    Thank you, {completedOrder.shipping.fullName}. Your handcrafted protection case is locked and entering processing queues. Standard delivery notification manifests will arrive in your email cabinet.
                  </p>
                </div>

                {/* Spline 3D Interactive Delivery Animation */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-widest block text-center">
                    // Interactive 3D Delivery Dispatch Box
                  </span>
                  <div className="w-full h-[280px] bg-slate-50 border-2 border-dashed border-gray-200 rounded-none overflow-hidden relative shadow-inner">
                    <iframe 
                      src="https://my.spline.design/deliverybox-vzNOt2NdKMBmCjYsDCwzL1vw/" 
                      className="w-full h-full pointer-events-auto"
                      title="3D Active Delivery Box"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 pointer-events-none uppercase tracking-widest">
                      Live Delivery Lab
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/85 text-neutral-300 text-[8px] font-mono px-2 py-1 pointer-events-none uppercase tracking-widest select-none">
                      Drag to rotate box • Pinch to zoom
                    </div>
                  </div>
                </div>

                {/* Full formal summary receipt */}
                <div className="bg-gray-50 p-6 border border-gray-150 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono pb-2.5 border-b border-gray-150">
                    <div>
                      <span className="text-gray-400">Order Reference:</span>
                      <strong className="text-black block mt-0.5">{completedOrder.id}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400">Manifest Date:</span>
                      <strong className="text-black block mt-0.5">{completedOrder.date}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider block">Deliver To:</span>
                    <p className="text-xs font-sans text-black leading-snug">
                      {completedOrder.shipping.fullName} <br />
                      {completedOrder.shipping.addressLine1}, {completedOrder.shipping.addressLine2 && `${completedOrder.shipping.addressLine2}, `} <br />
                      {completedOrder.shipping.city}, {completedOrder.shipping.state} {completedOrder.shipping.postalCode}, {completedOrder.shipping.country}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-gray-150">
                    <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider block">Cart items:</span>
                    {completedOrder.items.map((item, id) => (
                      <div key={id} className="flex justify-between text-xs text-slate-500">
                        <span>
                          {item.product.name} (x{item.quantity})
                          <small className="block text-[10px] text-gray-400 font-mono mt-0.5">
                            {item.selectedModel} • {item.selectedMaterial.replace('Premium ', '')}
                          </small>
                        </span>
                        <strong className="text-black font-mono font-bold">${(item.price * item.quantity).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-dashed border-gray-150 space-y-1 font-mono text-xs text-right">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span>${completedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping Cost:</span>
                      <span>{completedOrder.shippingCost === 0 ? 'FREE' : `$${completedOrder.shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Import & Sales Tax (8.25%):</span>
                      <span>${completedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-150">
                      <strong className="font-mono font-bold text-black uppercase">Total Charge Authorized:</strong>
                      <strong className="font-mono font-bold text-black text-lg">${completedOrder.total.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      setStep('shipping');
                    }}
                    className="w-full py-4.5 bg-black hover:opacity-85 text-white font-mono text-xs uppercase tracking-widest cursor-pointer text-center rounded-none transition-opacity"
                  >
                    Continue Styling Collections
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full py-4.5 bg-transparent border border-black text-black hover:bg-gray-100 font-mono text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 rounded-none transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Print Bill Statement</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Secure Right Summary Column (Col-5) */}
          <div className="md:col-span-5 bg-gray-50 p-6 sm:p-8 border-l md:border-t-0 border-t border-gray-150 flex flex-col justify-between">
            {step !== 'success' ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-black">Itemized Summary</h4>
                  <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{cart.length} unique designs</span>
                </div>

                {/* Mini cases map */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center text-xs">
                      <span className="text-white font-mono font-bold bg-black w-6 h-6 flex items-center justify-center rounded-none flex-shrink-0 text-[10px]">
                        {item.quantity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <strong className="text-black block truncate leading-tight font-sans text-xs uppercase tracking-wide">{item.product.name}</strong>
                        <span className="text-[10px] font-mono text-gray-400 block truncate">{item.selectedModel}</span>
                      </div>
                      <span className="font-mono text-black font-bold flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Subsidaries listing */}
                <div className="border-t border-gray-100 pt-4 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Items Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Express Shipping:</span>
                    <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sales Surcharge:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2.5 border-t border-dashed border-gray-150">
                    <strong className="font-mono font-bold text-black uppercase">Full Balance Total:</strong>
                    <strong className="font-mono text-lg font-bold text-black">${total.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-4">
                <BadgeCheck className="w-12 h-12 text-black" />
                <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-black">Vault cleared securely</h5>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em] leading-relaxed">
                  YOGANTAK Security algorithms automatically cleared payment details. Safe. Trusted. Verified.
                </p>
                
                {/* Embedded Mini 3D Box Preview inside success side panel */}
                <div className="w-full border-t border-gray-150 pt-4 space-y-2">
                  <span className="text-[9px] font-mono uppercase text-gray-400 tracking-widest block">
                    Your Package Vault
                  </span>
                  <div className="w-full h-[155px] bg-white border border-gray-200 rounded-none overflow-hidden relative shadow-xs">
                    <iframe 
                      src="https://my.spline.design/deliverybox-vzNOt2NdKMBmCjYsDCwzL1vw/" 
                      className="w-full h-full pointer-events-auto"
                      title="Mini 3D Active Delivery Box"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shield and locks reassurance footer always absolute at bottom of col-5 */}
            <div className="pt-6 border-t border-gray-100 text-[9.5px] font-mono text-gray-400 space-y-2">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span className="font-bold">HTTPS CERTIFICATION</span>
              </div>
              <p className="leading-tight">
                All transmissions are padded under strict banking SSL/TLS protocols. We represent direct compliance with PCI-DSS guidelines.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
