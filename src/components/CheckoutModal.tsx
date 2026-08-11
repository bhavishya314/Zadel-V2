import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../lib/products';
import { subscribeToSettings } from '../lib/firebase';
import { getOptimizedImageUrl } from '../lib/cloudinary';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutModal() {
  const { isCheckoutOpen, setCheckoutOpen, cart, cartTotal, clearCart, showToast } = useStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandName, setBrandName] = useState('ZADEL');
  const [brandLogo, setBrandLogo] = useState('');

  useEffect(() => {
    if (isCheckoutOpen) {
      setStep(1);
    }
  }, [isCheckoutOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      if (data) {
        setBrandName(data.brandName || data.storeName || 'ZADEL');
        setBrandLogo(data.logo || '');
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCheckoutOpen(false);
    };
    if (isCheckoutOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCheckoutOpen, setCheckoutOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      showToast('Please fill in all shipping details');
      return;
    }

    if (cartTotal <= 0) {
      showToast('Your bag is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create order on server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: cartTotal,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            fullName,
            email,
            phone,
            address,
            city,
            pincode,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        showToast(data.error || 'Failed to initialize payment order');
        setIsSubmitting(false);
        return;
      }

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Razorpay SDK failed to load. Check your connection.');
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout modal
      const logoUrl = brandLogo || (typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : '');

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: brandName || 'Zadel',
        description: 'Luxury Fashion Order',
        image: logoUrl,
        order_id: data.order.id,
        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },
        notes: {
          address: `${address}, ${city} - ${pincode}`,
          brand: 'Zadel Luxury Fashion',
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: false,
          emi: false,
          paylater: false,
        },
        config: {
          display: {
            sequence: ['upi', 'card', 'netbanking'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        theme: {
          color: '#C4A574',
          backdrop_color: '#0A0A0A',
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customer: {
                  fullName,
                  email,
                  phone,
                  address,
                  city,
                  pincode,
                },
                items: cart.map((item) => ({
                  productId: item.product.id,
                  productName: item.product.name,
                  price: item.product.price,
                  quantity: item.quantity,
                  size: item.size,
                  image: item.product.images?.[0] || '',
                })),
                totalAmount: cartTotal,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.verified) {
              showToast(`Payment verified! Order stored successfully. ID: ${response.razorpay_payment_id}`);
              clearCart();
              setCheckoutOpen(false);
            } else {
              showToast(verifyData.error || 'Payment signature verification failed');
            }
          } catch (verifyErr: any) {
            console.error('Payment verification error:', verifyErr);
            showToast('Failed to verify payment with server');
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        showToast(response.error?.description || 'Payment failed');
        setIsSubmitting(false);
      });
      razorpay.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || 'An error occurred during checkout');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          onClick={() => setCheckoutOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-foreground/10 bg-zadel-elevated shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-foreground/5 px-6 py-5">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground"
                    aria-label="Back to order summary"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl tracking-wide text-foreground">
                      {step === 1 ? 'Order Summary' : 'Shipping Details'}
                    </h2>
                    <span className="rounded-full border border-zadel-gold/20 bg-zadel-gold/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-zadel-gold uppercase">
                      Step {step} of 2
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {step === 1
                      ? 'Review the items in your bag before proceeding'
                      : 'Provide your delivery and contact information'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground"
                aria-label="Close checkout"
              >
                <X size={20} />
              </button>
            </div>

            {/* STEP 1: ORDER SUMMARY */}
            {step === 1 && (
              <div className="px-6 py-6">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-sm text-foreground/50">
                    Your bag is empty.
                  </div>
                ) : (
                  <>
                    {/* Products list */}
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={`${item.product.id}-${item.size}`}
                          className="flex items-center gap-4 rounded-xl border border-foreground/5 bg-zadel-surface/40 p-3"
                        >
                          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-foreground/5 bg-zadel-surface">
                            <img
                              src={getOptimizedImageUrl(
                                item.product.images?.[0] || '/images/placeholder.svg',
                                { width: 160 }
                              )}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                            <div>
                              <h4 className="truncate font-display text-sm font-medium text-foreground">
                                {item.product.name}
                              </h4>
                              <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-foreground/60">
                                <span className="rounded bg-foreground/5 px-2 py-0.5 font-medium text-foreground/80">
                                  Size: {item.size}
                                </span>
                                <span>
                                  Qty: <strong className="text-foreground">{item.quantity}</strong>
                                </span>
                                <span>{formatINR(item.product.price)} each</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <span className="text-foreground/40">Subtotal</span>
                              <span className="font-semibold text-foreground">
                                {formatINR(item.product.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="mt-5 space-y-2.5 rounded-xl border border-foreground/10 bg-zadel-surface/70 p-4 text-xs">
                      <div className="flex items-center justify-between text-foreground/70">
                        <span>Bag Subtotal</span>
                        <span className="font-medium text-foreground">{formatINR(cartTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-foreground/70">
                        <span>Delivery Charge</span>
                        <span className="text-[11px] font-medium tracking-wider text-zadel-gold uppercase">
                          Complimentary
                        </span>
                      </div>
                      <div className="my-2 border-t border-foreground/10" />
                      <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                        <span>Final Total</span>
                        <span className="font-display text-lg text-zadel-gold">
                          {formatINR(cartTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Step 1 Action */}
                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-luxury w-full rounded-full bg-zadel-gold py-3.5 text-[11px] font-semibold tracking-[0.18em] text-zadel-ink uppercase transition hover:bg-zadel-gold-light"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2: CUSTOMER DETAILS & PAYMENT */}
            {step === 2 && (
              <>
                {/* Cart Summary Banner */}
                {cart.length > 0 && (
                  <div className="flex items-center justify-between border-b border-foreground/5 bg-zadel-surface/60 px-6 py-3 text-xs text-foreground/70">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-zadel-gold" />
                      <span>
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                        {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'} in bag
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-semibold text-foreground">
                        Total: {formatINR(cartTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[11px] text-zadel-gold underline hover:text-zadel-gold-light transition"
                      >
                        Edit Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-foreground/10 bg-zadel-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-zadel-gold focus:outline-none transition"
                    />
                  </div>

                  {/* Contact Info (Phone & Email) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-foreground/10 bg-zadel-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-zadel-gold focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="eleanor@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-foreground/10 bg-zadel-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-zadel-gold focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
                      Address
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Street address, apartment, suite, etc."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full resize-none rounded-lg border border-foreground/10 bg-zadel-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-zadel-gold focus:outline-none transition"
                    />
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-lg border border-foreground/10 bg-zadel-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-zadel-gold focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
                        Pincode
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="400001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full rounded-lg border border-foreground/10 bg-zadel-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-zadel-gold focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-luxury w-full rounded-full bg-zadel-gold py-3.5 text-[11px] font-semibold tracking-[0.18em] text-zadel-ink uppercase transition hover:bg-zadel-gold-light disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Proceed to Pay'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
