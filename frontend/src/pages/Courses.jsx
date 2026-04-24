import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { key: '', label: 'All Courses', icon: 'bi-grid' },
  { key: 'convert', label: 'Convert Class', icon: 'bi-star', badge: 'Free', badgeClass: 'bg-success' },
  { key: 'missionary', label: 'Missionary Training', icon: 'bi-globe2', badge: 'Paid', badgeClass: 'bg-primary' },
  { key: 'discipleship', label: 'Sons & Daughters', icon: 'bi-people', badge: 'Enrollment', badgeClass: 'bg-purple' },
];

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    api.get('/api/courses', { params }).then(r => setCourses(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (user) {
      api.get('/api/courses/my-enrollments').then(r => setEnrollments(r.data.map(e => e.course_id))).catch(() => {});
    }
  }, [user]);

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">Training Programs</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Grow from a new convert to a mature, equipped follower of Christ
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {/* Category filter */}
          <div className="d-flex flex-wrap gap-2 mb-5">
            {CATEGORIES.map(c => (
              <button key={c.key} className={`btn ${category === c.key ? 'btn-gold' : 'btn-outline-secondary'}`}
                onClick={() => setSearchParams(c.key ? { category: c.key } : {})}>
                <i className={`bi ${c.icon} me-1`} />{c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
          ) : courses.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-mortarboard fs-1 mb-3 d-block" />
              <p>No courses found. Check back soon!</p>
            </div>
          ) : (
            <div className="row g-4">
              {courses.map(c => {
                const isEnrolled = enrollments.includes(c.id);
                const cat = CATEGORIES.find(x => x.key === c.category);
                return (
                  <div key={c.id} className="col-md-6 col-lg-4">
                    <div className="ministry-card h-100">
                      {c.thumbnail ? (
                        <img src={`/uploads/${c.thumbnail}`} className="media-thumb" alt={c.title} />
                      ) : (
                        <div className="media-thumb d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
                          <i className={`bi ${cat?.icon || 'bi-mortarboard'} text-gold`} style={{ fontSize: '3.5rem' }} />
                        </div>
                      )}
                      <div className="p-4 d-flex flex-column" style={{ flex: 1 }}>
                        <div className="d-flex gap-2 mb-2 flex-wrap">
                          {cat && <span className={`badge ${cat.badgeClass}`}>{cat.badge || cat.label}</span>}
                          {isEnrolled && <span className="badge bg-success"><i className="bi bi-check me-1" />Enrolled</span>}
                        </div>
                        <h5 className="fw-bold mb-2">{c.title}</h5>
                        <p className="text-muted small mb-3 flex-grow-1">{c.description?.slice(0,100)}{c.description?.length > 100 ? '...' : ''}</p>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">
                            <i className="bi bi-collection-play me-1" />{c.lesson_count} lessons
                          </small>
                          <small className="fw-bold text-gold">
                            {c.is_free ? 'FREE' : `$${c.price}`}
                          </small>
                        </div>
                        <Link to={`/courses/${c.id}`} className="btn btn-gold w-100">
                          {isEnrolled ? <><i className="bi bi-play-circle me-1" />Continue</> : <><i className="bi bi-eye me-1" />View Course</>}
                        </Link>
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
