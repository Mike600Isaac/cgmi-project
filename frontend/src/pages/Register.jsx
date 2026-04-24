import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', username: '',
    password: '', confirm_password: '', phone: '', country: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      await register(payload);
      toast.success('Registration successful! Welcome to the family!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-pad section-bg">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7">
            <div className="ministry-card p-4 p-md-5">
              <div className="text-center mb-4">
                <i className="bi bi-person-plus-fill text-gold fs-1" />
                <h2 className="fw-bold mt-2">Join the Ministry</h2>
                <p className="text-muted">Create your free account to access courses and more</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold">First Name *</label>
                    <input type="text" name="first_name" className="form-control" required
                      placeholder="First name" value={form.first_name} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Last Name *</label>
                    <input type="text" name="last_name" className="form-control" required
                      placeholder="Last name" value={form.last_name} onChange={handleChange} />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address *</label>
                  <input type="email" name="email" className="form-control" required
                    placeholder="your@email.com" value={form.email} onChange={handleChange} />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Username *</label>
                  <input type="text" name="username" className="form-control" required
                    placeholder="Choose a username" value={form.username} onChange={handleChange} />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone</label>
                    <input type="tel" name="phone" className="form-control"
                      placeholder="+1 234 567 8900" value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Country</label>
                    <input type="text" name="country" className="form-control"
                      placeholder="Your country" value={form.country} onChange={handleChange} />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password *</label>
                  <div className="input-group">
                    <input type={showPass ? 'text' : 'password'} name="password" className="form-control" required
                      placeholder="Min. 8 characters" value={form.password} onChange={handleChange} />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(!showPass)}>
                      <i className={`bi bi-eye${showPass ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Confirm Password *</label>
                  <input type={showPass ? 'text' : 'password'} name="confirm_password" className="form-control" required
                    placeholder="Repeat password" value={form.confirm_password} onChange={handleChange} />
                </div>

                <button type="submit" className="btn btn-gold w-100 py-2 fw-bold" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-circle me-2" />}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center mt-4 mb-0 text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-gold fw-semibold">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
