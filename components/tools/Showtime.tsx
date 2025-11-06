import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Segment, SegmentType, Song } from '../../types';
import { PlusIcon, TrashIcon, PlayIcon, PauseIcon, MusicIcon, XIcon, ScriptIcon, PrinterIcon } from '../Icons';
import { initialSegments } from '../../data/initialData';

// --- UTILITIES & CONSTANTS ---
const PREDEFINED_SEGMENT_TYPES: SegmentType[] = ['Talk', 'Music', 'Ad Break', 'Intro/Outro'];
const SEGMENT_COLORS: Record<SegmentType, string> = {
  'Talk': '#3b82f6', // blue-500
  'Music': '#8b5cf6', // purple-500
  'Ad Break': '#ca8a04', // yellow-600
  'Intro/Outro': '#22c55e', // green-500
};

const formatTime = (seconds: number, forceHours = false) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return (h > 0 || forceHours) ? `${h}:${m}:${s}` : `${m}:${s}`;
};

// --- SUB-COMPONENTS ---

const PrintableShow: React.FC<{ segments: Segment[], songs: Song[], totalRuntime: number }> = ({ segments, songs, totalRuntime }) => (
    <div id="printable-show">
        <div className="print-show-header">
            <h1>Show Rundown</h1>
            <p>Total Runtime: {formatTime(totalRuntime, true)}</p>
        </div>
        {segments.map((segment, index) => {
            const song = segment.songId ? songs.find(s => s.id === segment.songId) : null;
            const segmentColor = segment.color || SEGMENT_COLORS[segment.type] || '#6b7280';
            return (
                <div key={segment.id} className="print-segment">
                    <div className="print-segment-title">
                        <span>{index + 1}. {segment.title} ({formatTime(segment.duration)})</span>
                        <span className="print-segment-type" style={{ backgroundColor: segmentColor }}>{segment.type}</span>
                    </div>
                    {segment.script && <p className="print-segment-script">{segment.script}</p>}
                    {song && <p className="print-segment-song">▶ {song.title} - {song.artist}</p>}
                </div>
            );
        })}
    </div>
);


