import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const { siteTheme: theme, toggleSiteTheme: toggleTheme } = useTheme();
  const siteTitle = settings?.siteTitle.split(' ')[0] || 'First';
  const siteTitleColor = settings?.siteTitle.split(' ')[1] || 'Videos';

  const logoUrl = theme === 'dark' ? settings?.logoDarkUrl : settings?.logoLightUrl;
  const showLogo = !!logoUrl;

  const navLinks = [
    { href: '#home', label: 'Home', icon: 'fas fa-home' },
    { href: '#about', label: 'About', icon: 'fas fa-info-circle' },
    { href: '#projects', label: 'Projects', icon: 'fas fa-film' },
    { href: '#pricing', label: 'Pricing', icon: 'fas fa-tags' },
    { href: '#contact', label: 'Contact', icon: 'fas fa-envelope' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
          {navLinks.map(link => (
            <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium">
              <i className={`${link.icon} mr-2`}></i>
              <span>{link.label}</span>
            </a>
          ))}
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
          <nav className="flex flex-col items-center space-y-4 py-4">
             {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-300 font-medium text-lg">
                <i className={`${link.icon} w-6 text-center mr-3`}></i>
                <span>{link.label}</span>
              </a>
            ))}
            <button
              onClick={toggleTheme}
              className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] text-xl w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
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