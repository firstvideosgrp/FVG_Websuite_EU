import React, { useEffect, useMemo, useState } from 'react';
import type { Project, CastMember, CrewMember, ProductionPhase, ProductionPhaseStep } from '../types';
import { getProductionPhasesForProject, getPhaseStepsForPhase } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';

interface ProjectModalProps {
    project: Project;
    cast: CastMember[];
    crew: CrewMember[];
    onClose: () => void;
}

const statusIcon: Record<ProductionPhase['status'], string> = {
    'Pending': 'fas fa-circle-notch text-gray-500',
    'In Progress': 'fas fa-spinner fa-spin text-blue-500',
    'Completed': 'fas fa-check-circle text-green-500',
};

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
    const [phases, setPhases] = useState<ProductionPhase[]>([]);
    const [isLoadingPhases, setIsLoadingPhases] = useState(true);

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

        const fetchProductionData = async () => {
            setIsLoadingPhases(true);
            try {
                const fetchedPhases = await getProductionPhasesForProject(project.$id);
                const phasesWithSteps = await Promise.all(
                    fetchedPhases.map(async (phase) => {
                        const steps = await getPhaseStepsForPhase(phase.$id);
                        return { ...phase, steps };
                    })
                );
                setPhases(phasesWithSteps);
            } catch (error) {
                console.error("Failed to fetch production phases for modal", error);
            } finally {
                setIsLoadingPhases(false);
            }
        };
        
        fetchProductionData();

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'auto';
        };
    }, [onClose, isPosterEnlarged, project.$id]);

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
                            {project.posterUrl ? (
                                <button 
                                    onClick={() => setIsPosterEnlarged(true)} 
                                    className="w-full relative group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] focus:ring-[var(--primary-color)] rounded-lg"
                                    aria-label="Enlarge poster"
                                >
                                    <img 
                                        src={project.posterUrl} 
                                        alt={`${project.title} poster`} 
                                        className="w-full h-full object-cover rounded-lg shadow-lg aspect-[2/3]"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                        <i className="fas fa-search-plus text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                                    </div>
                                </button>
                            ) : (
                                <div className="w-full aspect-[2/3] bg-[var(--bg-secondary)] flex flex-col items-center justify-center text-center p-4 rounded-lg shadow-lg text-[var(--text-secondary)]">
                                    <i className="fas fa-camera-slash text-5xl mb-4"></i>
                                    <span className="text-sm">No poster available</span>
                                </div>
                            )}
                        </div>
                        <div className="md:w-2/3 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold border-b border-[var(--border-color)] pb-2 mb-3">Synopsis</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">{project.synopsis || project.description}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pt-4">
                                <DetailItem icon="fas fa-clock" label="Runtime" value={project.runtime ? `${project.runtime} min` : null} />
                                <DetailItem icon="fas fa-language" label="Language" value={project.language} />
                                <DetailItem 
                                    icon="fas fa-closed-captioning" 
                                    label="Subtitles" 
                                    value={project.hasSubtitles ? (project.mainSubtitleLanguage || 'Available') : 'Not Available'} 
                                />
                                <DetailItem icon="fas fa-star" label="Rating" value={project.rating} />

                                {project.genres && project.genres.length > 0 && (
                                    <div className="flex items-start space-x-2 sm:col-span-2">
                                        <i className="fas fa-tag text-[var(--primary-color)] w-5 text-center mt-1"></i>
                                        <div>
                                            <span className="font-semibold">Genres:</span>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {project.genres.map(genre => (
                                                    <span key={genre} className="bg-[var(--primary-color)]/20 text-[var(--primary-color)] text-xs font-bold px-2 py-1 rounded-full">
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                    
                    {/* Production Progress Section */}
                    {(project.status === 'In Production' || project.status === 'Upcoming' || phases.length > 0) && (
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h3 className="text-xl font-bold mb-4">Production Progress</h3>
                             {isLoadingPhases ? (
                                <div className="flex justify-center py-4"><LoadingSpinner/></div>
                             ) : phases.length > 0 ? (
                                <div className="space-y-4">
                                    {phases.map(phase => {
                                        const totalSteps = phase.steps?.length || 0;
                                        const completedSteps = phase.steps?.filter(step => step.status === 'Completed').length || 0;
                                        const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                                        return (
                                            <div key={phase.$id}>
                                                <h4 className="text-lg font-bold text-[var(--primary-color)] mb-2 flex items-center gap-2">
                                                    <i className={`${statusIcon[phase.status]}`}></i>
                                                    {phase.phaseName}
                                                </h4>
                                                {(phase.startDate || phase.endDate) && (
                                                    <p className="text-xs text-[var(--text-secondary)] ml-7 -mt-1 mb-2">
                                                        {phase.startDate && `From: ${new Date(phase.startDate).toLocaleDateString()}`}
                                                        {phase.startDate && phase.endDate && ' — '}
                                                        {phase.endDate && `To: ${new Date(phase.endDate).toLocaleDateString()}`}
                                                    </p>
                                                )}
                                                {totalSteps > 0 && (
                                                    <div className="ml-7 mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-semibold text-[var(--text-secondary)]">Completion</span>
                                                            <span className="text-xs font-semibold text-[var(--primary-color)]">{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-[var(--primary-color)]/20 rounded-full h-1.5">
                                                            <div 
                                                                className="bg-[var(--primary-color)] h-1.5 rounded-full transition-all duration-500" 
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                                {phase.steps && phase.steps.length > 0 ? (
                                                    <ul className="ml-5 border-l-2 border-[var(--primary-color)]/30 pl-6 space-y-2 py-2">
                                                        {phase.steps.map(step => (
                                                            <li key={step.$id} className="flex items-start gap-3">
                                                                <i className={`${statusIcon[step.status]} mt-1`}></i>
                                                                <div>
                                                                    <p className="font-semibold text-[var(--text-primary)]">{step.stepName}</p>
                                                                    {step.description && <p className="text-sm text-[var(--text-secondary)]">{step.description}</p>}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-[var(--text-secondary)] ml-7 pl-6">No steps defined for this phase yet.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                             ) : (
                                <p className="text-[var(--text-secondary)]">Production phases have not been detailed for this project yet.</p>
                             )}
                        </div>
                    )}

                </div>
            </div>

            {isPosterEnlarged && project.posterUrl && (
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