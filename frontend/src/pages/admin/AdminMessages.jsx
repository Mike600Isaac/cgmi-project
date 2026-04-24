import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [selected, setSelected] = useState(null);

  const fetch = (rec = recipient, pg = page) => {
    setLoading(true);
    const params = { page: pg, per_page: 20 };
    if (rec) params.recipient = rec;
    api.get('/api/contact', { params })
      .then(r => {
        setMessages(r.data.items);
        setTotalPages(r.data.pages);
        setTotal(r.data.total);
        setUnread(r.data.unread);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, recipient]);

  const markRead = async (id) => {
    await api.patch(`/api/contact/${id}/read`);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const deleteMsg = async (id) => {
    if (!confirm('Delete this message?')) return;
    await api.delete(`/api/contact/${id}`);
    toast.success('Message deleted');
    setSelected(null);
    fetch();
  };

  const openMessage = (m) => {
    setSelected(m);
    if (!m.is_read) markRead(m.id);
  };

  return (
    <AdminLayout title="Messages">
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold">{total} messages</span>
          {unread > 0 && <span className="badge bg-danger">{unread} unread</span>}
        </div>
        <div className="d-flex gap-2 ms-auto">
          {[['', 'All'], ['ministry', 'Ministry'], ['evangelist', 'Evangelist']].map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${recipient === v ? 'btn-gold' : 'btn-outline-secondary'}`}
              onClick={() => { setRecipient(v); setPage(1); }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {/* Message list */}
        <div className={selected ? 'col-md-5' : 'col-12'}>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
          ) : messages.length === 0 ? (
            <div className="ministry-card p-5 text-center text-muted">
              <i className="bi bi-inbox fs-1 mb-3 d-block" />
              <p>No messages yet.</p>
            </div>
          ) : (
            <div className="list-group">
              {messages.map(m => (
                <button
                  key={m.id}
                  className={`list-group-item list-group-item-action d-flex gap-3 align-items-start text-start ${selected?.id === m.id ? 'active' : ''} ${!m.is_read ? 'fw-bold' : ''}`}
                  onClick={() => openMessage(m)}
                  style={{ borderLeft: !m.is_read ? '3px solid var(--gold)' : '' }}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                    style={{ width: '36px', height: '36px', background: selected?.id === m.id ? 'rgba(255,255,255,0.2)' : 'rgba(201,168,76,.1)', color: selected?.id === m.id ? 'white' : 'var(--gold)' }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between">
                      <span className={selected?.id === m.id ? 'text-white' : ''}>{m.name}</span>
                      <small className={selected?.id === m.id ? 'text-white-50' : 'text-muted'}>{dayjs(m.created_at).format('DD MMM')}</small>
                    </div>
                    <p className="mb-0 small text-truncate" style={{ maxWidth: '100%', opacity: 0.75 }}>
                      {m.subject || m.message.slice(0, 50)}
                    </p>
                    <div className="d-flex gap-1 mt-1">
                      <span className={`badge ${selected?.id === m.id ? 'bg-light text-dark' : 'bg-secondary'}`} style={{ fontSize: '0.65rem' }}>{m.recipient}</span>
                      {!m.is_read && <span className={`badge ${selected?.id === m.id ? 'bg-warning text-dark' : 'bg-warning text-dark'}`} style={{ fontSize: '0.65rem' }}>New</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span className="btn btn-sm disabled">Page {page}/{totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>

        {/* Message detail */}
        {selected && (
          <div className="col-md-7">
            <div className="ministry-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="fw-bold mb-0">{selected.subject || 'No Subject'}</h5>
                  <small className="text-muted">
                    Recipient: <span className="text-capitalize fw-semibold">{selected.recipient}</span>
                    {' · '}{dayjs(selected.created_at).format('DD MMMM YYYY, h:mm A')}
                  </small>
                </div>
                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMsg(selected.id)}>
                  <i className="bi bi-trash" />
                </button>
              </div>

              <div className="p-3 rounded mb-3" style={{ background: 'var(--section-bg)' }}>
                <div className="row g-2 mb-3">
                  <div className="col-sm-6">
                    <small className="text-muted d-block">From</small>
                    <span className="fw-semibold">{selected.name}</span>
                  </div>
                  <div className="col-sm-6">
                    <small className="text-muted d-block">Email</small>
                    <a href={`mailto:${selected.email}`} className="text-gold">{selected.email}</a>
                  </div>
                  {selected.phone && (
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Phone</small>
                      <span>{selected.phone}</span>
                    </div>
                  )}
                </div>
                <hr />
                <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{selected.message}</div>
              </div>

              <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Your Message'}`}
                className="btn btn-gold w-100">
                <i className="bi bi-reply me-2" />Reply via Email
              </a>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
