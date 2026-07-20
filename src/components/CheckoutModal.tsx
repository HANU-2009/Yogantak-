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
  const shippingCost: number = 0; // Removed for trial
  const tax = 0; // Removed for trial
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
          color: '#cfff71'
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
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
        onClick={step !== 'authorizing' && step !== 'success' ? onClose : undefined}
      ></div>

      <div className="flex min-h-screen items-center justify-center p-4">
        
        {/* Core checkout frame */}
        <div className="relative w-full max-w-4xl bg-[#fdfdfd]/40 backdrop-blur-3xl border border-neutral-200/60 rounded-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Main Form Compartment (Col-7) */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6 bg-white/20 backdrop-blur-md rounded-l-[2rem]">
            
            {/* Header / Back Action */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-sans text-lg font-extrabold tracking-tight text-neutral-900">Secure Portal</h3>
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest flex items-center gap-1 font-semibold">
                  <Lock className="w-2.5 h-2.5 text-neutral-900" />
                  <span>256-Bit SSL Encryption Authorized</span>
                </span>
              </div>
              
              {step !== 'authorizing' && step !== 'success' && (
                <button
                  onClick={onClose}
                  className="p-2 px-3 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors tracking-widest font-mono text-[9px] cursor-pointer font-bold"
                >
                  CANCEL
                </button>
              )}
            </div>

            {/* Simulated Stepper Indicators */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                  step === 'shipping' ? 'bg-[#cfff71] text-neutral-900' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                }`}>1</span>
                <span className={`text-[10px] font-mono tracking-wider font-bold ${step === 'shipping' ? 'text-neutral-900' : 'text-neutral-400'}`}>Shipping</span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                  step === 'payment' ? 'bg-[#cfff71] text-neutral-900' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                }`}>2</span>
                <span className={`text-[10px] font-mono tracking-wider font-bold ${step === 'payment' ? 'text-neutral-900' : 'text-neutral-400'}`}>Payment</span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                  step === 'success' ? 'bg-[#cfff71] text-neutral-900' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                }`}>3</span>
                <span className={`text-[10px] font-mono tracking-wider font-bold ${step === 'success' ? 'text-neutral-900' : 'text-neutral-400'}`}>Receipt</span>
              </div>
            </div>

            {/* STEP 1: SHIPPING COMPARTMENT */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Full Legal Name</label>
                    <input
                      type="text"
                      value={shipping.fullName}
                      onChange={(e) => setShipping(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                      placeholder="Jane Doe"
                    />
                    {validationErrors.fullName && (
                      <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.fullName}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Secure Email</label>
                    <input
                      type="email"
                      value={shipping.email}
                      onChange={(e) => setShipping(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                      placeholder="jane.doe@example.com"
                    />
                    {validationErrors.email && (
                      <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.email}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Billing & Delivery Coordinates</label>
                  <input
                    type="text"
                    value={shipping.addressLine1}
                    onChange={(e) => setShipping(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                    placeholder="123 Serene Boulevard"
                  />
                  {validationErrors.addressLine1 && (
                    <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.addressLine1}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Apartment, Suite (Optional)</label>
                  <input
                    type="text"
                    value={shipping.addressLine2}
                    onChange={(e) => setShipping(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                    placeholder="Floor 4, Penthouse 2B"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">City</label>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) => setShipping(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                      placeholder="San Francisco"
                    />
                    {validationErrors.city && (
                      <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.city}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">State</label>
                    <select
                      value={shipping.state}
                      onChange={(e) => setShipping(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors cursor-pointer"
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
                      <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.state}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={shipping.postalCode}
                      onChange={(e) => setShipping(prev => ({ ...prev, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                      placeholder="400001"
                    />
                    {validationErrors.postalCode && (
                      <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.postalCode}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Country</label>
                    <select
                      value={shipping.country}
                      onChange={(e) => setShipping(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors cursor-pointer"
                    >
                      <option>India</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>United Arab Emirates</option>
                      <option>Singapore</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Mobile Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={shipping.phone}
                      onChange={(e) => setShipping(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className="w-full bg-white/20 backdrop-blur-sm border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold font-sans text-neutral-900 focus:outline-none focus:border-neutral-400 focus:bg-white/60 rounded-xl shadow-inner-sm transition-colors"
                      placeholder="9876543210"
                    />
                    {validationErrors.phone && (
                      <span className="text-[9px] font-mono text-red-500 font-semibold">{validationErrors.phone}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-sans font-extrabold text-[13px] uppercase tracking-wider mt-6 cursor-pointer flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  <span>Lock Delivery Coordinates</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT COMPARTMENT */}
            {step === 'payment' && (
              <form onSubmit={handleRazorpayCheckout} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-500 hover:text-neutral-900 mb-2 focus:outline-none cursor-pointer bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md border border-neutral-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Shipping Profile</span>
                </button>

                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{checkoutError}</span>
                  </div>
                )}

                {/* Digital Graphic Mockup showing Razorpay Gateway */}
                <div className="w-full bg-neutral-900 text-white p-6 rounded-3xl border border-neutral-800 flex flex-col justify-between aspect-[1.7/1] relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#cfff71]/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none blur-3xl"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className="font-mono text-[9px] font-bold tracking-widest text-neutral-400 uppercase">SECURE CHECKOUT GATEWAY</span>
                    <Lock className="w-4 h-4 text-[#cfff71]" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <span className="text-[10px] text-neutral-400 block tracking-wider uppercase font-mono font-semibold">Amount Payable</span>
                      <div className="text-2xl font-extrabold text-white font-mono mt-1">
                        ₹{total.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    <div className="flex justify-between font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                      <div>
                        <span className="font-semibold">Client Reference</span>
                        <span className="text-white block font-bold mt-0.5">{shipping.fullName || 'GUEST CUSTOMER'}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Currency</span>
                        <span className="text-white block font-bold mt-0.5">INR (₹)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Razorpay Gateway Description Badge */}
                <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-4 text-[10px] font-mono font-medium text-neutral-600 rounded-2xl">
                  <CreditCard className="w-5 h-5 text-neutral-900 shrink-0" />
                  <span>Razorpay handles all payments securely. We accept UPI (GooglePay, PhonePe, Paytm), RuPay, Visa, Mastercard, Netbanking, and Wallets.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-sans font-extrabold text-[13px] uppercase tracking-widest mt-6 cursor-pointer flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay with Razorpay (₹{total.toLocaleString('en-IN')})</span>
                </button>
              </form>
            )}

            {/* STEP 3: PROCESSING LOCK / AUTHORIZING */}
            {step === 'authorizing' && (
              <div className="h-96 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-12 h-12 text-[#cfff71] animate-spin drop-shadow-sm" />
                <div className="text-center space-y-1">
                  <h4 className="font-sans text-lg font-extrabold text-neutral-900 uppercase">Processing Payment</h4>
                  <p className="text-xs text-neutral-500 font-mono uppercase font-bold">Verifying banking handshakes...</p>
                </div>

                <div className="w-full max-w-sm bg-neutral-900 text-[#cfff71] p-4 rounded-2xl text-[10px] font-mono font-semibold space-y-1.5 shadow-inner">
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
                  <div className="w-14 h-14 bg-[#cfff71] rounded-2xl flex items-center justify-center mx-auto text-neutral-900 shadow-sm border border-[#bceb5e]">
                    <Check className="w-8 h-8 font-extrabold" />
                  </div>
                  <h4 className="font-sans text-xl font-extrabold text-neutral-900 uppercase tracking-wider italic">Secure Order Authorized</h4>
                  <p className="text-neutral-500 text-xs sm:text-sm font-sans font-medium leading-relaxed max-w-sm mx-auto">
                    Thank you, {completedOrder.shipping.fullName}. Your handcrafted protection case is locked and entering processing queues. Standard delivery notification manifests will arrive in your email cabinet.
                  </p>
                </div>

                {/* Spline 3D Interactive Delivery Animation */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-widest block text-center">
                    // Interactive 3D Delivery Dispatch Box
                  </span>
                  <div className="w-full h-[280px] bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl overflow-hidden relative shadow-inner-sm">
                    <iframe 
                      src="https://my.spline.design/deliverybox-vzNOt2NdKMBmCjYsDCwzL1vw/" 
                      className="w-full h-full pointer-events-auto"
                      title="3D Active Delivery Box"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-white border border-neutral-200 text-neutral-900 text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg pointer-events-none uppercase tracking-widest shadow-sm">
                      Live Delivery Lab
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-neutral-200 text-neutral-600 text-[8px] font-mono font-bold px-2.5 py-1.5 rounded-lg pointer-events-none uppercase tracking-widest select-none shadow-sm">
                      Drag to rotate box • Pinch to zoom
                    </div>
                  </div>
                </div>

                {/* Full formal summary receipt */}
                <div className="bg-neutral-50 p-6 border border-neutral-200 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start text-xs font-mono pb-3 border-b border-neutral-200">
                    <div>
                      <h5 className="font-bold text-neutral-900 uppercase tracking-wider mb-1">Tax Invoice</h5>
                      <p className="text-[9px] text-neutral-500 font-semibold mb-2">Issued by: Yogantak (GSTIN: 29XXXXX0000X1Z5)</p>
                      <span className="text-neutral-500 font-semibold">Order Reference:</span>
                      <strong className="text-neutral-900 block mt-0.5">{completedOrder.id}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-500 font-semibold">Manifest Date:</span>
                      <strong className="text-neutral-900 block mt-0.5">{completedOrder.date}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider block">Deliver To:</span>
                    <p className="text-xs font-sans font-semibold text-neutral-900 leading-snug">
                      {completedOrder.shipping.fullName} <br />
                      {completedOrder.shipping.addressLine1}, {completedOrder.shipping.addressLine2 && `${completedOrder.shipping.addressLine2}, `} <br />
                      {completedOrder.shipping.city}, {completedOrder.shipping.state} {completedOrder.shipping.postalCode}, {completedOrder.shipping.country}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-neutral-200">
                    <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider block">Cart items:</span>
                    {completedOrder.items.map((item, id) => (
                      <div key={id} className="flex justify-between text-xs text-neutral-600">
                        <span className="font-semibold">
                          {item.product.name} (x{item.quantity})
                          <small className="block text-[10px] text-neutral-400 font-mono mt-0.5 font-bold">
                            {item.selectedModel} • {item.selectedMaterial.replace('Premium ', '')}
                          </small>
                        </span>
                        <strong className="text-neutral-900 font-mono font-extrabold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-dashed border-neutral-300 space-y-1.5 font-mono text-xs text-right font-medium">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-semibold">Subtotal:</span>
                      <span className="text-neutral-900 font-bold">₹{completedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-semibold">Shipping Cost:</span>
                      <span className="text-neutral-900 font-bold">{completedOrder.shippingCost === 0 ? 'FREE' : `₹${completedOrder.shippingCost.toLocaleString('en-IN')}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-semibold">GST Tax (5%):</span>
                      <span className="text-neutral-900 font-bold">₹{completedOrder.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2.5 mt-1 border-t border-neutral-200">
                      <strong className="font-mono font-extrabold text-neutral-900 uppercase">Total Charge Authorized:</strong>
                      <strong className="font-mono font-extrabold text-[#95c52c] text-lg">₹{completedOrder.total.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      setStep('shipping');
                    }}
                    className="w-full py-3.5 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-sans font-extrabold text-[11px] uppercase tracking-wider cursor-pointer text-center rounded-xl transition-all shadow-sm active:scale-[0.98]"
                  >
                    Continue Styling Collections
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full py-3.5 bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 font-sans font-extrabold text-[11px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Print Bill Statement</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Secure Right Summary Column (Col-5) */}
          <div className="md:col-span-5 bg-neutral-50/50 p-6 sm:p-8 border-t md:border-t-0 md:border-l border-neutral-200/50 flex flex-col h-full justify-between">
            {step !== 'success' ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-neutral-200">
                  <h4 className="font-sans text-xs font-extrabold uppercase tracking-wider text-neutral-900">Itemized Summary</h4>
                  <span className="font-mono font-bold text-[10px] text-neutral-500 uppercase tracking-wider">{cart.length} unique designs</span>
                </div>

                {/* Mini cases map */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center text-xs">
                      <span className="text-neutral-900 font-mono font-bold bg-neutral-200 w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-[11px]">
                        {item.quantity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <strong className="text-neutral-900 block truncate leading-tight font-sans text-xs font-bold uppercase tracking-wide">{item.product.name}</strong>
                        <span className="text-[10px] font-mono font-semibold text-neutral-500 block truncate">{item.selectedModel}</span>
                      </div>
                      <span className="font-mono text-neutral-900 font-extrabold flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-neutral-200 pt-4 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 tracking-wider block">Apply Promo Coupon</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-white border border-neutral-200 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-neutral-900 focus:outline-none focus:border-neutral-400 rounded-xl shadow-inner-sm transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-sans font-extrabold text-[11px] uppercase tracking-wider cursor-pointer rounded-xl transition-colors shadow-sm"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[9px] font-mono font-semibold text-red-500 block">{couponError}</span>
                  )}
                  {appliedCoupon && (
                    <span className="text-[10px] font-mono text-emerald-600 block font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                      ✓ Coupon Applied: {appliedCoupon.code} (-₹{appliedCoupon.discount.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                {/* Subsidaries listing */}
                <div className="border-t border-neutral-200 pt-4 space-y-2 font-mono text-xs font-medium">
                  <div className="flex justify-between text-neutral-600">
                    <span className="font-semibold">Items Subtotal:</span>
                    <span className="font-bold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span className="font-semibold">Express Shipping:</span>
                    <span className="font-bold text-neutral-900 bg-[#cfff71]/30 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toLocaleString('en-IN')}`}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span className="font-semibold">GST Surcharge (18%):</span>
                    <span className="font-bold text-neutral-900">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-end text-sm pt-3 border-t border-dashed border-neutral-300">
                    <strong className="font-sans font-extrabold text-neutral-900 uppercase text-xs tracking-wider">Full Balance Total:</strong>
                    <strong className="font-mono text-2xl font-extrabold text-neutral-900 leading-none">₹{total.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-4">
                <BadgeCheck className="w-12 h-12 text-[#95c52c]" />
                <h5 className="font-sans text-xs font-extrabold uppercase tracking-wider text-neutral-900">Vault cleared securely</h5>
                <p className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-[0.2em] leading-relaxed">
                  YOGANTAK Security algorithms automatically cleared payment details. Safe. Trusted. Verified.
                </p>
                
                {/* Embedded Mini 3D Box Preview inside success side panel */}
                <div className="w-full border-t border-neutral-200 pt-4 space-y-2">
                  <span className="text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-widest block">
                    Your Package Vault
                  </span>
                  <div className="w-full h-[155px] bg-white border border-neutral-200 rounded-xl overflow-hidden relative shadow-sm">
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
            <div className="pt-6 border-t border-neutral-200 text-[9.5px] font-mono text-neutral-500 space-y-2 font-medium mt-6">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-neutral-900" />
                <span className="font-extrabold text-neutral-900">HTTPS CERTIFICATION</span>
              </div>
              <p className="leading-tight">
                All transmissions are padded under strict banking SSL/TLS protocols. We represent direct compliance with PCI-DSS guidelines.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>

    </>
  );
}
