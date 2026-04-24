import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ContactEvangelist() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/contact', { ...form, recipient: 'evangelist' });
      toast.success('Message sent to the Evangelist!');
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">Contact the Evangelist</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Reach out for speaking engagements, counselling & prayer</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-5 justify-content-center">
            <div className="col-lg-7">
              {sent && (
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle-fill me-2" />
                  Your message has been sent to the Evangelist. God bless you!
                </div>
              )}
              <div className="ministry-card p-4 p-md-5">
                <div className="text-center mb-4">
                  <i className="bi bi-person-fill text-gold fs-1" />
                  <h3 className="fw-bold mt-2">Send a Message</h3>
                  <p className="text-muted">For speaking invitations, counselling, prayer requests and more</p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input type="text" name="name" className="form-control" required value={form.name} onChange={handleChange} placeholder="Your name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email *</label>
                      <input type="email" name="email" className="form-control" required value={form.email} onChange={handleChange} placeholder="your@email.com" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone</label>
                      <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Purpose of Contact</label>
                      <select name="subject" className="form-select" value={form.subject} onChange={handleChange}>
                        <option value="">Select...</option>
                        <option>Speaking Invitation</option>
                        <option>Prayer Request</option>
                        <option>Counselling</option>
                        <option>Partnership</option>
                        <option>General Enquiry</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Message *</label>
                      <textarea name="message" className="form-control" required rows={5} value={form.message} onChange={handleChange} placeholder="Share your message..." />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-gold w-100 py-2 fw-bold" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-send-fill me-2" />}
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
