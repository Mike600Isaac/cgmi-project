import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';
dayjs.extend(relativeTime);

// ── constants ─────────────────────────────────────────────────────────────────
const TYPE_META = {
  conference: { icon: 'bi-mic-fill',         color: '#7c3aed', label: 'Conference'   },
  prayer:     { icon: 'bi-cloud',             color: '#4a90d9', label: 'Prayer Night' },
  outreach:   { icon: 'bi-globe2',            color: '#059669', label: 'Outreach'     },
  training:   { icon: 'bi-journal-bookmark',  color: '#c9a84c', label: 'Training'     },
  worship:    { icon: 'bi-music-note-beamed', color: '#db2777', label: 'Worship'      },
  crusade:    { icon: 'bi-fire',              color: '#dc2626', label: 'Crusade'      },
  general:    { icon: 'bi-calendar-event',    color: '#6b7280', label: 'Event'        },
};

const STATUS_META = {
  upcoming:  { label: 'Upcoming',   bg: '#1e3a5f', color: '#93c5fd' },
  ongoing:   { label: 'Ongoing',    bg: '#064e3b', color: '#6ee7b7' },
  concluded: { label: 'Concluded',  bg: '#1f2937', color: '#9ca3af' },
};

// ── YouTube helper ──────────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Jitsi loader ────────────────────────────────────────────────────────────
function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://meet.jit.si/external_api.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Events() {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [liveEvent, setLiveEvent]   = useState(null);   // event currently watched
  const [platform, setPlatform]     = useState(null);   // 'youtube' | 'jitsi'
  const jitsiRef   = useRef(null);
  const jitsiApiRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/events');
      setEvents(data);
    } catch { toast.error('Could not load events'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openLive = async (event, plt) => {
    setLiveEvent(event);
    setPlatform(plt);
    if (plt === 'jitsi') {
      try { await loadJitsiScript(); }
      catch { toast.error('Failed to load Jitsi'); setLiveEvent(null); return; }
      setTimeout(() => {
        if (!jitsiRef.current) return;
        jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: event.jitsi_room,
          parentNode: jitsiRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: { startWithAudioMuted: true, prejoinPageEnabled: true },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview', 'hangup'],
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
          },
        });
        jitsiApiRef.current.addEventListener('readyToClose', closeLive);
      }, 200);
    }
  };

  const closeLive = () => {
    try { jitsiApiRef.current?.dispose(); } catch {}
    jitsiApiRef.current = null;
    setLiveEvent(null);
    setPlatform(null);
  };

  const ongoing  = events.filter(e => e.status === 'ongoing');
  const upcoming = events.filter(e => e.status === 'upcoming');
  const concluded = events.filter(e => e.status === 'concluded');

  const displayed = filter === 'all'
    ? [...ongoing, ...upcoming, ...concluded]
    : filter === 'ongoing'  ? ongoing
    : filter === 'upcoming' ? upcoming
    : concluded;

  return (
    <>
      {/* ── Live overlay ── */}
      <AnimatePresence>
        {liveEvent && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
            style={{ zIndex: 9999, background: '#0d1b2a' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Top bar */}
            <div className="d-flex align-items-center justify-content-between px-3 py-2 flex-shrink-0"
              style={{ background: '#060e17', borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
              <div className="d-flex align-items-center gap-2">
                <motion.i className="bi bi-broadcast text-danger"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-white fw-bold" style={{ fontFamily: 'Cinzel, serif' }}>
                  {liveEvent.title}
                </span>
                <span className="badge bg-danger">● LIVE</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Platform switcher */}
                <div className="d-flex gap-1">
                  {liveEvent.youtube_url && (
                    <button className={`btn btn-sm ${platform === 'youtube' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => { closeLive(); setTimeout(() => openLive(liveEvent, 'youtube'), 100); }}>
                      <i className="bi bi-youtube me-1" />YouTube
                    </button>
                  )}
                  {liveEvent.jitsi_room && (
                    <button className={`btn btn-sm ${platform === 'jitsi' ? 'btn-gold' : 'btn-outline-secondary'}`}
                      style={platform !== 'jitsi' ? { color: 'var(--gold)', borderColor: 'var(--gold)' } : {}}
                      onClick={() => { closeLive(); setTimeout(() => openLive(liveEvent, 'jitsi'), 100); }}>
                      <i className="bi bi-camera-video me-1" />Jitsi
                    </button>
                  )}
                </div>
                <button className="btn btn-sm btn-outline-light" onClick={closeLive}>
                  <i className="bi bi-x-lg me-1" />Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {platform === 'youtube' && extractYouTubeId(liveEvent.youtube_url) && (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(liveEvent.youtube_url)}?autoplay=1`}
                  title={liveEvent.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              )}
              {platform === 'jitsi' && (
                <div ref={jitsiRef} style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Hero ── */}
      <section className="section-pad text-white text-center"
        style={{ background: 'linear-gradient(135deg, var(--dark-navy) 0%, var(--deep-blue) 60%, #2a1a0a 100%)', paddingBottom: 60 }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="gold-divider mx-auto" />
            <h1 className="display-5 fw-bold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <i className="bi bi-calendar-event-fill text-gold me-2" />Ministry Events
            </h1>
            <p className="lead mb-4" style={{ maxWidth: 560, margin: '0 auto', color: 'rgba(255,255,255,0.8)' }}>
              Conferences, prayer nights, crusades, outreaches — join us live from anywhere in the world.
            </p>
            {ongoing.length > 0 && (
              <motion.div
                className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill"
                style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.5)' }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}>
                <i className="bi bi-broadcast text-danger" />
                <span className="text-white fw-bold">{ongoing.length} Event{ongoing.length > 1 ? 's' : ''} Happening Now!</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Filter tabs ── */}
      <div style={{ background: 'var(--dark-navy)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="container">
          <div className="d-flex gap-1 py-2">
            {[
              { key: 'all',       label: 'All Events',  count: events.length },
              { key: 'ongoing',   label: '🔴 Live Now', count: ongoing.length },
              { key: 'upcoming',  label: 'Upcoming',    count: upcoming.length },
              { key: 'concluded', label: 'Concluded',   count: concluded.length },
            ].map(f => (
              <motion.button key={f.key}
                className={`btn btn-sm ${filter === f.key ? 'btn-gold' : ''}`}
                style={filter !== f.key ? { color: 'rgba(255,255,255,0.65)', background: 'transparent' } : {}}
                onClick={() => setFilter(f.key)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {f.label}
                {f.count > 0 && (
                  <span className={`badge ms-1 ${f.key === 'ongoing' ? 'bg-danger' : 'bg-secondary'}`}
                    style={{ fontSize: '0.65rem' }}>{f.count}</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Events list ── */}
      <section className="section-pad section-bg">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--gold)' }} />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-3" />
              <p>No events found for this filter.</p>
            </div>
          ) : (
            <>
              {/* Ongoing first — full width highlight */}
              {filter === 'all' && ongoing.length > 0 && (
                <div className="mb-5">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <motion.i className="bi bi-broadcast text-danger fs-5"
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                    <h5 className="fw-bold mb-0 text-danger">Happening Now</h5>
                  </div>
                  <div className="row g-4">
                    {ongoing.map(e => <EventCard key={e.id} event={e} onWatch={openLive} large />)}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {filter === 'all' && upcoming.length > 0 && (
                <div className="mb-5">
                  <h5 className="fw-bold mb-3"><i className="bi bi-calendar-check me-2 text-gold" />Upcoming Events</h5>
                  <div className="row g-4">
                    {upcoming.map(e => <EventCard key={e.id} event={e} onWatch={openLive} />)}
                  </div>
                </div>
              )}

              {/* Concluded */}
              {filter === 'all' && concluded.length > 0 && (
                <div>
                  <h5 className="fw-bold mb-3 text-muted"><i className="bi bi-clock-history me-2" />Concluded Events</h5>
                  <div className="row g-4">
                    {concluded.map(e => <EventCard key={e.id} event={e} onWatch={openLive} />)}
                  </div>
                </div>
              )}

              {/* Filtered view */}
              {filter !== 'all' && (
                <div className="row g-4">
                  {displayed.map(e => <EventCard key={e.id} event={e} onWatch={openLive} large={e.status === 'ongoing'} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Public Prayer section ── */}
      <PublicPrayerSection />
    </>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, onWatch, large }) {
  const typeMeta   = TYPE_META[event.event_type] || TYPE_META.general;
  const statusMeta = STATUS_META[event.status]   || STATUS_META.upcoming;
  const ytId = extractYouTubeId(event.youtube_url);
  const isLive = event.is_live_now;
  const isConcluded = event.status === 'concluded';

  return (
    <div className={large ? 'col-12' : 'col-md-6 col-lg-4'}>
      <motion.div
        className="ministry-card h-100 overflow-hidden"
        whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}
        transition={{ type: 'spring', stiffness: 280 }}
        style={isLive ? { border: '2px solid #dc2626', boxShadow: '0 0 20px rgba(220,38,38,0.3)' } : {}}>

        {/* Banner */}
        <div className="position-relative overflow-hidden" style={{ height: large ? 260 : 180 }}>
          {event.banner_image ? (
            <motion.img
              src={`/uploads/${event.banner_image}`}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }} />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ background: `linear-gradient(135deg, ${typeMeta.color}33, var(--dark-navy))` }}>
              <i className={`bi ${typeMeta.icon}`} style={{ fontSize: large ? '5rem' : '3.5rem', color: typeMeta.color, opacity: 0.7 }} />
            </div>
          )}

          {/* Overlaid badges */}
          <div className="position-absolute top-0 start-0 p-2 d-flex gap-1 flex-wrap">
            <span className="badge" style={{ background: typeMeta.color }}>
              <i className={`bi ${typeMeta.icon} me-1`} />{typeMeta.label}
            </span>
            {isLive ? (
              <motion.span className="badge bg-danger"
                animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                ● LIVE NOW
              </motion.span>
            ) : (
              <span className="badge" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                {statusMeta.label}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <h5 className="fw-bold mb-2">{event.title}</h5>
          {event.description && (
            <p className="text-muted small mb-3">
              {event.description.slice(0, large ? 200 : 100)}
              {event.description.length > (large ? 200 : 100) ? '...' : ''}
            </p>
          )}

          <div className="d-flex flex-column gap-1 mb-3">
            <small className="text-muted">
              <i className="bi bi-calendar3 me-2" />
              {dayjs(event.start_date).format('ddd, DD MMM YYYY [at] h:mm A')}
              {event.end_date && ` → ${dayjs(event.end_date).format('DD MMM YYYY')}`}
            </small>
            {event.location && (
              <small className="text-muted">
                <i className="bi bi-geo-alt me-2" />{event.location}
              </small>
            )}
          </div>

          {/* Live / watch platform buttons */}
          <div className="d-flex flex-wrap gap-2">
            {/* YouTube — embed when live, link when concluded */}
            {event.youtube_url && (
              <motion.button
                className={`btn btn-sm d-flex align-items-center gap-1 ${isLive ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => isLive || isConcluded ? onWatch(event, 'youtube') : window.open(event.youtube_url, '_blank')}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={!isLive ? { borderColor: '#dc2626', color: '#dc2626' } : {}}>
                <i className="bi bi-youtube" />
                {isLive ? 'Watch Live' : isConcluded ? 'Watch Replay' : 'YouTube'}
              </motion.button>
            )}

            {/* Jitsi */}
            {event.jitsi_room && (isLive || !isConcluded) && (
              <motion.button
                className={`btn btn-sm d-flex align-items-center gap-1 ${isLive ? 'btn-gold' : 'btn-outline-secondary'}`}
                style={!isLive ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}
                onClick={() => onWatch(event, 'jitsi')}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <i className="bi bi-camera-video-fill" />
                {isLive ? 'Join Live' : 'Join Room'}
              </motion.button>
            )}

            {/* Facebook */}
            {event.facebook_url && (
              <motion.button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: '#1877f2', color: '#fff', border: 'none' }}
                onClick={() => window.open(event.facebook_url, '_blank')}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <i className="bi bi-facebook" />
                {isLive ? 'Facebook Live' : 'Facebook'}
              </motion.button>
            )}

            {/* Twitter/X */}
            {event.twitter_url && (
              <motion.button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: '#000', color: '#fff', border: 'none' }}
                onClick={() => window.open(event.twitter_url, '_blank')}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <i className="bi bi-twitter-x" />
                {isLive ? 'X Live' : 'X / Twitter'}
              </motion.button>
            )}

            {/* Recording */}
            {isConcluded && event.recording_url && !event.youtube_url && (
              <a href={event.recording_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm btn-outline-gold">
                <i className="bi bi-play-circle me-1" />Watch Recording
              </a>
            )}

            {/* No platforms yet */}
            {!event.youtube_url && !event.jitsi_room && !event.facebook_url && !event.twitter_url && !event.recording_url && (
              <span className="text-muted small">
                <i className="bi bi-clock me-1" />Stream links coming soon
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC PRAYER SECTION  (reusable — used on Events page & Homepage)
// ══════════════════════════════════════════════════════════════════════════════
export function PublicPrayerSection() {
  const [form, setForm] = useState({ name: '', email: '', prayer_request: '', is_private: false });
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const charLimit = 2000;

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/api/events/prayers', form);
      setSent(true);
      setForm({ name: '', email: '', prayer_request: '', is_private: false });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section-pad" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <motion.div
              className="ministry-card p-4 p-md-5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6 }}>

              <div className="text-center mb-4">
                <motion.i className="bi bi-heart-pulse-fill text-gold d-block mb-2"
                  style={{ fontSize: '2.5rem' }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }} />
                <h3 className="fw-bold" style={{ fontFamily: 'Cinzel, serif' }}>Send a Prayer Request</h3>
                <p className="text-muted mb-0">
                  You don't need to be a member. Let us stand with you in prayer.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div className="text-center py-4"
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}>
                    <motion.i className="bi bi-check-circle-fill text-success d-block mb-3"
                      style={{ fontSize: '4rem' }}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }} />
                    <h5 className="fw-bold mb-2">Request Received!</h5>
                    <p className="text-muted mb-4">
                      We are standing with you in faith. God hears every prayer and He will answer.
                    </p>
                    <p className="text-gold fst-italic small">
                      "Do not be anxious about anything, but in every situation, by prayer and petition,
                      with thanksgiving, present your requests to God." — Philippians 4:6
                    </p>
                    <button className="btn btn-outline-gold mt-3" onClick={() => setSent(false)}>
                      <i className="bi bi-plus-circle me-1" />Submit Another Request
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="row g-3 mb-3">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold">Your Name (optional)</label>
                        <input className="form-control" placeholder="Leave blank to stay anonymous"
                          value={form.name}
                          onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold">Email (optional)</label>
                        <input type="email" className="form-control" placeholder="For a personal response"
                          value={form.email}
                          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold">
                        Your Prayer Request <span className="text-danger">*</span>
                      </label>
                      <textarea className="form-control" rows={5} required
                        placeholder="Share what's on your heart. Nothing is too big or too small for God..."
                        value={form.prayer_request}
                        maxLength={charLimit}
                        onChange={e => setForm(p => ({ ...p, prayer_request: e.target.value }))} />
                      <small className="text-muted float-end">
                        {form.prayer_request.length}/{charLimit}
                      </small>
                    </div>

                    <div className="form-check mb-4 mt-3">
                      <input className="form-check-input" type="checkbox" id="pubPrivate"
                        checked={form.is_private}
                        onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} />
                      <label className="form-check-label small" htmlFor="pubPrivate">
                        <i className="bi bi-lock me-1" />Keep my name private (show as Anonymous)
                      </label>
                    </div>

                    <motion.button type="submit" className="btn btn-gold w-100 py-2 fw-bold"
                      disabled={sending}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {sending
                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                        : <><i className="bi bi-send-fill me-2" />Send Prayer Request</>}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
