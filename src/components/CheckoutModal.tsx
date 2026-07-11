import React, { useState, useEffect } from 'react';
import { CartItem, ShippingDetails, PaymentDetails, Order } from '../types';
import { X, ShieldCheck, Lock, CreditCard, ChevronRight, Check, HelpCircle, ArrowLeft, Loader2, Calendar, FileText, BadgeCheck, ShieldAlert } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onOrderConfirmed: (order: Order) => void;
  user?: any;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onOrderConfirmed,
  user
}: CheckoutModalProps) {
  
  if (!isOpen) return null;

  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const shippingCost = subtotal >= 4000 ? 0 : 150;
  const tax = taxableAmount * 0.18; // 18% GST (Indian electronic accessories standard rate)
  const total = taxableAmount + shippingCost + tax;

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
    country: 'India',
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

  // Prefill details for user
  useEffect(() => {
    if (isOpen && user) {
      setShipping(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || ''
      }));
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => console.log('Razorpay script loaded successfully');
    script.onerror = () => console.error('Failed to load Razorpay script');
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, [isOpen]);

  const handleApplyCoupon = async () => {
    setCouponError(null);
    if (!promoCode) return;

    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, cartTotal: subtotal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply coupon');

      setAppliedCoupon(data);
      setPromoCode('');
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    }
  };

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
    if (!shipping.state.trim()) {
      errors.state = 'State selection is required';
    }
    if (!shipping.postalCode.trim()) {
      errors.postalCode = 'Postal PIN code is required';
    } else if (!/^\d{6}$/.test(shipping.postalCode.trim())) {
      errors.postalCode = 'Please enter a valid 6-digit Indian PIN code';
    }
    if (!shipping.phone.trim()) {
      errors.phone = 'Mobile phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(shipping.phone.trim().replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
      setStep('payment');
    }
  };

  // Launches Razorpay Web Standard Checkout
  const handleRazorpayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setStep('authorizing');
    setAuthLogs(['[SECURE-PORTAL] - Initiating Razorpay secure session...']);

    try {
      const amountPaise = Math.round(total * 100);

      setAuthLogs(prev => [...prev, '[SECURE-PORTAL] - Requesting order reference token from backend...']);
      
      // 1. Create Razorpay order on our backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: `rcpt_yogantak_${Date.now().toString().slice(-6)}`
        })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Payment gateway unavailable. Please try again or contact support.');
      }

      // Map order_id to id for compatibility
      if (orderData.order_id && !orderData.id) {
        orderData.id = orderData.order_id;
      }

      setAuthLogs(prev => [...prev, '[SECURE-PORTAL] - Razorpay order reference confirmed. Opening payment gateway...']);

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Razorpay key not configured. Ensure VITE_RAZORPAY_KEY_ID is set in .env');
      }

      // 2. Configure checkout options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'YOGANTAK™ | Premium Cases',
        description: `Bespoke Order fit for ${shipping.fullName}`,
        image: 'https://ai.google.dev/static/site-assets/images/share-ais-513315318.png',
        order_id: orderData.id,
        handler: async (response: any) => {
          setAuthLogs(prev => [
            ...prev,
            '[SECURE-PORTAL] - Payment successfully completed at Gateway.',
            '[SECURE-PORTAL] - Verifying cryptographic transaction signatures...'
          ]);

          try {
            // Verify payment on our backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || 'Cryptographic verification failed');
            }

            setAuthLogs(prev => [...prev, '[SECURE-PORTAL] - Signature verified. Hashing order manifest in database...']);

            // 3. Finalize order in our database
            const orderFinalRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user ? user.id : null,
                email: shipping.email,
                items: cart,
                subtotal,
                tax,
                total,
                shippingName: shipping.fullName,
                shippingAddress: shipping.addressLine1 + (shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''),
                shippingCity: shipping.city,
                shippingState: shipping.state,
                shippingZip: shipping.postalCode,
                shippingCountry: shipping.country,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                paymentId: response.razorpay_payment_id
              })
            });

            const orderFinalData = await orderFinalRes.json();
            if (!orderFinalRes.ok) {
              throw new Error(orderFinalData.error || 'Failed to place order in database');
            }

            const newOrder: Order = {
              id: orderFinalData.orderId,
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
              paymentMethod: `Razorpay UPI/Card/Wallet (ID: ${response.razorpay_payment_id.slice(-6)})`,
              status: 'processing'
            };

            setCompletedOrder(newOrder);
            setStep('success');
            onOrderConfirmed(newOrder);

          } catch (verifyErr: any) {
            console.error('Payment verification / checkout finalization error:', verifyErr);
            setCheckoutError(verifyErr.message || 'Payment verification failed');
            setStep('payment');
          }
        },
        prefill: {
          name: shipping.fullName,
          email: shipping.email,
          contact: shipping.phone || ''
        },
        notes: {
          address: `${shipping.addressLine1}, ${shipping.city}, ${shipping.state} ${shipping.postalCode}`
        },
        theme: {
          color: '#adc6ff' // Lumina Luxe primary Azure accent color
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed by user');
            setCheckoutError('Payment cancelled. Please try again.');
            setStep('payment');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        console.error('Payment failure event:', resp.error);
        setCheckoutError(`Payment failed: ${resp.error.description}`);
        setStep('payment');
      });

      rzp.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Checkout failed');
      setStep('payment');
    }
  };

  return (
    <>
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
                    <select
                      value={shipping.state}
                      onChange={(e) => setShipping(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black rounded-none cursor-pointer"
                    >
                      <option value="">Select State</option>
                      <option>Andhra Pradesh</option>
                      <option>Arunachal Pradesh</option>
                      <option>Assam</option>
                      <option>Bihar</option>
                      <option>Chhattisgarh</option>
                      <option>Delhi</option>
                      <option>Goa</option>
                      <option>Gujarat</option>
                      <option>Haryana</option>
                      <option>Himachal Pradesh</option>
                      <option>Jammu and Kashmir</option>
                      <option>Jharkhand</option>
                      <option>Karnataka</option>
                      <option>Kerala</option>
                      <option>Madhya Pradesh</option>
                      <option>Maharashtra</option>
                      <option>Manipur</option>
                      <option>Meghalaya</option>
                      <option>Mizoram</option>
                      <option>Nagaland</option>
                      <option>Odisha</option>
                      <option>Punjab</option>
                      <option>Rajasthan</option>
                      <option>Sikkim</option>
                      <option>Tamil Nadu</option>
                      <option>Telangana</option>
                      <option>Tripura</option>
                      <option>Uttar Pradesh</option>
                      <option>Uttarakhand</option>
                      <option>West Bengal</option>
                    </select>
                    {validationErrors.state && (
                      <span className="text-[9px] font-mono text-red-500">{validationErrors.state}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={shipping.postalCode}
                      onChange={(e) => setShipping(prev => ({ ...prev, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="400001"
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
                      <option>India</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>United Arab Emirates</option>
                      <option>Singapore</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Mobile Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={shipping.phone}
                      onChange={(e) => setShipping(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className="w-full bg-white border border-gray-100 px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black rounded-none"
                      placeholder="9876543210"
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
            )}            {/* STEP 2: PAYMENT COMPARTMENT */}
            {step === 'payment' && (
              <form onSubmit={handleRazorpayCheckout} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-[#c1c6d7] hover:text-white mb-2 focus:outline-none cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Shipping Profile</span>
                </button>

                {checkoutError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-500 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Digital Graphic Mockup showing Razorpay Gateway */}
                <div className="w-full bg-[#1c1c1e] text-white p-6 rounded-3xl border border-white/10 flex flex-col justify-between aspect-[1.7/1] relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#adc6ff]/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] tracking-widest text-[#c1c6d7] uppercase">SECURE CHECKOUT GATEWAY</span>
                    <Lock className="w-4 h-4 text-[#adc6ff]" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-neutral-400 block tracking-wider uppercase font-mono">Amount Payable</span>
                      <div className="text-2xl font-extrabold text-[#adc6ff] font-mono mt-1">
                        ₹{total.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    <div className="flex justify-between font-mono text-[9px] text-[#c1c6d7] uppercase tracking-widest">
                      <div>
                        <span>Client Reference</span>
                        <span className="text-white block font-medium mt-0.5">{shipping.fullName || 'GUEST CUSTOMER'}</span>
                      </div>
                      <div>
                        <span>Currency</span>
                        <span className="text-white block font-medium mt-0.5">INR (₹)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Razorpay Gateway Description Badge */}
                <div className="flex items-center gap-3 bg-neutral-900 border border-white/5 p-4 text-[10px] font-mono text-[#c1c6d7] rounded-2xl">
                  <CreditCard className="w-5 h-5 text-[#adc6ff] shrink-0" />
                  <span>Razorpay handles all payments securely. We accept UPI (GooglePay, PhonePe, Paytm), RuPay, Visa, Mastercard, Netbanking, and Wallets.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e69] font-bold text-xs uppercase tracking-widest mt-6 cursor-pointer flex items-center justify-center gap-2 rounded-full transition-all shadow-lg active:scale-98"
                >
                  <Lock className="w-3.5 h-3.5 text-[#002e69]" />
                  <span>Pay with Razorpay (₹{total.toLocaleString('en-IN')})</span>
                </button>
              </form>
            )}

            {/* STEP 3: PROCESSING LOCK / AUTHORIZING */}
            {step === 'authorizing' && (
              <div className="h-96 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
                <div className="text-center space-y-1">
                  <h4 className="font-sans text-lg font-bold text-black uppercase">Processing Payment</h4>
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
                  <div className="flex justify-between items-start text-xs font-mono pb-2.5 border-b border-gray-150">
                    <div>
                      <h5 className="font-bold text-black uppercase tracking-wider mb-1 border-b border-black inline-block">Tax Invoice</h5>
                      <p className="text-[9px] text-gray-500 mb-2">Issued by: Yogantak (GSTIN: 29XXXXX0000X1Z5)</p>
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
                        <strong className="text-black font-mono font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-dashed border-gray-150 space-y-1 font-mono text-xs text-right">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span>₹{completedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping Cost:</span>
                      <span>{completedOrder.shippingCost === 0 ? 'FREE' : `₹${completedOrder.shippingCost.toLocaleString('en-IN')}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GST Tax (18%):</span>
                      <span>₹{completedOrder.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-150">
                      <strong className="font-mono font-bold text-black uppercase">Total Charge Authorized:</strong>
                      <strong className="font-mono font-bold text-black text-lg">₹{completedOrder.total.toLocaleString('en-IN')}</strong>
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
                      <span className="font-mono text-black font-bold flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-gray-150 pt-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider block">Apply Promo Coupon</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs font-mono uppercase text-black focus:outline-none focus:border-black rounded-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-1.5 bg-black hover:opacity-85 text-white text-xs font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[9px] font-mono text-red-500 block">{couponError}</span>
                  )}
                  {appliedCoupon && (
                    <span className="text-[9px] font-mono text-green-700 block font-semibold">
                      ✓ Coupon Applied: {appliedCoupon.code} (-₹{appliedCoupon.discount.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                {/* Subsidaries listing */}
                <div className="border-t border-gray-100 pt-4 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Items Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Express Shipping:</span>
                    <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toLocaleString('en-IN')}`}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST Surcharge (18%):</span>
                    <span>₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2.5 border-t border-dashed border-gray-150">
                    <strong className="font-mono font-bold text-black uppercase">Full Balance Total:</strong>
                    <strong className="font-mono text-lg font-bold text-black">₹{total.toLocaleString('en-IN')}</strong>
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

    {/* Mock Razorpay Popup Simulation Frame */}
    {showMockRazorpay && mockRazorpayOrderData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
        <div className="relative w-full max-w-md bg-[#1B2430] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-white">
          
          {/* Header bar mirroring Razorpay design */}
          <div className="bg-[#121921] p-5 flex justify-between items-center border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#2E86C1] rounded-full flex items-center justify-center font-bold text-xs">R</div>
              <div>
                <h4 className="text-sm font-bold tracking-wide">Razorpay Checkout</h4>
                <span className="text-[10px] text-gray-400 font-mono">SANDBOX SIMULATION MODE</span>
              </div>
            </div>
            <button 
              onClick={handleMockPaymentDismiss}
              className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer border border-gray-800 px-2.5 py-1 transition-colors"
            >
              CANCEL
            </button>
          </div>

          {/* Sandbox alert */}
          <div className="bg-amber-500/10 border-b border-amber-500/25 p-4 text-xs text-amber-400 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <strong>Sandbox / Fallback Mode Active</strong>
              <p className="text-[11px] text-gray-400 leading-normal mt-0.5">
                Your server's API keys in <code className="text-white bg-black/20 px-1 font-mono">.env</code> are not configured or are returning unauthorized. We have enabled an in-app payment simulation so you can safely test the checkout flow!
              </p>
            </div>
          </div>

          {/* Details panel */}
          <div className="p-6 space-y-4">
            
            <div className="flex justify-between items-baseline border-b border-gray-800 pb-3">
              <span className="text-xs text-gray-400">Merchant</span>
              <span className="text-xs font-bold text-[#adc6ff]">YOGANTAK™ | Premium Cases</span>
            </div>

            <div className="flex justify-between items-baseline border-b border-gray-800 pb-3">
              <span className="text-xs text-gray-400">Total Charge</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">₹{(mockRazorpayOrderData.amount / 100).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-baseline border-b border-gray-800 pb-3">
              <span className="text-xs text-gray-400">Reference ID</span>
              <span className="text-xs font-mono text-gray-300">{mockRazorpayOrderData.id}</span>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handleMockPaymentSuccess}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simulate Payment Success (UPI / Card)</span>
              </button>

              <button
                onClick={() => {
                  setShowMockRazorpay(false);
                  setCheckoutError('Simulated Payment failed: Insufficient bank balance');
                  setStep('payment');
                }}
                className="w-full py-3.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Simulate Payment Failure</span>
              </button>
            </div>

            <p className="text-[10px] text-gray-500 text-center leading-normal pt-2 font-mono">
              To connect real payments, update the <code className="text-gray-400">RAZORPAY_KEY_ID</code> and <code className="text-gray-400">RAZORPAY_KEY_SECRET</code> inside the root <code className="text-gray-400">.env</code> configuration file.
            </p>
          </div>

        </div>
      </div>
    )}
    </>
  );
}
