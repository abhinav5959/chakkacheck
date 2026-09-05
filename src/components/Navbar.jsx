import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar({ theme = 'light', onToggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');

  const navItems = [
    {
      label: 'Home',
      href: '#home',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      )
    },
    {
      label: 'Analyze',
      href: '#analyze',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    },
    {
      label: 'About',
      href: '#about',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
    },
    {
      label: 'Fun Facts',
      href: '#fun-facts',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
        </svg>
      )
    }
  ];

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (label) => {
    setActiveItem(label);
    setIsMenuOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <header className="navbar-container">
      <div className="navbar-wrapper">
        <nav className="navbar" aria-label="Main Navigation">
          {/* Brand Section */}
          <a 
            href="#home" 
            className="navbar-brand" 
            onClick={() => handleNavClick('Home')}
            aria-label="ChakkaCheck Home"
          >
            <div className="brand-icon-wrapper" aria-hidden="true">
              {/* Illustrated Kerala Jackfruit Icon */}
              <svg 
                className="jackfruit-icon" 
                viewBox="0 0 36 36" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Stem */}
                <path 
                  d="M18 4C18 4 17 8 16 10" 
                  stroke="#47321F" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M17 7C14 5 10 7 11 11C13.5 11 16 9.5 17 7Z" 
                  fill="#2D5F3E" 
                  stroke="#1B3C29" 
                  strokeWidth="0.8" 
                />
                <path 
                  d="M18 6.5C21 5 25 7 24 10.5C21.8 10.5 19.5 9 18 6.5Z" 
                  fill="#3E7552" 
                  stroke="#1B3C29" 
                  strokeWidth="0.8" 
                />
                {/* Jackfruit Body */}
                <ellipse 
                  cx="18" 
                  cy="21" 
                  rx="11.5" 
                  ry="13" 
                  fill="#8FA838" 
                  stroke="#1E3A24" 
                  strokeWidth="1.6" 
                />
                {/* Highlights */}
                <ellipse 
                  cx="15" 
                  cy="19" 
                  rx="8" 
                  ry="10" 
                  fill="#A4BF42" 
                  opacity="0.8" 
                />
                {/* Texture dots */}
                <circle cx="14" cy="15" r="1" fill="#4B631C" />
                <circle cx="18" cy="14" r="1" fill="#4B631C" />
                <circle cx="22" cy="16" r="1" fill="#4B631C" />
                <circle cx="11" cy="19" r="1" fill="#4B631C" />
                <circle cx="15" cy="19" r="1" fill="#4B631C" />
                <circle cx="19" cy="19" r="1" fill="#4B631C" />
                <circle cx="23" cy="21" r="1" fill="#4B631C" />
                <circle cx="13" cy="24" r="1" fill="#4B631C" />
                <circle cx="17" cy="24" r="1" fill="#4B631C" />
                <circle cx="21" cy="25" r="1" fill="#4B631C" />
                <circle cx="15" cy="29" r="1" fill="#4B631C" />
              </svg>
            </div>
            
            <div className="brand-text-container">
              <span className="brand-name">
                Chakka<span className="brand-name-accent">Check</span>
              </span>
              <span className="brand-subtitle">
                An AI take on a classic proverb
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="navbar-links-group desktop-menu">
            <ul className="nav-links">
              {navItems.map((item) => {
                const isActive = activeItem === item.label;
                return (
                  <li key={item.label} className="nav-item">
                    <a
                      href={item.href}
                      className={`nav-link ${isActive ? 'active-pill' : ''}`}
                      onClick={() => handleNavClick(item.label)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Action: Kerala Badge & Theme Toggle */}
          <div className="navbar-actions-group desktop-menu">
            {/* Kerala Pill Badge */}
            <div className="kerala-pill-badge" title="God's Own Country">
              <span className="kerala-badge-leaf">🍃</span>
              <span className="kerala-badge-text">Because even AI loves Kerala! 💚</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to Morning Light Theme' : 'Switch to Evening Dark Theme'}
              title={isDark ? 'Switch to Morning Light Theme' : 'Switch to Evening Dark Theme'}
            >
              {isDark ? (
                <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              )}
              <span className="theme-label">{isDark ? 'Evening' : 'Morning'}</span>
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="mobile-controls">
            <button
              type="button"
              className="theme-toggle-btn mobile-theme-btn"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to Morning Light Theme' : 'Switch to Evening Dark Theme'}
            >
              {isDark ? (
                <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                </svg>
              )}
            </button>

            <button
              className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMenuOpen}
            >
              <span className="hamburger-bar top-bar"></span>
              <span className="hamburger-bar middle-bar"></span>
              <span className="hamburger-bar bottom-bar"></span>
            </button>
          </div>
        </nav>

        {/* Mobile Collapsible Navigation Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
          <ul className="mobile-nav-links">
            {navItems.map((item) => (
              <li key={item.label} className="mobile-nav-item">
                <a
                  href={item.href}
                  className={`mobile-nav-link ${activeItem === item.label ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.label)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
            <li className="mobile-nav-item mobile-kerala-badge">
              <span className="kerala-badge-leaf">🍃</span>
              <span>Because even AI loves Kerala! 💚</span>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
