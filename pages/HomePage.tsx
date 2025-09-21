
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ProjectsSection from '../components/ProjectsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAboutContent, getProjects, getCast, getCrew } from '../services/appwrite';
import type { AboutContent, Project, CastMember, CrewMember } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
  const { siteTheme } = useTheme();
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutData, projectsData, castData, crewData] = await Promise.all([
          getAboutContent(),
          getProjects(),
          getCast(),
          getCrew()
        ]);
        setAboutContent(aboutData);
        setProjects(projectsData);
        setCast(castData);
        setCrew(crewData);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={`bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 ${siteTheme}`}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <Header />
          <main>
            <HeroSection />
            <AboutSection content={aboutContent?.content} />
            <ProjectsSection projects={projects} cast={cast} crew={crew} />
            <ContactSection />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default HomePage;