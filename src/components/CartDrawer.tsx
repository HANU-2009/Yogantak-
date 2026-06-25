import { X, ShieldCheck, Lock, Trash2, ChevronRight, Plus, Minus } from 'lucide-react';
import { CartItem } from '../types';
import PhoneCaseRenderer from './PhoneCaseRenderer';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 4000;
  const awayFromFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-backdrop">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-gray-100 shadow-2xl flex flex-col justify-between">
          
          {/* Header Panel */}
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold uppercase tracking-wider text-black">Shopping Bag</span>
              <span className="text-[10px] font-mono bg-gray-50 px-2.2 py-0.5 rounded-none text-slate-500 font-bold border border-gray-100">
                {cart.reduce((a, c) => a + c.quantity, 0)} Items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary shipping milestone progress bar */}
          <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[11px] sm:text-xs font-mono text-slate-500">
              {awayFromFreeShipping > 0 ? (
                <span>You are <strong className="text-black">₹{awayFromFreeShipping.toLocaleString('en-IN')}</strong> away from free express shipping!</span>
              ) : (
                <span className="text-black font-bold">✓ Congratulations! Complimentary express delivery unlocked.</span>
              )}
              <span className="font-bold">₹{subtotal.toLocaleString('en-IN')} / ₹4,000</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-none overflow-hidden">
              <div 
                className="bg-black h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cart items listing */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-none bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                  <X className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-black">Your Bag is Empty</h3>
                  <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed">
                    Explore our protective options & customized designs to shield your device today.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-black text-white hover:opacity-85 font-mono text-[10px] uppercase tracking-widest transition-opacity cursor-pointer rounded-none"
                >
                  Return To Collections
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-gray-100 last:border-0 last:pb-0 group"
                >
                  {/* Miniature model render preview or placeholder */}
                  <div className="w-16 h-24 sm:w-20 sm:h-28 bg-gray-50 flex items-center justify-center p-2 rounded-none border border-gray-100 flex-shrink-0">
                    <span className="scale-[0.45] origin-center">
                      <PhoneCaseRenderer
                        model={item.selectedModel}
                        material={item.selectedMaterial}
                        color={item.selectedColor}
                        monogramText={item.customConfig?.monogramText || ''}
                        monogramColor={item.customConfig?.monogramColor || 'gold'}
                        magsafe={item.customConfig?.magsafe ?? item.product.magsafe}
                        buttonColor={item.customConfig?.buttonColor || 'matching'}
                        size="md"
                      />
                    </span>
                  </div>

                  {/* Core description details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-black leading-tight line-clamp-2">
                        {item.product.name}
                      </h4>
                      <span className="font-mono font-bold text-sm text-black flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Metadata chips */}
                    <div className="space-y-1 text-[11px] font-mono text-gray-400">
                      <div>{item.selectedModel}</div>
                      <div>{item.selectedMaterial.replace('Premium ', '')} / {item.selectedColor.name}</div>
                      
                      {item.customConfig?.monogramText && (
                        <div className="text-center md:text-left bg-neutral-900 text-white px-2 py-0.5 mt-1 block w-fit border border-black font-bold uppercase rounded-none text-[9px] tracking-wide">
                          ★ HOT MONOGRAM: "{item.customConfig.monogramText}" ({item.customConfig.monogramColor} foil)
                        </div>
                      )}
                    </div>

                    {/* Controls alignment */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Interactive pill adjuster */}
                      <div className="flex items-center border border-gray-100 bg-white text-xs font-mono">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove item bin icon */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 px-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-none transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Footer checkout and aggregate values drawer */}
          {cart.length > 0 && (
            <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-100 space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Complementary Shipping</span>
                  <span className="text-black font-bold">FREE EXPRESS</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Calculated Import Taxes</span>
                  <span>Calculated Next Step</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                  <span className="font-mono text-sm font-bold text-black">Subtotal Balance</span>
                  <span className="font-mono text-2xl font-bold text-black">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Secure padding shield alert */}
              <div className="bg-white px-3 py-2 border border-gray-100 flex gap-2 items-center">
                <ShieldCheck className="w-5 h-5 text-black flex-shrink-0" />
                <span className="text-[10px] font-mono leading-tight text-slate-500">
                  Secure AES-256 Bit SSL Certificate Encrypted checkout. Complete shopping protections fully enabled.
                </span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-4.5 bg-black hover:opacity-85 text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 group transition-opacity rounded-none cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock in & Proceed Securely</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
