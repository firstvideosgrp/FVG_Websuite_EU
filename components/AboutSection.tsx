
import React from 'react';

interface AboutSectionProps {
  content?: string;
}

const AboutSection: React.FC<AboutSectionProps> = ({ content }) => {
  return (
    <section id="about" className="py-20 md:py-32 bg-[var(--bg-primary)]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[var(--text-primary)]">
            About <span className="text-[var(--primary-color)]">Us</span>
          </h2>
          <div className="w-24 h-1 bg-[var(--primary-color)] mx-auto mt-4"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center text-[var(--text-secondary)] text-lg leading-relaxed">
          <p>{content || "FirstVideos Group is a leading entertainment and movie studio group dedicated to producing high-quality, innovative, and memorable content for a global audience. Our mission is to push the boundaries of storytelling through cutting-edge technology and creative excellence."}</p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;