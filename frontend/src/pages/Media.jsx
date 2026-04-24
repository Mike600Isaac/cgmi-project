import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ReactPlayer from 'react-player';

const TYPE_TABS = [
  { key: '', label: 'All', icon: 'bi-grid' },
  { key: 'video', label: 'Videos', icon: 'bi-play-circle' },
  { key: 'audio', label: 'Audio', icon: 'bi-music-note-beamed' },
  { key: 'image', label: 'Photos', icon: 'bi-image' },
  { key: 'document', label: 'Books / PDFs', icon: 'bi-file-earmark-text' },
];

export default function Media() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchMedia = async (type, pg) => {
    setLoading(true);
    try {
      const params = { section: 'messages', page: pg, per_page: 12 };
      if (type) params.type = type;
      const { data } = await api.get('/api/media', { params });
      setItems(data.items || []);
      setTotalPages(data.pages || 1);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setPage(1);
    fetchMedia(activeType, 1);
  }, [activeType]);

  useEffect(() => {
    fetchMedia(activeType, page);
  }, [page]);

  const setType = (t) => {
    setSearchParams(t ? { type: t } : {});
    setPage(1);
  };

  const MediaIcon = ({ type }) => {
    const icons = { video: 'bi-play-circle-fill', audio: 'bi-music-note-beamed', image: 'bi-image', document: 'bi-file-earmark-pdf' };
    return <i className={`bi ${icons[type] || 'bi-file'} text-gold`} style={{ fontSize: '3rem' }} />;
  };

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">Media Messages</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Videos, audios, books and photo galleries</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {/* Filter tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {TYPE_TABS.map(t => (
              <button key={t.key} className={`btn btn-sm ${activeType === t.key ? 'btn-gold' : 'btn-outline-secondary'}`} onClick={() => setType(t.key)}>
                <i className={`bi ${t.icon} me-1`} />{t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-collection fs-1 mb-3 d-block" />
              <p>No media found in this category.</p>
            </div>
          ) : (
            <div className="row g-4">
              {items.map(m => (
                <div key={m.id} className="col-md-4 col-lg-3">
                  <div className="ministry-card h-100 cursor-pointer" onClick={() => setSelected(m)} style={{ cursor: 'pointer' }}>
                    <div className="position-relative">
                      {m.thumbnail ? (
                        <img src={`/uploads/${m.thumbnail}`} className="media-thumb" alt={m.title} />
                      ) : (
                        <div className="media-thumb d-flex align-items-center justify-content-center" style={{ background: 'var(--section-bg)' }}>
                          <MediaIcon type={m.media_type} />
                        </div>
                      )}
                      <span className="badge bg-dark position-absolute top-0 end-0 m-2 text-capitalize">{m.media_type}</span>
                      {m.media_type === 'video' && (
                        <div className="media-play-icon"><i className="bi bi-play-circle-fill" /></div>
                      )}
                    </div>
                    <div className="p-3">
                      <h6 className="fw-bold mb-1">{m.title}</h6>
                      {m.description && <p className="small text-muted mb-2">{m.description.slice(0,80)}{m.description.length > 80 ? '...' : ''}</p>}
                      <div className="d-flex gap-2 align-items-center">
                        <small className="text-muted"><i className="bi bi-eye me-1" />{m.view_count}</small>
                        {m.allow_download && (
                          <a href={`/api/media/${m.id}/download`} className="ms-auto btn btn-outline-secondary btn-sm" onClick={e => e.stopPropagation()}>
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

          {/* Pagination */}
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

      {/* Media modal */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{selected.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body p-0">
                {selected.media_type === 'video' && (
                  <ReactPlayer url={`/uploads/${selected.file_url}`} controls width="100%" />
                )}
                {selected.media_type === 'audio' && (
                  <div className="p-4 text-center">
                    <i className="bi bi-music-note-beamed text-gold" style={{ fontSize: '4rem' }} />
                    <audio controls className="w-100 mt-3">
                      <source src={`/uploads/${selected.file_url}`} />
                    </audio>
                  </div>
                )}
                {selected.media_type === 'image' && (
                  <img src={`/uploads/${selected.file_url}`} className="w-100" alt={selected.title} />
                )}
                {selected.media_type === 'document' && (
                  <div className="p-4 text-center">
                    <i className="bi bi-file-earmark-pdf text-gold" style={{ fontSize: '4rem' }} />
                    <p className="mt-2">{selected.description}</p>
                    <a href={`/api/media/${selected.id}/download`} className="btn btn-gold mt-2">
                      <i className="bi bi-download me-2" />Download File
                    </a>
                  </div>
                )}
              </div>
              {selected.description && (
                <div className="modal-footer">
                  <p className="text-muted small mb-0">{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
