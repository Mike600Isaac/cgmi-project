import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import SonsAndDaughtersTab from '../components/SonsAndDaughtersTab';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/api/courses/my-enrollments'),
      api.get('/api/courses/my-certificates'),
      api.get('/api/donations/my'),
    ]).then(([e, c, d]) => {
      setEnrollments(e.data);
      setCertificates(c.data);
      setDonations(d.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = enrollments.filter(e => e.completed_at).length;
  const inProgress = enrollments.filter(e => !e.completed_at && e.progress > 0).length;

  // Show Sons & Daughters tab if approved, applied, or admin
  const showSonsTab = isAdmin || ['approved', 'applied', null].includes(user?.disciple_status) === false
    ? isAdmin || user?.disciple_status === 'approved' || user?.disciple_status === 'applied' || user?.disciple_status === null
    : true;

  const TABS = [
    { key: 'overview',  label: 'Overview',           icon: 'bi-speedometer2' },
    { key: 'courses',   label: 'My Courses',          icon: 'bi-mortarboard' },
    { key: 'certs',     label: 'Certificates',        icon: 'bi-award' },
    { key: 'donations', label: 'My Donations',        icon: 'bi-heart' },
    { key: 'sons',      label: 'Sons & Daughters',    icon: 'bi-patch-check-fill', gold: true },
    { key: 'profile',   label: 'Profile',             icon: 'bi-person-gear' },
  ];

  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 62px)', background: 'var(--section-bg)' }}>
        <div className="container py-4">
          {/* Header */}
          <motion.div
            className="ministry-card p-4 mb-4"
            style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {user?.profile_pic ? (
                <motion.img
                  src={`/uploads/${user.profile_pic}`}
                  alt="Profile"
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                />
              ) : (
                <motion.div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: '60px', height: '60px', background: 'rgba(201,168,76,0.3)', fontSize: '1.4rem', fontFamily: 'Cinzel, serif', flexShrink: 0 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </motion.div>
              )}
              <div>
                <h3 className="text-white fw-bold mb-0">Welcome, {user?.first_name}!</h3>
                <p className="text-gold mb-0 small">
                  {isAdmin ? <><i className="bi bi-shield-check me-1" />Administrator</> : <><i className="bi bi-person-check me-1" />Member</>}
                  {' · '}Member since {dayjs(user?.created_at).format('MMM YYYY')}
                </p>
              </div>
              <div className="ms-auto d-flex gap-2 flex-wrap">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/" className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                    <i className="bi bi-house-fill" />
                    <span className="d-none d-sm-inline">Home</span>
                  </Link>
                </motion.div>
                {isAdmin && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                    <Link to="/admin" className="btn btn-gold btn-sm">
                      <i className="bi bi-gear me-1" />Admin Panel
                    </Link>
                  </motion.div>
                )}
                <motion.button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(220,53,69,0.15)', border: '1px solid rgba(220,53,69,0.4)', color: '#f87171' }}
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05, background: 'rgba(220,53,69,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="bi bi-box-arrow-right" />
                  <span className="d-none d-sm-inline">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="d-flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {TABS.map(t => (
              <motion.button
                key={t.key}
                className={`btn btn-sm ${
                  activeTab === t.key
                    ? 'btn-gold'
                    : t.gold
                      ? 'btn-outline-warning'
                      : 'btn-outline-secondary'
                }`}
                style={t.gold && activeTab !== t.key ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}
                onClick={() => setActiveTab(t.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className={`bi ${t.icon} me-1`} />{t.label}
                {t.gold && user?.disciple_status === 'applied' && activeTab !== t.key && (
                  <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.6rem' }}>Pending</span>
                )}
              </motion.button>
            ))}
          </motion.div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
          ) : (
            <>
              {/* Overview */}
              {activeTab === 'overview' && (
                <>
                  <StaggerContainer className="row g-3 mb-4">
                    {[
                      { label: 'Enrolled Courses', value: enrollments.length, icon: 'bi-mortarboard', color: 'var(--gold)' },
                      { label: 'In Progress', value: inProgress, icon: 'bi-play-circle', color: '#0d6efd' },
                      { label: 'Completed', value: completed, icon: 'bi-patch-check', color: '#198754' },
                      { label: 'Certificates', value: certificates.length, icon: 'bi-award', color: '#6f42c1' },
                    ].map((s, i) => (
                      <StaggerItem key={i} className="col-6 col-md-3">
                        <motion.div
                          className="ministry-card p-3 text-center"
                          whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <i className={`bi ${s.icon}`} style={{ fontSize: '2rem', color: s.color }} />
                          <h3 className="fw-bold my-1">{s.value}</h3>
                          <p className="text-muted small mb-0">{s.label}</p>
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>

                  <h5 className="fw-bold mb-3">Continue Learning</h5>
                  {enrollments.length === 0 ? (
                    <div className="ministry-card p-4 text-center text-muted">
                      <i className="bi bi-mortarboard fs-1 mb-3 d-block" />
                      <p>You haven't enrolled in any courses yet.</p>
                      <Link to="/courses" className="btn btn-gold">Browse Courses</Link>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {enrollments.slice(0,4).map(e => (
                        <div key={e.id} className="col-md-6">
                          <div className="ministry-card p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold mb-0">{e.course?.title}</h6>
                              <span className="badge bg-secondary text-capitalize">{e.course?.category}</span>
                            </div>
                            <div className="course-progress mb-2">
                              <div className="d-flex justify-content-between small mb-1">
                                <span>Progress</span>
                                <span className="text-gold fw-bold">{e.progress}%</span>
                              </div>
                              <div className="progress">
                                <div className="progress-bar" style={{ width: `${e.progress}%` }} />
                              </div>
                            </div>
                            {e.completed_at ? (
                              <span className="badge bg-success"><i className="bi bi-check me-1" />Completed</span>
                            ) : (
                              <Link to={`/courses/${e.course_id}`} className="btn btn-gold btn-sm">
                                <i className="bi bi-play-circle me-1" />Continue
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Courses tab */}
              {activeTab === 'courses' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">My Enrolled Courses</h5>
                    <Link to="/courses" className="btn btn-gold btn-sm">Browse More</Link>
                  </div>
                  {enrollments.length === 0 ? (
                    <div className="ministry-card p-4 text-center text-muted">
                      <p>No courses enrolled yet.</p>
                      <Link to="/courses" className="btn btn-gold">Browse Courses</Link>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {enrollments.map(e => (
                        <div key={e.id} className="col-md-6">
                          <div className="ministry-card p-4">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="badge bg-secondary text-capitalize">{e.course?.category}</span>
                              {e.completed_at && <span className="badge bg-success">Completed</span>}
                            </div>
                            <h5 className="fw-bold">{e.course?.title}</h5>
                            <div className="course-progress mb-3">
                              <div className="d-flex justify-content-between small mb-1">
                                <span>Progress</span><span className="fw-bold text-gold">{e.progress}%</span>
                              </div>
                              <div className="progress"><div className="progress-bar" style={{ width: `${e.progress}%` }} /></div>
                            </div>
                            <div className="d-flex gap-2">
                              <Link to={`/courses/${e.course_id}`} className="btn btn-gold btn-sm flex-grow-1">
                                <i className="bi bi-play-circle me-1" />{e.progress === 0 ? 'Start' : 'Continue'}
                              </Link>
                            </div>
                            <small className="text-muted mt-2 d-block">
                              Enrolled {dayjs(e.enrolled_at).format('DD MMM YYYY')}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Certificates tab */}
              {activeTab === 'certs' && (
                <div>
                  <h5 className="fw-bold mb-3">My Certificates</h5>
                  {certificates.length === 0 ? (
                    <div className="ministry-card p-4 text-center text-muted">
                      <i className="bi bi-award fs-1 mb-3 d-block text-gold" />
                      <p>Complete a course to earn your certificate!</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {certificates.map(c => (
                        <div key={c.id} className="col-md-6 col-lg-4">
                          <div className="ministry-card p-4 text-center" style={{ border: '2px solid var(--gold)' }}>
                            <i className="bi bi-award-fill text-gold" style={{ fontSize: '3rem' }} />
                            <h6 className="fw-bold mt-2 mb-1">{c.course_title}</h6>
                            <p className="text-muted small mb-2">Issued {dayjs(c.issued_at).format('DD MMM YYYY')}</p>
                            <p className="small text-gold mb-3">#{c.certificate_number}</p>
                            {c.certificate_url && (
                              <a href={`/uploads/${c.certificate_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm w-100">
                                <i className="bi bi-download me-1" />Download Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Donations tab */}
              {activeTab === 'donations' && (
                <div>
                  <h5 className="fw-bold mb-3">My Donation History</h5>
                  {donations.length === 0 ? (
                    <div className="ministry-card p-4 text-center text-muted">
                      <i className="bi bi-heart fs-1 mb-3 d-block" />
                      <p>No donations yet.</p>
                      <Link to="/contact/ministry" className="btn btn-gold">Support the Ministry</Link>
                    </div>
                  ) : (
                    <div className="list-group">
                      {donations.map(d => (
                        <div key={d.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <p className="fw-bold mb-0">${d.amount} {d.currency}</p>
                            <small className="text-muted">{dayjs(d.created_at).format('DD MMM YYYY')}</small>
                          </div>
                          <span className={`badge ${d.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{d.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sons & Daughters tab */}
              {activeTab === 'sons' && <SonsAndDaughtersTab />}

              {/* Profile tab */}
              {activeTab === 'profile' && <ProfileTab user={user} />}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function ProfileTab({ user }) {
  const { updateUser } = useAuth();

  // ── Profile info form ──────────────────────────────────────────
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    country: user?.country || '',
  });
  const [saving, setSaving] = useState(false);

  // ── Password form ──────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // ── Profile picture ────────────────────────────────────────────
  const [picPreview, setPicPreview] = useState(
    user?.profile_pic ? `/uploads/${user.profile_pic}` : null
  );
  const [picFile, setPicFile] = useState(null);
  const [picUploading, setPicUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF or WEBP images are allowed');
      return;
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setPicFile(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const uploadPic = async () => {
    if (!picFile) return;
    setPicUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', picFile);
      const { data } = await api.post('/api/auth/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ profile_pic: data.profile_pic });
      setPicFile(null);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setPicUploading(false);
    }
  };

  const removePicPreview = () => {
    setPicFile(null);
    setPicPreview(user?.profile_pic ? `/uploads/${user.profile_pic}` : null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save profile ───────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/api/auth/me', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  // ── Change password ────────────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await api.post('/api/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setPwSaving(false); }
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="row g-4">

      {/* ── Profile Picture Card ── */}
      <div className="col-12">
        <div className="ministry-card p-4">
          <h5 className="fw-bold mb-4">Profile Picture</h5>
          <div className="d-flex align-items-center gap-4 flex-wrap">

            {/* Avatar */}
            <div className="position-relative" style={{ flexShrink: 0 }}>
              {picPreview ? (
                <img
                  src={picPreview}
                  alt="Profile"
                  style={{
                    width: 110, height: 110,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--gold)',
                  }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{
                    width: 110, height: 110,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))',
                    border: '3px solid var(--gold)',
                    fontSize: '2rem',
                    fontFamily: 'Cinzel, serif',
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Camera overlay button */}
              <button
                type="button"
                className="btn btn-gold btn-sm position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 32, height: 32 }}
                onClick={() => fileInputRef.current?.click()}
                title="Change photo"
              >
                <i className="bi bi-camera-fill" style={{ fontSize: '0.8rem' }} />
              </button>
            </div>

            {/* Info & actions */}
            <div>
              <p className="fw-bold mb-1">{user?.first_name} {user?.last_name}</p>
              <p className="text-muted small mb-3">
                JPG, PNG, GIF or WEBP · Max 5MB
              </p>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-upload me-1" />Choose Photo
                </button>

                {picFile && (
                  <>
                    <button
                      type="button"
                      className="btn btn-gold btn-sm"
                      onClick={uploadPic}
                      disabled={picUploading}
                    >
                      {picUploading
                        ? <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
                        : <><i className="bi bi-check-circle me-1" />Save Photo</>}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={removePicPreview}
                    >
                      <i className="bi bi-x me-1" />Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="d-none"
              onChange={handlePicChange}
            />
          </div>
        </div>
      </div>

      {/* ── Edit Info ── */}
      <div className="col-md-6">
        <div className="ministry-card p-4">
          <h5 className="fw-bold mb-3">Personal Information</h5>
          <form onSubmit={saveProfile}>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">First Name</label>
                <input className="form-control" value={form.first_name}
                  onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Last Name</label>
                <input className="form-control" value={form.last_name}
                  onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Phone</label>
                <input className="form-control" placeholder="+1 234 567 8900" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Country</label>
                <input className="form-control" placeholder="Nigeria, USA..." value={form.country}
                  onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Bio</label>
                <textarea className="form-control" rows={3} placeholder="Tell us a little about yourself..."
                  value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-gold w-100" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                    : <><i className="bi bi-check-circle me-2" />Save Changes</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="col-md-6">
        <div className="ministry-card p-4">
          <h5 className="fw-bold mb-3">Change Password</h5>
          <form onSubmit={changePassword}>
            {[
              { key: 'current_password', label: 'Current Password' },
              { key: 'new_password', label: 'New Password' },
              { key: 'confirm', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div className="mb-3" key={key}>
                <label className="form-label fw-semibold small">{label}</label>
                <div className="input-group">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    className="form-control"
                    required
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  />
                  <button type="button" className="btn btn-outline-secondary"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}>
                    <i className={`bi bi-eye${showPw[key] ? '-slash' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-outline-gold w-100 mt-1" disabled={pwSaving}>
              {pwSaving
                ? <><span className="spinner-border spinner-border-sm me-2" />Changing...</>
                : <><i className="bi bi-shield-lock me-2" />Change Password</>}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
