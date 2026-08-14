import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ContactMinistry() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', recipient: 'ministry' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/contact', { ...form, recipient: 'ministry' });
      toast.success('Message sent! We will be in touch soon.');
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '', recipient: 'ministry' });
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
          <h1 className="display-5 fw-bold">Contact the Ministry</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>We'd love to hear from you</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-4">
              <h3 className="fw-bold mb-4">Get In Touch</h3>
              {[
                { icon: 'bi-envelope-fill', title: 'Email', text: 'commandersmission@gmail.com' },
                { icon: 'bi-telephone-fill', title: 'Phone', text: '+1 (234) 567-8900' },
                { icon: 'bi-geo-alt-fill', title: 'Address', text: '123 Kingdom Avenue, City, Country' },
                { icon: 'bi-clock-fill', title: 'Office Hours', text: 'Mon–Fri: 9am – 5pm' },
              ].map((item, i) => (
                <div key={i} className="d-flex gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', background: 'rgba(201,168,76,.15)' }}>
                      <i className={`bi ${item.icon} text-gold`} />
                    </div>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">{item.title}</h6>
                    <p className="text-muted mb-0 small">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-lg-8">
              {sent && (
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle-fill me-2" />
                  Thank you! Your message has been received. We'll respond shortly. God bless you!
                </div>
              )}
              <div className="ministry-card p-4">
                <h4 className="fw-bold mb-4">Send a Message</h4>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input type="text" name="name" className="form-control" required value={form.name} onChange={handleChange} placeholder="Your full name" />
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
                      <label className="form-label fw-semibold">Subject</label>
                      <input type="text" name="subject" className="form-control" value={form.subject} onChange={handleChange} placeholder="Message subject" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Message *</label>
                      <textarea name="message" className="form-control" required rows={5} value={form.message} onChange={handleChange} placeholder="Type your message here..." />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-gold px-5 py-2 fw-bold" disabled={loading}>
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
