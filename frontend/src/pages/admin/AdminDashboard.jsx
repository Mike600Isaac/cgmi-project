import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import dayjs from 'dayjs';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/dashboard').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Dashboard"><div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div></AdminLayout>;

  const CARDS = [
    { label: 'Total Users', value: stats?.stats.total_users, icon: 'bi-people', color: '#0d6efd', link: '/admin/users' },
    { label: 'Total Courses', value: stats?.stats.total_courses, icon: 'bi-mortarboard', color: 'var(--gold)', link: '/admin/courses' },
    { label: 'Enrollments', value: stats?.stats.total_enrollments, icon: 'bi-person-check', color: '#198754', link: '/admin/courses' },
    { label: 'Media Files', value: stats?.stats.total_media, icon: 'bi-collection-play', color: '#6f42c1', link: '/admin/media' },
    { label: 'Total Donated', value: `$${stats?.stats.total_donations_raised?.toFixed(2)}`, icon: 'bi-heart-fill', color: '#dc3545' },
    { label: 'Unread Messages', value: stats?.stats.unread_messages, icon: 'bi-envelope', color: '#fd7e14', link: '/admin/messages' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="row g-3 mb-4">
        {CARDS.map((c, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-2">
            <div className="ministry-card p-3 text-center h-100">
              <i className={`bi ${c.icon}`} style={{ fontSize: '2rem', color: c.color }} />
              <h4 className="fw-bold my-1">{c.value}</h4>
              <p className="text-muted small mb-0">{c.label}</p>
              {c.link && <Link to={c.link} className="stretched-link" />}
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="ministry-card p-4">
            <h5 className="fw-bold mb-3">Recent Users</h5>
            {stats?.recent_users?.length === 0 ? <p className="text-muted">No users yet.</p> : (
              <div className="list-group list-group-flush">
                {stats?.recent_users?.map(u => (
                  <div key={u.id} className="list-group-item d-flex align-items-center gap-3 px-0">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '38px', height: '38px', background: 'rgba(201,168,76,.15)', color: 'var(--gold)', flexShrink: 0 }}>
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <p className="fw-bold mb-0">{u.first_name} {u.last_name}</p>
                      <small className="text-muted">{u.email} · {dayjs(u.created_at).fromNow?.() || dayjs(u.created_at).format('DD MMM')}</small>
                    </div>
                    <span className={`badge ms-auto ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="ministry-card p-4">
            <h5 className="fw-bold mb-3">Recent Enrollments</h5>
            {stats?.recent_enrollments?.length === 0 ? <p className="text-muted">No enrollments yet.</p> : (
              <div className="list-group list-group-flush">
                {stats?.recent_enrollments?.map(e => (
                  <div key={e.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <p className="fw-bold mb-0">{e.course?.title}</p>
                      <small className="text-muted">User #{e.user_id} · {dayjs(e.enrolled_at).format('DD MMM YYYY')}</small>
                    </div>
                    <div className="course-progress" style={{ width: '80px' }}>
                      <div className="progress"><div className="progress-bar" style={{ width: `${e.progress}%` }} /></div>
                      <small className="text-muted">{e.progress}%</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="row g-3 mt-2">
        {[
          { to: '/admin/courses', icon: 'bi-plus-circle', label: 'Add Course' },
          { to: '/admin/media', icon: 'bi-upload', label: 'Upload Media' },
          { to: '/admin/users', icon: 'bi-people', label: 'Manage Users' },
          { to: '/admin/content', icon: 'bi-pencil', label: 'Edit Site Content' },
        ].map((a, i) => (
          <div key={i} className="col-6 col-md-3">
            <Link to={a.to} className="ministry-card p-3 text-center d-block text-decoration-none" style={{ color: 'inherit' }}>
              <i className={`bi ${a.icon} text-gold fs-3 mb-1 d-block`} />
              <span className="fw-semibold small">{a.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
