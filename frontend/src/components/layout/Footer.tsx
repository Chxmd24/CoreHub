import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div className="brand-icon-wrapper" style={{ width: '1.875rem', height: '1.875rem' }} aria-hidden="true">
                <Cpu size={18} />
              </div>
              <span style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>CoreHub</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '320px' }}>
              The peer-to-peer electronics and embedded systems marketplace designed exclusively for engineering students.
              Share, swap, sell, and borrow microcontrollers, sensors, and lab gear with confidence.
            </p>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <h4 className="footer-heading">Marketplace</h4>
            <ul className="footer-links">
              <li>
                <Link to="/marketplace" className="footer-link">All Components</Link>
              </li>
              <li>
                <Link to="/marketplace?category=Microcontrollers" className="footer-link">Microcontrollers</Link>
              </li>
              <li>
                <Link to="/marketplace?category=Sensors" className="footer-link">Sensors & Modules</Link>
              </li>
              <li>
                <Link to="/marketplace?listingType=BORROW" className="footer-link">Borrow Equipment</Link>
              </li>
              <li>
                <Link to="/marketplace?listingType=SWAP" className="footer-link">Student Swaps</Link>
              </li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="footer-heading">Student Portal</h4>
            <ul className="footer-links">
              <li>
                <Link to="/dashboard" className="footer-link">Dashboard</Link>
              </li>
              <li>
                <Link to="/my-listings" className="footer-link">My Listings</Link>
              </li>
              <li>
                <Link to="/my-reservations" className="footer-link">My Reservations</Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">Log in</Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">Student Register</Link>
              </li>
            </ul>
          </div>

          {/* Department & Security */}
          <div>
            <h4 className="footer-heading">Community & Trust</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Built for engineering students. Authenticated via student credentials with anti-double-booking locks and 24h reservation expiry.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Verified Student Peer Network</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} CoreHub. Faculty of Engineering. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Crafted with</span>
            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
            <span>for engineering makers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
