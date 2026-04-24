import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_COLOR = { planning: 'warning', ongoing: 'primary', completed: 'success' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/projects').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">Ministry Projects</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Kingdom assignments we are carrying out</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
          ) : projects.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-building fs-1 mb-3 d-block" />
              <p>No projects listed yet. Check back soon!</p>
            </div>
          ) : (
            <div className="row g-4">
              {projects.map(p => {
                const pct = p.goal_amount ? Math.min(100, Math.round((p.raised_amount / p.goal_amount) * 100)) : 0;
                return (
                  <div key={p.id} className="col-md-6 col-lg-4">
                    <div className="ministry-card h-100">
                      {p.image_url ? (
                        <img src={`/uploads/${p.image_url}`} className="media-thumb" alt={p.title} />
                      ) : (
                        <div className="media-thumb d-flex align-items-center justify-content-center" style={{ background: 'var(--section-bg)' }}>
                          <i className="bi bi-building text-gold" style={{ fontSize: '3rem' }} />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="fw-bold mb-0">{p.title}</h5>
                          <span className={`badge bg-${STATUS_COLOR[p.status] || 'secondary'} text-capitalize ms-2`}>{p.status}</span>
                        </div>
                        {p.location && <p className="small text-muted mb-2"><i className="bi bi-geo-alt me-1" />{p.location}</p>}
                        <p className="text-muted small mb-3">{p.description?.slice(0,120)}{p.description?.length > 120 ? '...' : ''}</p>

                        {p.goal_amount > 0 && (
                          <div className="course-progress mb-2">
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="fw-semibold">Raised: ${p.raised_amount?.toLocaleString()}</span>
                              <span className="text-muted">Goal: ${p.goal_amount?.toLocaleString()}</span>
                            </div>
                            <div className="progress">
                              <div className="progress-bar" style={{ width: `${pct}%` }} />
                            </div>
                            <small className="text-muted">{pct}% funded</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
