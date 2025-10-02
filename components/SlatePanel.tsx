import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SlateEntry } from '../types';
import { getSlateEntries, createSlateEntry, updateSlateEntry, deleteSlateEntry } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import { useSettings } from '../contexts/SettingsContext';

const FRAME_RATE = 24;

const SlatePanel: React.FC = () => {
    const { settings } = useSettings();
    // Existing state for list, loading, and manual modal
    const [entries, setEntries] = useState<SlateEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<SlateEntry | null>(null);
    const [manualForm, setManualForm] = useState({
        roll: '', scene: '', take: 1, production: '', director: '', dop: '', note: '', date: new Date().toISOString().split('T')[0], timecode: '00:00:00:00',
    });

    // New state for interactive slate
    const [slateData, setSlateData] = useState({
        roll: '', scene: '', take: 1, production: '', director: '', dop: '', date: new Date().toISOString().split('T')[0],
    });
    const [timecode, setTimecode] = useState('00:00:00:00');
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<'normal' | 'smpte'>('smpte');
    
    // New state and ref for fullscreen
    const [isFullscreen, setIsFullscreen] = useState(false);
    const slateRef = useRef<HTMLDivElement>(null);

    // Audio state
    const [volume, setVolume] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const savedVolume = localStorage.getItem('slateVolume');
            return savedVolume ? parseFloat(savedVolume) : 0.5;
        }
        return 0.5;
    });
    const [isMuted, setIsMuted] = useState<boolean>(() => {
         if (typeof window !== 'undefined') {
            const savedMute = localStorage.getItem('slateMuted');
            return savedMute === 'true';
        }
        return false;
    });

    // Refs for animation loop and audio
    const animationFrameId = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const customBeepBuffer = useRef<AudioBuffer | null>(null);
    const loadedBeepUrl = useRef<string | null>(null);

    const fetchEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSlateEntries();
            setEntries(data);
            // Pre-fill next slate with data from the most recent entry for convenience
            if (data.length > 0) {
                const last = data[0];
                setSlateData({
                    production: last.production,
                    director: last.director,
                    dop: last.dop,
                    date: new Date().toISOString().split('T')[0],
                    roll: last.roll,
                    scene: last.scene,
                    take: last.take + 1,
                });
            }
        } catch (error) {
            console.error('Failed to fetch slate entries', error);
            alert('Could not load slate entries.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);
    
    // Fullscreen event listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Audio settings persistence
    useEffect(() => {
        localStorage.setItem('slateVolume', volume.toString());
    }, [volume]);

    useEffect(() => {
        localStorage.setItem('slateMuted', isMuted.toString());
    }, [isMuted]);
    
    // Effect to load custom beep sound
    useEffect(() => {
        if (settings?.customBeepSoundUrl && settings.customBeepSoundUrl !== loadedBeepUrl.current) {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioContext = audioContextRef.current;
            
            fetch(settings.customBeepSoundUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(decodedData => {
                    customBeepBuffer.current = decodedData;
                    loadedBeepUrl.current = settings.customBeepSoundUrl;
                })
                .catch(error => {
                    console.error('Error loading custom beep sound:', error);
                    customBeepBuffer.current = null; // Fallback to default
                    loadedBeepUrl.current = null;
                });
        } else if (!settings?.customBeepSoundUrl) {
            customBeepBuffer.current = null;
            loadedBeepUrl.current = null;
        }
    }, [settings?.customBeepSoundUrl]);

    // Animation loop and interval cleanup
    useEffect(() => {
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            slateRef.current?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleSlateDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setSlateData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        }));
    };
    
    const timecodeLoop = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        
        const elapsed = timestamp - startTimeRef.current;
        const totalFrames = Math.floor(elapsed / (1000 / FRAME_RATE));

        const frames = totalFrames % FRAME_RATE;
        const totalSeconds = Math.floor(totalFrames / FRAME_RATE);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = totalMinutes % 60;
        const hours = Math.floor(totalMinutes / 60);

        setTimecode(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
        );

        animationFrameId.current = requestAnimationFrame(timecodeLoop);
    };
    
    const playDefaultBeep = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'suspended') return;
        
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContextRef.current.currentTime + 0.1);

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.1);
    };

    const playBeep = () => {
        if (isMuted || !audioContextRef.current || audioContextRef.current.state === 'suspended') return;

        if (customBeepBuffer.current) {
            const audioContext = audioContextRef.current;
            const source = audioContext.createBufferSource();
            source.buffer = customBeepBuffer.current;
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            source.start(0);
        } else {
            playDefaultBeep();
        }
    };

    const handleStartStop = async () => {
        if (isRunning) { // --- STOPPING ---
            setIsRunning(false);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

            try {
                // Log the new entry
                const entryToLog: Omit<SlateEntry, keyof import('appwrite').Models.Document> = { ...slateData, timecode };
                await createSlateEntry(entryToLog);
                
                // Refresh list and auto-increment take
                fetchEntries();
                setSlateData(prev => ({ ...prev, take: prev.take + 1 }));
            } catch (error) {
                console.error('Failed to save slate entry', error);
                alert('Failed to save slate entry.');
            }
        } else { // --- STARTING ---
            if (!slateData.production || !slateData.roll || !slateData.scene || !slateData.director || !slateData.dop) {
                alert("Please fill in all slate details before starting.");
                return;
            }
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            playBeep();

            setIsRunning(true);
            startTimeRef.current = performance.now();
            animationFrameId.current = requestAnimationFrame(timecodeLoop);
        }
    };
    
    // --- Manual Modal Handlers ---
    const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setManualForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        }));
    };
    
    const openModal = (entry: SlateEntry | null) => {
        if (entry) {
            setEditingEntry(entry);
            setManualForm({
                roll: entry.roll, scene: entry.scene, take: entry.take, production: entry.production, director: entry.director, dop: entry.dop, note: entry.note || '', date: new Date(entry.date).toISOString().split('T')[0], timecode: entry.timecode
            });
        } else {
            setEditingEntry(null);
            setManualForm({
                roll: '', scene: '', take: 1, production: '', director: '', dop: '', note: '', date: new Date().toISOString().split('T')[0], timecode: '00:00:00:00'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...manualForm, note: manualForm.note || undefined };
            if (editingEntry) {
                await updateSlateEntry(editingEntry.$id, dataToSubmit);
            } else {
                await createSlateEntry(dataToSubmit);
            }
            alert('Slate entry saved successfully!');
            closeModal();
            fetchEntries();
        } catch (error) {
            console.error('Failed to save slate entry', error);
            alert('Failed to save slate entry.');
        }
    };

    const handleDelete = async (entryId: string) => {
        if (window.confirm('Are you sure you want to delete this slate entry?')) {
            try {
                await deleteSlateEntry(entryId);
                alert('Entry deleted.');
                fetchEntries();
            } catch (error) {
                console.error('Failed to delete entry', error);
                alert('Failed to delete entry.');
            }
        }
    };

    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)] space-y-8">
            {/* Graphical Slate Section */}
            <div ref={slateRef} className={`bg-black text-white rounded-lg shadow-2xl overflow-hidden border-4 border-gray-700 transition-all duration-300 ${isFullscreen ? 'p-4 sm:p-8 h-full flex flex-col' : ''}`}>
                {/* Clapper */}
                <div className={`bg-white flex items-center justify-between px-4 transition-all duration-300 ${isFullscreen ? 'h-16' : 'h-8'}`}>
                     <div className="flex items-center h-full">
                         {[...Array(6)].map((_, i) => (
                            <div key={i} className={`h-full bg-black -skew-x-12 ${isFullscreen ? 'ml-8 w-16' : 'ml-4 w-8 md:w-12'}`}></div>
                        ))}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 text-sm text-gray-400 ${isFullscreen ? 'text-lg' : 'text-xs'}`}>
                            <span className={mode === 'normal' ? 'text-black font-semibold' : ''}>Normal</span>
                            <button
                                onClick={() => setMode(prev => prev === 'normal' ? 'smpte' : 'normal')}
                                className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-600"
                                role="switch"
                                aria-checked={mode === 'smpte'}
                            >
                                <span
                                className={`${
                                    mode === 'smpte' ? 'translate-x-6' : 'translate-x-1'
                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                />
                            </button>
                            <span className={mode === 'smpte' ? 'text-black font-semibold' : ''}>SMPTE</span>
                        </div>
                        <button
                            onClick={handleToggleFullscreen}
                            className={`text-gray-400 hover:text-black ${isFullscreen ? 'text-4xl' : 'text-2xl'}`}
                            aria-label="Toggle Fullscreen"
                        >
                            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </button>
                    </div>
                </div>
                {/* Slate Body */}
                <div className={`p-4 md:p-6 ${isFullscreen ? 'flex-grow flex flex-col justify-around' : 'space-y-4'}`}>
                    <div className="space-y-4">
                        <div className={`grid grid-cols-1 md:grid-cols-3 text-sm ${isFullscreen ? 'gap-x-8 gap-y-4' : 'gap-4'}`}>
                            <div className="md:col-span-2">
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>Production</label>
                                <input type="text" name="production" value={slateData.production} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                            <div>
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>Date</label>
                                <input type="date" name="date" value={slateData.date} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none [color-scheme:dark] ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                        </div>
                         <div className={`grid grid-cols-3 text-sm ${isFullscreen ? 'gap-x-8 gap-y-4' : 'gap-4'}`}>
                            <div>
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>Roll</label>
                                <input type="text" name="roll" value={slateData.roll} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                            <div>
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>Scene</label>
                                <input type="text" name="scene" value={slateData.scene} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                            <div>
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>Take</label>
                                <input type="number" name="take" value={slateData.take} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                        </div>
                         <div className={`grid grid-cols-1 md:grid-cols-2 text-sm ${isFullscreen ? 'gap-x-8 gap-y-4' : 'gap-4'}`}>
                            <div>
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>Director</label>
                                <input type="text" name="director" value={slateData.director} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                            <div>
                                <label className={`font-bold text-gray-400 uppercase tracking-widest ${isFullscreen ? 'text-xl' : ''}`}>D.P.</label>
                                <input type="text" name="dop" value={slateData.dop} onChange={handleSlateDataChange} disabled={isRunning} className={`w-full bg-transparent border-b-2 border-gray-600 focus:border-white font-semibold focus:outline-none ${isFullscreen ? 'text-3xl py-2' : 'text-lg'}`}/>
                            </div>
                        </div>
                    </div>
                    {/* Timecode Display */}
                    <div className="bg-gray-900 rounded-md p-2 sm:p-4 text-center my-4 border-2 border-gray-700">
                        <p
                            className={`text-cyan-400 tracking-widest transition-all duration-300 ${!isFullscreen ? 'text-4xl md:text-6xl' : 'leading-none'} ${mode === 'smpte' ? 'font-orbitron' : 'font-mono'}`}
                            style={isFullscreen ? { fontSize: 'clamp(2.5rem, min(13vw, 30vh), 18rem)' } : {}}
                        >
                            {timecode}
                        </p>
                    </div>
                    {/* Action Button & Sound Controls */}
                    <div className={`space-y-4 ${isFullscreen ? 'mt-auto' : ''}`}>
                        <button onClick={handleStartStop} className={`w-full rounded-md font-bold uppercase transition-colors ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} ${isFullscreen ? 'py-8 text-5xl' : 'py-4 text-2xl'}`}>
                            {isRunning ? 'Stop & Log Take' : 'Start'}
                        </button>
                        <div className="flex items-center justify-center gap-x-4 pt-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${isFullscreen ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-xl'}`}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    const newVolume = parseFloat(e.target.value);
                                    setVolume(newVolume);
                                    if (isMuted && newVolume > 0) {
                                        setIsMuted(false);
                                    }
                                }}
                                className={`w-32 accent-cyan-400 cursor-pointer ${isMuted ? 'opacity-50' : ''}`}
                                aria-label="Volume"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logged Entries Section */}
            <div className={isFullscreen ? 'hidden' : ''}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center">
                        <i className="fas fa-list-ol mr-3"></i>Logged Takes
                    </h2>
                    <button onClick={() => openModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2">
                        <i className="fas fa-edit"></i><span>Manual Entry</span>
                    </button>
                </div>
                 {isLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
                    <div className="space-y-3">
                        {entries.length > 0 ? entries.map(entry => (
                            <div key={entry.$id} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="font-black text-lg md:text-xl text-[var(--text-primary)] tracking-wider">
                                            R:<span className="text-[var(--primary-color)]">{entry.roll}</span> | S:<span className="text-[var(--primary-color)]">{entry.scene}</span> | T:<span className="text-[var(--primary-color)]">{String(entry.take).padStart(2, '0')}</span>
                                        </h3>
                                        <p className="font-mono text-base md:text-lg bg-gray-900 text-cyan-400 px-2 py-1 rounded-md">{entry.timecode}</p>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        <strong>Prod:</strong> {entry.production} | <strong>Dir:</strong> {entry.director} | <strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}
                                    </p>
                                    {entry.note && <p className="text-xs text-[var(--text-secondary)] mt-1 italic">Note: {entry.note}</p>}
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => openModal(entry)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                    <button onClick={() => handleDelete(entry.$id)} className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        )) : <p className="text-center text-[var(--text-secondary)] py-6">No takes logged yet. Use the slate above to start.</p>}
                    </div>
                )}
            </div>
            
            {/* Manual Entry / Edit Modal */}
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingEntry ? 'Edit Slate Entry' : 'Create Manual Entry'}</h2>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Timecode</label>
                                    <input name="timecode" value={manualForm.timecode} onChange={handleManualFormChange} placeholder="HH:MM:SS:FF" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 font-mono" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Date</label>
                                    <input name="date" type="date" value={manualForm.date} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="text-sm font-medium text-[var(--text-secondary)]">Roll</label><input name="roll" value={manualForm.roll} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /></div>
                                <div><label className="text-sm font-medium text-[var(--text-secondary)]">Scene</label><input name="scene" value={manualForm.scene} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /></div>
                                <div><label className="text-sm font-medium text-[var(--text-secondary)]">Take</label><input name="take" type="number" value={manualForm.take} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /></div>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Production</label>
                                <input name="production" value={manualForm.production} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium text-[var(--text-secondary)]">Director</label><input name="director" value={manualForm.director} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /></div>
                                <div><label className="text-sm font-medium text-[var(--text-secondary)]">DOP</label><input name="dop" value={manualForm.dop} onChange={handleManualFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /></div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Note (optional)</label>
                                <textarea name="note" value={manualForm.note} onChange={handleManualFormChange} rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlatePanel;