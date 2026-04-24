import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <motion.footer
      className="footer-ministry"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-brightness-high-fill text-gold fs-4" />
              <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: '1.1rem' }}>
                Ministry of the Word
              </span>
            </div>
            <p className="small mb-3">
              Transforming lives through the power of God's Word. Winning souls, making disciples, raising kingdom builders.
            </p>
            <div className="d-flex gap-3">
              {[
                { icon: 'bi-facebook', label: 'Facebook' },
                { icon: 'bi-youtube', label: 'YouTube' },
                { icon: 'bi-instagram', label: 'Instagram' },
                { icon: 'bi-twitter-x', label: 'Twitter/X' },
              ].map(({ icon, label }) => (
                <motion.a
                  key={icon}
                  href="#"
                  className="fs-5"
                  aria-label={label}
                  whileHover={{ scale: 1.3, color: 'var(--gold)' }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <i className={`bi ${icon}`} />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="col-lg-2 col-6">
            <h6 className="text-gold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Ministry</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/about/ministry">About Ministry</Link></li>
              <li className="mb-2"><Link to="/about/evangelist">About Evangelist</Link></li>
              <li className="mb-2"><Link to="/projects">Projects</Link></li>
              <li className="mb-2"><Link to="/gallery">Outreach Gallery</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-6">
            <h6 className="text-gold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Media</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/media">Messages</Link></li>
              <li className="mb-2"><Link to="/media?type=video">Video</Link></li>
              <li className="mb-2"><Link to="/media?type=audio">Audio</Link></li>
              <li className="mb-2"><Link to="/media?type=document">Books / PDFs</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-6">
            <h6 className="text-gold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Training</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/courses?category=convert">Convert Class</Link></li>
              <li className="mb-2"><Link to="/courses?category=missionary">Missionary Course</Link></li>
              <li className="mb-2"><Link to="/courses?category=discipleship">Discipleship</Link></li>
              <li className="mb-2"><Link to="/courses">All Courses</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-6">
            <h6 className="text-gold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Connect</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/contact/ministry">Contact Ministry</Link></li>
              <li className="mb-2"><Link to="/contact/evangelist">Contact Evangelist</Link></li>
              <li className="mb-2"><Link to="/register">Join Us</Link></li>
              <li className="mb-2"><Link to="/login">Member Login</Link></li>
            </ul>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(201,168,76,0.2)' }} />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 pt-2">
          <p className="small mb-0">© {year} Ministry of the Word. All rights reserved.</p>
          <p className="small mb-0 text-gold">
            <i className="bi bi-book-half me-1" />
            "Go therefore and make disciples of all nations" — Matthew 28:19
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
