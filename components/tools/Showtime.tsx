



import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Segment, SegmentType, Song, ProfileData } from '../../types';
import { PlusIcon, TrashIcon, PlayIcon, PauseIcon, MusicIcon, XIcon, ScriptIcon, PrinterIcon, CalendarDaysIcon, SearchIcon, ChevronRightIcon } from '../Icons';
import { initialShowsData, initialProfile } from '../../data/initialData';
import { songDatabase } from '../../data/songDatabase';

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

const PrintableShow: React.FC<{ segments: Segment[], songs: Song[], showName: string }> = ({ segments, songs, showName }) => {
    const totalRuntime = segments.reduce((acc, s) => acc + s.duration, 0);
    const allSongs = [...songs, ...songDatabase];
    return (
    <div id="printable-show">
        <div className="print-show-header">
            <h1>{showName} - Rundown</h1>
            <p>Total Runtime: {formatTime(totalRuntime, true)}</p>
        </div>
        {segments.map((segment, index) => {
            const song = segment.songId ? allSongs.find(s => s.id === segment.songId) : null;
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
    )
};


const TeleprompterModal: React.FC<{
    segment: Segment;
    onClose: () => void;
}> = ({ segment, onClose }) => {
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

const SongBrowser: React.FC<{
  onSelect: (song: Song) => void;
  localSongs: Song[];
  setLocalSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  usedSongIds: Set<string | undefined>;
}> = ({ onSelect, localSongs, setLocalSongs, usedSongIds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newArtist && newDuration) {
      const newSong: Song = {
        id: `local_${Date.now()}`,
        title: newTitle,
        artist: newArtist,
        duration: parseInt(newDuration, 10),
      };
      setLocalSongs(prev => [newSong, ...prev]);
      setNewTitle('');
      setNewArtist('');
      setNewDuration('');
      setShowAddForm(false);
    }
  };
  
  const filteredDiscoverSongs = songDatabase.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLocalSongs = localSongs.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SongListItem: React.FC<{ song: Song, isUsed: boolean }> = ({ song, isUsed }) => (
    <button
      onClick={() => onSelect(song)}
      disabled={isUsed}
      className={`w-full text-left p-3 flex items-center justify-between rounded-3xl transition-colors ${isUsed ? 'bg-light-surface/50 dark:bg-dark-surface/50 opacity-50 cursor-not-allowed' : 'bg-light-bg-primary dark:bg-dark-bg-secondary hover:bg-light-accent-subtle dark:hover:bg-dark-accent-subtle'}`}
    >
      <div>
        <p className="font-semibold text-sm">{song.title}</p>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
      </div>
      <span className="text-xs font-mono">{formatTime(song.duration)}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full">
      <h3 className="text-xl font-bold text-center mb-4 flex-shrink-0">Select a Song</h3>
      <div className="relative mb-4 flex-shrink-0">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary"/>
        <input 
          type="text" 
          placeholder="Search for a song..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-full pl-10 pr-4 py-2 text-sm border border-light-divider dark:border-dark-divider"
        />
      </div>

      <div className="flex-grow overflow-y-auto space-y-4 -mx-2 px-2">
        {filteredLocalSongs.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 px-2 text-light-text-secondary dark:text-dark-text-secondary">Your Library</h4>
            <div className="space-y-2">
              {filteredLocalSongs.map(song => <SongListItem key={song.id} song={song} isUsed={usedSongIds.has(song.id)} />)}
            </div>
          </div>
        )}
        {filteredDiscoverSongs.length > 0 && (
           <div>
            <h4 className="font-semibold text-sm mb-2 px-2 text-light-text-secondary dark:text-dark-text-secondary">Discover</h4>
            <div className="space-y-2">
              {filteredDiscoverSongs.map(song => <SongListItem key={song.id} song={song} isUsed={usedSongIds.has(song.id)} />)}
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-4 mt-auto border-t border-light-divider dark:border-dark-divider flex-shrink-0">
        {showAddForm ? (
            <form onSubmit={handleAddSong} className="space-y-2">
                <p className="text-sm font-semibold text-center">Add New Song</p>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" required className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-xl p-2 text-sm"/>
                <input type="text" value={newArtist} onChange={e => setNewArtist(e.target.value)} placeholder="Artist" required className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-xl p-2 text-sm"/>
                <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="Duration (sec)" required className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-xl p-2 text-sm"/>
                <div className="flex space-x-2">
                     <button type="button" onClick={() => setShowAddForm(false)} className="w-full py-2 text-sm rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                     <button type="submit" className="w-full py-2 text-sm rounded-full bg-light-accent text-white">Add</button>
                </div>
            </form>
        ) : (
            <button onClick={() => setShowAddForm(true)} className="w-full text-sm text-light-accent dark:text-dark-accent p-2 flex items-center justify-center rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10">
                <PlusIcon className="w-4 h-4 mr-1" /> Can't find a song? Add it to your library.
            </button>
        )}
      </div>
    </div>
  );
};


const MusicSegmentView: React.FC<{ 
    segment: Segment; 
    onSongUpdate: (songId: string | undefined, title: string, duration: number) => void;
    localSongs: Song[];
    setLocalSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    allSongs: Song[];
    usedSongIds: Set<string|undefined>;
}> = ({ segment, onSongUpdate, localSongs, setLocalSongs, allSongs, usedSongIds }) => {
    const [isSelectingSong, setIsSelectingSong] = useState(!segment.songId);
    const song = allSongs.find(s => s.id === segment.songId);

    const handleSelect = (selectedSong: Song) => {
        onSongUpdate(selectedSong.id, selectedSong.title, selectedSong.duration);
        setIsSelectingSong(false);
    }
    
    const handleChangeSong = () => {
        setIsSelectingSong(true);
    }

    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
            {!isSelectingSong ? (
                <div className="flex flex-col items-center justify-center text-center flex-grow">
                    <h3 className="text-3xl font-bold">{segment.title}</h3>
                    {song ? (
                        <>
                            <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary mt-1">{song.title}</p>
                            <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                        </>
                    ) : (
                        <MusicIcon className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary my-4" />
                    )}
                    <p className="text-6xl font-mono mt-4">{formatTime(segment.duration)}</p>
                    <button onClick={handleChangeSong} className="mt-6 px-4 py-2 text-sm font-semibold rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary hover:bg-light-divider dark:hover:bg-dark-divider">
                        {song ? 'Change Song' : 'Select Song'}
                    </button>
                </div>
            ) : (
                <SongBrowser onSelect={handleSelect} localSongs={localSongs} setLocalSongs={setLocalSongs} usedSongIds={usedSongIds} />
            )}
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

const EditScheduleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    profile: ProfileData;
    setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
    setShowsData: React.Dispatch<React.SetStateAction<Record<string, Segment[]>>>;
    setSelectedShowId: (id: string | null) => void;
    selectedShowId: string | null;
}> = ({ isOpen, onClose, profile, setProfile, setShowsData, setSelectedShowId, selectedShowId }) => {
    if (!isOpen) return null;

    const [localSchedule, setLocalSchedule] = useState(profile.weeklySchedule);

    const handleUpdate = (id: string, field: 'day' | 'time' | 'show', value: string) => {
        setLocalSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAdd = () => {
        const newId = `sched_${Date.now()}`;
        const newItem = { id: newId, day: 'New Day', time: '00:00', show: 'New Show' };
        setLocalSchedule(prev => [...prev, newItem]);
        setShowsData(prev => ({ ...prev, [newId]: [] }));
    };

    const handleDelete = (idToDelete: string) => {
        setLocalSchedule(prev => prev.filter(item => item.id !== idToDelete));
        setShowsData(prev => {
            const newData = { ...prev };
            delete newData[idToDelete];
            return newData;
        });
        if (selectedShowId === idToDelete) {
            const newSchedule = localSchedule.filter(s => s.id !== idToDelete);
            setSelectedShowId(newSchedule[0]?.id || null);
        }
    };

    const handleSave = () => {
        setProfile(prev => ({ ...prev, weeklySchedule: localSchedule }));
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleSave}>
            <div className="bg-light-bg-primary dark:bg-dark-bg-secondary rounded-6xl p-5 w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4 flex-shrink-0"></div>
                <h3 className="text-xl font-bold text-center mb-4 flex-shrink-0">Edit Weekly Schedule</h3>
                <div className="flex-grow overflow-y-auto space-y-3">
                    {localSchedule.map(item => (
                        <div key={item.id} className="p-3 bg-light-surface dark:bg-dark-surface rounded-3xl flex items-center space-x-2">
                            <input value={item.show} onChange={e => handleUpdate(item.id, 'show', e.target.value)} placeholder="Show Name" className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-xl p-2 text-sm"/>
                            <input value={item.day} onChange={e => handleUpdate(item.id, 'day', e.target.value)} placeholder="Day(s)" className="w-1/2 bg-light-bg-primary dark:bg-dark-bg-secondary rounded-xl p-2 text-sm"/>
                            <input value={item.time} onChange={e => handleUpdate(item.id, 'time', e.target.value)} placeholder="Time" className="w-1/3 bg-light-bg-primary dark:bg-dark-bg-secondary rounded-xl p-2 text-sm"/>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-destructive rounded-full hover:bg-destructive/10"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                    <button onClick={handleAdd} className="w-full text-sm text-light-accent dark:text-dark-accent p-3 flex items-center justify-center rounded-3xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 mt-2">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add Show
                    </button>
                </div>
                 <button onClick={handleSave} className="mt-4 w-full px-5 py-3 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Done</button>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const Showtime: React.FC = () => {
    const [profile, setProfile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
    const [showsData, setShowsData] = useLocalStorage<Record<string, Segment[]>>('shows_data', initialShowsData);
    const [localSongs, setLocalSongs] = useLocalStorage<Song[]>('playlist', []);
    const [selectedShowId, setSelectedShowId] = useState<string | null>(profile.weeklySchedule[0]?.id || null);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isOnAir, setIsOnAir] = useState(false);
    const [onAirTimeLeft, setOnAirTimeLeft] = useState(0);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    // FIX: Hoisted `segments` declaration above the `useEffect` hooks that depend on it
    // to resolve a "used before declaration" error.
    const segments = useMemo(() => {
        if (!selectedShowId || !showsData[selectedShowId]) return [];
        return showsData[selectedShowId];
    }, [selectedShowId, showsData]);

    // ON AIR Timer Logic
    useEffect(() => {
        const activeSegment = segments.find(s => s.id === activeSegmentId);
        if (isOnAir && activeSegment) {
            setOnAirTimeLeft(activeSegment.duration);
            
            timerIntervalRef.current = window.setInterval(() => {
                setOnAirTimeLeft(prev => {
                    if (prev <= 1) {
                        if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }

        return () => {
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    }, [isOnAir, activeSegmentId, segments]);

    // Set initial active segment when a show is selected
    useEffect(() => {
        if(selectedShowId && showsData[selectedShowId]?.length > 0){
            setActiveSegmentId(showsData[selectedShowId][0].id);
        } else {
            setActiveSegmentId(null);
        }
    }, [selectedShowId, showsData]);

    // Open schedule modal on first run if no shows exist
    useEffect(() => {
        if (profile.weeklySchedule.length === 0) {
            setIsScheduleModalOpen(true);
        }
    }, [profile.weeklySchedule.length]);

    const selectedShow = useMemo(() => profile.weeklySchedule.find(s => s.id === selectedShowId), [profile.weeklySchedule, selectedShowId]);
    const activeSegment = useMemo(() => segments.find(s => s.id === activeSegmentId), [segments, activeSegmentId]);
    const totalRuntime = useMemo(() => segments.reduce((acc, s) => acc + s.duration, 0), [segments]);
    const activeSegmentIndex = useMemo(() => segments.findIndex(s => s.id === activeSegmentId), [segments, activeSegmentId]);
    const nextSegment = useMemo(() => (activeSegmentIndex > -1 && activeSegmentIndex < segments.length - 1) ? segments[activeSegmentIndex + 1] : null, [segments, activeSegmentIndex]);

    const setSegmentsForCurrentShow = (newSegments: Segment[] | ((prev: Segment[]) => Segment[])) => {
        if (!selectedShowId) return;
        setShowsData(prev => {
            const currentShowSegments = prev[selectedShowId] || [];
            const updatedSegments = typeof newSegments === 'function' ? newSegments(currentShowSegments) : newSegments;
            return { ...prev, [selectedShowId]: updatedSegments };
        });
    };

    const handleNextSegment = () => {
        if (nextSegment) {
            setActiveSegmentId(nextSegment.id);
        }
    };

    const handleSaveSegment = (segmentToSave: Segment) => {
        if (!segmentToSave.title) return;
        const exists = segments.some(s => s.id === segmentToSave.id);
        if (exists) {
            setSegmentsForCurrentShow(prev => prev.map(s => s.id === segmentToSave.id ? segmentToSave : s));
        } else {
            setSegmentsForCurrentShow(prev => [...prev, segmentToSave]);
            setActiveSegmentId(segmentToSave.id);
        }
        setEditingSegment(null);
    };

    const handleScriptChange = (newScript: string) => {
        if (!activeSegmentId) return;
        setSegmentsForCurrentShow(prev => prev.map(s => s.id === activeSegmentId ? { ...s, script: newScript } : s));
    };
    
    const handleAddNew = () => setEditingSegment({ id: Date.now().toString(), title: '', type: 'Talk', duration: 300 });

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newSegments = [...segments];
        const draggedItem = newSegments.splice(dragItem.current, 1)[0];
        newSegments.splice(dragOverItem.current, 0, draggedItem);
        dragItem.current = null;
        dragOverItem.current = null;
        setSegmentsForCurrentShow(newSegments);
    };

    const renderContextView = () => {
        if (!selectedShowId) return <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full items-center justify-center text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider"><p className="text-light-text-secondary dark:text-dark-text-secondary">Select a show to get started.</p></div>;
        if (!activeSegment) return <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 flex flex-col h-full items-center justify-center text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider"><p className="text-light-text-secondary dark:text-dark-text-secondary">This show has no segments. Click 'Add Segment' to begin.</p></div>;
        
        switch (activeSegment.type) {
            case 'Talk':
            case 'Intro/Outro':
                return <TalkSegmentView segment={activeSegment} onOpenTeleprompter={() => setIsTeleprompterOpen(true)} onScriptChange={handleScriptChange} />;
            case 'Music':
                const allSongs = [...localSongs, ...songDatabase];
                const usedSongIds = new Set(segments.map(s => s.songId).filter(Boolean));
                return <MusicSegmentView 
                    segment={activeSegment} 
                    onSongUpdate={(songId, title, duration) => {
                        if (!activeSegmentId) return;
                        setSegmentsForCurrentShow(prev => prev.map(s => 
                            s.id === activeSegmentId 
                            ? { ...s, songId, duration, title }
                            : s
                        ));
                    }} 
                    localSongs={localSongs} 
                    setLocalSongs={setLocalSongs}
                    allSongs={allSongs}
                    usedSongIds={usedSongIds}
                />;
            case 'Ad Break':
            default:
                return <PlaceholderView segment={activeSegment} />;
        }
    };

    if (isOnAir) {
        const timerColor = onAirTimeLeft <= 10 ? 'text-destructive' : 'text-light-text-primary dark:text-dark-text-primary';
        const allSongs = [...localSongs, ...songDatabase];
        const songForActiveSegment = activeSegment?.songId ? allSongs.find(s => s.id === activeSegment.songId) : null;
        
        return (
            <div className="fixed inset-0 bg-light-bg-primary dark:bg-dark-bg-secondary z-[60] flex flex-col p-4">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                        <span className="font-bold text-destructive">ON AIR</span>
                    </div>
                    <button onClick={() => setIsOnAir(false)} className="px-4 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface">Exit ON AIR Mode</button>
                </div>

                <div className="flex-grow bg-light-surface dark:bg-dark-surface rounded-5xl shadow-soft dark:shadow-none dark:border dark:border-dark-divider p-6 flex flex-col justify-between">
                    {activeSegment ? (
                        <>
                            <div className="text-center">
                                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">{activeSegment.title}</h2>
                                <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mt-1">{activeSegment.type}</p>
                            </div>

                            <div className="text-center">
                                <p className={`font-mono text-8xl lg:text-9xl font-bold tracking-tighter transition-colors ${timerColor}`}>
                                    {formatTime(onAirTimeLeft)}
                                </p>
                            </div>
                            
                            <div className="h-48 overflow-y-auto bg-light-bg-primary dark:bg-dark-bg-secondary p-4 rounded-4xl text-lg leading-relaxed">
                                {activeSegment.type === 'Music' && songForActiveSegment ? (
                                    <div className="text-center">
                                        <p className="font-bold">{songForActiveSegment.title}</p>
                                        <p>{songForActiveSegment.artist}</p>
                                    </div>
                                ) : (
                                    activeSegment.script || "No script for this segment."
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">UP NEXT:</p>
                                    <p className="font-bold">{nextSegment ? nextSegment.title : 'End of Show'}</p>
                                </div>
                                <button onClick={handleNextSegment} disabled={!nextSegment} className="flex items-center space-x-2 px-6 py-4 text-lg font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white disabled:opacity-50">
                                    <span>Next</span>
                                    <ChevronRightIcon className="w-6 h-6"/>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-light-text-secondary dark:text-dark-text-secondary">No segment selected.</div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full sm:w-auto">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full sm:w-64 text-left flex justify-between items-center px-4 py-2 font-semibold rounded-full bg-light-surface dark:bg-dark-surface shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                        <span>{selectedShow ? selectedShow.show : "Select a Show"}</span>
                        <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full sm:w-64 bg-light-surface dark:bg-dark-surface shadow-lg rounded-3xl p-2 z-50 border dark:border-dark-divider">
                            {profile.weeklySchedule.map(show => (
                                <button key={show.id} onClick={() => { setSelectedShowId(show.id); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-2xl hover:bg-light-accent-subtle dark:hover:bg-dark-accent-subtle">
                                    <p className="font-semibold">{show.show}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{show.day} @ {show.time}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                     <label className="flex items-center cursor-pointer bg-light-surface dark:bg-dark-surface p-1 pr-3 rounded-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                        <input type="checkbox" checked={isOnAir} onChange={() => setIsOnAir(!isOnAir)} className="sr-only peer" />
                        <div className="w-8 h-8 rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary peer-checked:bg-destructive transition-colors flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-light-text-secondary dark:text-dark-text-secondary peer-checked:bg-white transition-colors"></div>
                        </div>
                        <span className="ml-2 text-sm font-bold peer-checked:text-destructive">ON AIR</span>
                    </label>
                    <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center space-x-2 p-2.5 rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 shadow-soft dark:shadow-none dark:border dark:border-dark-divider"><CalendarDaysIcon className="w-5 h-5"/></button>
                    <button onClick={() => window.print()} className="flex items-center space-x-2 p-2.5 rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 shadow-soft dark:shadow-none dark:border dark:border-dark-divider"><PrinterIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 bg-light-surface dark:bg-dark-surface rounded-5xl p-4 space-y-2 shadow-soft dark:shadow-none dark:border dark:border-dark-divider h-full max-h-[calc(100vh-250px)] lg:max-h-none lg:h-auto flex flex-col">
                     <div className="flex-shrink-0 text-center py-2">
                        <h3 className="font-bold text-lg">{selectedShow?.show || 'No Show Selected'}</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total: {formatTime(totalRuntime)}</p>
                     </div>
                     <div className="flex-grow overflow-y-auto space-y-2 -mx-2 px-2">
                        {segments.map((segment, index) => {
                            const segmentColor = segment.color || SEGMENT_COLORS[segment.type] || '#6b7280';
                            const isActive = activeSegmentId === segment.id;
                            return (
                                <div
                                    key={segment.id}
                                    draggable
                                    onDragStart={() => dragItem.current = index}
                                    onDragEnter={() => dragOverItem.current = index}
                                    onDragEnd={handleDragSort}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => setActiveSegmentId(segment.id)}
                                    className={`p-3 rounded-3xl flex items-center justify-between cursor-pointer transition-all border-2 ${isActive ? 'bg-light-bg-primary dark:bg-dark-bg-secondary' : 'border-transparent hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary'}`}
                                    style={isActive ? { borderColor: segmentColor } : {}}
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{backgroundColor: segmentColor}}></div>
                                        <div className="truncate">
                                            <p className="font-semibold text-sm leading-tight truncate">{segment.title}</p>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatTime(segment.duration)}</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingSegment(segment); }} className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                    {selectedShowId && (
                        <button onClick={handleAddNew} className="flex-shrink-0 w-full text-sm text-light-accent dark:text-dark-accent p-3 flex items-center justify-center rounded-3xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 mt-2">
                            <PlusIcon className="w-4 h-4 mr-1" /> Add Segment
                        </button>
                    )}
                </div>

                <div className="lg:col-span-2 h-[60vh] lg:h-full min-h-[500px]">
                    {renderContextView()}
                </div>
            </div>

            {selectedShow && <PrintableShow segments={segments} songs={localSongs} showName={selectedShow.show} />}
            
            <EditScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                profile={profile}
                setProfile={setProfile}
                setShowsData={setShowsData}
                selectedShowId={selectedShowId}
                setSelectedShowId={setSelectedShowId}
            />

            {editingSegment && (
                 <EditSegmentModal 
                    segment={editingSegment} 
                    isNew={!segments.some(s => s.id === editingSegment.id)}
                    onClose={() => setEditingSegment(null)} 
                    onSave={handleSaveSegment}
                 />
            )}
            
            {isTeleprompterOpen && activeSegment && (activeSegment.type === 'Talk' || activeSegment.type === 'Intro/Outro') && (
                <TeleprompterModal
                    segment={activeSegment}
                    onClose={() => setIsTeleprompterOpen(false)}
                />
            )}
        </div>
    );
};

export default Showtime;