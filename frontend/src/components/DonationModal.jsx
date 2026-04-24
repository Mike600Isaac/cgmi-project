import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];
const CURRENCIES = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghana Cedis' },
];

/* ── Load Paystack script once ─────────────────────────────────── */
function loadPaystack() {
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function DonationModal({ show, onClose }) {
  const { user } = useAuth();

  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [submitting, setSubmitting] = useState(false);
  const [paidDonation, setPaidDonation] = useState(null);

  const [form, setForm] = useState({
    amount: '',
    currency: 'NGN',
    donor_name: user ? `${user.first_name} ${user.last_name}` : '',
    donor_email: user ? user.email : '',
    message: '',
    is_anonymous: false,
  });

  // Sync logged-in user details whenever modal opens
  useEffect(() => {
    if (show && user) {
      setForm(f => ({
        ...f,
        donor_name: `${user.first_name} ${user.last_name}`,
        donor_email: user.email,
      }));
    }
    if (show) setStep('form');
  }, [show, user]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency) || CURRENCIES[0];
  const amountNum = parseFloat(form.amount) || 0;
  const isValid = amountNum > 0 && form.donor_email && form.donor_name;

  /* ── Save donation to backend ───────────────────────────────── */
  const saveDonation = async (payRef) => {
    const { data } = await api.post('/api/donations', {
      amount: amountNum,
      currency: form.currency,
      donor_name: form.is_anonymous ? 'Anonymous' : form.donor_name,
      donor_email: form.donor_email,
      message: form.message,
      is_anonymous: form.is_anonymous,
      payment_method: 'paystack',
      payment_ref: payRef,
    });
    return data.donation;
  };

  /* ── Launch Paystack popup ──────────────────────────────────── */
  const handleGive = async () => {
    if (!isValid) { toast.error('Please fill in your name, email and amount'); return; }
    setSubmitting(true);

    try {
      await loadPaystack();

      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // Paystack amounts are in kobo (NGN), pesewas (GHS) or cents (USD/GBP)
      const paystackAmount = Math.round(amountNum * 100);

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: form.donor_email,
        amount: paystackAmount,
        currency: form.currency,
        ref: `MIN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        metadata: {
          donor_name: form.donor_name,
          message: form.message,
          custom_fields: [
            { display_name: 'Donor Name', variable_name: 'donor_name', value: form.donor_name },
            { display_name: 'Message', variable_name: 'message', value: form.message || 'No message' },
          ],
        },
        callback: async (response) => {
          try {
            const donation = await saveDonation(response.reference);
            setPaidDonation(donation);
            setStep('success');
          } catch {
            toast.error('Payment received but record failed. Please contact us.');
          } finally {
            setSubmitting(false);
          }
        },
        onClose: () => {
          setSubmitting(false);
          toast('Payment window closed. You can try again.');
        },
      });

      handler.openIframe();
    } catch {
      setSubmitting(false);
      toast.error('Could not load payment. Please check your connection.');
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === 'success' ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1055, width: '100%', maxWidth: 520, padding: '0 1rem' }}
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="ministry-card p-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

              {/* ── Step: Success ── */}
              {step === 'success' && (
                <motion.div
                  className="text-center py-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, times: [0, 0.5, 1] }}
                  >
                    <i className="bi bi-patch-check-fill text-success" style={{ fontSize: '4rem' }} />
                  </motion.div>
                  <h3 className="fw-bold mt-3 mb-2" style={{ fontFamily: 'Cinzel, serif', color: 'var(--dark-navy)' }}>
                    God Bless You! 🙏
                  </h3>
                  <p className="text-muted mb-1">
                    Your donation of <strong>{selectedCurrency.symbol}{paidDonation?.amount?.toLocaleString()}</strong> has been received.
                  </p>
                  <p className="small text-muted mb-3">
                    Ref: <code>{paidDonation?.payment_ref}</code>
                  </p>
                  <div
                    className="p-3 rounded mb-4"
                    style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))', color: 'white' }}
                  >
                    <i className="bi bi-quote fs-4 text-gold d-block mb-1" />
                    <p className="small mb-1 fst-italic">
                      "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap."
                    </p>
                    <p className="small text-gold mb-0">— Luke 6:38</p>
                  </div>
                  {user && (
                    <p className="small text-muted mb-3">
                      <i className="bi bi-info-circle me-1" />
                      This donation has been recorded to your account. View it in your <strong>Dashboard → My Donations</strong>.
                    </p>
                  )}
                  <button className="btn btn-gold w-100" onClick={onClose}>
                    <i className="bi bi-heart-fill me-2" />Close
                  </button>
                </motion.div>
              )}

              {/* ── Step: Form ── */}
              {step === 'form' && (
                <>
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h4 className="fw-bold mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                        <i className="bi bi-heart-fill text-gold me-2" />Give Today
                      </h4>
                      <p className="text-muted small mb-0">Support the Ministry — no registration required</p>
                    </div>
                    <button className="btn-close" onClick={onClose} />
                  </div>

                  {/* Logged-in banner */}
                  {user && (
                    <div className="alert alert-sm d-flex align-items-center gap-2 mb-3 py-2"
                      style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10 }}>
                      <i className="bi bi-person-check-fill text-gold" />
                      <span className="small">Giving as <strong>{user.first_name} {user.last_name}</strong> — your donation will appear on your dashboard.</span>
                    </div>
                  )}

                  {/* Currency */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Currency</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {CURRENCIES.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          className={`btn btn-sm ${form.currency === c.code ? 'btn-gold' : 'btn-outline-secondary'}`}
                          onClick={() => set('currency', c.code)}
                        >
                          {c.symbol} {c.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset amounts */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Select Amount</label>
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {PRESET_AMOUNTS.map(a => (
                        <motion.button
                          key={a}
                          type="button"
                          className={`btn btn-sm ${parseFloat(form.amount) === a ? 'btn-gold' : 'btn-outline-secondary'}`}
                          onClick={() => set('amount', String(a))}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {selectedCurrency.symbol}{a.toLocaleString()}
                        </motion.button>
                      ))}
                    </div>
                    <div className="input-group">
                      <span className="input-group-text fw-bold">{selectedCurrency.symbol}</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter custom amount"
                        min="1"
                        value={form.amount}
                        onChange={e => set('amount', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Donor info — read-only if logged in */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.donor_name}
                        onChange={e => set('donor_name', e.target.value)}
                        readOnly={!!user && !form.is_anonymous}
                        style={user && !form.is_anonymous ? { background: '#f8f9fa' } : {}}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.donor_email}
                        onChange={e => set('donor_email', e.target.value)}
                        readOnly={!!user && !form.is_anonymous}
                        style={user && !form.is_anonymous ? { background: '#f8f9fa' } : {}}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Message (optional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Leave a word of encouragement..."
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                    />
                  </div>

                  {/* Anonymous toggle */}
                  <div className="form-check mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="anonymousCheck"
                      checked={form.is_anonymous}
                      onChange={e => {
                        set('is_anonymous', e.target.checked);
                        if (e.target.checked) {
                          set('donor_name', 'Anonymous');
                          set('donor_email', form.donor_email || (user?.email ?? ''));
                        } else if (user) {
                          set('donor_name', `${user.first_name} ${user.last_name}`);
                          set('donor_email', user.email);
                        }
                      }}
                    />
                    <label className="form-check-label small text-muted" htmlFor="anonymousCheck">
                      Give anonymously (your name won't be shown publicly)
                    </label>
                  </div>

                  {/* Summary */}
                  {amountNum > 0 && (
                    <div className="p-3 rounded mb-3 text-center"
                      style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))', color: 'white' }}>
                      <p className="small text-gold mb-0">You are giving</p>
                      <h3 className="fw-bold mb-0">{selectedCurrency.symbol}{amountNum.toLocaleString()} {form.currency}</h3>
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="button"
                    className="btn btn-gold w-100 py-2 fw-bold"
                    onClick={handleGive}
                    disabled={submitting || !isValid}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
                      : <><i className="bi bi-shield-lock me-2" />Give {amountNum > 0 ? `${selectedCurrency.symbol}${amountNum.toLocaleString()}` : 'Now'} Securely</>
                    }
                  </motion.button>
                  <p className="text-center text-muted small mt-2 mb-0">
                    <i className="bi bi-lock-fill me-1" />Secured by Paystack · 256-bit SSL
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
