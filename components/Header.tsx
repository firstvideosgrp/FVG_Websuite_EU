
import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const { settings } = useSettings();
  const { siteTheme: theme, toggleSiteTheme: toggleTheme } = useTheme();
  const location = useLocation();
  const siteTitle = settings?.siteTitle.split(' ')[0] || 'First';
  const siteTitleColor = settings?.siteTitle.split(' ')[1] || 'Videos';
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logoUrl = theme === 'dark' ? settings?.logoDarkUrl : settings?.logoLightUrl;
  const showLogo = !!logoUrl;

  const isHomePage = location.pathname === '/';

  const navLinks = [
    { href: isHomePage ? '#home' : '/', label: 'Home', icon: 'fas fa-home' },
    { href: isHomePage ? '#about' : '/#about', label: 'About', icon: 'fas fa-info-circle' },
    { href: isHomePage ? '#projects' : '/#projects', label: 'Projects', icon: 'fas fa-film' },
    { href: isHomePage ? '#pricing' : '/#pricing', label: 'Pricing', icon: 'fas fa-dollar-sign' },
    {
      id: 'tools',
      label: 'Tools',
      icon: 'fas fa-tools',
      submenu: [
        { to: '/tools/soundtrack-searcher', label: 'Soundtrack Searcher', icon: 'fas fa-music' }
      ]
    },
    { href: isHomePage ? '#contact' : '/#contact', label: 'Contact', icon: 'fas fa-envelope' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHomePage) {
      // Let router handle navigation to home page sections
      return;
    }

    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      if (targetId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const headerElement = document.querySelector('header');
        const headerHeight = headerElement ? headerElement.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
      }
    }

    if (isOpen) {
      setIsOpen(false);
    }
  };


  return (
    <header className="bg-[var(--header-bg)] backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--border-color)]">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="text-2xl font-black tracking-wider uppercase text-[var(--text-primary)]">
          {showLogo ? (
            <img src={logoUrl} alt={settings?.siteTitle || 'Site Logo'} className="h-10 max-w-[200px] object-contain" />
          ) : (
            <>{siteTitle}<span className="text-[var(--primary-color)]">{siteTitleColor}</span></>
          )}
        </a>
        
        <nav className="hidden md:flex space-x-8 items-center">
          {navLinks.map(link => {
            if (link.submenu) {
              return (
                <div 
                  key={link.id} 
                  ref={dropdownRef}
                  className="relative"
                >
                  <button 
                    onClick={() => setOpenDropdown(prev => prev === link.id ? null : link.id)}
                    className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium"
                    aria-haspopup="true"
                    aria-expanded={openDropdown === link.id}
                  >
                    <i className={`${link.icon} mr-2`}></i>
                    <span>{link.label}</span>
                    <i className={`fas fa-chevron-down ml-2 text-xs transition-transform ${openDropdown === link.id ? 'rotate-180' : ''}`}></i>
                  </button>
                  {openDropdown === link.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[var(--bg-card)] rounded-md shadow-lg border border-[var(--border-color)] animate-fade-in">
                      <div className="py-1">
                        {link.submenu.map(sublink => (
                          <Link
                            key={sublink.to}
                            to={sublink.to}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)]"
                          >
                            <i className={`${sublink.icon} w-5 text-center mr-2`}></i>
                            <span>{sublink.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            if ('to' in link) {
              return (
                <Link key={link.to} to={link.to!} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium">
                  <i className={`${link.icon} mr-2`}></i>
                  <span>{link.label}</span>
                </Link>
              );
            }
            return (
              <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href!)} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium">
                <i className={`${link.icon} mr-2`}></i>
                <span>{link.label}</span>
              </a>
            );
          })}
           <button
              onClick={toggleTheme}
              className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] text-xl w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
        </nav>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none text-2xl text-[var(--text-primary)]">
            <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
          <nav className="flex flex-col items-center space-y-2 py-4">
             {navLinks.map(link => {
                if (link.submenu) {
                  return (
                    <div key={link.id} className="w-full text-center">
                      <button
                        onClick={() => setOpenMobileDropdown(openMobileDropdown === link.id ? null : link.id)}
                        className="w-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium text-lg py-2"
                      >
                        <i className={`${link.icon} w-6 text-center mr-3`}></i>
                        <span>{link.label}</span>
                        <i className={`fas fa-chevron-down ml-2 text-xs transition-transform ${openMobileDropdown === link.id ? 'rotate-180' : ''}`}></i>
                      </button>
                      {openMobileDropdown === link.id && (
                        <div className="mt-2 space-y-2 bg-[var(--bg-secondary)] py-2 rounded-md">
                          {link.submenu.map(sublink => (
                            <Link
                              key={sublink.to}
                              to={sublink.to}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium py-2"
                            >
                              <i className={`${sublink.icon} w-6 text-center mr-3`}></i>
                              <span>{sublink.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                if ('to' in link) {
                  return (
                    <Link key={link.to} to={link.to!} onClick={() => setIsOpen(false)} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium text-lg py-2">
                      <i className={`${link.icon} w-6 text-center mr-3`}></i>
                      <span>{link.label}</span>
                    </Link>
                  );
                }
                return (
                  <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href!)} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium text-lg py-2">
                    <i className={`${link.icon} w-6 text-center mr-3`}></i>
                    <span>{link.label}</span>
                  </a>
                );
             })}
            <button
              onClick={toggleTheme}
              className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] text-xl w-10 h-10 flex items-center justify-center rounded-lg transition-colors mt-2"
              aria-label="Toggle theme"
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
