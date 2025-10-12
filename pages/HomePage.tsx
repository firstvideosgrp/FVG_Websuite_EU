import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ProjectsSection from '../components/ProjectsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectModal from '../components/ProjectModal';
import { getAboutContent, getProjects, getCast, getCrew, getAllDepartmentRoles, getAllDepartmentCrew, getDepartments, getStaticContactInfo, getPricingTiers } from '../services/appwrite';
import type { AboutContent, Project, CastMember, CrewMember, DepartmentRole, DepartmentCrew, Department, StaticContactInfo, PricingTier } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import PricingSection from '../components/PricingSection';

const HomePage: React.FC = () => {
  const { siteTheme } = useTheme();
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [allRoles, setAllRoles] = useState<DepartmentRole[]>([]);
  const [allAssignments, setAllAssignments] = useState<DepartmentCrew[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staticContactInfo, setStaticContactInfo] = useState<StaticContactInfo[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutData, projectsData, castData, crewData, rolesData, assignmentsData, departmentsData, contactInfoData, pricingTiersData] = await Promise.all([
          getAboutContent(),
          getProjects(),
          getCast(),
          getCrew(),
          getAllDepartmentRoles(),
          getAllDepartmentCrew(),
          getDepartments(),
          getStaticContactInfo(),
          getPricingTiers(),
        ]);
        setAboutContent(aboutData);
        setProjects(projectsData);
        setCast(castData);
        setCrew(crewData);
        setAllRoles(rolesData);
        setAllAssignments(assignmentsData);
        setDepartments(departmentsData);
        setStaticContactInfo(contactInfoData);
        setPricingTiers(pricingTiersData);
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  return (
    <div className={`bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 ${siteTheme}`}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <Header />
          <div className={`transition-all duration-300 ${selectedProject ? 'blur-sm' : ''}`}>
            <main>
              <HeroSection />
              <AboutSection content={aboutContent?.content} />
              <ProjectsSection projects={projects} cast={cast} crew={crew} onOpenModal={handleOpenModal} />
              <PricingSection tiers={pricingTiers} />
              <ContactSection staticContactInfo={staticContactInfo} />
            </main>
            <Footer />
          </div>
          {selectedProject && <ProjectModal project={selectedProject} cast={cast} crew={crew} allRoles={allRoles} allAssignments={allAssignments} departments={departments} onClose={handleCloseModal} />}
        </>
      )}
    </div>
  );
};

export default HomePage;