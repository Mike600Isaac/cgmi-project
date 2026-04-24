import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourse = () => {
    api.get(`/api/courses/${id}`).then(r => setCourse(r.data)).catch(() => navigate('/courses')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setEnrolling(true);
    try {
      await api.post(`/api/courses/${id}/enroll`);
      toast.success('Enrolled successfully! Start learning now.');
      fetchCourse();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>;
  if (!course) return null;

  const ICONS = { video: 'bi-play-circle', audio: 'bi-music-note-beamed', pdf: 'bi-file-earmark-pdf', word: 'bi-file-earmark-word', txt: 'bi-file-text', image: 'bi-image', text: 'bi-file-text' };

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <span className={`badge ${course.is_free ? 'bg-success' : 'bg-primary'}`}>{course.is_free ? 'FREE' : `$${course.price}`}</span>
                <span className="badge bg-secondary text-capitalize">{course.category}</span>
                {course.enrolled && <span className="badge bg-success"><i className="bi bi-check me-1" />Enrolled</span>}
              </div>
              <h1 className="display-5 fw-bold mb-3">{course.title}</h1>
              <p className="lead mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>{course.description}</p>
              <div className="d-flex gap-4 flex-wrap small mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span><i className="bi bi-collection-play me-1" />{course.lesson_count} Lessons</span>
                <span><i className="bi bi-people me-1" />{course.enrollment_count} Students</span>
                <span><i className="bi bi-person-workspace me-1" />Self-paced</span>
                <span><i className="bi bi-award me-1" />Certificate on completion</span>
              </div>
              {!course.enrolled ? (
                <button className="btn btn-gold btn-lg px-5" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-mortarboard me-2" />}
                  {course.is_free ? 'Enroll Free' : `Enroll — $${course.price}`}
                </button>
              ) : (
                <Link to={`/courses/${id}/lessons/${course.lessons?.[0]?.id}`} className="btn btn-gold btn-lg px-5">
                  <i className="bi bi-play-circle-fill me-2" />
                  {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                </Link>
              )}
            </div>
            {course.thumbnail && (
              <div className="col-lg-5">
                <img src={`/uploads/${course.thumbnail}`} className="img-fluid rounded-4 shadow" alt={course.title} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-8">
              {/* Progress (if enrolled) */}
              {course.enrolled && (
                <div className="ministry-card p-4 mb-4 course-progress">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">Your Progress</h6>
                    <span className="text-gold fw-bold">{course.progress}%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${course.progress}%` }} />
                  </div>
                  {course.progress === 100 && (
                    <p className="text-success mt-2 mb-0 fw-semibold">
                      <i className="bi bi-patch-check-fill me-1" />Course Complete! Check your certificates.
                    </p>
                  )}
                </div>
              )}

              {/* Lesson list */}
              <h3 className="fw-bold mb-3">Course Curriculum</h3>
              <div className="list-group">
                {course.lessons?.map((l, i) => {
                  const canAccess = course.enrolled || course.is_free || l.is_preview;
                  return (
                    <div key={l.id} className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${!canAccess ? 'text-muted' : ''}`}>
                      <span className="badge bg-secondary rounded-circle" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i+1}</span>
                      <i className={`bi ${ICONS[l.content_type] || 'bi-file'} text-gold flex-shrink-0`} />
                      <div className="flex-grow-1">
                        <p className="mb-0 fw-semibold">{l.title}</p>
                        {l.description && <small className="text-muted">{l.description}</small>}
                      </div>
                      {l.is_preview && !course.enrolled && <span className="badge bg-info">Preview</span>}
                      {!canAccess && <i className="bi bi-lock text-muted" />}
                      {canAccess && (
                        <Link to={`/courses/${id}/lessons/${l.id}`} className="btn btn-outline-gold btn-sm">
                          {course.enrolled ? 'Open' : 'Preview'}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="ministry-card p-4 mb-4 sticky-top" style={{ top: '80px' }}>
                <h5 className="fw-bold mb-3">Course Includes</h5>
                <ul className="list-unstyled">
                  <li className="mb-2"><i className="bi bi-collection-play text-gold me-2" />{course.lesson_count} Lessons</li>
                  <li className="mb-2"><i className="bi bi-clock text-gold me-2" />Self-paced learning</li>
                  <li className="mb-2"><i className="bi bi-phone text-gold me-2" />Access on any device</li>
                  <li className="mb-2"><i className="bi bi-award text-gold me-2" />Certificate of completion</li>
                  <li className="mb-2"><i className="bi bi-infinity text-gold me-2" />Lifetime access</li>
                </ul>
                {!course.enrolled && (
                  <button className="btn btn-gold w-100 mt-2" onClick={handleEnroll} disabled={enrolling}>
                    {course.is_free ? 'Enroll Free' : `Enroll — $${course.price}`}
                  </button>
                )}
                {course.is_free && !user && (
                  <p className="text-center small mt-2 mb-0 text-muted">
                    <Link to="/register" className="text-gold">Register</Link> to enroll for free
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
