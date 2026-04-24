import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AboutEvangelist() {
  const [content, setContent] = useState({});

  useEffect(() => {
    api.get('/api/site/content/about_evangelist').then(r => setContent(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg, var(--dark-navy), var(--deep-blue))' }}>
        <div className="container py-4">
          <div className="gold-divider ms-0" />
          <h1 className="display-5 fw-bold">{content.title || 'About the Evangelist'}</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Called, anointed and sent</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-4 text-center">
              {content.image_url ? (
                <img src={`/uploads/${content.image_url}`} className="img-fluid rounded-circle shadow" style={{ width: '280px', height: '280px', objectFit: 'cover' }} alt="Evangelist" />
              ) : (
                <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '280px', height: '280px', background: 'var(--section-bg)' }}>
                  <i className="bi bi-person-fill text-gold" style={{ fontSize: '5rem' }} />
                </div>
              )}
            </div>
            <div className="col-lg-8">
              <div className="gold-divider ms-0" />
              <h2 className="fw-bold mb-1">{content.title || 'The Evangelist'}</h2>
              <p className="text-gold mb-3 fw-semibold">{content.subtitle || 'Servant of God & Evangelist'}</p>
              <div className="text-muted lh-lg" style={{ whiteSpace: 'pre-line' }}>
                {content.body || `Called by God from a young age with a burning passion for souls, our Evangelist has dedicated his life to the proclamation of the Gospel of Jesus Christ.

With a mandate to reach the lost, heal the sick and set the captives free, he has ministered across nations, seeing the miraculous power of God transform lives.

His message is simple but powerful — Jesus saves, heals, delivers and is coming back. Every crusade, every message and every course is birthed out of a deep love for God and a desperate burden for souls.`}
              </div>
              <div className="mt-4 d-flex gap-3 flex-wrap">
                <Link to="/contact/evangelist" className="btn btn-gold px-4">
                  <i className="bi bi-envelope me-2" />Contact
                </Link>
                <Link to="/media" className="btn btn-outline-gold px-4">
                  <i className="bi bi-play-circle me-2" />Watch Messages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad section-bg">
        <div className="container text-center" style={{ maxWidth: '700px' }}>
          <i className="bi bi-quote text-gold fs-1" />
          <blockquote className="display-6 fw-light fst-italic my-3">
            "Every soul is precious. Every life can be transformed. The Gospel is still the power of God unto salvation."
          </blockquote>
          <p className="text-gold fw-bold">— The Evangelist</p>
        </div>
      </section>
    </>
  );
}
