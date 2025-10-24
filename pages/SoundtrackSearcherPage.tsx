import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPublicSoundtracks } from '../services/appwrite';
import type { PublicSoundtrack } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const SoundtrackSearcherPage: React.FC = () => {
    const { siteTheme } = useTheme();
    const [soundtracks, setSoundtracks] = useState<PublicSoundtrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('movieTitle-asc');

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

    const filteredAndSortedSoundtracks = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        let filtered = soundtracks;
        if (lowerCaseSearch) {
            filtered = soundtracks.filter(s =>
                s.movieTitle.toLowerCase().includes(lowerCaseSearch) ||
                s.songTitle.toLowerCase().includes(lowerCaseSearch) ||
                s.artistName.toLowerCase().includes(lowerCaseSearch) ||
                s.imdbUrl?.toLowerCase().includes(lowerCaseSearch) ||
                s.youtubeUrl?.toLowerCase().includes(lowerCaseSearch)
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
                return order === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });
    }, [soundtracks, searchTerm, sortBy]);
    
    return (
        <div className={`bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 ${siteTheme} min-h-screen flex flex-col`}>
          <Header />
          <main className="flex-grow container mx-auto px-6 py-28 md:py-32">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[var(--text-primary)]">
                Soundtrack <span className="text-[var(--primary-color)]">Searcher</span>
              </h1>
              <div className="w-24 h-1 bg-[var(--primary-color)] mx-auto mt-4"></div>
              <p className="max-w-2xl mx-auto mt-4 text-lg text-[var(--text-secondary)]">
                Find your favorite movie soundtracks. Search by movie, song title, artist, or even IMDb/YouTube links.
              </p>
            </div>

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
                <div className="flex-shrink-0">
                    <label htmlFor="sort-by" className="sr-only">Sort by</label>
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
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : filteredAndSortedSoundtracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredAndSortedSoundtracks.map(track => (
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
                                <div className="mt-auto pt-4 flex items-center justify-end gap-4 text-xl">
                                    {track.imdbUrl && <a href={track.imdbUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-yellow-500" title="View on IMDb"><i className="fab fa-imdb"></i></a>}
                                    {track.youtubeUrl && <a href={track.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-red-500" title="Watch on YouTube"><i className="fab fa-youtube"></i></a>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-[var(--text-secondary)]">
                    <i className="fas fa-compact-disc text-4xl mb-4 animate-spin" style={{ animationDuration: '3s' }}></i>
                    <h3 className="text-xl font-bold">No Soundtracks Found</h3>
                    <p>Try adjusting your search term, or check back later!</p>
                </div>
            )}

          </main>
          <Footer />
        </div>
    );
};

export default SoundtrackSearcherPage;
