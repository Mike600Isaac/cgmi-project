/**
 * Sons & Daughters — Private discipleship platform.
 *
 * Access: Any born-again believer who is genuinely led and convicted by God
 * may apply.  There is NO mandatory sequence (convert class → missionary etc.).
 * The admin reviews each application and approves based on spiritual readiness
 * and desire to submit to the leader's covering.
 *
 * Features
 *  • Application form with testimony + reason
 *  • Live video / voice sessions via Jitsi Meet (embedded, no app install)
 *  • Admin can start Dropbox cloud-recording inside the Jitsi toolbar
 *  • Post-session structured summary (prayers covered, teaching, scriptures,
 *    action items) — downloadable as PDF or Word
 *  • Private prayer wall (disciples + admin only)
 *  • Private announcements board
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// ── constants ─────────────────────────────────────────────────────────────────
const SESSION_TYPE_META = {
  prayer:     { icon: 'bi-cloud',               color: '#4a90d9', label: 'Prayer Meeting' },
  training:   { icon: 'bi-journal-bookmark',    color: '#c9a84c', label: 'Training' },
  conference: { icon: 'bi-camera-video',         color: '#7c3aed', label: 'Conference Call' },
  worship:    { icon: 'bi-music-note-beamed',    color: '#db2777', label: 'Worship' },
  general:    { icon: 'bi-people-fill',          color: '#059669', label: 'General' },
};

// ── Jitsi loader ──────────────────────────────────────────────────────────────
function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://meet.jit.si/external_api.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Jitsi library'));
    document.head.appendChild(s);
  });
}

// ── PDF / Word helpers ────────────────────────────────────────────────────────
function buildSummaryHtml(session) {
  const date = dayjs(session.scheduled_at).format('dddd, DD MMMM YYYY [at] h:mm A');
  const rows = [
    ['Prayer Points Covered', session.summary_prayers],
    ['Key Teaching / Training Notes', session.summary_teaching],
    ['Scriptures Referenced', session.summary_scriptures],
    ['Action Items & Assignments', session.summary_action_items],
    ['Additional Notes', session.recording_notes],
  ].filter(([, v]) => v);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:Georgia,serif;max-width:760px;margin:40px auto;color:#1a1a1a;line-height:1.7}
  h1{font-size:1.6rem;border-bottom:3px solid #c9a84c;padding-bottom:8px;color:#0d1b2a}
  h2{font-size:1.05rem;color:#c9a84c;margin-top:28px;text-transform:uppercase;letter-spacing:1px}
  p{margin:4px 0;white-space:pre-line}
  .meta{color:#666;font-size:0.9rem;margin-bottom:24px}
  .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:12px;font-size:0.8rem;color:#999}
</style></head><body>
<h1>Session Summary — ${session.title}</h1>
<div class="meta">
  <strong>Type:</strong> ${SESSION_TYPE_META[session.session_type]?.label || session.session_type} &nbsp;|&nbsp;
  <strong>Date:</strong> ${date} &nbsp;|&nbsp;
  <strong>Duration:</strong> ${session.duration_minutes} minutes
</div>
${rows.map(([h, v]) => `<h2>${h}</h2><p>${v}</p>`).join('')}
<div class="footer">Sons &amp; Daughters Ministry · Private members document · ${dayjs().format('DD MMM YYYY')}</div>
</body></html>`;
}

function downloadAsPdf(session) {
  const html = buildSummaryHtml(session);
  const win = window.open('', '_blank');
  if (!win) { toast.error('Pop-ups are blocked — please allow pop-ups and try again'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

function downloadAsWord(session) {
  const html = buildSummaryHtml(session);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-summary-${session.id}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function SonsAndDaughtersTab() {
  const { user } = useAuth();
  const status = user?.disciple_status ?? null;
  const [subTab, setSubTab] = useState('sessions');

  // Non-approved non-admin → show application / status screen
  if (user?.role !== 'admin' && status !== 'approved') {
    return <ApplicationScreen status={status} user={user} />;
  }

  const SUB_TABS = [
    { key: 'sessions',      icon: 'bi-camera-video',  label: 'Live Sessions' },
    { key: 'prayer',        icon: 'bi-heart',          label: 'Prayer Wall' },
    { key: 'announcements', icon: 'bi-megaphone',      label: 'Announcements' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Banner */}
      <div
        className="rounded-3 p-4 mb-4 text-white"
        style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1e3a5f 60%, #2a1a0a 100%)' }}
      >
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <motion.i
            className="bi bi-patch-check-fill text-gold"
            style={{ fontSize: '2.5rem' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div>
            <h4 className="fw-bold mb-0" style={{ fontFamily: 'Cinzel, serif' }}>Sons &amp; Daughters</h4>
            <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {user?.role === 'admin'
                ? 'Admin — full platform access'
                : `Welcome, ${user?.first_name} · Active Disciple`}
            </p>
          </div>
          <span className="badge bg-success ms-auto px-3 py-2" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-patch-check-fill me-1" />
            {user?.role === 'admin' ? 'Administrator' : 'Active Disciple'}
          </span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {SUB_TABS.map(t => (
          <motion.button
            key={t.key}
            className={`btn btn-sm ${subTab === t.key ? 'btn-gold' : 'btn-outline-secondary'}`}
            onClick={() => setSubTab(t.key)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <i className={`bi ${t.icon} me-1`} />{t.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'sessions'      && <SessionsPanel      key="sessions" user={user} />}
        {subTab === 'prayer'        && <PrayerPanel        key="prayer"   user={user} />}
        {subTab === 'announcements' && <AnnouncementsPanel key="ann"      user={user} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APPLICATION SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function ApplicationScreen({ status, user }) {
  const [form, setForm] = useState({ testimony: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/sons/apply', form);
      toast.success('Application submitted! We will review it soon.');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pending ───────────────────────────────────────────────────────────────
  if (status === 'applied') {
    return (
      <motion.div className="ministry-card p-5 text-center"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.i className="bi bi-hourglass-split text-warning d-block mb-3"
          style={{ fontSize: '4rem' }}
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
        />
        <h4 className="fw-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Application Under Review
        </h4>
        <p className="text-muted mb-1" style={{ maxWidth: 500, margin: '0 auto' }}>
          Your application has been received. The admin will review your testimony and
          reason for joining, then reach out to you. Keep pressing in!
        </p>
        {user?.disciple_applied_at && (
          <small className="text-muted d-block mt-3">
            Submitted {dayjs(user.disciple_applied_at).fromNow()}
          </small>
        )}
      </motion.div>
    );
  }

  // ── Suspended ─────────────────────────────────────────────────────────────
  if (status === 'suspended') {
    return (
      <motion.div className="ministry-card p-5 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <i className="bi bi-slash-circle text-danger d-block mb-3" style={{ fontSize: '4rem' }} />
        <h4 className="fw-bold mb-2">Membership Suspended</h4>
        <p className="text-muted">Please contact the admin to discuss reinstatement.</p>
      </motion.div>
    );
  }

  // ── Not yet applied ───────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

      {/* Hero */}
      <div className="rounded-3 p-5 text-white text-center mb-4"
        style={{ background: 'linear-gradient(135deg, #0d1b2a, #1e3a5f)' }}>
        <motion.i className="bi bi-patch-check-fill text-gold d-block mb-3"
          style={{ fontSize: '4rem' }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }} />
        <h3 className="fw-bold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
          Sons &amp; Daughters Discipleship
        </h3>
        <p className="mb-3" style={{ maxWidth: 620, margin: '0 auto', color: 'rgba(255,255,255,0.85)' }}>
          This is a private, intimate community of believers — not a class or course sequence.
          It is for those who are <strong>truly born-again</strong>, genuinely <strong>led and
          convicted by God</strong> to come under the pastor's covering for deep discipleship,
          mentorship and spiritual formation.
        </p>
        <div className="alert d-inline-block mb-0 text-start"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', color: 'rgba(255,255,255,0.9)', maxWidth: 560 }}>
          <i className="bi bi-info-circle text-gold me-2" />
          <strong>Who should apply?</strong> Any born-again believer — whether a new convert or
          a mature believer — who feels a <em>strong, prayerful leading</em> to submit under
          this leadership and grow in deep discipleship. It is not about where you are in a
          programme; it is about your heart.
        </div>
      </div>

      {/* What you'll get */}
      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-camera-video-fill', title: 'Live Sessions',         text: 'Embedded video & voice calls — prayer meetings, training classes and conference calls. Recorded for those who miss.' },
          { icon: 'bi-heart-fill',        title: 'Private Prayer Wall',   text: 'Share prayer requests and intercede for one another in a completely private, members-only space.' },
          { icon: 'bi-megaphone-fill',    title: 'Private Announcements', text: 'Receive teachings, updates and assignments that are exclusive to Sons & Daughters.' },
          { icon: 'bi-people-fill',       title: 'Deep Community',        text: 'Be mentored, sharpened and challenged by fellow disciples who are truly hungry for God.' },
        ].map((b, i) => (
          <div key={i} className="col-sm-6 col-md-3">
            <motion.div className="ministry-card p-3 text-center h-100"
              whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
              <i className={`bi ${b.icon} text-gold fs-2 mb-2 d-block`} />
              <h6 className="fw-bold mb-1">{b.title}</h6>
              <p className="small text-muted mb-0">{b.text}</p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Application form */}
      <div className="ministry-card p-4 p-md-5">
        <h5 className="fw-bold mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
          <i className="bi bi-send-fill text-gold me-2" />Apply to Join
        </h5>
        <p className="text-muted small mb-4">
          This is not a test — write honestly from your heart. The admin reads every application personally.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Your Salvation &amp; Walk with God
              <span className="text-danger ms-1">*</span>
            </label>
            <p className="text-muted small mb-2">
              Share how you came to know Christ and what your relationship with Him looks like today.
            </p>
            <textarea className="form-control" rows={5} required
              placeholder="Tell us about your salvation experience and your current walk with God..."
              value={form.testimony}
              onChange={e => setForm(p => ({ ...p, testimony: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Why Are You Applying?
              <span className="text-danger ms-1">*</span>
            </label>
            <p className="text-muted small mb-2">
              What is God speaking to you about joining? What are you hungry for?
              Are you prepared to submit to and receive from this leadership?
            </p>
            <textarea className="form-control" rows={5} required
              placeholder="Be honest and specific — this is between you and God first..."
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
          <div className="alert alert-warning mb-4" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-shield-check me-2" />
            By submitting this application you acknowledge that Sons &amp; Daughters is a
            <strong> private, accountability-based community</strong>. All sessions, prayer requests
            and communications are strictly confidential.
          </div>
          <motion.button type="submit" className="btn btn-gold w-100 py-2 fw-bold"
            disabled={submitting}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
              : <><i className="bi bi-send-fill me-2" />Submit Application</>}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SESSIONS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function SessionsPanel({ user }) {
  const [sessions, setSessions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeSession, setActiveSession] = useState(null);  // currently in call
  const [summarySession, setSummarySession] = useState(null); // viewing summary
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef       = useRef(null);
  const isAdmin = user?.role === 'admin';

  // ── Create form state (admin) ─────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [newSess, setNewSess]       = useState({
    title: '', description: '', session_type: 'general',
    scheduled_at: '', duration_minutes: 60, agenda: '', jitsi_room: '',
  });

  const loadSessions = useCallback(async () => {
    try {
      const url = isAdmin ? '/api/sons/admin/sessions' : '/api/sons/sessions';
      const { data } = await api.get(url);
      setSessions(data);
    } catch { toast.error('Could not load sessions'); }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Join session via Jitsi ────────────────────────────────────────────────
  const joinSession = async (session) => {
    setActiveSession(session);
    try { await loadJitsiScript(); }
    catch {
      toast.error('Failed to load video library. Check your internet connection.');
      setActiveSession(null);
      return;
    }
    // Small delay so the container div has mounted
    setTimeout(() => {
      if (!jitsiContainerRef.current) return;
      jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: session.jitsi_room,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: true,
          // Enable Dropbox cloud recording (admin must link their Dropbox once)
          fileRecordingsEnabled: true,
          liveStreamingEnabled: false,
          // Disable some distracting features for a focused ministry session
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop',
            'chat', 'raisehand', 'tileview',
            'participants-pane', 'hangup',
            'recording',          // ← Dropbox recording button for admin
            'security',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_BACKGROUND: '#0d1b2a',
        },
        userInfo: {
          displayName: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
          email: user?.email ?? '',
        },
      });
      jitsiApiRef.current.addEventListener('readyToClose', leaveSession);
      // Notify on recording start/stop
      jitsiApiRef.current.addEventListener('recordingStatusChanged', ({ on }) => {
        toast(on ? '🔴 Recording started' : '⏹ Recording stopped',
          { icon: on ? '🔴' : '⏹' });
      });
    }, 250);
  };

  const leaveSession = () => {
    try { jitsiApiRef.current?.dispose(); } catch {}
    jitsiApiRef.current = null;
    setActiveSession(null);
  };

  // ── Admin: toggle live ────────────────────────────────────────────────────
  const toggleLive = async (session) => {
    try {
      const ep = session.is_active
        ? `/api/sons/admin/sessions/${session.id}/end-live`
        : `/api/sons/admin/sessions/${session.id}/go-live`;
      await api.post(ep);
      toast.success(session.is_active ? 'Session ended' : '🔴 Session is now LIVE — disciples can join!');
      loadSessions();
    } catch { toast.error('Failed to update session'); }
  };

  // ── Admin: create session ─────────────────────────────────────────────────
  const createSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/sons/admin/sessions', newSess);
      toast.success('Session scheduled!');
      setShowCreate(false);
      setNewSess({ title: '', description: '', session_type: 'general', scheduled_at: '', duration_minutes: 60, agenda: '', jitsi_room: '' });
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create session');
    } finally { setCreating(false); }
  };

  // ── Admin: delete session ─────────────────────────────────────────────────
  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/api/sons/admin/sessions/${id}`);
      toast.success('Session deleted'); loadSessions();
    } catch { toast.error('Failed'); }
  };

  const upcoming = sessions.filter(s => s.is_active || new Date(s.scheduled_at) >= new Date());
  const past     = sessions.filter(s => !s.is_active && new Date(s.scheduled_at) < new Date());

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* ── Full-screen Jitsi overlay ── */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
            style={{ zIndex: 9999, background: '#0d1b2a' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Top bar */}
            <div className="d-flex align-items-center justify-content-between px-3 py-2 flex-shrink-0"
              style={{ background: '#0a1520', borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-patch-check-fill text-gold" />
                <span className="text-white fw-bold" style={{ fontFamily: 'Cinzel, serif' }}>
                  {activeSession.title}
                </span>
                {activeSession.is_active && (
                  <span className="badge bg-danger" style={{ animation: 'pulse-gold 2s infinite' }}>
                    ● LIVE
                  </span>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                {isAdmin && (
                  <span className="text-muted small d-none d-md-block">
                    <i className="bi bi-info-circle me-1" />
                    Click the <strong>Record</strong> button inside the call to save to Dropbox
                  </span>
                )}
                <button className="btn btn-danger btn-sm" onClick={leaveSession}>
                  <i className="bi bi-telephone-x-fill me-1" />Leave Session
                </button>
              </div>
            </div>
            {/* Jitsi iframe target */}
            <div ref={jitsiContainerRef} style={{ flex: 1, minHeight: 0 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary modal ── */}
      <AnimatePresence>
        {summarySession && (
          <SummaryModal
            session={summarySession}
            isAdmin={isAdmin}
            onClose={() => setSummarySession(null)}
            onSaved={(updated) => {
              setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
              setSummarySession(updated);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-camera-video text-gold me-2" />Live Sessions
        </h5>
        {isAdmin && (
          <motion.button className="btn btn-gold btn-sm"
            onClick={() => setShowCreate(v => !v)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <i className={`bi ${showCreate ? 'bi-x' : 'bi-calendar-plus'} me-1`} />
            {showCreate ? 'Cancel' : 'Schedule Session'}
          </motion.button>
        )}
      </div>

      {/* ── Admin: create form ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="ministry-card p-4 mb-4"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <h6 className="fw-bold mb-3">Schedule New Session</h6>
            <form onSubmit={createSession}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Title *</label>
                  <input className="form-control" required value={newSess.title}
                    onChange={e => setNewSess(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Type</label>
                  <select className="form-select" value={newSess.session_type}
                    onChange={e => setNewSess(p => ({ ...p, session_type: e.target.value }))}>
                    {Object.entries(SESSION_TYPE_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Duration (min)</label>
                  <input type="number" className="form-control" min={15}
                    value={newSess.duration_minutes}
                    onChange={e => setNewSess(p => ({ ...p, duration_minutes: +e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Date &amp; Time *</label>
                  <input type="datetime-local" className="form-control" required
                    value={newSess.scheduled_at}
                    onChange={e => setNewSess(p => ({ ...p, scheduled_at: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Jitsi Room Name
                    <span className="text-muted fw-normal ms-1">(auto-generated if blank)</span>
                  </label>
                  <input className="form-control" placeholder="e.g. sons-prayer-april-2026"
                    value={newSess.jitsi_room}
                    onChange={e => setNewSess(p => ({ ...p, jitsi_room: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea className="form-control" rows={2} value={newSess.description}
                    onChange={e => setNewSess(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Agenda / Pre-session Notes for Disciples</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Topics to cover, scriptures to read beforehand, what to prepare..."
                    value={newSess.agenda}
                    onChange={e => setNewSess(p => ({ ...p, agenda: e.target.value }))} />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-gold" disabled={creating}>
                    {creating ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                              : <><i className="bi bi-calendar-check me-1" />Schedule Session</>}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--gold)' }} />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <p className="text-muted fw-semibold mb-2 text-uppercase"
                style={{ fontSize: '0.72rem', letterSpacing: 1 }}>
                Upcoming &amp; Live
              </p>
              <div className="row g-3 mb-4">
                {upcoming.map(s => (
                  <SessionCard key={s.id} session={s} isAdmin={isAdmin}
                    onJoin={() => joinSession(s)}
                    onToggleLive={() => toggleLive(s)}
                    onDelete={() => deleteSession(s.id)}
                    onSummary={() => setSummarySession(s)} />
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <p className="text-muted fw-semibold mb-2 text-uppercase"
                style={{ fontSize: '0.72rem', letterSpacing: 1 }}>
                Past Sessions
              </p>
              <div className="row g-3">
                {past.map(s => (
                  <SessionCard key={s.id} session={s} isAdmin={isAdmin}
                    onJoin={() => joinSession(s)}
                    onToggleLive={() => toggleLive(s)}
                    onDelete={() => deleteSession(s.id)}
                    onSummary={() => setSummarySession(s)} />
                ))}
              </div>
            </>
          )}

          {sessions.length === 0 && (
            <div className="ministry-card p-5 text-center text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-3" />
              <p>No sessions scheduled yet. Check back soon!</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── SessionCard ───────────────────────────────────────────────────────────────
function SessionCard({ session, isAdmin, onJoin, onToggleLive, onDelete, onSummary }) {
  const typeMeta = SESSION_TYPE_META[session.session_type] || SESSION_TYPE_META.general;
  const isPast = !session.is_active && new Date(session.scheduled_at) < new Date();
  const hasSummary = session.summary_published || (isAdmin &&
    (session.summary_prayers || session.summary_teaching || session.summary_scriptures || session.summary_action_items));

  return (
    <div className="col-lg-6">
      <motion.div className="ministry-card p-4 h-100"
        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
        transition={{ type: 'spring', stiffness: 280 }}
        style={{ borderLeft: `4px solid ${typeMeta.color}` }}>

        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-1">
          <div className="d-flex gap-1 flex-wrap">
            <span className="badge" style={{ background: typeMeta.color }}>
              <i className={`bi ${typeMeta.icon} me-1`} />{typeMeta.label}
            </span>
            {session.is_active && (
              <span className="badge bg-danger" style={{ animation: 'pulse-gold 2s infinite' }}>
                ● LIVE
              </span>
            )}
            {!session.is_published && isAdmin && (
              <span className="badge bg-secondary">Draft</span>
            )}
            {hasSummary && (
              <span className="badge" style={{ background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.4)' }}>
                <i className="bi bi-file-text me-1" />Summary
              </span>
            )}
          </div>
          <small className="text-muted">{session.duration_minutes} min</small>
        </div>

        <h6 className="fw-bold mb-1">{session.title}</h6>
        {session.description && (
          <p className="small text-muted mb-2">{session.description}</p>
        )}

        <div className="d-flex align-items-center gap-2 mb-2">
          <i className="bi bi-calendar3 small" style={{ color: typeMeta.color }} />
          <small className="text-muted">
            {dayjs(session.scheduled_at).format('ddd, DD MMM YYYY [at] h:mm A')}
          </small>
        </div>

        {session.agenda && (
          <div className="p-2 rounded mb-3"
            style={{ background: 'var(--section-bg)', fontSize: '0.8rem', borderLeft: `3px solid ${typeMeta.color}` }}>
            <strong style={{ color: typeMeta.color }}>
              <i className="bi bi-list-check me-1" />Agenda:
            </strong>
            <div className="mt-1 text-muted" style={{ whiteSpace: 'pre-line' }}>{session.agenda}</div>
          </div>
        )}

        {/* Action buttons */}
        <div className="d-flex gap-2 flex-wrap mt-auto">
          {/* Join — disciples: only when live; admin: always (for testing) */}
          {(session.is_active || isAdmin) && (
            <motion.button className="btn btn-gold btn-sm flex-grow-1"
              onClick={onJoin}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={session.is_active ? { animation: 'pulse-gold 2s infinite' } : {}}>
              <i className="bi bi-camera-video-fill me-1" />
              {session.is_active ? 'Join Live Now' : (isAdmin ? 'Test Room' : 'Join')}
            </motion.button>
          )}

          {/* Recording link */}
          {session.recording_url && (
            <a href={session.recording_url} target="_blank" rel="noopener noreferrer"
              className="btn btn-outline-gold btn-sm flex-grow-1">
              <i className="bi bi-play-circle me-1" />Watch Recording
            </a>
          )}

          {/* Session summary */}
          {(hasSummary || isAdmin) && (
            <motion.button className="btn btn-sm btn-outline-secondary"
              onClick={onSummary}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              title="Session Summary / Notes">
              <i className="bi bi-file-earmark-text" />
            </motion.button>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <>
              <button
                className={`btn btn-sm ${session.is_active ? 'btn-danger' : 'btn-outline-success'}`}
                onClick={onToggleLive}>
                <i className={`bi ${session.is_active ? 'bi-stop-circle' : 'bi-broadcast'} me-1`} />
                {session.is_active ? 'End' : 'Go Live'}
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
                <i className="bi bi-trash" />
              </button>
            </>
          )}
        </div>

        {session.recording_notes && (
          <p className="small text-muted mt-2 mb-0">
            <i className="bi bi-info-circle me-1" />{session.recording_notes}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────
function SummaryModal({ session, isAdmin, onClose, onSaved }) {
  const [form, setForm] = useState({
    summary_prayers:      session.summary_prayers      || '',
    summary_teaching:     session.summary_teaching     || '',
    summary_scriptures:   session.summary_scriptures   || '',
    summary_action_items: session.summary_action_items || '',
    recording_url:        session.recording_url        || '',
    recording_notes:      session.recording_notes      || '',
    summary_published:    session.summary_published    || false,
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('view');

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post(`/api/sons/admin/sessions/${session.id}/summary`, form);
      toast.success('Summary saved!');
      onSaved(data.session);
    } catch { toast.error('Failed to save summary'); }
    finally { setSaving(false); }
  };

  const typeMeta = SESSION_TYPE_META[session.session_type] || SESSION_TYPE_META.general;
  const date = dayjs(session.scheduled_at).format('DD MMM YYYY [at] h:mm A');

  const sections = [
    { key: 'summary_prayers',      icon: 'bi-cloud',            label: 'Prayer Points Covered',       color: '#4a90d9' },
    { key: 'summary_teaching',     icon: 'bi-journal-bookmark', label: 'Key Teaching / Training Notes',color: 'var(--gold)' },
    { key: 'summary_scriptures',   icon: 'bi-book',             label: 'Scriptures Referenced',        color: '#059669' },
    { key: 'summary_action_items', icon: 'bi-check2-square',    label: 'Action Items & Assignments',   color: '#7c3aed' },
  ].filter(s => isAdmin || form[s.key]);

  return (
    <motion.div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 8888, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <motion.div
        className="bg-white rounded-4 shadow-lg d-flex flex-column"
        style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden' }}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}>

        {/* Header */}
        <div className="p-4 border-bottom d-flex justify-content-between align-items-start flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0d1b2a, #1e3a5f)', color: '#fff' }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge" style={{ background: typeMeta.color }}>
                <i className={`bi ${typeMeta.icon} me-1`} />{typeMeta.label}
              </span>
              {form.summary_published && (
                <span className="badge bg-success"><i className="bi bi-check me-1" />Published</span>
              )}
            </div>
            <h5 className="fw-bold mb-0" style={{ fontFamily: 'Cinzel, serif' }}>{session.title}</h5>
            <small style={{ color: 'rgba(255,255,255,0.65)' }}>
              <i className="bi bi-calendar3 me-1" />{date}
              {' · '}{session.duration_minutes} min
            </small>
          </div>
          <button className="btn btn-sm text-white" onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Tabs (admin only) */}
        {isAdmin && (
          <div className="border-bottom px-4 pt-3 pb-0 flex-shrink-0">
            <ul className="nav nav-tabs border-0 gap-2">
              {[{ key: 'view', label: 'View' }, { key: 'edit', label: 'Edit Summary' }, { key: 'recording', label: 'Recording' }].map(t => (
                <li key={t.key} className="nav-item">
                  <button
                    className={`nav-link border-0 px-3 py-2 ${tab === t.key ? 'active fw-bold text-gold border-bottom border-2' : 'text-muted'}`}
                    style={tab === t.key ? { borderBottomColor: 'var(--gold) !important', borderBottom: '2px solid var(--gold)' } : {}}
                    onClick={() => setTab(t.key)}>
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-auto flex-grow-1">

          {/* ── VIEW tab ── */}
          {(tab === 'view' || !isAdmin) && (
            <>
              {sections.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-file-earmark-text fs-1 d-block mb-3" />
                  {isAdmin
                    ? <p>No summary yet. Switch to the <strong>Edit Summary</strong> tab to add notes.</p>
                    : <p>The admin hasn't published a summary for this session yet.</p>}
                </div>
              ) : (
                sections.map(s => (
                  <div key={s.key} className="mb-4">
                    <h6 className="fw-bold d-flex align-items-center gap-2 mb-2"
                      style={{ color: s.color }}>
                      <i className={`bi ${s.icon}`} />{s.label}
                    </h6>
                    <div className="p-3 rounded"
                      style={{ background: '#f8f9fa', whiteSpace: 'pre-line', fontSize: '0.9rem', borderLeft: `3px solid ${s.color}` }}>
                      {form[s.key] || <span className="text-muted fst-italic">Not filled yet</span>}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── EDIT tab (admin) ── */}
          {tab === 'edit' && isAdmin && (
            <>
              {(() => {
                const editFields = [
                  { key: 'summary_prayers',      icon: 'bi-cloud',            label: 'Prayer Points Covered',        color: '#4a90d9' },
                  { key: 'summary_teaching',     icon: 'bi-journal-bookmark', label: 'Key Teaching / Training Notes', color: 'var(--gold)' },
                  { key: 'summary_scriptures',   icon: 'bi-book',             label: 'Scriptures Referenced',         color: '#059669' },
                  { key: 'summary_action_items', icon: 'bi-check2-square',    label: 'Action Items & Assignments',    color: '#7c3aed' },
                ];
                return editFields.map(s => (
                  <div key={s.key} className="mb-3">
                    <label className="form-label small fw-semibold d-flex align-items-center gap-1"
                      style={{ color: s.color }}>
                      <i className={`bi ${s.icon}`} />{s.label}
                    </label>
                    <textarea className="form-control" rows={4}
                      placeholder={`Enter ${s.label.toLowerCase()}...`}
                      value={form[s.key]}
                      onChange={e => setForm(p => ({ ...p, [s.key]: e.target.value }))} />
                  </div>
                ));
              })()}
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="sumPub"
                  checked={form.summary_published}
                  onChange={e => setForm(p => ({ ...p, summary_published: e.target.checked }))} />
                <label className="form-check-label small" htmlFor="sumPub">
                  <i className="bi bi-eye me-1" />Publish summary to all disciples
                </label>
              </div>
            </>
          )}

          {/* ── RECORDING tab (admin) ── */}
          {tab === 'recording' && isAdmin && (
            <>
              <div className="alert" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <h6 className="fw-bold text-gold mb-1"><i className="bi bi-info-circle me-1" />How recording works</h6>
                <p className="small mb-0">
                  During a live session, click the <strong>Record</strong> button inside the Jitsi
                  toolbar. Jitsi will save the recording to a linked <strong>Dropbox account</strong>.
                  After the session, paste the shared link below so disciples can watch it back.
                </p>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Recording URL (YouTube, Dropbox, Drive…)</label>
                <input className="form-control" placeholder="https://..."
                  value={form.recording_url}
                  onChange={e => setForm(p => ({ ...p, recording_url: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Recording Notes (optional)</label>
                <textarea className="form-control" rows={3}
                  placeholder="e.g. Prayer segment starts at 12:00, teaching at 28:00..."
                  value={form.recording_notes}
                  onChange={e => setForm(p => ({ ...p, recording_notes: e.target.value }))} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-top d-flex justify-content-between align-items-center flex-shrink-0 flex-wrap gap-2">
          {/* Download buttons — show if summary has content */}
          {(form.summary_prayers || form.summary_teaching || form.summary_scriptures || form.summary_action_items) ? (
            <div className="d-flex gap-2">
              <motion.button className="btn btn-sm btn-outline-secondary"
                onClick={() => downloadAsPdf({ ...session, ...form })}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                title="Download as PDF (print dialog)">
                <i className="bi bi-file-earmark-pdf me-1" />PDF
              </motion.button>
              <motion.button className="btn btn-sm btn-outline-secondary"
                onClick={() => downloadAsWord({ ...session, ...form })}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                title="Download as Word document">
                <i className="bi bi-file-earmark-word me-1" />Word
              </motion.button>
            </div>
          ) : <div />}

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
            {isAdmin && (
              <motion.button className="btn btn-gold btn-sm" onClick={save} disabled={saving}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
                        : <><i className="bi bi-check-circle me-1" />Save</>}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRAYER WALL  (private — disciples + admin only)
// ══════════════════════════════════════════════════════════════════════════════
function PrayerPanel({ user }) {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', body: '', is_private: false });
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === 'admin';

  const loadPrayers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/sons/prayer');
      setPrayers(data);
    } catch { toast.error('Could not load prayer requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPrayers(); }, [loadPrayers]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/sons/prayer', form);
      toast.success('Prayer request shared with the community!');
      setForm({ title: '', body: '', is_private: false });
      setShowForm(false);
      loadPrayers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post'); }
    finally { setSubmitting(false); }
  };

  const prayFor = async (id) => {
    try {
      const { data } = await api.post(`/api/sons/prayer/${id}/pray`);
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayer_count: data.prayer_count } : p));
    } catch { toast.error('Failed'); }
  };

  const markAnswered = async (id) => {
    try {
      await api.patch(`/api/sons/prayer/${id}`, { is_answered: true });
      toast.success('Praise God! Marked as answered 🎉');
      loadPrayers();
    } catch { toast.error('Failed'); }
  };

  const deletePrayer = async (id) => {
    if (!window.confirm('Delete this prayer request?')) return;
    try { await api.delete(`/api/sons/prayer/${id}`); loadPrayers(); }
    catch { toast.error('Failed'); }
  };

  const answered = prayers.filter(p => p.is_answered);
  const active   = prayers.filter(p => !p.is_answered);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* Privacy notice */}
      <div className="alert mb-3 d-flex align-items-center gap-2"
        style={{ background: 'rgba(13,27,42,0.06)', border: '1px solid rgba(13,27,42,0.15)', fontSize: '0.85rem' }}>
        <i className="bi bi-lock-fill text-gold" />
        <span>
          This prayer wall is <strong>completely private</strong> — only approved Sons &amp; Daughters
          members and the admin can see what is shared here.
        </span>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-heart text-gold me-2" />Prayer Wall
        </h5>
        <motion.button className="btn btn-gold btn-sm"
          onClick={() => setShowForm(v => !v)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <i className={`bi ${showForm ? 'bi-x' : 'bi-plus-circle'} me-1`} />
          {showForm ? 'Cancel' : 'Share a Request'}
        </motion.button>
      </div>

      {/* New prayer form */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="ministry-card p-4 mb-4"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Prayer Title *</label>
                <input className="form-control" required placeholder="e.g. Healing for my mother"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Share Your Heart *</label>
                <textarea className="form-control" rows={4} required
                  placeholder="You are safe here. Pour out your heart before God and your brothers and sisters..."
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
              </div>
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="isPrivate"
                  checked={form.is_private}
                  onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} />
                <label className="form-check-label small" htmlFor="isPrivate">
                  <i className="bi bi-lock me-1" />Keep extra-private (only admin can see — not other disciples)
                </label>
              </div>
              <button type="submit" className="btn btn-gold" disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Posting...</>
                            : <><i className="bi bi-send me-1" />Share Prayer Request</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--gold)' }} />
        </div>
      ) : prayers.length === 0 ? (
        <div className="ministry-card p-5 text-center text-muted">
          <i className="bi bi-heart fs-1 d-block mb-3 text-gold" />
          <h6 className="fw-bold">Be the first to share</h6>
          <p className="small mb-0">
            This is a safe, private space. Your prayer requests are only visible
            to fellow disciples who are standing with you.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="row g-3 mb-4">
              {active.map(p => (
                <PrayerCard key={p.id} prayer={p} user={user} isAdmin={isAdmin}
                  onPray={() => prayFor(p.id)}
                  onAnswered={() => markAnswered(p.id)}
                  onDelete={() => deletePrayer(p.id)} />
              ))}
            </div>
          )}

          {answered.length > 0 && (
            <>
              <h6 className="fw-semibold mb-3 mt-2 text-success">
                <i className="bi bi-stars me-1" />Answered Prayers ({answered.length}) — Praise Reports!
              </h6>
              <div className="row g-3">
                {answered.map(p => (
                  <PrayerCard key={p.id} prayer={p} user={user} isAdmin={isAdmin}
                    onPray={() => prayFor(p.id)}
                    onAnswered={() => {}}
                    onDelete={() => deletePrayer(p.id)} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

function PrayerCard({ prayer, user, isAdmin, onPray, onAnswered, onDelete }) {
  const isOwner = prayer.user_id === user?.id;
  return (
    <div className="col-md-6">
      <motion.div className="ministry-card p-4 h-100"
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={prayer.is_answered ? { borderLeft: '4px solid #198754' } : {}}>

        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex gap-1 flex-wrap">
            {prayer.is_private && (
              <span className="badge bg-secondary"><i className="bi bi-lock me-1" />Extra Private</span>
            )}
            {prayer.is_answered && (
              <span className="badge bg-success"><i className="bi bi-stars me-1" />Answered!</span>
            )}
          </div>
          <small className="text-muted">{dayjs(prayer.created_at).fromNow()}</small>
        </div>

        <h6 className="fw-bold mb-2">{prayer.title}</h6>
        <p className="small text-muted mb-3" style={{ whiteSpace: 'pre-line' }}>{prayer.body}</p>

        {prayer.author && (
          <div className="d-flex align-items-center gap-2 mb-3">
            {prayer.author.profile_pic ? (
              <img src={`/uploads/${prayer.author.profile_pic}`} alt=""
                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle"
                style={{ width: 26, height: 26, background: 'var(--navy)', fontSize: '0.65rem' }}>
                {prayer.author.first_name?.[0]}{prayer.author.last_name?.[0]}
              </div>
            )}
            <small className="text-muted">{prayer.author.first_name} {prayer.author.last_name}</small>
          </div>
        )}

        <div className="d-flex gap-2 flex-wrap">
          <motion.button
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            onClick={onPray} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <i className="bi bi-heart-fill" />
            <span>{prayer.prayer_count || 0} Praying</span>
          </motion.button>
          {(isOwner || isAdmin) && !prayer.is_answered && (
            <button className="btn btn-sm btn-outline-success" onClick={onAnswered}>
              <i className="bi bi-check-circle me-1" />Answered
            </button>
          )}
          {(isOwner || isAdmin) && (
            <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
              <i className="bi bi-trash" />
            </button>
          )}
        </div>

        {prayer.answered_testimony && (
          <div className="mt-3 p-2 rounded" style={{ background: '#d1fae5', fontSize: '0.82rem' }}>
            <strong className="text-success"><i className="bi bi-stars me-1" />Testimony:</strong>
            <p className="mb-0 mt-1 text-success" style={{ whiteSpace: 'pre-line' }}>
              {prayer.answered_testimony}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════════════════
function AnnouncementsPanel({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', body: '', is_pinned: false });
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/sons/announcements');
      setAnnouncements(data);
    } catch { toast.error('Could not load announcements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/sons/admin/announcements', form);
      toast.success('Announcement posted!');
      setForm({ title: '', body: '', is_pinned: false });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.delete(`/api/sons/admin/announcements/${id}`); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-megaphone text-gold me-2" />Announcements
        </h5>
        {isAdmin && (
          <motion.button className="btn btn-gold btn-sm"
            onClick={() => setShowForm(v => !v)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <i className={`bi ${showForm ? 'bi-x' : 'bi-plus-circle'} me-1`} />
            {showForm ? 'Cancel' : 'Post Announcement'}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="ministry-card p-4 mb-4"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <form onSubmit={create}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Title *</label>
                <input className="form-control" required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Message *</label>
                <textarea className="form-control" rows={6} required value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
              </div>
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="isPinned"
                  checked={form.is_pinned}
                  onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))} />
                <label className="form-check-label small" htmlFor="isPinned">
                  <i className="bi bi-pin me-1" />Pin to top
                </label>
              </div>
              <button type="submit" className="btn btn-gold" disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Posting...</>
                            : <><i className="bi bi-megaphone me-1" />Post Announcement</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--gold)' }} />
        </div>
      ) : announcements.length === 0 ? (
        <div className="ministry-card p-5 text-center text-muted">
          <i className="bi bi-megaphone fs-1 d-block mb-3" />
          <p>No announcements yet. Watch this space!</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {announcements.map((a, i) => (
            <motion.div key={a.id} className="ministry-card p-4"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={a.is_pinned ? { borderLeft: '4px solid var(--gold)' } : {}}>
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1 pe-3">
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    {a.is_pinned && (
                      <span className="badge bg-warning text-dark">
                        <i className="bi bi-pin-fill me-1" />Pinned
                      </span>
                    )}
                    <h6 className="fw-bold mb-0">{a.title}</h6>
                  </div>
                  <p className="text-muted mb-2" style={{ whiteSpace: 'pre-line' }}>{a.body}</p>
                  <small className="text-muted">
                    <i className="bi bi-clock me-1" />
                    {dayjs(a.created_at).format('DD MMM YYYY [at] h:mm A')}
                    {' · '}{dayjs(a.created_at).fromNow()}
                  </small>
                </div>
                {isAdmin && (
                  <button className="btn btn-sm btn-outline-danger flex-shrink-0" onClick={() => del(a.id)}>
                    <i className="bi bi-trash" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
