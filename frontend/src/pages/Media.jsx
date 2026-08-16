import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ReactPlayer from 'react-player';

const TYPE_TABS = [
  { key: '',         label: 'All',         icon: 'bi-grid-3x3-gap' },
  { key: 'video',    label: 'Videos',      icon: 'bi-play-btn' },
  { key: 'audio',    label: 'Audio',       icon: 'bi-music-note-beamed' },
  { key: 'image',    label: 'Photos',      icon: 'bi-image' },
  { key: 'document', label: 'Books / PDFs', icon: 'bi-file-earmark-text' },
];

const TYPE_ICON = {
  video: 'bi-play-circle-fill',
  audio: 'bi-music-note-beamed',
  image: 'bi-image',
  document: 'bi-file-earmark-pdf',
};

export default function Media() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [index, setIndex] = useState(null);

  const fetchMedia = async (type, pg) => {
    setLoading(true);
    try {
      const params = { section: 'messages', page: pg, per_page: 12 };
      if (type) params.type = type;
      const { data } = await api.get('/api/media', { params });
      setItems(data.items || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total ?? (data.items?.length || 0));
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchMedia(activeType, 1); }, [activeType]);
  useEffect(() => { fetchMedia(activeType, page); }, [page]);

  const setType = (t) => { setSearchParams(t ? { type: t } : {}); setPage(1); };

  const selected = index !== null ? items[index] : null;
  const close = useCallback(() => setIndex(null), []);
  const prev  = useCallback(() => setIndex(i => (i === null ? i : (i - 1 + items.length) % items.length)), [items.length]);
  const next  = useCallback(() => setIndex(i => (i === null ? i : (i + 1) % items.length)), [items.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, close, prev, next]);

  const src = (m) => `/uploads/${m.file_url}`;

  return (
    <>
      {/* ── Header ── */}
      <section className="text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))', padding: '64px 0 56px' }}>
        <div className="container">
          <div className="gold-divider ms-0" />
          <h1 className="fw-bold mb-2" style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.9rem, 4vw, 2.9rem)' }}>
            Media &amp; Messages
          </h1>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,.72)', maxWidth: 620 }}>
            Watch, listen and read — sermons, teachings, worship and resources in one place.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {/* ── Filter pills ── */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div className="d-flex flex-wrap gap-2">
              {TYPE_TABS.map(t => (
                <button key={t.key}
                  className={`gallery-filter ${activeType === t.key ? 'active' : ''}`}
                  onClick={() => setType(t.key)}>
                  <i className={`bi ${t.icon}`} />{t.label}
                </button>
              ))}
            </div>
            {!loading && total > 0 && (
              <span className="text-muted small">{total} item{total !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="row g-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-6 col-md-4 col-lg-3">
                  <div className="media-grid-card">
                    <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />
                    <div className="media-body">
                      <div className="skeleton mb-2" style={{ height: 16, width: '80%' }} />
                      <div className="skeleton" style={{ height: 12, width: '55%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 my-5">
              <div className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--section-bg)' }}>
                <i className="bi bi-collection-play text-gold" style={{ fontSize: '2.4rem' }} />
              </div>
              <h5 className="fw-bold" style={{ fontFamily: 'Cinzel, serif' }}>Nothing here yet</h5>
              <p className="text-muted mb-0">Messages in this category will appear here soon.</p>
            </div>
          ) : (
            <div className="row g-4">
              {items.map((m, i) => (
                <div key={m.id} className="col-6 col-md-4 col-lg-3">
                  <div className="media-grid-card" onClick={() => setIndex(i)}>
                    <div className="media-cover">
                      {m.thumbnail ? (
                        <img src={`/uploads/${m.thumbnail}`} alt={m.title} loading="lazy" />
                      ) : m.media_type === 'image' ? (
                        <img src={src(m)} alt={m.title} loading="lazy" />
                      ) : (
                        <div className="media-cover-ph">
                          <i className={`bi ${TYPE_ICON[m.media_type] || 'bi-file-earmark'}`} />
                        </div>
                      )}
                      {m.media_type === 'video' && (
                        <div className="media-play"><i className="bi bi-play-circle-fill" /></div>
                      )}
                      <span className="media-type-chip">{m.media_type}</span>
                    </div>
                    <div className="media-body">
                      <h6 className="fw-bold mb-1" style={{ lineHeight: 1.35 }}>{m.title}</h6>
                      {m.description && (
                        <p className="small text-muted mb-3 text-truncate-2">{m.description}</p>
                      )}
                      <div className="d-flex align-items-center gap-2 mt-auto">
                        <small className="text-muted"><i className="bi bi-eye me-1" />{m.view_count || 0}</small>
                        {m.allow_download && (
                          <a href={`/api/media/${m.id}/download`} className="ms-auto btn btn-outline-gold btn-sm py-1 px-2"
                            onClick={e => e.stopPropagation()} title="Download">
                            <i className="bi bi-download" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
              <button className="btn btn-sm" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--section-bg)', border: '1px solid rgba(13,27,42,.12)' }}
                disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <span className="text-muted small">Page {page} of {totalPages}</span>
              <button className="btn btn-sm" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--section-bg)', border: '1px solid rgba(13,27,42,.12)' }}
                disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox player ── */}
      {selected && (
        <div className="lightbox-backdrop" onClick={close}>
          <button className="lightbox-close" onClick={close}><i className="bi bi-x-lg" /></button>

          {items.length > 1 && (
            <>
              <button className="lightbox-nav" style={{ left: 20 }} onClick={e => { e.stopPropagation(); prev(); }}>
                <i className="bi bi-chevron-left" />
              </button>
              <button className="lightbox-nav" style={{ right: 20 }} onClick={e => { e.stopPropagation(); next(); }}>
                <i className="bi bi-chevron-right" />
              </button>
            </>
          )}

          <div style={{ maxWidth: 960, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#0f1c2e', borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>
              <div style={{ background: '#000' }}>
                {selected.media_type === 'video' && (
                  <ReactPlayer url={src(selected)} controls width="100%" height="min(70vh, 540px)" />
                )}
                {selected.media_type === 'image' && (
                  <img src={src(selected)} alt={selected.title}
                    style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }} />
                )}
                {selected.media_type === 'audio' && (
                  <div className="text-center text-white" style={{ padding: '56px 24px' }}>
                    <i className="bi bi-music-note-beamed text-gold" style={{ fontSize: '4rem' }} />
                    <audio controls className="w-100 mt-4" style={{ maxWidth: 520 }}>
                      <source src={src(selected)} />
                    </audio>
                  </div>
                )}
                {selected.media_type === 'document' && (
                  <div className="text-center text-white" style={{ padding: '56px 24px' }}>
                    <i className="bi bi-file-earmark-pdf text-gold" style={{ fontSize: '4rem' }} />
                    <p className="mt-3 mb-0" style={{ color: 'rgba(255,255,255,.7)' }}>Download to read this resource.</p>
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between gap-3 p-3">
                <div className="text-white">
                  <h6 className="fw-bold mb-0" style={{ fontFamily: 'Cinzel, serif' }}>{selected.title}</h6>
                  {selected.description && (
                    <p className="small mb-0" style={{ color: 'rgba(255,255,255,.6)' }}>{selected.description}</p>
                  )}
                </div>
                {selected.allow_download && (
                  <a href={`/api/media/${selected.id}/download`} className="btn btn-gold btn-sm flex-shrink-0">
                    <i className="bi bi-download me-2" />Download
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
