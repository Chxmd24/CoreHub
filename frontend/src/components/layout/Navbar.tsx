import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Cpu, Menu, X, ShoppingBag, LayoutDashboard, Bookmark, LogIn, UserPlus, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo / Brand */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <div className="brand-icon-wrapper" aria-hidden="true">
              <Cpu size={22} />
            </div>
            <span>CoreHub</span>
            <span className="brand-badge">P2P CEng</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop" aria-label="Main Navigation">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              Home
            </NavLink>
            <NavLink to="/marketplace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShoppingBag size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Marketplace
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Dashboard
            </NavLink>
            <NavLink to="/my-listings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              My Listings
            </NavLink>
            <NavLink to="/my-reservations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Bookmark size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              My Reservations
            </NavLink>
          </nav>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--color-primary-light)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.6rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                  title={`Signed in as ${user.email} (${user.studentId})`}
                >
                  <UserIcon size={14} />
                  <span>{user.name}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleLogout}
                  style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
                  <LogIn size={15} />
                  <span>Log in</span>
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary">
                  <UserPlus size={15} />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="mobile-nav-menu" aria-label="Mobile Navigation">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Marketplace
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/my-listings"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              My Listings
            </NavLink>
            <NavLink
              to="/my-reservations"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              My Reservations
            </NavLink>

            <div style={{ marginTop: '0.75rem', padding: '0 0.85rem' }}>
              {isAuthenticated && user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0',
                    }}
                  >
                    <UserIcon size={14} />
                    <span>Signed in as <strong>{user.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleLogout}
                    style={{ width: '100%', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to="/login" className="btn btn-sm btn-outline" style={{ flex: 1, color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={closeMobileMenu}>
                    Log in
                  </Link>
                  <Link to="/register" className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={closeMobileMenu}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
