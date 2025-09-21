
import React from 'react';
import type { Project } from '../types';
import ProjectCard from './ProjectCard';

interface ProjectsSectionProps {
  projects: Project[];
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects }) => {
  return (
    <section id="projects" className="py-20 md:py-32 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[var(--text-primary)]">
            Our <span className="text-[var(--primary-color)]">Projects</span>
          </h2>
          <div className="w-24 h-1 bg-[var(--primary-color)] mx-auto mt-4"></div>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.$id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--text-secondary)]">No projects to display at the moment. Check back soon!</p>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;