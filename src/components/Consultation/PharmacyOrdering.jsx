import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  Zap,
  TrendingDown,
  Clock,
  ShieldAlert,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  X,
  Plus,
  Minus,
  Truck,
  PackageCheck,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { PHARMACY_PROVIDERS } from '../../utils/providers';
import { logAuditEvent } from '../Common/AuditLogModal';

export function PharmacyOrdering({ medicines = [], consultationSummary }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [prescriptionAttached, setPrescriptionAttached] = useState(false);
  const [digitalDraftConfirmed, setDigitalDraftConfirmed] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Address Form State
  const [address, setAddress] = useState({
    name: 'Mrs. Smith',
    phone: '+91 98765 43210',
    line1: 'Flat 402, Greenview Heights, Sector 14',
    city: 'New Delhi',
    pincode: '110001',
  });

  // Query Pharmacy Gateway for quotes whenever medicines list updates
  useEffect(() => {
    if (medicines && medicines.length > 0) {
      fetchQuotesForMedicines();
    }
  }, [medicines]);

  const fetchQuotesForMedicines = async () => {
    setIsLoading(true);
    try {
      const results = [];
      for (const med of medicines) {
        const query = med.name.split(' ')[0]; // Search base name
        const res = await fetch(`/api/pharmacy/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.medicines && data.medicines.length > 0) {
            results.push({
              originalMed: med,
              matched: data.medicines[0],
            });
          }
        }
      }
      setSearchResults(results);
    } catch (err) {
      console.warn('Pharmacy quote search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (medicineItem, quote) => {
    const cartItem = {
      id: `${medicineItem.id}-${quote.provider}`,
      name: medicineItem.name,
      genericSalt: medicineItem.genericSalt,
      strength: medicineItem.strength,
      rxRequired: medicineItem.rxRequired,
      provider: quote.provider,
      providerName: quote.providerName,
      price: quote.price,
      eta: quote.eta,
      deliveryFee: quote.deliveryFee || 25,
      quantity: 1,
    };

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, cartItem];
    });

    setIsCartOpen(true);
    logAuditEvent('MEDICINE_ADDED_TO_CART', `Added ${cartItem.name} via ${quote.providerName}`);
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Place Order through Sandbox Adapter
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Check Rx-requirement
    const hasRxOnly = cart.some((item) => item.rxRequired);
    const isRxSatisfied = prescriptionAttached || digitalDraftConfirmed;

    if (hasRxOnly && !isRxSatisfied) {
      alert('Prescription-only medicine detected. Please attach or confirm the Digital Prescription Draft before proceeding.');
      return;
    }

    try {
      const primaryProvider = cart[0]?.provider || 'blinkit';
      const response = await fetch('/api/pharmacy/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          provider: primaryProvider,
          patientDetails: address,
          prescriptionAttached: isRxSatisfied,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to place order');
      }

      const orderData = await response.json();
      setActiveOrder(orderData);
      setIsCartOpen(false);
      setIsTrackingModalOpen(true);
      setCart([]);
      logAuditEvent('ORDER_PLACED', `Placed simulated pharmacy order #${orderData.orderId}`);
    } catch (err) {
      alert('Order placement error: ' + err.message);
    }
  };

  if (!medicines || medicines.length === 0) {
    return null;
  }

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const deliveryFee = cart.length > 0 ? 25 : 0;
  const grandTotal = cartTotal + deliveryFee;
  const hasRxItemInCart = cart.some((i) => i.rxRequired);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Order Your Medicines</h3>
            <p className="text-xs text-slate-500">Live price comparison & instant delivery gateway</p>
          </div>
        </div>

        {/* Cart Trigger Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>View Cart</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center ml-1">
              {cart.reduce((a, c) => a + c.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mandatory Clinical Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Prescription Compliance Note:</span> Prescription medicines require a valid prescription. Confirm dosage with your doctor before ordering.
        </div>
      </div>

      {/* Medicines Comparison Cards */}
      <div className="space-y-4">
        {searchResults.map(({ originalMed, matched }, index) => {
          return (
            <div
              key={index}
              className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
            >
              {/* Medicine Title & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-sm">{matched.name}</h4>
                    <span className="text-xs text-slate-500">({matched.strength})</span>
                    {matched.rxRequired ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Prescription Only (Rx)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Over The Counter (OTC)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Salt: <span className="font-medium text-slate-800">{matched.genericSalt}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{matched.description}</p>
                </div>
              </div>

              {/* Provider Quotes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                {matched.quotes &&
                  matched.quotes.map((quote) => (
                    <div
                      key={quote.provider}
                      className={`relative bg-white border rounded-lg p-3 flex flex-col justify-between transition-all ${
                        quote.isBestPrice
                          ? 'border-emerald-400 ring-1 ring-emerald-400'
                          : quote.isFastest
                          ? 'border-teal-400 ring-1 ring-teal-400'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Best Price / Fastest Floating Badges */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {quote.providerName}
                        </span>
                        {quote.isBestPrice && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <TrendingDown className="w-2.5 h-2.5" /> Best Price
                          </span>
                        )}
                        {quote.isFastest && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                            <Zap className="w-2.5 h-2.5" /> Fastest
                          </span>
                        )}
                      </div>

                      {/* Pricing & ETA */}
                      <div className="my-1.5">
                        <div className="text-base font-bold text-slate-900">
                          ₹{quote.price.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{quote.eta}</span>
                        </div>
                      </div>

                      {/* Sandbox Badge */}
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-2">
                        Simulated Partner API
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleAddToCart(matched, quote)}
                          className="w-full py-1.5 px-2 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-medium transition-colors"
                        >
                          Add to Cart
                        </button>
                        <a
                          href={quote.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1 py-1 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors"
                          title="Open real web search on provider"
                        >
                          <span>Open Site</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Generic Alternatives (Cost Savings) */}
              {matched.genericAlternatives && matched.genericAlternatives.length > 0 && (
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                    Generic Alternatives with Same Salt:
                  </div>
                  <div className="flex flex-wrap gap-2 text-slate-700">
                    {matched.genericAlternatives.map((alt, i) => (
                      <span
                        key={i}
                        className="bg-white border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {alt.name} ({alt.manufacturer}) • ₹{alt.price}{' '}
                        <span className="text-emerald-700 font-bold">({alt.saving} cheaper)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-teal-700" />
                <h3 className="font-semibold text-slate-800 text-base">Pharmacy Checkout Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {cart.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Your pharmacy cart is empty.</p>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between bg-white">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              via {item.providerName}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            ₹{item.price.toFixed(2)} each • {item.eta}
                          </div>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="p-1 border border-slate-200 rounded hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-semibold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="p-1 border border-slate-200 rounded hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rx-Only Gate */}
                  {hasRxItemInCart && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Prescription Verification Gate</span>
                      </div>
                      <p className="text-amber-800 text-[11px]">
                        One or more items in your cart require a valid prescription. Select an option below to authorize checkout:
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={digitalDraftConfirmed}
                            onChange={(e) => setDigitalDraftConfirmed(e.target.checked)}
                            className="rounded text-teal-600"
                          />
                          <span className="text-slate-800 font-medium text-xs">
                            Attach Consultation Summary as Digital Prescription Draft
                          </span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prescriptionAttached}
                            onChange={(e) => setPrescriptionAttached(e.target.checked)}
                            className="rounded text-teal-600"
                          />
                          <span className="text-slate-800 font-medium text-xs">
                            Patient has uploaded external paper prescription photo
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Delivery Address Form */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <span className="font-semibold text-slate-700 block">Delivery Address & Recipient:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={address.name}
                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                        placeholder="Recipient Name"
                        className="p-2 border rounded text-xs"
                      />
                      <input
                        type="text"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="Phone Number"
                        className="p-2 border rounded text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      placeholder="Delivery Street Address"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="border-t border-slate-200 pt-3 space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Medicines Subtotal:</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-100">
                      <span>Grand Total:</span>
                      <span className="text-teal-800">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 text-xs"
              >
                Continue Shopping
              </button>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`px-4 py-2 rounded-lg text-white font-medium text-xs transition-colors ${
                  cart.length > 0 ? 'bg-teal-700 hover:bg-teal-800 shadow-xs' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Place Simulated Order (₹{grandTotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracker Modal */}
      {isTrackingModalOpen && activeOrder && (
        <LiveOrderTrackerModal
          order={activeOrder}
          onClose={() => setIsTrackingModalOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Live Order Tracker Component with Server-Sent Events (SSE) Live Progression
 */
function LiveOrderTrackerModal({ order, onClose }) {
  const [currentOrder, setCurrentOrder] = useState(order);

  useEffect(() => {
    // Connect to Server-Sent Events (SSE) live tracking endpoint
    const eventSource = new EventSource(`/api/pharmacy/order/${order.orderId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const updated = JSON.parse(event.data);
        setCurrentOrder(updated);
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, [order.orderId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Live Order Tracking</h3>
              <p className="text-xs text-slate-500">Order #{currentOrder.orderId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracking Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status Banner */}
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] text-teal-700 uppercase font-semibold block">Current State</span>
              <span className="font-bold text-teal-950 text-sm">{currentOrder.status}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white border border-teal-300 text-teal-800 font-medium text-xs">
              {currentOrder.provider}
            </span>
          </div>

          {/* Stepper Progress */}
          <div className="space-y-4 relative pl-4 border-l-2 border-slate-200 ml-3">
            {currentOrder.steps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Step dot */}
                <div
                  className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${
                    step.completed
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {step.completed && <CheckCircle2 className="w-3 h-3 text-white fill-current" />}
                </div>

                <div className="pl-2">
                  <div className={`font-semibold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </div>
                  {step.time && <div className="text-[11px] text-slate-500">{step.time}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Details */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-700">
            <div className="font-medium text-slate-900">Delivery Address:</div>
            <div>{currentOrder.patientDetails?.line1}</div>
            <div>{currentOrder.patientDetails?.name} • {currentOrder.patientDetails?.phone}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
