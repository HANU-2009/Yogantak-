import { Order } from '../types';
import { Package, Calendar, MapPin, Truck, ExternalLink, ClipboardCheck, Sparkles, Receipt, XCircle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface OrdersListProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
}

export default function OrdersList({ orders, onCancelOrder }: OrdersListProps) {
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1B1C]">
          Track Your Deliveries
        </h2>
        <p className="text-xs sm:text-sm text-[#8C8273] font-mono uppercase tracking-widest">
          Secure purchase history records & courier coordinates
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#FAF7F2] p-12 text-center border border-[#EBE3D5] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EFEBE4] flex items-center justify-center text-[#8C8273] mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-[18px] font-bold text-[#1A1B1C]">No Active Manifests</h3>
            <p className="text-xs text-[#8C8273] max-w-sm mx-auto leading-relaxed">
              You have not authorized any secure purchases in this session yet. Complete checkout and trace order clearances live!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div 
              key={order.id}
              className={`bg-white border transition-all duration-300 ${
                order.status === 'cancelled' ? 'opacity-65 border-[#E2D4C0]' : 'border-[#EBE3D5]'
              } overflow-hidden`}
            >
              {/* Top status bar */}
              <div className="bg-[#FAF7F2] p-4 px-6 border-b border-[#EBE3D5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[#8C8273]">SECURE PIN:</span>
                    <button 
                      onClick={() => copyToClipboard(order.id)}
                      className="flex items-center gap-1 font-bold text-[#1A1B1C] hover:text-[#C05C46] focus:outline-none"
                    >
                      <span>{order.id}</span>
                      {copiedId === order.id ? (
                        <span className="text-emerald-700 text-[9px] uppercase font-bold pl-1">✓ COPIED</span>
                      ) : (
                        <ClipboardCheck className="w-3.5 h-3.5 opacity-55" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#8C8273]">DATE COMPLETED:</span>
                    <strong className="text-[#1A1B1C] block">{order.date.split(' at ')[0]}</strong>
                  </div>
                </div>

                {/* Tracking state badge */}
                {order.status === 'cancelled' ? (
                  <span className="px-3.5 py-1.5 bg-[#5A2C22] text-white text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Manifest Terminated</span>
                  </span>
                ) : order.status === 'delayed' ? (
                  <span className="px-3.5 py-1.5 bg-amber-600 text-white text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-full animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Fulfillment Delayed</span>
                  </span>
                ) : order.status === 'confirmed' ? (
                  <span className="px-3.5 py-1.5 bg-blue-700 text-white text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Order Confirmed</span>
                  </span>
                ) : order.status === 'delivered' ? (
                  <span className="px-3.5 py-1.5 bg-emerald-700 text-white text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-full">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Delivered</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 bg-[#243D2D] text-white text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-full">
                    <Truck className="w-3.5 h-3.5 animate-pulse" />
                    <span>{order.status === 'shipped' ? 'Shipped in Transit' : 'Processing for Dispatch'}</span>
                  </span>
                )}
              </div>

              {/* Central Information Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Left: Items (Col-7) */}
                <div className="md:col-span-7 space-y-4">
                  <span className="text-[10px] font-mono text-[#8C8273] uppercase tracking-wider block font-bold">Courier Freight manifest:</span>
                  <div className="divide-y divide-[#EBE3D5]">
                    {order.items.map((item, id) => (
                      <div key={id} className="py-3 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                        <div className="space-y-1">
                          <strong className="font-serif text-[#1A1B1C] font-semibold text-sm">
                            {item.product?.name || (item as any).productName || 'Phone Case'} <span className="font-mono text-neutral-400">({item.quantity}x)</span>
                          </strong>
                          <div className="font-mono text-[10px] text-[#8C8273] flex flex-wrap gap-2">
                            <span>DEVICE: {item.selectedModel || item.customConfig?.model}</span>
                            {item.selectedMaterial || item.customConfig?.material ? (
                              <>
                                <span>•</span>
                                <span>MATERIAL: {item.selectedMaterial || item.customConfig?.material}</span>
                              </>
                            ) : null}
                            {item.customConfig?.monogramText && (
                              <>
                                <span>•</span>
                                <span className="text-[#C05C46] font-bold">LASER ENGRAVED</span>
                              </>
                            )}
                          </div>
                        </div>

                        <span className="font-mono text-neutral-900 font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Billing details (Col-5) */}
                <div className="md:col-span-5 bg-[#FAF7F2] p-5 border border-[#EBE3D5] space-y-4">
                  <span className="text-[10px] font-mono text-[#8C8273] uppercase tracking-wider block font-bold">Logistics Dossier:</span>
                  
                  {/* Address */}
                  <div className="space-y-1 text-xs">
                    <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider">Recipient Coordinates:</span>
                    <p className="text-[#1A1B1C] font-mono leading-relaxed">
                      {order.shipping.fullName}<br />
                      {order.shipping.addressLine1}<br />
                      {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}, {order.shipping.country}
                    </p>
                  </div>

                  {/* Pricing tally */}
                  <div className="border-t border-dashed border-[#DCD5C9] pt-3.5 space-y-1 text-xs text-right font-mono text-[#8C8273]">
                    <div className="flex justify-between">
                      <span>Items tally:</span>
                      <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Express courier cost:</span>
                      <span className="text-emerald-700 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & Duties:</span>
                      <span>₹{order.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#1A1B1C] font-serif font-black border-t border-[#DCD5C9] pt-2">
                      <span>Total Authorized:</span>
                      <span>₹{order.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Progress milestones list footer */}
              <div className={`px-6 py-4 text-[10.5px] font-mono border-t flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ${
                order.status === 'cancelled' 
                  ? 'bg-[#F9F6F0] text-[#8C8273] border-[#E2D4C0]' 
                  : order.status === 'delayed'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-[#EFEDE7] text-[#5C5549] border-[#EBE3D5]'
              }`}>
                {order.status === 'cancelled' ? (
                  <div className="w-full space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[#5A2C22] font-bold">
                        <Receipt className="w-4 h-4 text-[#C05C46] shrink-0" />
                        <span>
                          {order.refund?.status === 'REFUNDED' || order.refund?.status === 'completed' || order.refund?.status === 'processed'
                            ? 'ORDER CANCELLED — REFUND PROCESSED TO SOURCE'
                            : order.refund?.status === 'REFUND_PENDING' || order.refund?.status === 'pending'
                            ? 'ORDER CANCELLED — REFUND PENDING BANK CLEARANCE'
                            : order.refund?.status === 'REFUND_FAILED'
                            ? 'ORDER CANCELLED — GATEWAY REFUND ACTION REQUIRED'
                            : 'ORDER CANCELLED — REFUND INITIATED'}
                        </span>
                      </span>
                      <span className="text-[#C05C46] font-extrabold font-mono text-xs tracking-wider bg-[#F5ECE2] px-2.5 py-1 rounded-md border border-[#E2D4C0]">
                        REFUND AMOUNT: ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="bg-white p-3.5 rounded-lg border border-[#E2D4C0] font-mono text-[10.5px] space-y-1.5 text-[#5C5549] shadow-inner-sm">
                      <div className="flex flex-wrap justify-between gap-2 border-b border-dashed border-[#EBE3D5] pb-1.5">
                        <span>REFUND TRANSACTION ID: <strong className="text-neutral-900">{order.refund?.razorpayRefundId || order.refund?.id || `REF-${order.id.slice(-8)}`}</strong></span>
                        <span>
                          CLEARANCE STATUS: {' '}
                          <strong className={`font-extrabold uppercase px-2 py-0.5 rounded ${
                            order.refund?.status === 'REFUNDED' || order.refund?.status === 'completed' || order.refund?.status === 'processed'
                              ? 'text-emerald-700 bg-emerald-50'
                              : order.refund?.status === 'REFUND_PENDING' || order.refund?.status === 'pending'
                              ? 'text-amber-700 bg-amber-50'
                              : order.refund?.status === 'REFUND_FAILED'
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-blue-700 bg-blue-50'
                          }`}>
                            {order.refund?.status === 'REFUNDED' || order.refund?.status === 'completed' || order.refund?.status === 'processed'
                              ? '✓ REFUNDED'
                              : order.refund?.status === 'REFUND_PENDING' || order.refund?.status === 'pending'
                              ? '⏳ REFUND PENDING'
                              : order.refund?.status === 'REFUND_FAILED'
                              ? '❌ REFUND FAILED'
                              : 'ℹ️ INITIATED'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2 pt-0.5">
                        <span>DISBURSEMENT CHANNEL: <strong className="text-neutral-800">{order.refund?.refundMethod || 'Razorpay / Original Payment Source'}</strong></span>
                        <span>TIMESTAMPS: <strong>{order.refund?.completedAt ? new Date(order.refund.completedAt).toLocaleString('en-IN') : 'Gateway Processing'}</strong></span>
                      </div>
                      {order.refund?.gatewayError && (
                        <div className="pt-1 text-[10px] text-rose-600 font-sans font-semibold">
                          ⚠️ Gateway Notice: {order.refund.gatewayError}
                        </div>
                      )}
                    </div>
                  </div>
                ) : order.status === 'delayed' ? (
                  <>
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>⚠️ DISPATCH DELAY NOTICE: {order.delayReason || 'Quality check inspection in progress.'}</span>
                      </span>
                      {order.estimatedDelivery && (
                        <p className="text-[10px] text-amber-700 font-bold pl-5">REVISED ESTIMATED DELIVERY: {order.estimatedDelivery}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {confirmingCancelId === order.id ? (
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-[#8C8273] uppercase tracking-wider pr-1">Cancel order?</span>
                          <button
                            onClick={() => {
                              onCancelOrder(order.id);
                              setConfirmingCancelId(null);
                            }}
                            className="px-2.5 py-1 bg-[#5A2C22] hover:bg-[#723B30] text-white rounded text-[9px] cursor-pointer transition-all"
                          >
                            Confirm Cancel
                          </button>
                          <button
                            onClick={() => setConfirmingCancelId(null)}
                            className="px-2.5 py-1 border border-[#DCD5C9] hover:bg-[#EFEBE4] text-[#5C5549] rounded text-[9px] cursor-pointer transition-all"
                          >
                            Keep Order
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingCancelId(order.id)}
                          className="px-2.5 py-1 border border-amber-300 hover:border-amber-500 bg-white text-amber-900 font-bold rounded text-[9.5px] tracking-wider uppercase cursor-pointer transition-all"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C05C46]" />
                      <span>STATUS: {order.status === 'confirmed' ? 'Order Confirmed — Preparing for laser monogramming' : order.status === 'delivered' ? 'Package Delivered' : 'DISPATCH DEPOT: Mumbai Central Sorting Center'}</span>
                    </span>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[#C05C46] font-bold">
                        {order.status === 'delivered' ? 'DELIVERY COMPLETED' : 'ESTIMATED DELIVERY: 3-5 BUSINESS DAYS via BlueDart / Delhivery'}
                      </span>
                      
                      {order.status !== 'delivered' && (
                        confirmingCancelId === order.id ? (
                          <div className="flex items-center gap-2 font-bold">
                            <span className="text-[#8C8273] uppercase tracking-wider pr-1">Are you sure?</span>
                            <button
                              onClick={() => {
                                onCancelOrder(order.id);
                                setConfirmingCancelId(null);
                              }}
                              className="px-2.5 py-1 bg-[#5A2C22] hover:bg-[#723B30] text-white rounded text-[9px] cursor-pointer transition-all"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              onClick={() => setConfirmingCancelId(null)}
                              className="px-2.5 py-1 border border-[#DCD5C9] hover:bg-[#EFEBE4] text-[#5C5549] rounded text-[9px] cursor-pointer transition-all"
                            >
                              Keep Order
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingCancelId(order.id)}
                            className="px-2.5 py-1 border border-[#EBE3D5] hover:border-[#C05C46] text-[#8C8273] hover:text-[#C05C46] rounded text-[9.5px] tracking-wider uppercase cursor-pointer transition-all"
                          >
                            Cancel Order
                          </button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
