import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

/* ── tiny hook: close dropdown when clicking outside ── */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

/* ── reusable dropdown ── */
function NavDropdown({ label, icon, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false));

  return (
    <li className="nav-item position-relative" ref={ref}>
      <button
        className="nav-link btn btn-link border-0 bg-transparent d-flex align-items-center gap-1 px-2"
        style={{ color: 'rgba(255,255,255,.85)', fontWeight: 500 }}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {icon && <i className={`bi ${icon} me-1`} />}
        {label}
        <motion.i
          className="bi bi-chevron-down ms-1"
          style={{ fontSize: '0.7rem' }}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="list-unstyled mb-0 py-1"
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              minWidth: 220,
              background: 'var(--dark-navy)',
              border: '1px solid rgba(201,168,76,.25)',
              borderRadius: 10,
              boxShadow: '0 12px 40px rgba(0,0,0,.45)',
              zIndex: 9999,
            }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ── dropdown item ── */
function DropItem({ to, icon, children, onClick }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className="d-flex align-items-center gap-2 px-4 py-2 text-decoration-none"
        style={{ color: 'rgba(255,255,255,.8)', fontSize: '0.9rem', transition: 'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,.12)'; e.currentTarget.style.color = 'var(--gold)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.8)'; }}
      >
        {icon && <i className={`bi ${icon}`} />}
        {children}
      </Link>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [userMenu, setUserMenu]     = useState(false);
  const userMenuRef = useRef(null);
  useOutsideClick(userMenuRef, () => setUserMenu(false));

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const close = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
    setUserMenu(false);
  };

  return (
    <motion.nav
      className="sticky-top navbar-ministry"
      style={{
        padding: scrolled ? '0' : '0',
        boxShadow: scrolled ? '0 4px 28px rgba(0,0,0,.45)' : 'none',
        transition: 'box-shadow 0.3s ease',
        zIndex: 1050,
        position: 'sticky',
        top: 0,
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* ── Top strip ── */}
      <div style={{ background: 'rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.2)', padding: '4px 0' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <small style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.72rem' }}>
            <i className="bi bi-geo-alt me-1" />Soul Winning · Empowerment · Mentorship · Revival
          </small>
          <div className="d-flex gap-3">
            {[
              { icon: 'bi-youtube',   href: '#', color: '#ff0000' },
              { icon: 'bi-facebook',  href: '#', color: '#1877f2' },
              { icon: 'bi-twitter-x', href: '#', color: '#fff' },
              { icon: 'bi-instagram', href: '#', color: '#e4405f' },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.75rem', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = s.color}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}>
                <i className={`bi ${s.icon}`} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <div style={{
        background: 'rgba(13,27,42,.97)',
        backdropFilter: 'blur(12px)',
        padding: scrolled ? '0.35rem 0' : '0.6rem 0',
        transition: 'padding 0.3s ease',
      }}>
        <div className="container d-flex align-items-center justify-content-between gap-3">

          {/* ── BRAND / LOGO ── */}
          <Link to="/" className="text-decoration-none flex-shrink-0 d-flex align-items-center gap-3" onClick={close}>
            {/* Logo image — place your logo at frontend/public/logo.png */}
            <motion.div
              style={{
                width: scrolled ? 42 : 52,
                height: scrolled ? 42 : 52,
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img
                src="/logo.png"
                alt="CGMOI Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                onError={e => {
                  // Fallback if logo.png not yet uploaded
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback icon shown if logo.png missing */}
              <div style={{
                display: 'none', width: '100%', height: '100%', borderRadius: '50%',
                background: 'linear-gradient(135deg, #2937b2, #1e3a8a)',
                border: '2px solid var(--gold)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-brightness-high-fill text-gold" style={{ fontSize: '1.5rem' }} />
              </div>
            </motion.div>

            {/* Ministry name */}
            <div className="d-none d-sm-block">
              <div style={{
                fontFamily: 'Cinzel, serif',
                color: 'var(--gold)',
                fontWeight: 700,
                fontSize: scrolled ? '0.8rem' : '0.92rem',
                lineHeight: 1.2,
                letterSpacing: '0.5px',
                transition: 'font-size 0.3s',
              }}>
                COMMANDERS GOSPEL
              </div>
              <div style={{
                fontFamily: 'Cinzel, serif',
                color: 'var(--gold)',
                fontWeight: 700,
                fontSize: scrolled ? '0.8rem' : '0.92rem',
                lineHeight: 1.2,
                letterSpacing: '0.5px',
                transition: 'font-size 0.3s',
              }}>
                MISSION OUTREACH INT'L
              </div>
            </div>

            {/* Mobile — short name */}
            <div className="d-block d-sm-none">
              <span style={{
                fontFamily: 'Cinzel, serif',
                color: 'var(--gold)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
              }}>CGMOI</span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <ul className="navbar-nav flex-row align-items-center gap-1 mb-0 d-none d-xl-flex">
            <li className="nav-item">
              <NavLink className="nav-link px-2" to="/" end style={({ isActive }) => isActive ? { color: 'var(--gold)' } : {}}>
                Home
              </NavLink>
            </li>

            <NavDropdown label="About">
              <DropItem to="/about/ministry"   icon="bi-building"     onClick={close}>About the Ministry</DropItem>
              <DropItem to="/about/evangelist" icon="bi-person-fill"  onClick={close}>About the Evangelist</DropItem>
            </NavDropdown>

            <NavDropdown label="Contact">
              <DropItem to="/contact/ministry"   icon="bi-envelope"          onClick={close}>Contact Ministry</DropItem>
              <DropItem to="/contact/evangelist" icon="bi-person-lines-fill" onClick={close}>Contact Evangelist</DropItem>
            </NavDropdown>

            <li className="nav-item">
              <NavLink className="nav-link px-2" to="/media" style={({ isActive }) => isActive ? { color: 'var(--gold)' } : {}}>
                Messages
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-2" to="/events" style={({ isActive }) => isActive ? { color: 'var(--gold)' } : {}}>
                Events
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-2" to="/gallery" style={({ isActive }) => isActive ? { color: 'var(--gold)' } : {}}>
                Gallery
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-2" to="/projects" style={({ isActive }) => isActive ? { color: 'var(--gold)' } : {}}>
                Projects
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-2" to="/courses" style={({ isActive }) => isActive ? { color: 'var(--gold)' } : {}}>
                Courses
              </NavLink>
            </li>
          </ul>

          {/* ── Right: auth + hamburger ── */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {/* Auth buttons */}
            {user ? (
              <div className="position-relative" ref={userMenuRef}>
                <motion.button
                  className="btn btn-outline-gold btn-sm d-flex align-items-center gap-2"
                  onClick={() => setUserMenu(v => !v)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  {user.profile_pic ? (
                    <img src={`/uploads/${user.profile_pic}`} alt="Profile"
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle"
                      style={{ width: 24, height: 24, background: 'rgba(201,168,76,0.3)', fontSize: '0.65rem', color: 'var(--gold)' }}>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                  )}
                  <span className="d-none d-sm-inline">{user.first_name}</span>
                  <motion.i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}
                    animate={{ rotate: userMenu ? 180 : 0 }} transition={{ duration: 0.2 }} />
                </motion.button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      style={{
                        position: 'absolute', top: '110%', right: 0, minWidth: 200,
                        background: 'var(--dark-navy)', border: '1px solid rgba(201,168,76,.25)',
                        borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,.45)', zIndex: 9999, overflow: 'hidden',
                      }}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}>

                      {/* User info header */}
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                        <p className="fw-bold text-white mb-0 small">{user.first_name} {user.last_name}</p>
                        <p className="text-gold mb-0" style={{ fontSize: '0.75rem' }}>
                          {isAdmin ? '⚙️ Administrator' : '✝️ Member'}
                        </p>
                      </div>

                      <div className="py-1">
                        <DropItem to="/dashboard" icon="bi-speedometer2" onClick={() => { close(); setUserMenu(false); }}>
                          My Dashboard
                        </DropItem>
                        {isAdmin && (
                          <DropItem to="/admin" icon="bi-gear" onClick={() => { close(); setUserMenu(false); }}>
                            Admin Panel
                          </DropItem>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)' }} className="py-1">
                        <button
                          className="w-100 border-0 bg-transparent d-flex align-items-center gap-2 px-4 py-2 text-danger"
                          style={{ fontSize: '0.9rem', cursor: 'pointer', transition: 'background .15s' }}
                          onClick={handleLogout}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,53,69,.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <i className="bi bi-box-arrow-right" />Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-gold btn-sm">Login</Link>
                <Link to="/register" className="btn btn-gold btn-sm d-none d-sm-inline-flex">Register</Link>
              </div>
            )}

            {/* Hamburger — mobile / tablet */}
            <motion.button
              className="btn border-0 d-xl-none"
              style={{ background: 'rgba(255,255,255,.06)', color: '#fff', padding: '6px 10px' }}
              onClick={() => setMobileOpen(v => !v)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <motion.i
                className={`bi ${mobileOpen ? 'bi-x' : 'bi-list'} fs-5`}
                animate={{ rotate: mobileOpen ? 90 : 0 }}
                transition={{ duration: 0.22 }} />
            </motion.button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              style={{ borderTop: '1px solid rgba(201,168,76,.15)', background: 'rgba(13,27,42,.98)' }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <div className="container py-3">
                <MobileNav close={close} />
                {!user && (
                  <div className="mt-3 pt-3 d-flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
                    <Link to="/login" className="btn btn-outline-gold btn-sm flex-grow-1" onClick={close}>Login</Link>
                    <Link to="/register" className="btn btn-gold btn-sm flex-grow-1" onClick={close}>Register</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

/* ── Mobile accordion nav ── */
function MobileNav({ close }) {
  const [openSection, setOpenSection] = useState(null);
  const toggle = (k) => setOpenSection(v => v === k ? null : k);

  const navLinkStyle = {
    color: 'rgba(255,255,255,.8)',
    fontSize: '0.95rem',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,.05)',
    textDecoration: 'none',
    display: 'block',
  };

  return (
    <div>
      <NavLink to="/" end style={navLinkStyle} onClick={close}>🏠 Home</NavLink>

      {/* About accordion */}
      <div>
        <button className="w-100 border-0 bg-transparent text-start d-flex justify-content-between align-items-center py-2"
          style={{ color: 'rgba(255,255,255,.8)', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer' }}
          onClick={() => toggle('about')}>
          ⛪ About
          <motion.i className="bi bi-chevron-down text-gold"
            animate={{ rotate: openSection === 'about' ? 180 : 0 }} transition={{ duration: 0.2 }} />
        </button>
        <AnimatePresence>
          {openSection === 'about' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', paddingLeft: 16 }}>
              <Link to="/about/ministry"   style={{ ...navLinkStyle, fontSize: '0.88rem' }} onClick={close}><i className="bi bi-building me-2 text-gold" />About the Ministry</Link>
              <Link to="/about/evangelist" style={{ ...navLinkStyle, fontSize: '0.88rem' }} onClick={close}><i className="bi bi-person-fill me-2 text-gold" />About the Evangelist</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contact accordion */}
      <div>
        <button className="w-100 border-0 bg-transparent text-start d-flex justify-content-between align-items-center py-2"
          style={{ color: 'rgba(255,255,255,.8)', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer' }}
          onClick={() => toggle('contact')}>
          📞 Contact
          <motion.i className="bi bi-chevron-down text-gold"
            animate={{ rotate: openSection === 'contact' ? 180 : 0 }} transition={{ duration: 0.2 }} />
        </button>
        <AnimatePresence>
          {openSection === 'contact' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', paddingLeft: 16 }}>
              <Link to="/contact/ministry"   style={{ ...navLinkStyle, fontSize: '0.88rem' }} onClick={close}><i className="bi bi-envelope me-2 text-gold" />Contact Ministry</Link>
              <Link to="/contact/evangelist" style={{ ...navLinkStyle, fontSize: '0.88rem' }} onClick={close}><i className="bi bi-person-lines-fill me-2 text-gold" />Contact Evangelist</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NavLink to="/media"    style={navLinkStyle} onClick={close}>🎬 Messages</NavLink>
      <NavLink to="/events"   style={navLinkStyle} onClick={close}>📅 Events</NavLink>
      <NavLink to="/gallery"  style={navLinkStyle} onClick={close}>🖼️ Gallery</NavLink>
      <NavLink to="/projects" style={navLinkStyle} onClick={close}>🏗️ Projects</NavLink>
      <NavLink to="/courses"  style={navLinkStyle} onClick={close}>📚 Courses</NavLink>
    </div>
  );
}
