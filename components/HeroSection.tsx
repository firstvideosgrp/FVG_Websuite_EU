import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const HeroSection: React.FC = () => {
  const { settings } = useSettings();

  const heroBackgroundImageUrl = settings?.heroBackgroundImageUrl || 'https://picsum.photos/1920/1080?grayscale&blur=2';
  const heroTitle = settings?.heroTitle || 'Storytelling Redefined';
  const heroDescription = settings?.heroDescription || 'FirstVideos Group crafts compelling narratives that captivate audiences and shape the future of entertainment.';
  const heroButtonText = settings?.heroButtonText || 'View Our Work';

  const handleScrollToProjects = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.getElementById('projects');

    if (targetElement) {
        const headerElement = document.querySelector('header');
        const headerHeight = headerElement ? headerElement.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
  };

  return (
    <section id="home" className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBackgroundImageUrl})` }}></div>
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div className="relative z-10 px-6">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-wider leading-tight animate-fade-in-down text-[var(--secondary-color)]">
          {heroTitle}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {heroDescription}
        </p>
        <a 
          href="#projects" 
          onClick={handleScrollToProjects}
          className="mt-8 inline-block bg-[var(--primary-color)] text-gray-900 font-bold py-3 px-8 rounded-full uppercase tracking-wider hover:brightness-110 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" 
          style={{ animationDelay: '1s' }}
        >
          {heroButtonText}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;