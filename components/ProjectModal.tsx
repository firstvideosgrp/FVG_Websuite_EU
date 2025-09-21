import React, { useEffect, useMemo, useState } from 'react';
import type { Project, CastMember, CrewMember } from '../types';

interface ProjectModalProps {
    project: Project;
    cast: CastMember[];
    crew: CrewMember[];
    onClose: () => void;
}

const DetailItem: React.FC<{ icon: string; label: string; value?: string | number | null; }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start space-x-2">
            <i className={`${icon} text-[var(--primary-color)] w-5 text-center mt-1`}></i>
            <div>
                <span className="font-semibold">{label}:</span>
                <span className="ml-2 text-[var(--text-secondary)]">{value}</span>
            </div>
        </div>
    );
};

const MemberList: React.FC<{ title: string; members: (CastMember | CrewMember)[], getRole?: (member: any) => string }> = ({ title, members, getRole }) => {
    if (members.length === 0) return null;
    return (
        <div>
            <h4 className="text-lg font-bold text-[var(--primary-color)] mb-2">{title}</h4>
            <ul className="space-y-1">
                {members.map(member => (
                    <li key={member.$id} className="text-[var(--text-secondary)]">{member.name} <span className="text-xs opacity-75">({getRole ? getRole(member) : member.role})</span></li>
                ))}
            </ul>
        </div>
    );
};

const ProjectModal: React.FC<ProjectModalProps> = ({ project, cast, crew, onClose }) => {
    const [isPosterEnlarged, setIsPosterEnlarged] = useState(false);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isPosterEnlarged) {
                    setIsPosterEnlarged(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'auto';
        };
    }, [onClose, isPosterEnlarged]);

    const projectCast = useMemo(() => {
        if (!project.cast) return [];
        const castMap = new Map(cast.map(c => [c.$id, c]));
        return project.cast.map(id => castMap.get(id)).filter(Boolean) as CastMember[];
    }, [project.cast, cast]);

    const projectDirectors = useMemo(() => {
        if (!project.directors) return [];
        const crewMap = new Map(crew.map(c => [c.$id, c]));
        return project.directors.map(id => crewMap.get(id)).filter(Boolean) as CrewMember[];
    }, [project.directors, crew]);
    
    const projectProducers = useMemo(() => {
        if (!project.producers) return [];
        const crewMap = new Map(crew.map(c => [c.$id, c]));
        return project.producers.map(id => crewMap.get(id)).filter(Boolean) as CrewMember[];
    }, [project.producers, crew]);

    const otherCrew = useMemo(() => {
        if (!project.crew) return [];
        const directorIds = new Set(project.directors || []);
        const producerIds = new Set(project.producers || []);
        const crewMap = new Map(crew.map(c => [c.$id, c]));
        return project.crew
            .filter(id => !directorIds.has(id) && !producerIds.has(id))
            .map(id => crewMap.get(id))
            .filter(Boolean) as CrewMember[];
    }, [project.crew, project.directors, project.producers, crew]);


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 animate-fade-in" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="project-modal-title"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative text-[var(--text-primary)]"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-3xl font-light z-10">&times;</button>
                
                <header className="mb-4 pr-8">
                    <div className="flex items-center gap-3">
                        <h2 id="project-modal-title" className="text-3xl md:text-4xl font-black text-[var(--primary-color)]">{project.title}</h2>
                        {project.isRework && (
                            <span className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                REWORK
                            </span>
                        )}
                    </div>
                    <p className="text-[var(--text-secondary)] text-lg mt-1">{project.releaseYear}</p>
                </header>
                
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                    <div className="md:flex md:space-x-8">
                        <div className="md:w-1/3 mb-6 md:mb-0">
                             <button 
                                onClick={() => setIsPosterEnlarged(true)} 
                                className="w-full relative group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] focus:ring-[var(--primary-color)] rounded-lg"
                                aria-label="Enlarge poster"
                            >
                                <img 
                                    src={project.posterUrl} 
                                    alt={`${project.title} poster`} 
                                    className="w-full h-auto object-cover rounded-lg shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                    <i className="fas fa-search-plus text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                                </div>
                            </button>
                        </div>
                        <div className="md:w-2/3 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold border-b border-[var(--border-color)] pb-2 mb-3">Synopsis</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">{project.synopsis || project.description}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <DetailItem icon="fas fa-clock" label="Runtime" value={project.runtime ? `${project.runtime} min` : null} />
                                <DetailItem icon="fas fa-language" label="Language" value={project.language} />
                                <DetailItem 
                                    icon="fas fa-closed-captioning" 
                                    label="Subtitles" 
                                    value={project.hasSubtitles ? (project.mainSubtitleLanguage || 'Available') : 'Not Available'} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--border-color)]">
                        <MemberList title="Cast" members={projectCast} />
                        <div>
                            <h3 className="text-xl font-bold border-b border-[var(--border-color)] pb-2 mb-3">Crew</h3>
                            <div className="space-y-4">
                                <MemberList title="Director(s)" members={projectDirectors} getRole={() => 'Director'}/>
                                <MemberList title="Producer(s)" members={projectProducers} getRole={() => 'Producer'}/>
                                <MemberList title="Additional Crew" members={otherCrew} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isPosterEnlarged && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[110] p-4 animate-fade-in"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPosterEnlarged(false);
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Enlarged poster view"
                >
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPosterEnlarged(false);
                        }} 
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-[120]"
                        aria-label="Close enlarged poster"
                    >
                        &times;
                    </button>
                    <img 
                        src={project.posterUrl} 
                        alt={`Enlarged poster for ${project.title}`} 
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ProjectModal;