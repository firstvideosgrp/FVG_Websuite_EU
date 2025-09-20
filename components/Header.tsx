import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const siteTitle = settings?.siteTitle.split(' ')[0] || 'First';
  const siteTitleColor = settings?.siteTitle.split(' ')[1] || 'Videos';

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#projects', label: 'Projects' },
    { href: '#contact', label: 'Contact' },
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
    <header className="bg-gray-900 bg-opacity-80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="text-2xl font-black tracking-wider uppercase text-[var(--secondary-color)]">{siteTitle}<span className="text-[var(--primary-color)]">{siteTitleColor}</span></a>
        
        <nav className="hidden md:flex space-x-8 items-center">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-gray-300 hover:text-[var(--primary-color)] transition-colors duration-300 font-medium">{link.label}</a>
          ))}
        </nav>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none text-2xl text-[var(--secondary-color)]">
            <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-gray-900">
          <nav className="flex flex-col items-center space-y-4 py-4">
             {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-gray-300 hover:text-[var(--primary-color)] transition-colors duration-300 font-medium">{link.label}</a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
