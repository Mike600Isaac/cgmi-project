import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-pad section-bg">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="ministry-card p-4 p-md-5">
              <div className="text-center mb-4">
                <i className="bi bi-brightness-high-fill text-gold fs-1" />
                <h2 className="fw-bold mt-2">Welcome Back</h2>
                <p className="text-muted">Sign in to your ministry account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email or Username</label>
                  <input
                    type="text" name="identifier" className="form-control" required
                    placeholder="Enter email or username"
                    value={form.identifier} onChange={handleChange}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group">
                    <input
                      type={showPass ? 'text' : 'password'} name="password" className="form-control" required
                      placeholder="Enter password"
                      value={form.password} onChange={handleChange}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(!showPass)}>
                      <i className={`bi bi-eye${showPass ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-gold w-100 py-2 fw-bold" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-box-arrow-in-right me-2" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center mt-4 mb-0 text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-gold fw-semibold">Register here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
