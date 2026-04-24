import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AboutMinistry() {
  const [content, setContent] = useState({});

  useEffect(() => {
    api.get('/api/site/content/about_ministry').then(r => setContent(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">{content.title || 'About the Ministry'}</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Our vision, mission and calling</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              {content.image_url && (
                <img src={`/uploads/${content.image_url}`} className="img-fluid rounded-4 shadow" alt="Ministry" />
              )}
              {!content.image_url && (
                <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ height: '360px', background: 'var(--section-bg)' }}>
                  <i className="bi bi-building text-gold" style={{ fontSize: '5rem' }} />
                </div>
              )}
            </div>
            <div className="col-lg-6">
              <div className="gold-divider ms-0" />
              <h2 className="fw-bold mb-3">Who We Are</h2>
              <div className="text-muted lh-lg" style={{ whiteSpace: 'pre-line' }}>
                {content.body || `We are a Spirit-filled ministry founded on the solid foundation of Jesus Christ, dedicated to the Great Commission.

Our mandate is clear — win souls, make disciples, and raise kingdom builders who will transform their communities and nations for Christ.

We believe in the full gospel: salvation, healing, deliverance and the baptism of the Holy Spirit. Every soul matters, and every believer has a role to play in God's plan.`}
              </div>
              <div className="mt-4 d-flex gap-3 flex-wrap">
                <Link to="/contact/ministry" className="btn btn-gold px-4">Contact Us</Link>
                <Link to="/courses" className="btn btn-outline-gold px-4">Our Courses</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad section-bg">
        <div className="container">
          <div className="text-center mb-5">
            <div className="gold-divider" />
            <h2 className="fw-bold">Our Core Values</h2>
          </div>
          <div className="row g-4">
            {[
              { icon: 'bi-book-fill', title: 'The Word', text: 'We are rooted in the uncompromising truth of God\'s Word.' },
              { icon: 'bi-wind', title: 'The Spirit', text: 'We operate in the power and gifts of the Holy Spirit.' },
              { icon: 'bi-heart-fill', title: 'Love', text: 'Unconditional love is the foundation of all we do.' },
              { icon: 'bi-globe2', title: 'The Great Commission', text: 'We are committed to reaching every nation with the Gospel.' },
              { icon: 'bi-people-fill', title: 'Community', text: 'We build strong, loving, accountable communities of faith.' },
              { icon: 'bi-star-fill', title: 'Excellence', text: 'We pursue excellence in everything we do for God\'s glory.' },
            ].map((v, i) => (
              <div key={i} className="col-md-4">
                <div className="ministry-card p-4 h-100 text-center">
                  <i className={`bi ${v.icon} text-gold fs-2 mb-2`} />
                  <h5 className="fw-bold">{v.title}</h5>
                  <p className="text-muted mb-0">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
