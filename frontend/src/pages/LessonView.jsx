import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ReactPlayer from 'react-player';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/courses/${courseId}/lessons/${lessonId}`),
      api.get(`/api/courses/${courseId}`),
    ]).then(([lRes, cRes]) => {
      setLesson(lRes.data);
      setCourse(cRes.data);
    }).catch(() => navigate(`/courses/${courseId}`))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  const markComplete = async () => {
    setCompleting(true);
    try {
      const { data } = await api.post(`/api/courses/${courseId}/lessons/${lessonId}/complete`);
      toast.success(data.message);
      setLesson(prev => ({ ...prev, completed: true }));
      if (data.certificate) {
        toast.success(`Certificate issued! Cert #${data.certificate.certificate_number}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark complete');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" style={{ color: 'var(--gold)' }} />
      </div>
    </>
  );

  const lessons = course?.lessons || [];
  const currentIndex = lessons.findIndex(l => l.id === parseInt(lessonId));
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <>
      <Navbar />
      <div className="d-flex" style={{ minHeight: 'calc(100vh - 62px)' }}>

        {/* Sidebar — lesson list */}
        <aside className="sidebar d-none d-lg-block" style={{ width: '280px' }}>
          <div className="p-3 border-bottom border-secondary">
            <Link to={`/courses/${courseId}`} className="text-gold small text-decoration-none">
              <i className="bi bi-arrow-left me-1" />Back to Course
            </Link>
            <h6 className="text-white mt-2 mb-1 fw-bold">{course?.title}</h6>
            <div className="course-progress mt-2">
              <div className="progress" style={{ height: '6px' }}>
                <div className="progress-bar" style={{ width: `${course?.progress || 0}%` }} />
              </div>
              <small style={{ color: 'rgba(255,255,255,0.5)' }}>{course?.progress || 0}% complete</small>
            </div>
          </div>
          <nav className="p-2">
            {lessons.map((l, i) => (
              <Link
                key={l.id}
                to={`/courses/${courseId}/lessons/${l.id}`}
                className={`nav-link d-flex align-items-center gap-2 py-2 ${l.id === parseInt(lessonId) ? 'active' : ''}`}
              >
                <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: '18px' }}>{i+1}.</span>
                <span className="text-truncate small flex-grow-1">{l.title}</span>
                {l.completed && <i className="bi bi-check-circle-fill text-success flex-shrink-0" style={{ fontSize: '0.8rem' }} />}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-grow-1 p-3 p-md-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="lesson-body">
            <div className="mb-3">
              <span className="badge bg-secondary text-capitalize me-2">{lesson?.content_type}</span>
              {lesson?.completed && <span className="badge bg-success"><i className="bi bi-check me-1" />Completed</span>}
            </div>
            <h2 className="fw-bold mb-3">{lesson?.title}</h2>
            {lesson?.description && <p className="text-muted mb-4">{lesson.description}</p>}

            {/* Content renderer */}
            <div className="mb-4">
              {lesson?.content_type === 'video' && (
                <div className="ratio ratio-16x9 rounded-3 overflow-hidden mb-3">
                  <ReactPlayer url={`/uploads/${lesson.content_url}`} controls width="100%" height="100%" style={{ position: 'absolute', top: 0 }} />
                </div>
              )}
              {lesson?.content_type === 'audio' && (
                <div className="ministry-card p-4 text-center mb-3">
                  <i className="bi bi-music-note-beamed text-gold" style={{ fontSize: '4rem' }} />
                  <audio controls className="w-100 mt-3">
                    <source src={`/uploads/${lesson.content_url}`} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {lesson?.content_type === 'image' && (
                <img src={`/uploads/${lesson.content_url}`} className="img-fluid rounded-3 mb-3" alt={lesson.title} />
              )}
              {(lesson?.content_type === 'pdf') && (
                <div className="ministry-card p-4 text-center mb-3">
                  <i className="bi bi-file-earmark-pdf text-gold" style={{ fontSize: '4rem' }} />
                  <p className="mt-2">PDF Document</p>
                  <a href={`/uploads/${lesson.content_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-gold me-2">
                    <i className="bi bi-eye me-1" />View PDF
                  </a>
                  <a href={`/uploads/${lesson.content_url}`} download className="btn btn-outline-gold">
                    <i className="bi bi-download me-1" />Download
                  </a>
                </div>
              )}
              {(lesson?.content_type === 'word' || lesson?.content_type === 'document') && (
                <div className="ministry-card p-4 text-center mb-3">
                  <i className="bi bi-file-earmark-word text-gold" style={{ fontSize: '4rem' }} />
                  <p className="mt-2">Word Document</p>
                  <a href={`/uploads/${lesson.content_url}`} download className="btn btn-gold">
                    <i className="bi bi-download me-1" />Download Document
                  </a>
                </div>
              )}
              {(lesson?.content_type === 'text' || lesson?.content_type === 'txt') && (
                <div className="ministry-card p-4 mb-3" style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                  {lesson.content_text || (
                    <a href={`/uploads/${lesson.content_url}`} download className="btn btn-gold">
                      <i className="bi bi-download me-1" />Download File
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Navigation + complete button */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top">
              <div>
                {prevLesson ? (
                  <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`} className="btn btn-outline-secondary">
                    <i className="bi bi-arrow-left me-1" />Previous
                  </Link>
                ) : (
                  <Link to={`/courses/${courseId}`} className="btn btn-outline-secondary">
                    <i className="bi bi-arrow-left me-1" />Course Overview
                  </Link>
                )}
              </div>
              <div className="d-flex gap-2">
                {!lesson?.completed && (
                  <button className="btn btn-gold" onClick={markComplete} disabled={completing}>
                    {completing ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check-circle me-1" />}
                    Mark as Complete
                  </button>
                )}
                {nextLesson ? (
                  <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`} className="btn btn-gold">
                    Next <i className="bi bi-arrow-right ms-1" />
                  </Link>
                ) : (
                  <Link to={`/courses/${courseId}`} className="btn btn-outline-gold">
                    <i className="bi bi-trophy me-1" />Finish Course
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
