/**
 * Admin — Sons & Daughters Management
 * • View / approve / reject / suspend applicants
 * • Quick stats
 */
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const STATUS_META = {
  applied:   { label: 'Pending',  color: 'warning', text: 'dark' },
  approved:  { label: 'Approved', color: 'success', text: 'white' },
  suspended: { label: 'Suspended',color: 'danger',  text: 'white' },
};

export default function AdminSons() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [selected, setSelected]     = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/sons/admin/applications');
      setApplicants(data);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (uid, endpoint, msg) => {
    try {
      await api.post(endpoint);
      toast.success(msg);
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filtered = applicants.filter(a =>
    filter === 'all' ? true : a.disciple_status === filter
  );

  const counts = {
    all:       applicants.length,
    applied:   applicants.filter(a => a.disciple_status === 'applied').length,
    approved:  applicants.filter(a => a.disciple_status === 'approved').length,
    suspended: applicants.filter(a => a.disciple_status === 'suspended').length,
  };

  return (
    <AdminLayout title="Sons & Daughters">
      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { key: 'all',       label: 'Total',     icon: 'bi-people',             color: '#6b7280' },
          { key: 'applied',   label: 'Pending',   icon: 'bi-hourglass-split',    color: '#d97706' },
          { key: 'approved',  label: 'Active',    icon: 'bi-patch-check-fill',   color: '#059669' },
          { key: 'suspended', label: 'Suspended', icon: 'bi-slash-circle',       color: '#dc2626' },
        ].map(s => (
          <div key={s.key} className="col-6 col-md-3">
            <motion.div
              className={`ministry-card p-3 text-center h-100 ${filter === s.key ? 'border border-2' : ''}`}
              style={filter === s.key ? { borderColor: s.color } : {}}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={() => setFilter(s.key)}
              role="button">
              <i className={`bi ${s.icon}`} style={{ fontSize: '2rem', color: s.color }} />
              <h3 className="fw-bold my-1">{counts[s.key]}</h3>
              <p className="text-muted small mb-0">{s.label}</p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {['all', 'applied', 'approved', 'suspended'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && counts[f] > 0 && (
              <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--gold)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ministry-card p-5 text-center text-muted">
          <i className="bi bi-people fs-1 d-block mb-3" />
          <p>No records found for this filter.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(a => {
            const meta = STATUS_META[a.disciple_status] || { label: 'Unknown', color: 'secondary', text: 'white' };
            return (
              <div key={a.id} className="col-md-6 col-lg-4">
                <motion.div
                  className="ministry-card p-4 h-100"
                  whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
                  transition={{ type: 'spring', stiffness: 280 }}>

                  <div className="d-flex align-items-center gap-3 mb-3">
                    {a.profile_pic ? (
                      <img src={`/uploads/${a.profile_pic}`} alt=""
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle flex-shrink-0"
                        style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))', fontFamily: 'Cinzel, serif' }}>
                        {a.first_name?.[0]}{a.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="fw-bold mb-0 text-truncate">{a.first_name} {a.last_name}</h6>
                      <small className="text-muted">{a.email}</small>
                    </div>
                    <span className={`badge bg-${meta.color} text-${meta.text} flex-shrink-0`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="small text-muted mb-1">
                      <i className="bi bi-calendar3 me-1" />
                      Applied {a.disciple_applied_at ? dayjs(a.disciple_applied_at).fromNow() : '—'}
                    </p>
                    {a.disciple_approved_at && (
                      <p className="small text-muted mb-1">
                        <i className="bi bi-check-circle me-1 text-success" />
                        Approved {dayjs(a.disciple_approved_at).fromNow()}
                      </p>
                    )}
                  </div>

                  <motion.button
                    className="btn btn-outline-gold btn-sm w-100"
                    onClick={() => setSelected(a)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <i className="bi bi-eye me-1" />View Application
                  </motion.button>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Application detail modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 8888, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>

            <motion.div
              className="bg-white rounded-4 shadow-lg"
              style={{ width: '100%', maxWidth: 600, maxHeight: '88vh', overflow: 'auto' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}>

              {/* Header */}
              <div className="p-4 border-bottom"
                style={{ background: 'linear-gradient(135deg, #0d1b2a, #1e3a5f)', color: '#fff' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    {selected.profile_pic ? (
                      <img src={`/uploads/${selected.profile_pic}`} alt=""
                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle"
                        style={{ width: 56, height: 56, background: 'rgba(201,168,76,0.25)', fontSize: '1.3rem', fontFamily: 'Cinzel, serif' }}>
                        {selected.first_name?.[0]}{selected.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h5 className="fw-bold mb-0">{selected.first_name} {selected.last_name}</h5>
                      <small style={{ color: 'rgba(255,255,255,0.7)' }}>{selected.email}</small>
                    </div>
                  </div>
                  <button className="btn btn-sm text-white" onClick={() => setSelected(null)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none' }}>
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* Status */}
                <div className="mb-4">
                  {(() => {
                    const meta = STATUS_META[selected.disciple_status] || { label: 'Unknown', color: 'secondary' };
                    return (
                      <span className={`badge bg-${meta.color} px-3 py-2`} style={{ fontSize: '0.85rem' }}>
                        {meta.label}
                      </span>
                    );
                  })()}
                  <span className="text-muted small ms-2">
                    Applied {selected.disciple_applied_at
                      ? dayjs(selected.disciple_applied_at).format('DD MMM YYYY')
                      : '—'}
                  </span>
                </div>

                {/* Testimony */}
                <div className="mb-4">
                  <h6 className="fw-bold text-gold mb-2">
                    <i className="bi bi-journal-text me-1" />Salvation & Walk with God
                  </h6>
                  <div className="p-3 rounded" style={{ background: 'var(--section-bg)', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                    {selected.disciple_testimony || <span className="text-muted fst-italic">Not provided</span>}
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <h6 className="fw-bold text-gold mb-2">
                    <i className="bi bi-question-circle me-1" />Why They Want to Join
                  </h6>
                  <div className="p-3 rounded" style={{ background: 'var(--section-bg)', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                    {selected.disciple_reason || <span className="text-muted fst-italic">Not provided</span>}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="d-flex gap-2 flex-wrap">
                  {selected.disciple_status !== 'approved' && (
                    <motion.button
                      className="btn btn-success flex-grow-1"
                      onClick={() => action(selected.id, `/api/sons/admin/applications/${selected.id}/approve`,
                        `${selected.first_name} has been approved as a disciple!`)}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <i className="bi bi-patch-check-fill me-1" />Approve
                    </motion.button>
                  )}
                  {selected.disciple_status !== 'suspended' && (
                    <motion.button
                      className="btn btn-warning flex-grow-1"
                      onClick={() => action(selected.id, `/api/sons/admin/applications/${selected.id}/suspend`,
                        `${selected.first_name} has been suspended`)}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <i className="bi bi-slash-circle me-1" />Suspend
                    </motion.button>
                  )}
                  {selected.disciple_status !== 'applied' && (
                    <motion.button
                      className="btn btn-outline-danger flex-grow-1"
                      onClick={() => action(selected.id, `/api/sons/admin/applications/${selected.id}/reject`,
                        `Application for ${selected.first_name} has been rejected`)}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <i className="bi bi-x-circle me-1" />Reject & Reset
                    </motion.button>
                  )}
                </div>

                {selected.disciple_status === 'applied' && (
                  <div className="d-flex gap-2 mt-2">
                    <motion.button
                      className="btn btn-outline-danger w-100"
                      onClick={() => action(selected.id, `/api/sons/admin/applications/${selected.id}/reject`,
                        `Application for ${selected.first_name} has been rejected`)}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <i className="bi bi-x-circle me-1" />Reject Application
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
