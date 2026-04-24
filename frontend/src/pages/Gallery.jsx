import { useEffect, useState } from 'react';
import api from '../api/axios';
import ReactPlayer from 'react-player';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const fetch = async (type, pg) => {
    setLoading(true);
    try {
      const params = { section: 'gallery', page: pg, per_page: 16 };
      if (type) params.type = type;
      const { data } = await api.get('/api/media', { params });
      setItems(data.items || []);
      setTotalPages(data.pages || 1);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(typeFilter, page); }, [typeFilter, page]);

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">Outreach Gallery</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Photos, videos and media from our outreaches and crusades</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {/* Filters */}
          <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
            <span className="fw-semibold me-2">Filter:</span>
            {['', 'video', 'audio', 'image', 'document'].map(t => (
              <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-gold' : 'btn-outline-secondary'}`} onClick={() => { setTypeFilter(t); setPage(1); }}>
                {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-images fs-1 mb-3 d-block" />
              <p>No gallery items yet. Check back soon!</p>
            </div>
          ) : (
            <div className="row g-3">
              {items.map(m => (
                <div key={m.id} className="col-6 col-md-3">
                  <div className="ministry-card overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => setSelected(m)}>
                    <div className="position-relative">
                      {m.thumbnail || m.media_type === 'image' ? (
                        <img src={`/uploads/${m.thumbnail || m.file_url}`} className="media-thumb" alt={m.title} />
                      ) : (
                        <div className="media-thumb d-flex align-items-center justify-content-center" style={{ background: 'var(--section-bg)' }}>
                          <i className={`bi bi-${m.media_type === 'video' ? 'play-circle' : m.media_type === 'audio' ? 'music-note-beamed' : 'file-earmark-pdf'} text-gold`} style={{ fontSize: '2.5rem' }} />
                        </div>
                      )}
                      <div className="position-absolute bottom-0 start-0 end-0 p-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                        <p className="text-white small mb-0 fw-semibold text-truncate">{m.title}</p>
                      </div>
                      {m.allow_download && (
                        <a href={`/api/media/${m.id}/download`} className="btn btn-sm btn-gold position-absolute top-0 end-0 m-1"
                          onClick={e => e.stopPropagation()} title="Download">
                          <i className="bi bi-download" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <span className="btn btn-sm disabled">Page {page} of {totalPages}</span>
              <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox modal */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1060 }} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{selected.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body p-1">
                {selected.media_type === 'video' && (
                  <ReactPlayer url={`/uploads/${selected.file_url}`} controls width="100%" style={{ maxHeight: '70vh' }} />
                )}
                {selected.media_type === 'audio' && (
                  <div className="p-4 text-center">
                    <i className="bi bi-music-note-beamed text-gold" style={{ fontSize: '4rem' }} />
                    <audio controls className="w-100 mt-3"><source src={`/uploads/${selected.file_url}`} /></audio>
                  </div>
                )}
                {selected.media_type === 'image' && (
                  <img src={`/uploads/${selected.file_url}`} className="w-100" style={{ maxHeight: '80vh', objectFit: 'contain' }} alt={selected.title} />
                )}
                {selected.media_type === 'document' && (
                  <div className="p-4 text-center">
                    <i className="bi bi-file-earmark-pdf text-gold" style={{ fontSize: '4rem' }} />
                    <p className="mt-2">{selected.description}</p>
                    <a href={`/api/media/${selected.id}/download`} className="btn btn-gold mt-2">
                      <i className="bi bi-download me-2" />Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
