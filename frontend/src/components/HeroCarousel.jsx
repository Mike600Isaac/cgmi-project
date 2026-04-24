import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    id: 0,
    bg: 'linear-gradient(135deg, #0d1b2a 0%, #1e3a5f 55%, #0f2340 100%)',
    accent: '#c9a84c',
    icon: 'bi-brightness-high-fill',
    badge: 'Welcome to CGMOI',
    title: 'Commanders Gospel Mission Outreach Int\'l',
    subtitle: 'Soul Winning · Empowerment · Mentorship · Revival',
    body: 'Raising Kingdom builders who will reach the nations with the undiluted power of the Gospel of Jesus Christ.',
    cta1: { label: 'Explore the Ministry', to: '/about/ministry', icon: 'bi-arrow-right-circle' },
    cta2: { label: 'Watch Messages', to: '/media', icon: 'bi-play-circle' },
    verse: '"Go ye into all the world and preach the Gospel..." — Mark 16:15',
  },
  {
    id: 1,
    bg: 'linear-gradient(135deg, #0a1a0f 0%, #14532d 55%, #052e16 100%)',
    accent: '#4ade80',
    icon: 'bi-person-heart',
    badge: 'Soul Winning',
    title: 'Reaching the Lost with the Gospel',
    subtitle: 'Every soul matters to God',
    body: 'We are committed to reaching the lost, the broken and the hopeless with the life-changing message of Jesus Christ.',
    cta1: { label: 'Our Outreaches', to: '/projects', icon: 'bi-globe2' },
    cta2: { label: 'Join the Mission', to: '/register', icon: 'bi-person-plus' },
    verse: '"For the Son of man is come to seek and to save that which was lost." — Luke 19:10',
  },
  {
    id: 2,
    bg: 'linear-gradient(135deg, #1a0a2e 0%, #4c1d95 55%, #2e1065 100%)',
    accent: '#a78bfa',
    icon: 'bi-mortarboard-fill',
    badge: 'Training & Discipleship',
    title: 'Equipping Believers for Kingdom Impact',
    subtitle: 'Convert Class · Missionary Training · Sons & Daughters',
    body: 'From new converts to mature disciples — we have a programme for every stage of your walk with God.',
    cta1: { label: 'Browse Courses', to: '/courses', icon: 'bi-mortarboard' },
    cta2: { label: 'Sons & Daughters', to: '/dashboard', icon: 'bi-patch-check-fill' },
    verse: '"And he gave some, apostles; and some, prophets; and some, evangelists..." — Ephesians 4:11',
  },
  {
    id: 3,
    bg: 'linear-gradient(135deg, #1a0505 0%, #7f1d1d 55%, #450a0a 100%)',
    accent: '#f87171',
    icon: 'bi-broadcast',
    badge: 'Live Events & Programmes',
    title: 'Join Us Live from Anywhere in the World',
    subtitle: 'Prayer Meetings · Conferences · Crusades · Special Programmes',
    body: 'Watch and participate in live events on YouTube, Facebook and via Jitsi video conferencing — no matter where you are.',
    cta1: { label: 'View Events', to: '/events', icon: 'bi-calendar-event' },
    cta2: { label: 'Live Now?', to: '/events', icon: 'bi-broadcast' },
    verse: '"For where two or three are gathered together in my name, there am I..." — Matthew 18:20',
  },
  {
    id: 4,
    bg: 'linear-gradient(135deg, #0d1b2a 0%, #1e3a5f 40%, #2a1a0a 100%)',
    accent: '#c9a84c',
    icon: 'bi-heart-fill',
    badge: 'Support the Ministry',
    title: 'Be a Partner in the Gospel',
    subtitle: 'Your giving fuels souls saved, lives transformed',
    body: 'Every seed you sow goes directly to soul-winning outreaches, training resources and reaching the nations with the Gospel.',
    cta1: { label: 'Give Today', to: '/#give', icon: 'bi-gift-fill', isDonate: true },
    cta2: { label: 'Learn More', to: '/about/ministry', icon: 'bi-info-circle' },
    verse: '"Give, and it shall be given unto you; good measure, pressed down..." — Luke 6:38',
  },
];

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 120 : -120, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -120 : 120, scale: 0.97 }),
};

