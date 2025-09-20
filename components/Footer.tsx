import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import type { SocialLink, FooterLink } from '../types';

const Footer: React.FC = () => {
  const { settings } = useSettings();

  const socialLinks: SocialLink[] = React.useMemo(() => {
    try {
      return settings?.socialLinks ? JSON.parse(settings.socialLinks) : [];
    } catch {
      return [];
    }
  }, [settings?.socialLinks]);

  const footerLinks: FooterLink[] = React.useMemo(() => {
    try {
      return settings?.footerLinks ? JSON.parse(settings.footerLinks) : [];
    } catch {
      return [];
    }
  }, [settings?.footerLinks]);

  const footerText = settings?.footerText?.replace('{year}', new Date().getFullYear().toString())
    || `© ${new Date().getFullYear()} FirstVideos Group. All Rights Reserved.`;
  
  const siteVersion = settings?.siteVersion;

  return (
    <footer className="bg-gray-800 py-8">
      <div className="container mx-auto px-6 text-center text-gray-400">
        <div className="flex justify-center space-x-6 mb-6">
          {socialLinks.map((link, index) => (
            <a key={index} href={link.url} aria-label={link.icon.split('fa-')[1]?.replace('-', ' ')} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-color)] transition-colors">
              <i className={`${link.icon} fa-2x`}></i>
            </a>
          ))}
        </div>
        <p>{footerText}</p>
        <div className="mt-4 flex justify-center items-center flex-wrap gap-x-4 gap-y-2">
          <Link to="/admin" className="text-xs hover:text-[var(--primary-color)] transition-colors">Admin Login</Link>
          {footerLinks.length > 0 && <span className="text-xs text-gray-600 hidden sm:inline">|</span>}
          {footerLinks.map((link, index) => (
            <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[var(--primary-color)] transition-colors">{link.label}</a>
          ))}
          {siteVersion && (
            <>
              {(footerLinks.length > 0 || true) && <span className="text-xs text-gray-600 hidden sm:inline">|</span>}
              <span className="text-xs text-gray-500">v{siteVersion}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;