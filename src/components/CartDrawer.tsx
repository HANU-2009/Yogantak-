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
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#fdfdfd]/40 backdrop-blur-3xl border-l border-neutral-200/60 shadow-2xl flex flex-col justify-between sm:rounded-l-[2rem] overflow-hidden">
          
          {/* Header Panel */}
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-neutral-200/60 flex items-center justify-between bg-white/20 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-sans text-lg font-extrabold tracking-tight text-neutral-900">Shopping Bag</span>
              <span className="text-[10px] font-mono bg-neutral-100 px-2.5 py-0.5 rounded-full text-neutral-600 font-bold border border-neutral-200 shadow-sm">
                {cart.reduce((a, c) => a + c.quantity, 0)} Items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary shipping milestone progress bar */}
          <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-neutral-200/60 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[11px] sm:text-xs font-mono text-neutral-600">
              {awayFromFreeShipping > 0 ? (
                <span>You are <strong className="text-neutral-900">₹{awayFromFreeShipping.toLocaleString('en-IN')}</strong> away from free express shipping!</span>
              ) : (
                <span className="text-neutral-900 font-bold">✓ Congratulations! Complimentary express delivery unlocked.</span>
              )}
              <span className="font-bold">₹{subtotal.toLocaleString('en-IN')} / ₹4,000</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden shadow-inner-sm">
              <div 
                className="bg-[#cfff71] h-full transition-all duration-500 ease-out rounded-full shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cart items listing */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shadow-sm">
                  <X className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-sm font-extrabold uppercase tracking-wider text-neutral-900">Your Bag is Empty</h3>
                  <p className="text-xs text-neutral-500 max-w-[240px] leading-relaxed font-medium">
                    Explore our protective options & customized designs to shield your device today.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-[#cfff71]/80 backdrop-blur-sm text-neutral-900 hover:bg-[#cfff71] font-sans font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer rounded-xl shadow-sm active:scale-[0.98]"
                >
                  Return To Collections
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-neutral-200 last:border-0 last:pb-0 group"
                >
                  {/* Miniature model render preview or placeholder */}
                  <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white flex items-center justify-center p-2 rounded-[1rem] border border-neutral-200 shadow-sm flex-shrink-0">
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
                      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900 leading-tight line-clamp-2">
                        {item.product.name}
                      </h4>
                      <span className="font-mono font-bold text-sm text-neutral-900 flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Metadata chips */}
                    <div className="space-y-1 text-[11px] font-mono text-neutral-500 font-semibold">
                      <div>{item.selectedModel}</div>
                      <div>{item.selectedMaterial.replace('Premium ', '')} / {item.selectedColor.name}</div>
                      
                      {item.customConfig?.monogramText && (
                        <div className="text-center md:text-left bg-neutral-900 text-white px-2.5 py-0.5 mt-1.5 block w-fit border border-neutral-900 font-bold uppercase rounded-full text-[9px] tracking-wide shadow-sm">
                          ★ HOT MONOGRAM: "{item.customConfig.monogramText}" ({item.customConfig.monogramColor} foil)
                        </div>
                      )}
                    </div>

                    {/* Controls alignment */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Interactive pill adjuster */}
                      <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden text-xs font-mono shadow-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1.5 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 font-bold text-neutral-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1.5 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove item bin icon */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors cursor-pointer shadow-sm border border-red-100"
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
            <div className="bg-white/20 backdrop-blur-md p-4 sm:p-6 border-t border-neutral-200/60 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="space-y-1.5 font-mono text-xs font-medium">
                <div className="flex justify-between text-neutral-500">
                  <span>Complementary Shipping</span>
                  <span className="text-neutral-900 font-bold bg-[#cfff71]/30 px-1.5 py-0.5 rounded text-[10px]">FREE EXPRESS</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Calculated Import Taxes</span>
                  <span>Calculated Next Step</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-neutral-200">
                  <span className="font-mono text-sm font-bold text-neutral-900">Subtotal Balance</span>
                  <span className="font-mono text-2xl font-extrabold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Secure padding shield alert */}
              <div className="bg-white/10 backdrop-blur-md px-3 py-2.5 border border-neutral-200/60 rounded-xl flex gap-2.5 items-center">
                <ShieldCheck className="w-5 h-5 text-neutral-900 flex-shrink-0" />
                <span className="text-[10px] font-mono leading-tight text-neutral-600 font-semibold">
                  Secure AES-256 Bit SSL Certificate Encrypted checkout. Complete shopping protections fully enabled.
                </span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-4 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-sans font-extrabold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 group transition-all rounded-xl cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
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
