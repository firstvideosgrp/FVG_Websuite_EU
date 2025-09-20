
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ProjectsSection from '../components/ProjectsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAboutContent, getProjects } from '../services/appwrite';
import type { AboutContent, Project } from '../types';

const HomePage: React.FC = () => {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutData, projectsData] = await Promise.all([
          getAboutContent(),
          getProjects()
        ]);
        setAboutContent(aboutData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-gray-900">
      <Header />
      <main>
        <HeroSection />
        <AboutSection content={aboutContent?.content} />
        <ProjectsSection projects={projects} />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
