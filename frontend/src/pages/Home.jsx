import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import AnimatedSection, { StaggerContainer, StaggerItem, SlideInLeft, SlideInRight, PopIn } from '../components/AnimatedSection';
import DonationModal from '../components/DonationModal';
import HeroCarousel from '../components/HeroCarousel';
import { PublicPrayerSection } from './Events';

export default function Home() {
  const [content, setContent] = useState({});
  const [courses, setCourses] = useState([]);
  const [recentMedia, setRecentMedia] = useState([]);
  const [liveEvents, setLiveEvents]   = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [showDonation, setShowDonation] = useState(false);

  useEffect(() => {
    api.get('/api/site/content').then(r => setContent(r.data)).catch(() => {});
    api.get('/api/courses?published=true').then(r => setCourses(r.data.slice(0,3))).catch(() => {});
    api.get('/api/media?section=messages&per_page=3').then(r => setRecentMedia(r.data.items || [])).catch(() => {});
    api.get('/api/events?status=ongoing').then(r => setLiveEvents(r.data)).catch(() => {});
    api.get('/api/events?status=upcoming').then(r => setUpcomingEvents(r.data.slice(0, 3))).catch(() => {});
  }, []);

  const about = content.home_about || {};
  const verse = content.home_verse || {};

  return (
    <>
      {/* ── Hero Carousel ── */}
      <HeroCarousel onDonate={() => setShowDonation(true)} />

      {/* ── Scripture verse banner ── */}
      <section style={{ background: 'var(--section-bg)', padding: '30px 0', borderBottom: '1px solid rgba(13,27,42,0.06)' }}>
        <div className="container text-center">
          <i className="bi bi-quote text-gold d-block mb-1" style={{ fontSize: '1.5rem', lineHeight: 1 }} />
          <p className="mb-0 fst-italic" style={{ color: 'var(--deep-blue)', fontFamily: 'Cinzel, serif', fontSize: '1.05rem', maxWidth: 760, margin: '0 auto' }}>
            {verse.body || '"Go therefore and make disciples of all nations..." — Matthew 28:19'}
          </p>
        </div>
      </section>

      {/* ── Scrolling Give Today ticker ── */}
      <div className="give-ticker" style={{ background: 'var(--dark-navy)', borderBottom: '1px solid rgba(201,168,76,0.3)', padding: '10px 0', overflow: 'hidden', position: 'relative' }}>
        <div className="give-ticker-track">
          {[...Array(3)].map((_, gi) => (
            <span key={gi} className="give-ticker-group">
              {[
                'Support the Ministry',
                'Your giving changes lives',
                'Help us reach the nations',
                'Fund Gospel outreach',
                'Give and it shall be given unto you',
                'Be a blessing today',
              ].map((msg, i) => (
                <span key={i} className="give-ticker-item">
                  {msg}
                  <button
                    className="btn btn-gold btn-sm ms-3 py-0 px-3"
                    style={{ fontSize: '0.78rem', borderRadius: 20 }}
                    onClick={() => setShowDonation(true)}
                  >
                    Give Now
                  </button>
                  <span className="give-ticker-dot">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── About Ministry ── */}
      <section className="section-pad">
        <div className="container">
          <div className="row align-items-center g-5">
            <SlideInLeft className="col-lg-6">
              <div className="gold-divider ms-0" />
              <h2 className="display-6 fw-bold mb-3">{about.title || 'About Our Ministry'}</h2>
              <p className="lead mb-4 text-muted">{about.body || 'We are a Spirit-filled ministry dedicated to winning souls, making disciples and raising kingdom builders for Christ.'}</p>
              <div className="d-flex gap-3 flex-wrap">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/about/ministry" className="btn btn-gold px-4">Learn More</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/contact/ministry" className="btn btn-outline-gold px-4">Contact Us</Link>
                </motion.div>
              </div>
            </SlideInLeft>
            <SlideInRight className="col-lg-6">
              <StaggerContainer className="row g-3">
                {[
                  { icon: 'bi-person-heart', title: 'Soul Winning', text: 'Reaching the lost with the saving message of Jesus Christ.' },
                  { icon: 'bi-mortarboard', title: 'Discipleship', text: 'Training believers to be strong, mature followers of Christ.' },
                  { icon: 'bi-globe2', title: 'Missions', text: 'Taking the Gospel to the ends of the earth through missions.' },
                  { icon: 'bi-people-fill', title: 'Community', text: 'Building a loving community of believers united in purpose.' },
                ].map((item, i) => (
                  <StaggerItem key={i} className="col-6">
                    <motion.div
                      className="ministry-card p-3 h-100 text-center"
                      style={{ background: 'var(--section-bg)' }}
                      whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(201,168,76,0.15)' }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <i className={`bi ${item.icon} text-gold fs-2 mb-2`} />
                      <h6 className="fw-bold mb-1">{item.title}</h6>
                      <p className="small text-muted mb-0">{item.text}</p>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </SlideInRight>
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      <section className="section-pad section-bg">
        <div className="container">
          <AnimatedSection className="text-center mb-5">
            <div className="gold-divider" />
            <h2 className="display-6 fw-bold">Training Programs</h2>
            <p className="text-muted mt-2">Grow from a new convert to a mature, equipped believer</p>
          </AnimatedSection>
          <StaggerContainer className="row g-4">
            {[
              { category: 'convert', icon: 'bi-star-fill', badge: 'Free', badgeClass: 'chip chip-gold', title: 'Convert Class', text: 'Begin your journey with Christ. This course lays the solid foundation every new believer needs.' },
              { category: 'missionary', icon: 'bi-globe2', badge: 'Paid', badgeClass: 'chip chip-navy', title: 'Missionary Training', text: 'Equip yourself to take the Gospel to the nations with power, strategy and fire.' },
              { category: 'discipleship', icon: 'bi-people-fill', badge: 'Enrollment', badgeClass: 'chip', title: 'Sons & Daughters', text: 'Deep discipleship and mentorship for those hungry for more of God.' },
            ].map((item, i) => (
              <StaggerItem key={i} className="col-md-4">
                <motion.div
                  className="ministry-card h-100 p-4 text-center"
                  whileHover={{ y: -8, boxShadow: '0 20px 48px rgba(0,0,0,0.14)' }}
                  transition={{ type: 'spring', stiffness: 280 }}
                >
                  <PopIn delay={i * 0.1}>
                    <i className={`bi ${item.icon} text-gold fs-1 mb-3`} />
                  </PopIn>
                  <span className={`${item.badgeClass} mb-2`}>{item.badge}</span>
                  <h4 className="fw-bold mb-2">{item.title}</h4>
                  <p className="text-muted mb-4">{item.text}</p>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link to={`/courses?category=${item.category}`} className="btn btn-gold w-100">
                      Explore Course
                    </Link>
                  </motion.div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <AnimatedSection className="text-center mt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
              <Link to="/courses" className="btn btn-outline-gold px-5">View All Courses</Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Recent Messages ── */}
      {recentMedia.length > 0 && (
        <section className="section-pad">
          <div className="container">
            <AnimatedSection className="text-center mb-5">
              <div className="gold-divider" />
              <h2 className="display-6 fw-bold">Recent Messages</h2>
            </AnimatedSection>
            <StaggerContainer className="row g-4">
              {recentMedia.map(m => (
                <StaggerItem key={m.id} className="col-md-4">
                    <motion.div
                    className="ministry-card h-100"
                    whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}
                    transition={{ type: 'spring', stiffness: 280 }}
                  >
                    <div className="position-relative overflow-hidden" style={{ borderRadius: '16px 16px 0 0' }}>
                      {m.thumbnail ? (
                        <motion.img
                          src={`/uploads/${m.thumbnail}`}
                          className="media-thumb"
                          alt={m.title}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.4 }}
                        />
                      ) : (
                        <div className="media-thumb d-flex align-items-center justify-content-center" style={{ background: 'var(--navy)' }}>
                          <i className={`bi bi-${m.media_type === 'video' ? 'play-circle' : m.media_type === 'audio' ? 'music-note-beamed' : 'file-text'} text-gold`} style={{ fontSize: '3rem' }} />
                        </div>
                      )}
                      <span className="badge bg-dark position-absolute top-0 end-0 m-2">{m.media_type}</span>
                    </div>
                    <div className="p-3">
                      <h6 className="fw-bold mb-1">{m.title}</h6>
                      <p className="small text-muted">{m.description?.slice(0,80)}{m.description?.length > 80 ? '...' : ''}</p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            <AnimatedSection className="text-center mt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
                <Link to="/media" className="btn btn-outline-gold px-5">All Messages</Link>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── Events Section ── */}
      {(liveEvents.length > 0 || upcomingEvents.length > 0) && (
        <section className="section-pad" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
          <div className="container">
            <AnimatedSection className="text-center mb-5">
              <div className="gold-divider" />
              <h2 className="display-6 fw-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                Ministry Events
              </h2>
              {liveEvents.length > 0 && (
                <motion.div
                  className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mt-2"
                  style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.5)' }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}>
                  <motion.i className="bi bi-broadcast text-danger"
                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                  <span className="text-white fw-bold">{liveEvents.length} Event{liveEvents.length > 1 ? 's' : ''} LIVE Right Now!</span>
                  <Link to="/events" className="btn btn-danger btn-sm ms-2">Join Now</Link>
                </motion.div>
              )}
            </AnimatedSection>

            <StaggerContainer className="row g-4">
              {[...liveEvents, ...upcomingEvents].slice(0, 3).map((e, i) => {
                const TYPE_ICONS = {
                  conference: 'bi-mic-fill', prayer: 'bi-cloud', outreach: 'bi-globe2',
                  training: 'bi-journal-bookmark', worship: 'bi-music-note-beamed',
                  crusade: 'bi-fire', general: 'bi-calendar-event',
                };
                const icon = TYPE_ICONS[e.event_type] || 'bi-calendar-event';
                return (
                  <StaggerItem key={e.id} className="col-md-4">
                    <motion.div
                      className="ministry-card h-100 overflow-hidden"
                      whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}
                      transition={{ type: 'spring', stiffness: 280 }}
                      style={e.is_live_now ? { borderTop: '3px solid #be2a2a' } : { borderTop: '3px solid var(--gold)' }}>
                      <div className="p-4">
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          <span className="chip chip-navy">
                            <i className={`bi ${icon} me-1`} />{e.event_type}
                          </span>
                          {e.is_live_now
                            ? <motion.span className="chip chip-live"
                                animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                                ● LIVE
                              </motion.span>
                            : <span className="chip chip-gold">Upcoming</span>}
                        </div>
                        <h5 className="fw-bold text-dark mb-1">{e.title}</h5>
                        {e.description && (
                          <p className="small text-muted mb-2">{e.description.slice(0, 80)}{e.description.length > 80 ? '...' : ''}</p>
                        )}
                        <p className="small text-muted mb-3">
                          <i className="bi bi-calendar3 me-1" />
                          {new Date(e.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                          {e.youtube_url  && <span className="platform-tag"><i className="bi bi-youtube" />YouTube</span>}
                          {e.jitsi_room   && <span className="platform-tag"><i className="bi bi-camera-video-fill" />Jitsi</span>}
                          {e.facebook_url && <span className="platform-tag"><i className="bi bi-facebook" />Facebook</span>}
                          {e.twitter_url  && <span className="platform-tag"><i className="bi bi-twitter-x" />X</span>}
                        </div>
                      </div>
                      <div className="p-3 pt-0">
                        <Link to="/events" className={`btn w-100 btn-sm ${e.is_live_now ? 'btn-danger' : 'btn-gold'}`}>
                          {e.is_live_now ? <><i className="bi bi-broadcast me-1" />Join Live Now</> : <><i className="bi bi-arrow-right me-1" />View Details</>}
                        </Link>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <AnimatedSection className="text-center mt-4">
              <Link to="/events" className="btn btn-outline-light px-5">
                <i className="bi bi-calendar-event me-2" />All Events
              </Link>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── Public Prayer Request ── */}
      <PublicPrayerSection />

      {/* ── Donate CTA ── */}
      <section className="section-pad text-white text-center" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container">
          <AnimatedSection>
            <i className="bi bi-heart-fill text-gold fs-1 mb-3 d-inline-block" />
            <h2 className="display-6 fw-bold mb-3">Support the Ministry</h2>
            <p className="lead mb-4 mx-auto" style={{ maxWidth: '560px', color: 'rgba(255,255,255,0.8)' }}>
              Your generous donations help us reach more souls, produce more content and expand God's kingdom.
              No registration needed — give freely as God leads you.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
                <button className="btn btn-gold btn-lg px-5" onClick={() => setShowDonation(true)}>
                  <i className="bi bi-gift-fill me-2" />Give Today
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
                <Link to="/contact/ministry" className="btn btn-outline-light btn-lg px-5">
                  <i className="bi bi-envelope me-2" />Contact Us
                </Link>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Donation Modal */}
      <DonationModal show={showDonation} onClose={() => setShowDonation(false)} />
    </>
  );
}