export default function HeroCarousel({ onDonate }) {
  const [[current, direction], setCurrent] = useState([0, 1]);
  const [paused, setPaused] = useState(false);

  const go = useCallback((idx) => {
    const dir = idx > current ? 1 : -1;
    setCurrent([idx, dir]);
  }, [current]);

  const next = useCallback(() => {
    const nxt = (current + 1) % SLIDES.length;
    setCurrent([nxt, 1]);
  }, [current]);

  const prev = useCallback(() => {
    const prv = (current - 1 + SLIDES.length) % SLIDES.length;
    setCurrent([prv, -1]);
  }, [current]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 6000);
    return () => clearTimeout(t);
  }, [current, paused, next]);

  const slide = SLIDES[current];

  return (
    <section
      className="position-relative overflow-hidden"
      style={{ minHeight: '92vh', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Animated background ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`bg-${current}`}
          style={{
            position: 'absolute', inset: 0,
            background: slide.bg,
            zIndex: 0,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      </AnimatePresence>

      {/* Decorative floating circles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        {[
          { w: 400, h: 400, top: '-10%', left: '-8%', opacity: 0.06 },
          { w: 300, h: 300, bottom: '-5%', right: '-5%', opacity: 0.08 },
          { w: 200, h: 200, top: '30%', right: '15%', opacity: 0.05 },
        ].map((c, i) => (
          <motion.div key={i}
            style={{
              position: 'absolute', width: c.w, height: c.h,
              borderRadius: '50%', border: `2px solid ${slide.accent}`,
              opacity: c.opacity, top: c.top, left: c.left, bottom: c.bottom, right: c.right,
            }}
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── Slide content ── */}
      <div className="container position-relative text-white text-center" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {/* Badge */}
            <motion.div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4"
              style={{ background: `${slide.accent}22`, border: `1px solid ${slide.accent}55`, color: slide.accent }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}>
              <motion.i className={`bi ${slide.icon}`}
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }} />
              <span className="fw-bold small">{slide.badge}</span>
            </motion.div>

            {/* Main title */}
            <motion.h1
              className="fw-bold mb-3"
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
                textShadow: '0 2px 24px rgba(0,0,0,.6)',
                lineHeight: 1.2,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}>
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="fw-semibold mb-3"
              style={{ color: slide.accent, fontSize: 'clamp(0.85rem, 1.8vw, 1.1rem)', letterSpacing: '1px' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}>
              {slide.subtitle}
            </motion.p>

            {/* Body */}
            <motion.p
              className="lead mx-auto mb-4"
              style={{ maxWidth: 620, color: 'rgba(255,255,255,.8)', fontSize: 'clamp(0.9rem, 1.6vw, 1.1rem)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}>
              {slide.body}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              className="d-flex flex-wrap justify-content-center gap-3 mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}>
              {slide.cta1.isDonate ? (
                <motion.button
                  className="btn btn-lg px-5 fw-bold"
                  style={{ background: `linear-gradient(135deg, ${slide.accent}, #e8c97e)`, color: '#0d1b2a', border: 'none', borderRadius: 10 }}
                  onClick={onDonate}
                  whileHover={{ scale: 1.06, boxShadow: `0 8px 32px ${slide.accent}66` }}
                  whileTap={{ scale: 0.97 }}>
                  <i className={`bi ${slide.cta1.icon} me-2`} />{slide.cta1.label}
                </motion.button>
              ) : (
                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                  <Link to={slide.cta1.to}
                    className="btn btn-lg px-5 fw-bold"
                    style={{ background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`, color: '#0d1b2a', border: 'none', borderRadius: 10 }}>
                    <i className={`bi ${slide.cta1.icon} me-2`} />{slide.cta1.label}
                  </Link>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                <Link to={slide.cta2.to}
                  className="btn btn-outline-light btn-lg px-5 fw-bold"
                  style={{ borderRadius: 10 }}>
                  <i className={`bi ${slide.cta2.icon} me-2`} />{slide.cta2.label}
                </Link>
              </motion.div>
            </motion.div>

            {/* Scripture verse */}
            <motion.div
              className="mx-auto px-4 py-2 rounded-pill"
              style={{
                display: 'inline-block',
                background: 'rgba(0,0,0,.3)',
                border: `1px solid ${slide.accent}33`,
                color: `${slide.accent}cc`,
                fontStyle: 'italic',
                fontSize: 'clamp(0.75rem, 1.4vw, 0.9rem)',
                maxWidth: 620,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}>
              <i className="bi bi-quote me-1" />{slide.verse}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Prev / Next arrows ── */}
      <motion.button
        onClick={prev}
        className="position-absolute d-none d-md-flex align-items-center justify-content-center"
        style={{
          left: 20, top: '50%', transform: 'translateY(-50%)',
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
          color: '#fff', cursor: 'pointer', zIndex: 3,
        }}
        whileHover={{ scale: 1.15, background: 'rgba(201,168,76,.25)' }}
        whileTap={{ scale: 0.95 }}>
        <i className="bi bi-chevron-left fs-5" />
      </motion.button>

      <motion.button
        onClick={next}
        className="position-absolute d-none d-md-flex align-items-center justify-content-center"
        style={{
          right: 20, top: '50%', transform: 'translateY(-50%)',
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
          color: '#fff', cursor: 'pointer', zIndex: 3,
        }}
        whileHover={{ scale: 1.15, background: 'rgba(201,168,76,.25)' }}
        whileTap={{ scale: 0.95 }}>
        <i className="bi bi-chevron-right fs-5" />
      </motion.button>

      {/* ── Dot indicators ── */}
      <div className="position-absolute d-flex gap-2 justify-content-center"
        style={{ bottom: 28, left: 0, right: 0, zIndex: 3 }}>
        {SLIDES.map((s, i) => (
          <motion.button
            key={i}
            onClick={() => go(i)}
            style={{
              width: i === current ? 32 : 10,
              height: 10, borderRadius: 5,
              background: i === current ? SLIDES[current].accent : 'rgba(255,255,255,.35)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {/* ── Progress bar ── */}
      {!paused && (
        <motion.div
          key={current}
          style={{
            position: 'absolute', bottom: 0, left: 0, height: 3,
            background: slide.accent, zIndex: 4,
          }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
        />
      )}

      {/* ── Scroll indicator ── */}
      <motion.div
        className="position-absolute"
        style={{ bottom: 48, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,.4)', zIndex: 3 }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        <i className="bi bi-chevron-compact-down fs-3" />
      </motion.div>
    </section>
  );
}
