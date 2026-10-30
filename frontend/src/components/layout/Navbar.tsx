import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Cpu,
  Menu,
  X,
  ShoppingBag,
  LayoutDashboard,
  Bookmark,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../api/types';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  // Close both menus when the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  // Handle outside click and Escape key dismissal for account dropdown and mobile menu
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (accountMenuOpen) {
          setAccountMenuOpen(false);
          accountTriggerRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen, mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    if (accountMenuOpen) setAccountMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const getRoleLabel = (role?: Role) => {
    if (role === Role.SUPER_ADMIN) return 'SUPER ADMIN';
    if (role === Role.ADMIN) return 'ADMIN';
    return 'STUDENT';
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const isAdminUser = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo / Brand */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <div className="brand-icon-wrapper" aria-hidden="true">
              <Cpu size={22} />
            </div>
            <span className="brand-title">CoreHub</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop" aria-label="Main Navigation">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              Home
            </NavLink>
            <NavLink to="/marketplace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShoppingBag size={15} aria-hidden="true" />
              <span>Marketplace</span>
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={15} aria-hidden="true" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/my-listings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>My Listings</span>
            </NavLink>
            <NavLink to="/my-reservations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Bookmark size={15} aria-hidden="true" />
              <span>My Reservations</span>
            </NavLink>
            {isAdminUser && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'active' : ''}`}>
                <Shield size={15} aria-hidden="true" />
                <span>Admin</span>
              </NavLink>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {isAuthenticated && user ? (
              <div className="nav-user-dropdown-container" ref={accountMenuRef}>
                <button
                  ref={accountTriggerRef}
                  type="button"
                  className={`nav-user-dropdown-btn ${accountMenuOpen ? 'active' : ''}`}
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                >
                  <span className="user-avatar-initial" aria-hidden="true">
                    {userInitial}
                  </span>
                  <span className="nav-user-name" title={user.name}>
                    {user.name}
                  </span>
                  {user.role === Role.SUPER_ADMIN && (
                    <span className="role-pill role-pill-super">Super Admin</span>
                  )}
                  {user.role === Role.ADMIN && (
                    <span className="role-pill role-pill-admin">Admin</span>
                  )}
                  <ChevronDown
                    size={14}
                    className={`user-caret ${accountMenuOpen ? 'rotate' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {accountMenuOpen && (
                  <div
                    className="nav-user-dropdown-menu"
                    role="menu"
                    aria-label="User account options"
                  >
                    <div className="dropdown-user-header">
                      <div className="dropdown-avatar-circle" aria-hidden="true">
                        {userInitial}
                      </div>
                      <div className="dropdown-user-meta">
                        <div className="dropdown-user-name" title={user.name}>
                          {user.name}
                        </div>
                        <div className="dropdown-user-email" title={user.email}>
                          {user.email}
                        </div>
                        <div className="dropdown-role-row">
                          <span className={`role-badge role-badge-${user.role.toLowerCase()}`}>
                            {user.role === Role.SUPER_ADMIN && <Shield size={12} aria-hidden="true" />}
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        {user.studentId && (
                          <div className="dropdown-student-id-row">
                            <span className="dropdown-student-id">ID: {user.studentId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="dropdown-divider" role="separator" />

                    <div className="dropdown-links" role="group">
                      <Link
                        to="/profile"
                        className="dropdown-item dropdown-item-profile"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <UserIcon size={15} aria-hidden="true" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <LayoutDashboard size={15} aria-hidden="true" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/my-listings"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <ShoppingBag size={15} aria-hidden="true" />
                        <span>My Listings</span>
                      </Link>
                      <Link
                        to="/my-reservations"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Bookmark size={15} aria-hidden="true" />
                        <span>My Reservations</span>
                      </Link>
                      {isAdminUser && (
                        <Link
                          to="/admin"
                          className="dropdown-item dropdown-item-admin"
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <Shield size={15} aria-hidden="true" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="dropdown-divider" role="separator" />

                    <button
                      type="button"
                      className="dropdown-item dropdown-item-logout"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} aria-hidden="true" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link to="/login" className="btn btn-sm btn-outline nav-auth-btn">
                  <LogIn size={15} aria-hidden="true" />
                  <span>Log in</span>
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary nav-auth-btn">
                  <UserPlus size={15} aria-hidden="true" />
                  <span>Register</span>
                </Link>
              </div>
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
            {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="mobile-nav-menu" aria-label="Mobile Navigation">
            <div className="mobile-nav-links">
              <NavLink
                to="/"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
                end
              >
                Home
              </NavLink>
              <NavLink
                to="/marketplace"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <ShoppingBag size={16} aria-hidden="true" />
                <span>Marketplace</span>
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/my-listings"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span>My Listings</span>
              </NavLink>
              <NavLink
                to="/my-reservations"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Bookmark size={16} aria-hidden="true" />
                <span>My Reservations</span>
              </NavLink>
              {isAuthenticated && (
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <UserIcon size={16} aria-hidden="true" />
                  <span>My Profile</span>
                </NavLink>
              )}
              {isAdminUser && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `mobile-nav-link mobile-nav-link-admin ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Shield size={16} aria-hidden="true" />
                  <span>Admin</span>
                </NavLink>
              )}
            </div>

            <div className="mobile-nav-footer">
              {isAuthenticated && user ? (
                <div className="mobile-user-card">
                  <div className="mobile-user-info">
                    <span className="mobile-user-avatar" aria-hidden="true">
                      {userInitial}
                    </span>
                    <div className="mobile-user-details">
                      <span className="mobile-user-name">{user.name}</span>
                      <span className="mobile-user-email">{user.email}</span>
                      <span className={`role-badge role-badge-${user.role.toLowerCase()}`}>
                        {user.role === Role.SUPER_ADMIN && <Shield size={11} aria-hidden="true" />}
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline mobile-logout-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} aria-hidden="true" />
                    <span>Log out</span>
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-actions">
                  <Link
                    to="/login"
                    className="btn btn-sm btn-outline mobile-auth-btn"
                    onClick={closeMobileMenu}
                  >
                    <LogIn size={15} aria-hidden="true" />
                    <span>Log in</span>
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-sm btn-primary mobile-auth-btn"
                    onClick={closeMobileMenu}
                  >
                    <UserPlus size={15} aria-hidden="true" />
                    <span>Register</span>
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
