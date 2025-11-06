

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Segment, SegmentType, Song } from '../../types';
import { PlusIcon, TrashIcon, PlayIcon, PauseIcon, ShuffleIcon } from '../Icons';
import { initialSegments } from '../../data/initialData';

// --- UTILITIES & CONSTANTS ---
const SEGMENT_COLORS: Record<SegmentType, string> = {
  'Talk': 'bg-blue-500',
  'Music': 'bg-purple-500',
  'Ad Break': 'bg-yellow-600',
  'Intro/Outro': 'bg-green-500',
};

const formatTime = (seconds: number, forceHours = false) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return (h > 0 || forceHours) ? `${h}:${m}:${s}` : `${m}:${s}`;
};

// --- SUB-COMPONENTS ---

const TeleprompterView: React.FC<{ segment: Segment, onScriptChange: (newScript: string) => void }> = ({ segment, onScriptChange }) => {
    const script = segment.script || '';
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useLocalStorage('teleprompter_speed', 2);
    const prompterRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);

    const startScrolling = () => {
        if (!prompterRef.current) return;
        const prompter = prompterRef.current;
        const scroll = () => {
            prompter.scrollTop += speed / 10;
            if (prompter.scrollTop < prompter.scrollHeight - prompter.clientHeight) {
                scrollIntervalRef.current = requestAnimationFrame(scroll);
            } else {
                setIsPlaying(false);
            }
        };
        scrollIntervalRef.current = requestAnimationFrame(scroll);
    };

    const stopScrolling = () => {
        if (scrollIntervalRef.current) cancelAnimationFrame(scrollIntervalRef.current);
    };

    useEffect(() => {
        if (isPlaying) startScrolling();
        else stopScrolling();
        return () => stopScrolling();
    }, [isPlaying, speed]);
    
    // Reset scroll and playing state when segment changes
    useEffect(() => {
        if (prompterRef.current) prompterRef.current.scrollTop = 0;
        setIsPlaying(false);
    }, [segment]);

    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
            <div ref={prompterRef} className="flex-grow h-96 overflow-y-scroll bg-light-bg-primary dark:bg-dark-bg-secondary p-4 rounded-4xl border border-light-divider dark:border-dark-divider smooth-scroll text-3xl leading-relaxed">
                {script.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
            </div>
            <div className="pt-4 mt-4 border-t border-light-divider dark:border-dark-divider">
                 <textarea value={script} onChange={e => onScriptChange(e.target.value)} rows={4} placeholder="Type your script here..." className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-3xl p-4 text-sm resize-y border border-light-divider dark:border-dark-divider mb-4"></textarea>
                 <div className="flex items-center justify-between">
                     <button onClick={() => setIsPlaying(!isPlaying)} className="px-4 py-2 rounded-full bg-light-accent dark:bg-dark-accent text-white flex items-center font-semibold w-28 justify-center">
                        {isPlaying ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <div className="flex-grow flex items-center px-4 space-x-2">
                        <label className="text-sm font-semibold">Speed</label>
                        <input type="range" min="0.5" max="10" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full"/>
                    </div>
                 </div>
            </div>
        </div>
    );
};

