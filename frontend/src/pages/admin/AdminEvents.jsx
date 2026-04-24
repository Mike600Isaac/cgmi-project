import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const TYPE_OPTIONS = [
  { value: 'conference', label: 'Conference' },
  { value: 'prayer',     label: 'Prayer Night' },
  { value: 'outreach',   label: 'Outreach' },
  { value: 'training',   label: 'Training' },
  { value: 'worship',    label: 'Worship' },
  { value: 'crusade',    label: 'Crusade' },
  { value: 'general',    label: 'General Event' },
];

const STATUS_COLORS = {
  upcoming:  'primary',
  ongoing:   'success',
  concluded: 'secondary',
};

const BLANK = {
  title: '', description: '', event_type: 'general', status: 'upcoming',
  start_date: '', end_date: '', location: '', is_physical: false,
  youtube_url: '', jitsi_room: '', facebook_url: '', twitter_url: '',
  recording_url: '', recording_notes: '', is_published: true,
};

export default function AdminEvents() {
  const [events, setEvents]         = useState([]);
  const [prayers, setPrayers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('events');
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);   // event being edited
  const [form, setForm]             = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/api/events/admin');
      setEvents(data);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, []);

  const loadPrayers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/events/admin/prayers');
      setPrayers(data);
      setUnreadCount(data.filter(p => !p.is_read).length);
    } catch {}
  }, []);

  useEffect(() => { loadEvents(); loadPrayers(); }, [loadEvents, loadPrayers]);

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); };
  const openEdit   = (e) => {
    setEditing(e);
    setForm({
      ...BLANK, ...e,
      start_date: e.start_date ? e.start_date.slice(0, 16) : '',
      end_date:   e.end_date   ? e.end_date.slice(0, 16)   : '',
    });
    setShowForm(true);
  };

  const save = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/events/admin/${editing.id}`, form);
        toast.success('Event updated!');
      } else {
        await api.post('/api/events/admin', form);
        toast.success('Event created!');
      }
      setShowForm(false);
      loadEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save event');
    } finally { setSaving(false); }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.delete(`/api/events/admin/${id}`); loadEvents(); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const toggleLive = async (event) => {
    try {
      const ep = event.is_live_now
        ? `/api/events/admin/${event.id}/end-live`
        : `/api/events/admin/${event.id}/go-live`;
      await api.post(ep);
      toast.success(event.is_live_now ? 'Live ended' : '🔴 Event is now LIVE!');
      loadEvents();
    } catch { toast.error('Failed'); }
  };

  const concludeEvent = async (id) => {
    if (!window.confirm('Mark this event as concluded?')) return;
    try {
      await api.post(`/api/events/admin/${id}/conclude`);
      toast.success('Marked as concluded'); loadEvents();
    } catch { toast.error('Failed'); }
  };

  const markPrayerRead = async (id) => {
    try {
      await api.patch(`/api/events/admin/prayers/${id}/read`);
      loadPrayers();
    } catch {}
  };

  const deletePrayer = async (id) => {
    try { await api.delete(`/api/events/admin/prayers/${id}`); loadPrayers(); }
    catch { toast.error('Failed'); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <AdminLayout title="Events">
      {/* Tab switcher */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        <button className={`btn btn-sm ${activeTab === 'events' ? 'btn-gold' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('events')}>
          <i className="bi bi-calendar-event me-1" />Events ({events.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'prayers' ? 'btn-gold' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('prayers')}>
          <i className="bi bi-heart me-1" />Prayer Requests ({prayers.length})
          {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}
        </button>
        {activeTab === 'events' && (
          <motion.button className="btn btn-gold btn-sm ms-auto"
            onClick={openCreate} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <i className="bi bi-plus-circle me-1" />Create Event
          </motion.button>
        )}
      </div>

      {/* ── CREATE / EDIT FORM ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="ministry-card p-4 mb-4"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">{editing ? 'Edit Event' : 'Create New Event'}</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowForm(false)}>
                <i className="bi bi-x" />
              </button>
            </div>
            <form onSubmit={save}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label small fw-semibold">Title *</label>
                  <input className="form-control" required value={form.title} onChange={f('title')} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Type</label>
                  <select className="form-select" value={form.event_type} onChange={f('event_type')}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Status</label>
                  <select className="form-select" value={form.status} onChange={f('status')}>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="concluded">Concluded</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={f('description')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Start Date &amp; Time *</label>
                  <input type="datetime-local" className="form-control" required value={form.start_date} onChange={f('start_date')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">End Date &amp; Time</label>
                  <input type="datetime-local" className="form-control" value={form.end_date} onChange={f('end_date')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Physical Location</label>
                  <input className="form-control" placeholder="City, Venue, Online..." value={form.location} onChange={f('location')} />
                </div>

                <div className="col-12"><hr className="my-1" /><h6 className="fw-bold text-gold mb-2"><i className="bi bi-broadcast me-1" />Live Streaming Platforms</h6></div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    <i className="bi bi-youtube text-danger me-1" />YouTube URL
                  </label>
                  <input className="form-control" placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                    value={form.youtube_url} onChange={f('youtube_url')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    <i className="bi bi-camera-video me-1 text-gold" />Jitsi Room Name
                  </label>
                  <input className="form-control" placeholder="e.g. ministry-conference-2026"
                    value={form.jitsi_room} onChange={f('jitsi_room')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    <i className="bi bi-facebook me-1" style={{ color: '#1877f2' }} />Facebook Live URL
                  </label>
                  <input className="form-control" placeholder="https://facebook.com/..."
                    value={form.facebook_url} onChange={f('facebook_url')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    <i className="bi bi-twitter-x me-1" />Twitter/X URL
                  </label>
                  <input className="form-control" placeholder="https://twitter.com/i/spaces/..."
                    value={form.twitter_url} onChange={f('twitter_url')} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Recording URL (after event)</label>
                  <input className="form-control" placeholder="YouTube, Drive or Dropbox link..."
                    value={form.recording_url} onChange={f('recording_url')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Recording Notes</label>
                  <input className="form-control" placeholder="e.g. sermon starts at 22:00..."
                    value={form.recording_notes} onChange={f('recording_notes')} />
                </div>

                <div className="col-12 d-flex gap-3 flex-wrap">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="isPublished"
                      checked={form.is_published} onChange={f('is_published')} />
                    <label className="form-check-label small" htmlFor="isPublished">Published (visible to public)</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="isPhysical"
                      checked={form.is_physical} onChange={f('is_physical')} />
                    <label className="form-check-label small" htmlFor="isPhysical">Has a physical venue</label>
                  </div>
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                             : <><i className="bi bi-check-circle me-1" />{editing ? 'Update Event' : 'Create Event'}</>}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EVENTS TAB ── */}
      {activeTab === 'events' && (
        loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
        ) : events.length === 0 ? (
          <div className="ministry-card p-5 text-center text-muted">
            <i className="bi bi-calendar-x fs-1 d-block mb-3" />
            <p>No events yet. Click "Create Event" to add one.</p>
          </div>
        ) : (
          <div className="row g-3">
            {events.map(e => (
              <div key={e.id} className="col-12">
                <div className="ministry-card p-4"
                  style={e.is_live_now ? { border: '2px solid #dc2626', boxShadow: '0 0 16px rgba(220,38,38,0.25)' } : {}}>
                  <div className="row align-items-center g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className={`badge bg-${STATUS_COLORS[e.status] || 'secondary'}`}>
                          {e.status}
                        </span>
                        {e.is_live_now && (
                          <motion.span className="badge bg-danger"
                            animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                            ● LIVE NOW
                          </motion.span>
                        )}
                        {!e.is_published && <span className="badge bg-warning text-dark">Draft</span>}
                      </div>
                      <h6 className="fw-bold mb-0">{e.title}</h6>
                      <small className="text-muted">
                        {dayjs(e.start_date).format('DD MMM YYYY [at] h:mm A')}
                        {e.location && ` · ${e.location}`}
                      </small>
                    </div>

                    {/* Platform icons */}
                    <div className="col-md-3">
                      <div className="d-flex gap-2 flex-wrap">
                        {e.youtube_url  && <span className="badge" style={{ background: '#dc2626' }}><i className="bi bi-youtube" /></span>}
                        {e.jitsi_room   && <span className="badge" style={{ background: 'var(--gold)', color: 'var(--dark-navy)' }}><i className="bi bi-camera-video-fill" /></span>}
                        {e.facebook_url && <span className="badge" style={{ background: '#1877f2' }}><i className="bi bi-facebook" /></span>}
                        {e.twitter_url  && <span className="badge bg-dark"><i className="bi bi-twitter-x" /></span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-md-3 d-flex gap-2 flex-wrap justify-content-md-end">
                      <button
                        className={`btn btn-sm ${e.is_live_now ? 'btn-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleLive(e)}>
                        <i className={`bi ${e.is_live_now ? 'bi-stop-circle' : 'bi-broadcast'} me-1`} />
                        {e.is_live_now ? 'End Live' : 'Go Live'}
                      </button>
                      {e.status !== 'concluded' && (
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => concludeEvent(e.id)}>
                          <i className="bi bi-check2-all me-1" />Conclude
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-gold" onClick={() => openEdit(e)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteEvent(e.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── PRAYERS TAB ── */}
      {activeTab === 'prayers' && (
        prayers.length === 0 ? (
          <div className="ministry-card p-5 text-center text-muted">
            <i className="bi bi-heart fs-1 d-block mb-3" />
            <p>No prayer requests yet.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {prayers.map(p => (
              <motion.div key={p.id}
                className={`ministry-card p-4 ${!p.is_read ? 'border border-2 border-warning' : ''}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      {!p.is_read && <span className="badge bg-warning text-dark">New</span>}
                      <span className="fw-bold">{p.name || 'Anonymous'}</span>
                      {p.email && <small className="text-muted">· {p.email}</small>}
                      <small className="text-muted ms-auto">
                        {dayjs(p.created_at).format('DD MMM YYYY [at] h:mm A')}
                      </small>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{p.prayer_request}</p>
                  </div>
                  <div className="d-flex gap-2 ms-3 flex-shrink-0">
                    {!p.is_read && (
                      <button className="btn btn-sm btn-outline-success" onClick={() => markPrayerRead(p.id)}>
                        <i className="bi bi-check" />
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deletePrayer(p.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );
}
