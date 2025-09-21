import React from 'react';
import type { Project, ProjectStatus } from '../types';

interface ProjectCardProps {
  project: Project;
}

const statusColors: Record<ProjectStatus, string> = {
    'Released': 'bg-green-500',
    'In Production': 'bg-yellow-500 text-gray-900',
    'Upcoming': 'bg-blue-500',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    // Main card container.
    <div className="bg-[var(--bg-card)] rounded-lg overflow-hidden shadow-lg shadow-black/5 dark:shadow-lg dark:shadow-[var(--primary-color)]/10 transition-all duration-300 border border-[var(--border-color)] hover:-translate-y-1">
      
      {/* Image Section: contains poster and status tags */}
      <div className="relative aspect-[2/3]">
        <img 
          src={project.posterUrl || 'https://picsum.photos/400/600'} 
          alt={project.title} 
          className="w-full h-full object-cover"
        />
        
        {/* Top-right status tags remain overlaid on the image */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
            <span className="bg-black/70 text-[var(--primary-color)] text-xs font-bold px-2 py-1 rounded">
                {project.projectType}
            </span>
            {project.status && (
                 <span className={`text-white text-xs font-bold px-2 py-1 rounded ${statusColors[project.status]}`}>
                    {project.status}
                </span>
            )}
        </div>
      </div>

      {/* Content Section: Separated from the image, displayed below it */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-[var(--text-primary)] truncate" title={project.title}>
          {project.title}
        </h3>
        <span className="text-sm text-[var(--primary-color)] font-semibold flex items-center mt-1">
            <i className="far fa-calendar-alt mr-2"></i>
            {project.releaseYear}
        </span>
        <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed h-24 overflow-hidden">
            {project.description}
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;