const TeleprompterModal: React.FC<{
    segment: Segment;
    onClose: () => void;
    onScriptChange: (newScript: string) => void;
}> = ({ segment, onClose, onScriptChange }) => {
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

    useEffect(() => {
        if (prompterRef.current) prompterRef.current.scrollTop = 0;
        setIsPlaying(false);
    }, [segment]);

    return (
        <div className="fixed inset-0 bg-light-bg-primary dark:bg-dark-bg-primary z-[60] flex flex-col p-4" onClick={onClose}>
             <div className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg rounded-5xl p-5 flex flex-col h-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider" onClick={e => e.stopPropagation()}>
                <div ref={prompterRef} className="flex-grow h-96 overflow-y-scroll bg-light-bg-primary dark:bg-dark-bg-secondary p-8 rounded-4xl border border-light-divider dark:border-dark-divider smooth-scroll text-5xl leading-relaxed">
                    {script.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
                </div>
                <div className="pt-4 mt-4 border-t border-light-divider dark:border-dark-divider">
                     <div className="flex items-center justify-between">
                         <button onClick={() => setIsPlaying(!isPlaying)} className="px-4 py-2 rounded-full bg-light-accent dark:bg-dark-accent text-white flex items-center font-semibold w-28 justify-center">
                            {isPlaying ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <div className="flex-grow flex items-center px-4 space-x-2">
                            <label className="text-sm font-semibold">Speed</label>
                            <input type="range" min="0.5" max="10" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full"/>
                        </div>
                         <button onClick={onClose} className="px-4 py-2 text-sm rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary font-semibold">Close</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

const TalkSegmentView: React.FC<{ segment: Segment; onOpenTeleprompter: () => void; onScriptChange: (newScript: string) => void; }> = ({ segment, onOpenTeleprompter, onScriptChange }) => (
    <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
        <div className="flex justify-between items-center mb-4">
             <div>
                <h3 className="text-3xl font-bold">{segment.title}</h3>
                <p className="text-lg font-mono mt-1 text-light-text-secondary dark:text-dark-text-secondary">{formatTime(segment.duration)}</p>
             </div>
             <button onClick={onOpenTeleprompter} className="px-4 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">
                Open Teleprompter
            </button>
        </div>
        <textarea 
            value={segment.script || ''}
            onChange={(e) => onScriptChange(e.target.value)}
            placeholder="Type your script here..."
            className="w-full h-full flex-grow bg-light-bg-primary dark:bg-dark-bg-secondary rounded-4xl p-4 text-base resize-none border border-light-divider dark:border-dark-divider focus:outline-none focus:ring-2 focus:ring-light-accent"
        />
    </div>
);


const MusicSegmentView: React.FC<{ 
    segment: Segment; 
    onSelectSongClick: () => void;
    songs: Song[];
}> = ({ segment, onSelectSongClick, songs }) => {
    const song = songs.find(s => s.id === segment.songId);

    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full items-center justify-center text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
            {song ? (
                <div className="flex flex-col items-center">
                    <MusicIcon className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mb-4" />
                    <h3 className="text-3xl font-bold">{song.title}</h3>
                    <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                    <p className="text-6xl font-mono mt-4">{formatTime(song.duration)}</p>
                    <button onClick={onSelectSongClick} className="mt-6 px-4 py-2 text-sm font-semibold rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary hover:bg-light-divider dark:hover:bg-dark-divider">Change Song</button>
                </div>
            ) : (
                <div>
                    <MusicIcon className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mb-4" />
                    <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">No song selected for this segment.</p>
                    <button onClick={onSelectSongClick} className="px-5 py-3 text-base font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">
                        Select a Song
                    </button>
                </div>
            )}
        </div>
    );
};

const SongPickerModal: React.FC<{
    songs: Song[];
    setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    segments: Segment[];
    onClose: () => void;
    onSelect: (song: Song) => void;
}> = ({ songs, setSongs, segments, onClose, onSelect }) => {
    const usedSongIds = useMemo(() => new Set(segments.map(s => s.songId).filter(Boolean)), [segments]);
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [duration, setDuration] = useState('');

    const handleAddSong = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && artist && duration) {
            const newSong: Song = {
                id: Date.now().toString(),
                title, artist,
                duration: parseInt(duration, 10)
            };
            setSongs(prev => [...prev, newSong]);
            setTitle(''); setArtist(''); setDuration('');
            setIsAdding(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-bg-primary dark:bg-dark-bg-secondary rounded-6xl p-5 w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4 flex-shrink-0"></div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-center flex-grow">Select a Song</h3>
                    <button onClick={() => setIsAdding(!isAdding)} className={`flex items-center text-sm font-semibold p-2 rounded-full transition-colors ${isAdding ? 'bg-light-accent-subtle text-light-accent' : 'text-light-text-secondary hover:text-light-accent'}`}>
                       <PlusIcon className={`w-5 h-5 transition-transform duration-300 ${isAdding ? 'rotate-45' : ''}`}/>
                    </button>
                </div>

                {isAdding && (
                     <form onSubmit={handleAddSong} className="space-y-3 p-4 mb-4 bg-light-surface dark:bg-dark-surface rounded-4xl flex-shrink-0">
                        <h4 className="font-semibold text-center">Add New Song</h4>
                        <div className="flex space-x-2">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm"/>
                            <input type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" required className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm"/>
                        </div>
                        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (sec)" required className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm"/>
                        <button type="submit" className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Add Song</button>
                    </form>
                )}
                
                <div className="flex-grow overflow-y-auto space-y-2">
                    {songs.map((song, index) => {
                        const isUsed = usedSongIds.has(song.id);
                        return (
                            <button 
                                key={song.id}
                                disabled={isUsed}
                                onClick={() => onSelect(song)}
                                className={`w-full text-left p-3 flex items-center justify-between rounded-3xl transition-colors ${isUsed ? 'bg-light-surface/50 dark:bg-dark-surface/50 opacity-50 cursor-not-allowed' : 'bg-light-surface dark:bg-dark-surface hover:bg-light-accent-subtle dark:hover:bg-dark-accent-subtle'}`}
                            >
                                <div className="flex items-center">
                                    <span className="text-light-text-secondary dark:text-dark-text-secondary mr-3 w-5 text-center font-medium">{index + 1}</span>
                                    <div>
                                        <p className="font-semibold text-sm">{song.title}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono">{formatTime(song.duration)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


const PlaceholderView: React.FC<{ segment: Segment }> = ({ segment }) => (
    <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full items-center justify-center text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
        <div className="p-4 rounded-full" style={{backgroundColor: segment.color || SEGMENT_COLORS[segment.type]}}>
            <span className="text-white font-bold text-2xl">{segment.type}</span>
        </div>
        <h3 className="text-3xl font-bold mt-4">{segment.title}</h3>
        <p className="text-6xl font-mono mt-2 text-light-text-secondary dark:text-dark-text-secondary">{formatTime(segment.duration)}</p>
    </div>
);

const EditSegmentModal: React.FC<{ segment: Segment; isNew: boolean; onClose: () => void; onSave: (segment: Segment) => void;}> = ({ segment, isNew, onClose, onSave }) => {
    const [editedSegment, setEditedSegment] = useState(segment);
    const handleFieldChange = <K extends keyof Segment>(field: K, value: Segment[K]) => setEditedSegment(prev => ({...prev, [field]: value}));
    const isCustomType = !PREDEFINED_SEGMENT_TYPES.includes(editedSegment.type);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'Custom') {
            handleFieldChange('type', '');
        } else {
            handleFieldChange('type', value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-4 text-center">{isNew ? 'Add Segment' : 'Edit Segment'}</h3>
                <div className="space-y-4">
                    <input type="text" value={editedSegment.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="Segment Title" className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm focus:outline-none"/>
                    <select value={isCustomType ? 'Custom' : editedSegment.type} onChange={handleTypeChange} className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm focus:outline-none appearance-none">
                        {PREDEFINED_SEGMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        <option value="Custom">Custom...</option>
                    </select>
                    {isCustomType && (
                        <div className="flex items-center space-x-2">
                             <input type="text" value={editedSegment.type} onChange={e => handleFieldChange('type', e.target.value)} placeholder="Custom Type Name" className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm focus:outline-none"/>
                             <input type="color" value={editedSegment.color || '#6b7280'} onChange={e => handleFieldChange('color', e.target.value)} className="w-12 h-12 p-1 rounded-lg bg-transparent border-none cursor-pointer" title="Custom Segment Color" />
                        </div>
                    )}
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
    const [songs, setSongs] = useLocalStorage<Song[]>('playlist', []);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(segments[0]?.id || null);
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);

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
    
    const handleSongSelected = (song: Song) => {
        if (!activeSegmentId) return;
        setSegments(prev => prev.map(s => 
            s.id === activeSegmentId 
            ? { ...s, songId: song.id, title: song.title, duration: song.duration }
            : s
        ));
        setShowSongPicker(false);
    };

    const handleAddNew = () => setEditingSegment({ id: Date.now().toString(), title: '', type: 'Talk', duration: 300 });

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
                return <TalkSegmentView segment={activeSegment} onOpenTeleprompter={() => setIsTeleprompterOpen(true)} onScriptChange={handleScriptChange} />;
            case 'Music':
                return <MusicSegmentView segment={activeSegment} onSelectSongClick={() => setShowSongPicker(true)} songs={songs} />;
            case 'Ad Break':
                return <PlaceholderView segment={activeSegment} />;
            default:
                return <PlaceholderView segment={activeSegment} />;
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg text-light-text-secondary dark:text-dark-text-secondary">Total Runtime: <span className="font-bold text-light-text-primary dark:text-dark-text-primary">{formatTime(totalRuntime, true)}</span></h2>
                <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 transition-opacity shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                    <PrinterIcon className="w-5 h-5"/>
                    <span>Print Show</span>
                 </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 bg-light-surface dark:bg-dark-surface rounded-5xl p-4 space-y-2 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                     {segments.map((segment, index) => {
                        const segmentColor = segment.color || SEGMENT_COLORS[segment.type] || '#6b7280';
                        return (
                            <div
                                key={segment.id}
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => setActiveSegmentId(segment.id)}
                                className={`p-3 rounded-3xl flex items-center justify-between cursor-pointer transition-all ${activeSegmentId === segment.id ? 'ring-2' : 'hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary'}`}
                                style={{ ringColor: segmentColor }}
                            >
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{backgroundColor: segmentColor}}></div>
                                    <div className="truncate">
                                        <p className="font-semibold text-sm leading-tight truncate">{segment.title}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatTime(segment.duration)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingSegment(segment); }} className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    <button onClick={handleAddNew} className="w-full text-sm text-light-accent dark:text-dark-accent p-3 flex items-center justify-center rounded-3xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 mt-2">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add Segment
                    </button>
                </div>

                <div className="lg:col-span-2 h-[80vh] min-h-[600px]">
                    {renderContextView()}
                </div>
            </div>

            <PrintableShow segments={segments} songs={songs} totalRuntime={totalRuntime} />

            {editingSegment && (
                 <EditSegmentModal 
                    segment={editingSegment} 
                    isNew={!segments.some(s => s.id === editingSegment.id)}
                    onClose={() => setEditingSegment(null)} 
                    onSave={handleSaveSegment}
                 />
            )}
            
            {showSongPicker && activeSegment?.type === 'Music' && (
                <SongPickerModal 
                    songs={songs}
                    setSongs={setSongs}
                    segments={segments}
                    onClose={() => setShowSongPicker(false)}
                    onSelect={handleSongSelected}
                />
            )}

            {isTeleprompterOpen && activeSegment && (activeSegment.type === 'Talk' || activeSegment.type === 'Intro/Outro') && (
                <TeleprompterModal
                    segment={activeSegment}
                    onClose={() => setIsTeleprompterOpen(false)}
                    onScriptChange={handleScriptChange}
                />
            )}
        </div>
    );
};

export default Showtime;