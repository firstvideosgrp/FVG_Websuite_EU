

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPublicSoundtracks } from '../services/appwrite';
import type { PublicSoundtrack } from '../types';
import { useTheme } from '../contexts/ThemeContext';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

const ITEMS_PER_PAGE = 12; // Adjusted for better grid layout

const SoundtrackSearcherPage: React.FC = () => {
    const { siteTheme } = useTheme();
    const [soundtracks, setSoundtracks] = useState<PublicSoundtrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('movieTitle-asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    const playerRef = useRef<any>(null);
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

    useEffect(() => {
        const initializePlayer = () => {
            if (playerRef.current || !document.getElementById('youtube-player')) {
                return;
            }
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '0',
                width: '0',
                playerVars: { 'playsinline': 1 },
                events: {
                    'onStateChange': (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            setPlayingTrackId(null);
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initializePlayer();
        } else {
            window.onYouTubeIframeAPIReady = initializePlayer;
        }

        return () => {
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }
            playerRef.current = null;
            window.onYouTubeIframeAPIReady = undefined;
        };
    }, []);

    const getYouTubeVideoId = (url: string): string | null => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handlePlayToggle = (track: PublicSoundtrack) => {
        const player = playerRef.current;
        if (!player || !track.youtubeUrl) return;

        if (playingTrackId === track.$id) {
            player.stopVideo();
            setPlayingTrackId(null);
        } else {
            const videoId = getYouTubeVideoId(track.youtubeUrl);
            if (videoId) {
                player.loadVideoById(videoId);
                setPlayingTrackId(track.$id);
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getPublicSoundtracks();
                setSoundtracks(data);
            } catch (error) {
                console.error("Failed to load soundtracks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const recommendedTracks = useMemo(() =>
        soundtracks.filter(s => s.isRecommended),
        [soundtracks]);

    const filteredAndSortedSoundtracks = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        let filtered = soundtracks;
        if (lowerCaseSearch) {
            filtered = soundtracks.filter(s =>
                s.movieTitle.toLowerCase().includes(lowerCaseSearch) ||
                s.songTitle.toLowerCase().includes(lowerCaseSearch) ||
                s.artistName.toLowerCase().includes(lowerCaseSearch) ||
                s.imdbUrl?.toLowerCase().includes(lowerCaseSearch) ||
                s.youtubeUrl?.toLowerCase().includes(lowerCaseSearch) ||
                s.trackType?.toLowerCase().includes(lowerCaseSearch)
            );
        }

        const [key, order] = sortBy.split('-');
        return filtered.sort((a, b) => {
            const valA = a[key as keyof PublicSoundtrack] ?? '';
            const valB = b[key as keyof PublicSoundtrack] ?? '';
            if (typeof valA === 'string' && typeof valB === 'string') {
                return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return order === 'asc' ? valA - valB : valB - a;
            }
            return 0;
        });
    }, [soundtracks, searchTerm, sortBy]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, viewMode]);

    const totalPages = Math.ceil(filteredAndSortedSoundtracks.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentTracks = filteredAndSortedSoundtracks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const listElement = document.getElementById('soundtrack-list');
            if (listElement) {
                listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className={`bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 ${siteTheme} min-h-screen flex flex-col`}>
          <Header />
          <main className="flex-grow container mx-auto px-6 py-28 md:py-32">
            <div id="youtube-player" className="hidden"></div>
            <div id="soundtrack-list" className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[var(--text-primary)]">
                Soundtrack <span className="text-[var(--primary-color)]">Searcher</span>
              </h1>
              <div className="w-24 h-1 bg-[var(--primary-color)] mx-auto mt-4"></div>
              <p className="max-w-2xl mx-auto mt-4 text-lg text-[var(--text-secondary)]">
                Find your favorite movie soundtracks. Search by movie, song title, artist, or even IMDb/YouTube links.
              </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : (
                <>
                    {recommendedTracks.length > 0 && (
                        <section className="mb-16">
                            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-[var(--text-primary)] mb-6">
                                Recommended <span className="text-[var(--primary-color)]">Tracks</span>
                            </h2>
                            <div className="flex gap-6 overflow-x-auto pb-4 -mb-4">
                                {recommendedTracks.map(track => (
                                    <div key={track.$id} className="flex-shrink-0 w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-lg flex flex-col">
                                        {track.albumArtUrl ? (
                                            <img src={track.albumArtUrl} alt={`${track.songTitle} album art`} className="w-full h-40 object-cover" />
                                        ) : (
                                            <div className="w-full h-40 bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)]">
                                                <i className="fas fa-music text-5xl"></i>
                                            </div>
                                        )}
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-bold text-md text-[var(--text-primary)] truncate" title={track.songTitle}>{track.songTitle}</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">by {track.artistName}</p>
                                            <p className="text-sm text-[var(--primary-color)] mt-1 font-semibold truncate" title={track.movieTitle}>
                                                <i className="fas fa-film mr-2"></i>{track.movieTitle} {track.releaseYear && `(${track.releaseYear})`}
                                            </p>
                                            {track.trackType && <span className="mt-2 inline-block bg-gray-500/20 text-gray-300 text-xs font-bold px-2 py-1 rounded-full self-start">{track.trackType}</span>}
                                            <div className="mt-auto pt-3 flex items-center justify-end gap-4 text-lg">
                                                {track.youtubeUrl && (
                                                    <button type="button" onClick={() => handlePlayToggle(track)} className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors" title={playingTrackId === track.$id ? "Stop Audio" : "Play Audio"} aria-label={playingTrackId === track.$id ? "Stop Audio" : "Play Audio"}>
                                                        <i className={`fas ${playingTrackId === track.$id ? 'fa-stop-circle' : 'fa-play-circle'}`}></i>
                                                    </button>
                                                )}
                                                {track.imdbUrl && <a href={track.imdbUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-yellow-500" title="View on IMDb"><i className="fab fa-imdb"></i></a>}
                                                {track.youtubeUrl && <a href={track.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-red-500" title="Watch on YouTube"><i className="fab fa-youtube"></i></a>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-grow w-full">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--text-secondary)]">
                              <i className="fas fa-search"></i>
                            </span>
                            <input 
                                type="text"
                                placeholder="Search for soundtracks..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-full py-3 px-4 pl-12 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" 
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                id="sort-by"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-full py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                            >
                                <option value="movieTitle-asc">Movie Title (A-Z)</option>
                                <option value="movieTitle-desc">Movie Title (Z-A)</option>
                                <option value="songTitle-asc">Song Title (A-Z)</option>
                                <option value="songTitle-desc">Song Title (Z-A)</option>
                                <option value="artistName-asc">Artist (A-Z)</option>
                                <option value="artistName-desc">Artist (Z-A)</option>
                                <option value="releaseYear-desc">Release Year (Newest)</option>
                                <option value="releaseYear-asc">Release Year (Oldest)</option>
                            </select>
                             <div className="flex-shrink-0 flex items-center bg-[var(--input-bg)] border border-[var(--border-color)] rounded-full p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-[var(--primary-color)] text-gray-900' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                                    aria-label="Grid view"
                                    title="Grid view"
                                >
                                    <i className="fas fa-th-large"></i>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[var(--primary-color)] text-gray-900' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                                    aria-label="List view"
                                    title="List view"
                                >
                                    <i className="fas fa-bars"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {currentTracks.length > 0 ? (
                        <div>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {currentTracks.map(track => (
                                        <div key={track.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-lg flex flex-col">
                                            {track.albumArtUrl ? (
                                                <img src={track.albumArtUrl} alt={`${track.songTitle} album art`} className="w-full h-48 object-cover" />
                                            ) : (
                                                <div className="w-full h-48 bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)]">
                                                    <i className="fas fa-music text-5xl"></i>
                                                </div>
                                            )}
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="font-bold text-lg text-[var(--text-primary)] truncate" title={track.songTitle}>{track.songTitle}</h3>
                                                <p className="text-sm text-[var(--text-secondary)]">by {track.artistName}</p>
                                                <p className="text-sm text-[var(--primary-color)] mt-1 font-semibold truncate" title={track.movieTitle}>
                                                    <i className="fas fa-film mr-2"></i>{track.movieTitle} {track.releaseYear && `(${track.releaseYear})`}
                                                </p>
                                                {track.trackType && <span className="mt-2 inline-block bg-gray-500/20 text-gray-300 text-xs font-bold px-2 py-1 rounded-full self-start">{track.trackType}</span>}
                                                <div className="mt-auto pt-4 flex items-center justify-end gap-4 text-xl">
                                                    {track.youtubeUrl && (
                                                        <button type="button" onClick={() => handlePlayToggle(track)} className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors" title={playingTrackId === track.$id ? "Stop Audio" : "Play Audio"} aria-label={playingTrackId === track.$id ? "Stop Audio" : "Play Audio"}>
                                                            <i className={`fas ${playingTrackId === track.$id ? 'fa-stop-circle' : 'fa-play-circle'}`}></i>
                                                        </button>
                                                    )}
                                                    {track.imdbUrl && <a href={track.imdbUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-yellow-500" title="View on IMDb"><i className="fab fa-imdb"></i></a>}
                                                    {track.youtubeUrl && <a href={track.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-red-500" title="Watch on YouTube"><i className="fab fa-youtube"></i></a>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentTracks.map(track => (
                                        <div key={track.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg flex items-center p-4 gap-4 transition-all hover:shadow-xl hover:border-[var(--primary-color)]/50">
                                            {track.albumArtUrl ? (
                                                <img src={track.albumArtUrl} alt={`${track.songTitle} album art`} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                            ) : (
                                                <div className="w-16 h-16 bg-[var(--bg-primary)] flex-shrink-0 flex items-center justify-center rounded-md text-[var(--text-secondary)]">
                                                    <i className="fas fa-music text-3xl"></i>
                                                </div>
                                            )}
                                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
                                                <div>
                                                    <span className="md:hidden text-xs font-bold uppercase text-[var(--text-secondary)]">Song</span>
                                                    <h3 className="font-bold text-md text-[var(--text-primary)] truncate" title={track.songTitle}>{track.songTitle}</h3>
                                                    {track.trackType && <span className="text-xs text-gray-400">{track.trackType}</span>}
                                                </div>
                                                <div>
                                                    <span className="md:hidden text-xs font-bold uppercase text-[var(--text-secondary)]">Artist</span>
                                                    <p className="text-sm text-[var(--text-secondary)] truncate" title={track.artistName}>{track.artistName}</p>
                                                </div>
                                                <div>
                                                    <span className="md:hidden text-xs font-bold uppercase text-[var(--text-secondary)]">Movie</span>
                                                    <p className="text-sm text-[var(--primary-color)] font-semibold truncate" title={track.movieTitle}>
                                                        {track.movieTitle} {track.releaseYear && `(${track.releaseYear})`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-4 text-xl ml-4">
                                                {track.youtubeUrl && (
                                                    <button type="button" onClick={() => handlePlayToggle(track)} className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors" title={playingTrackId === track.$id ? "Stop Audio" : "Play Audio"} aria-label={playingTrackId === track.$id ? "Stop Audio" : "Play Audio"}>
                                                        <i className={`fas ${playingTrackId === track.$id ? 'fa-stop-circle' : 'fa-play-circle'}`}></i>
                                                    </button>
                                                )}
                                                {track.imdbUrl && <a href={track.imdbUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-yellow-500" title="View on IMDb"><i className="fab fa-imdb"></i></a>}
                                                {track.youtubeUrl && <a href={track.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-red-500" title="Watch on YouTube"><i className="fab fa-youtube"></i></a>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-[var(--text-secondary)]">
                            <i className="fas fa-compact-disc text-4xl mb-4 animate-spin" style={{ animationDuration: '3s' }}></i>
                            <h3 className="text-xl font-bold">No Soundtracks Found</h3>
                            <p>Try adjusting your search term, or check back later!</p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <nav aria-label="Pagination" className="mt-12 flex justify-center items-center gap-4 text-[var(--text-secondary)]">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-card)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                aria-label="Go to previous page"
                            >
                                <i className="fas fa-chevron-left"></i> Previous
                            </button>

                            <span className="font-semibold text-[var(--text-primary)]" aria-current="page">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-card)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                aria-label="Go to next page"
                            >
                                Next <i className="fas fa-chevron-right"></i>
                            </button>
                        </nav>
                    )}
                </>
            )}
          </main>
          <Footer />
        </div>
    );
};

export default SoundtrackSearcherPage;