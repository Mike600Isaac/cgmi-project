import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', exact: true },
  { to: '/admin/courses', label: 'Courses', icon: 'bi-mortarboard' },
  { to: '/admin/media', label: 'Media', icon: 'bi-collection-play' },
  { to: '/admin/users', label: 'Users', icon: 'bi-people' },
  { to: '/admin/projects', label: 'Projects', icon: 'bi-building' },
  { to: '/admin/messages', label: 'Messages', icon: 'bi-envelope' },
  { to: '/admin/content', label: 'Site Content', icon: 'bi-pencil-square' },
  { to: '/admin/events', label: 'Events',          icon: 'bi-calendar-event' },
  { to: '/admin/sons',   label: 'Sons & Daughters', icon: 'bi-patch-check-fill', gold: true },
];

export default function AdminLayout({ children, title }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top bar */}
      <header className="navbar navbar-ministry px-3" style={{ height: '56px' }}>
        <Link to="/admin" className="navbar-brand-text d-flex align-items-center gap-2">
          <i className="bi bi-brightness-high-fill text-gold" />
          <span className="navbar-brand-text">Admin Panel</span>
        </Link>
        <div className="ms-auto d-flex gap-2">
          <Link to="/" className="btn btn-outline-gold btn-sm">
            <i className="bi bi-globe2 me-1" />View Site
          </Link>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate('/login'); }}>
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <aside className="sidebar d-none d-md-flex flex-column py-3" style={{ width: '220px', flexShrink: 0 }}>
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.exact}
              className="nav-link d-flex align-items-center gap-2"
              style={({ isActive }) => l.gold && !isActive ? { color: 'var(--gold)' } : {}}>
              <i className={`bi ${l.icon}`} style={l.gold ? { color: 'var(--gold)' } : {}} />
              {l.label}
            </NavLink>
          ))}
          <Link to="/dashboard" className="nav-link d-flex align-items-center gap-2 mt-auto">
            <i className="bi bi-person-circle" />My Dashboard
          </Link>
        </aside>

        {/* Main */}
        <main className="flex-grow-1 p-4" style={{ background: 'var(--section-bg)', minHeight: 'calc(100vh - 56px)' }}>
          {title && <h3 className="fw-bold mb-4">{title}</h3>}
          {children}
        </main>
      </div>
    </div>
  );
}