const PlaylistView: React.FC = () => {
    const [songs, setSongs] = useLocalStorage<Song[]>('playlist', []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [duration, setDuration] = useState('');

    const handleAddSong = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && artist && duration) {
            const newSong: Song = {
                id: Date.now().toString(),
                title,
                artist,
                duration: parseInt(duration, 10)
            };
            setSongs(prev => [...prev, newSong]);
            setTitle('');
            setArtist('');
            setDuration('');
            setShowAddModal(false);
        }
    };
    
    const removeSong = (id: string) => setSongs(prev => prev.filter(song => song.id !== id));
    const shufflePlaylist = () => setSongs(currentSongs => [...currentSongs].sort(() => Math.random() - 0.5));
    
    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Playlist</h3>
                 <button onClick={shufflePlaylist} className="p-2.5 rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary shadow-soft dark:shadow-none" aria-label="Shuffle Playlist">
                    <ShuffleIcon className="w-5 h-5" />
                </button>
            </div>
             <div className="flex-grow overflow-y-auto -mx-1 px-1 space-y-2">
                {songs.map((song, index) => (
                    <div key={song.id} className="p-3 flex items-center justify-between bg-light-bg-primary dark:bg-dark-bg-secondary rounded-3xl">
                        <div className="flex items-center">
                            <span className="text-light-text-secondary dark:text-dark-text-secondary mr-3 w-5 text-center font-medium">{index + 1}</span>
                            <div>
                                <p className="font-semibold text-sm">{song.title}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                            </div>
                        </div>
                        <button onClick={() => removeSong(song.id)} className="p-2 rounded-full hover:bg-light-surface dark:hover:bg-dark-surface text-destructive"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
            {songs.length === 0 && <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary pt-10">Your playlist is looking for its first track. Tap '+' to add a song!</p>}
            
             <button onClick={() => setShowAddModal(true)} className="absolute bottom-6 right-6 bg-light-accent dark:bg-dark-accent text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 hover:opacity-90 transition-transform active:scale-95" aria-label="Add new song">
                <PlusIcon className="w-7 h-7" />
            </button>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold mb-4 text-center">Add New Song</h3>
                        <form onSubmit={handleAddSong} className="space-y-3">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"/>
                            <input type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"/>
                            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (sec)" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"/>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Add Song</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlaceholderView: React.FC<{ segment: Segment }> = ({ segment }) => (
    <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full items-center justify-center text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
        <div className={`p-4 rounded-full ${SEGMENT_COLORS[segment.type]}`}>
            <span className="text-white font-bold text-2xl">{segment.type}</span>
        </div>
        <h3 className="text-3xl font-bold mt-4">{segment.title}</h3>
        <p className="text-6xl font-mono mt-2 text-light-text-secondary dark:text-dark-text-secondary">{formatTime(segment.duration)}</p>
    </div>
);

const EditSegmentModal: React.FC<{ segment: Segment; isNew: boolean; onClose: () => void; onSave: (segment: Segment) => void;}> = ({ segment, isNew, onClose, onSave }) => {
    const [editedSegment, setEditedSegment] = useState(segment);
    const handleFieldChange = <K extends keyof Segment>(field: K, value: Segment[K]) => setEditedSegment(prev => ({...prev, [field]: value}));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-4 text-center">{isNew ? 'Add Segment' : 'Edit Segment'}</h3>
                <div className="space-y-4">
                    <input type="text" value={editedSegment.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="Segment Title" className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm focus:outline-none"/>
                    <select value={editedSegment.type} onChange={e => handleFieldChange('type', e.target.value as SegmentType)} className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm focus:outline-none appearance-none">
                        {Object.keys(SEGMENT_COLORS).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <div>
                        <label className="text-sm font-medium flex justify-between"><span>Duration</span> <span>{formatTime(editedSegment.duration)}</span></label>
                        <input type="range" min="10" max="3600" step="10" value={editedSegment.duration} onChange={e => handleFieldChange('duration', parseInt(e.target.value))} className="w-full mt-1"/>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                        <button type="button" onClick={() => onSave(editedSegment)} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN COMPONENT ---
const Showtime: React.FC = () => {
    const [segments, setSegments] = useLocalStorage<Segment[]>('show_planner_segments', initialSegments);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(segments[0]?.id || null);
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const totalRuntime = useMemo(() => segments.reduce((acc, s) => acc + s.duration, 0), [segments]);
    const activeSegment = useMemo(() => segments.find(s => s.id === activeSegmentId), [segments, activeSegmentId]);

    const handleSaveSegment = (segmentToSave: Segment) => {
        if (!segmentToSave.title) return;
        const exists = segments.some(s => s.id === segmentToSave.id);
        if (exists) {
            setSegments(prev => prev.map(s => s.id === segmentToSave.id ? segmentToSave : s));
        } else {
            setSegments(prev => [...prev, segmentToSave]);
            setActiveSegmentId(segmentToSave.id);
        }
        setEditingSegment(null);
    };

    const handleScriptChange = (newScript: string) => {
        if (!activeSegmentId) return;
        setSegments(prev => prev.map(s => s.id === activeSegmentId ? { ...s, script: newScript } : s));
    };

    const handleAddNew = () => setEditingSegment({ id: Date.now().toString(), title: '', type: 'Talk', duration: 300 });
    const removeSegment = (id: string) => {
        setSegments(prev => prev.filter(s => s.id !== id));
        if (activeSegmentId === id) setActiveSegmentId(segments[0]?.id || null);
    };

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const segmentsCopy = [...segments];
        const draggedItem = segmentsCopy.splice(dragItem.current, 1)[0];
        segmentsCopy.splice(dragOverItem.current, 0, draggedItem);
        dragItem.current = null;
        dragOverItem.current = null;
        setSegments(segmentsCopy);
    };

    const renderContextView = () => {
        if (!activeSegment) return <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full items-center justify-center text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider"><p className="text-light-text-secondary dark:text-dark-text-secondary">Select a segment to begin</p></div>;
        switch (activeSegment.type) {
            case 'Talk':
            case 'Intro/Outro':
                return <TeleprompterView segment={activeSegment} onScriptChange={handleScriptChange} />;
            case 'Music':
                return <PlaylistView />;
            case 'Ad Break':
            default:
                return <PlaceholderView segment={activeSegment} />;
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg text-light-text-secondary dark:text-dark-text-secondary">Total Runtime: <span className="font-bold text-light-text-primary dark:text-dark-text-primary">{formatTime(totalRuntime, true)}</span></h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 bg-light-surface dark:bg-dark-surface rounded-5xl p-4 space-y-2 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                     {segments.map((segment, index) => (
                        <div
                            key={segment.id}
                            draggable
                            onDragStart={() => dragItem.current = index}
                            onDragEnter={() => dragOverItem.current = index}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => setActiveSegmentId(segment.id)}
                            className={`p-3 rounded-3xl flex items-center justify-between cursor-pointer transition-all ${activeSegmentId === segment.id ? 'ring-2 ring-light-accent dark:ring-dark-accent' : 'hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary'}`}
                        >
                             <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-3 ${SEGMENT_COLORS[segment.type]}`}></div>
                                <div>
                                    <p className="font-semibold text-sm leading-tight">{segment.title}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatTime(segment.duration)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={(e) => { e.stopPropagation(); setEditingSegment(segment); }} className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAddNew} className="w-full text-sm text-light-accent dark:text-dark-accent p-3 flex items-center justify-center rounded-3xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 mt-2">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add Segment
                    </button>
                </div>

                <div className="lg:col-span-2 h-[80vh] min-h-[600px]">
                    {renderContextView()}
                </div>
            </div>

            {editingSegment && (
                 <EditSegmentModal 
                    segment={editingSegment} 
                    isNew={!segments.some(s => s.id === editingSegment.id)}
                    onClose={() => setEditingSegment(null)} 
                    onSave={handleSaveSegment}
                 />
            )}
        </div>
    );
};

export default Showtime;