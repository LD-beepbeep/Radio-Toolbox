

import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { WidgetConfig, WidgetType, Link, Song, Recording, ProfileData } from '../../types';
import { initialProfile } from '../../data/initialData';
import { XIcon, PlusIcon, ExternalLinkIcon, TrashIcon, PlayIcon, PauseIcon, ScriptIcon, MicIcon, PlaylistIcon, BroadcastIcon, TrophyIcon } from '../Icons';

// --- WIDGET COMPONENTS ---

const WidgetWrapper: React.FC<{ title: string; onRemove?: () => void; isEditing?: boolean; children: React.ReactNode; className?: string }> = ({ title, onRemove, isEditing, children, className }) => (
  <div className={`bg-light-surface dark:bg-dark-surface rounded-2xl p-4 flex flex-col h-full relative ${className}`}>
    {isEditing && (
      <button onClick={onRemove} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 z-10 hover:opacity-90 transition-opacity">
        <XIcon className="w-4 h-4" />
      </button>
    )}
    <h3 className="text-lg font-bold mb-3 text-light-text dark:text-dark-text">{title}</h3>
    <div className="flex-grow overflow-y-auto">
      {children}
    </div>
  </div>
);

interface ScheduleItem {
  id: string;
  time: string;
  event: string;
}

const TodayScheduleWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [items, setItems] = useLocalStorage<ScheduleItem[]>('schedule_widget_items', [
        { id: '1', time: '09:00 AM', event: 'Morning Show Prep' },
        { id: '2', time: '10:00 AM', event: 'LIVE: Morning Drive' },
        { id: '3', time: '01:00 PM', event: 'Production Meeting' },
        { id: '4', time: '03:00 PM', event: 'Guest Interview: Jane Doe' },
    ]);
    const [newItemTime, setNewItemTime] = useState('');
    const [newItemEvent, setNewItemEvent] = useState('');
    const inputClasses = "bg-transparent focus:bg-light-bg dark:focus:bg-dark-primary rounded-md p-1 transition-colors w-full";

    const handleUpdate = (itemId: string, field: 'time' | 'event', value: string) => {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemTime && newItemEvent) {
            setItems(prev => [...prev, { id: Date.now().toString(), time: newItemTime, event: newItemEvent }]);
            setNewItemTime('');
            setNewItemEvent('');
        }
    };
    
    const handleRemoveItem = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    return (
        <WidgetWrapper title="Today's Schedule" onRemove={onRemove} isEditing={isEditing}>
            <ul className="space-y-3 text-sm">
                {items.map(item => (
                    <li key={item.id} className="flex items-center group">
                         <div className="w-24 mr-2">
                            <input type="text" value={item.time} onChange={e => handleUpdate(item.id, 'time', e.target.value)} className={`${inputClasses}`} />
                         </div>
                         <div className="flex-grow">
                             <input type="text" value={item.event} onChange={e => handleUpdate(item.id, 'event', e.target.value)} className={`${inputClasses} font-semibold ${item.event.toLowerCase().includes('live') ? 'text-light-accent dark:text-dark-accent' : ''}`} />
                         </div>
                        <button onClick={() => handleRemoveItem(item.id)} className="ml-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                    </li>
                ))}
            </ul>
             <form onSubmit={handleAddItem} className="flex items-center pt-3 mt-3 border-t border-light-primary/50 dark:border-dark-primary/50">
                <input type="text" value={newItemTime} onChange={e => setNewItemTime(e.target.value)} placeholder="Time" className="bg-light-bg dark:bg-dark-primary rounded-md p-1 w-20 mr-2 text-sm" />
                <input type="text" value={newItemEvent} onChange={e => setNewItemEvent(e.target.value)} placeholder="Event Name" className="bg-light-bg dark:bg-dark-primary rounded-md p-1 flex-grow text-sm" />
                <button type="submit" className="ml-2 text-light-accent dark:text-dark-accent"><PlusIcon className="w-5 h-5" /></button>
            </form>
        </WidgetWrapper>
    );
};

interface ChecklistItem {
    id: string;
    text: string;
}

const ChecklistWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [checklistItems, setChecklistItems] = useLocalStorage<ChecklistItem[]>('checklist_widget_items', [
        {id: '1', text: "Microphone Check"}, {id: '2', text: "Headphones"}, {id: '3', text: "Audio Interface"}, {id: '4', text: "Show Notes Ready"}, {id: '5', text: "Guest Confirmed"}
    ]);
    const [checkedItemIds, setCheckedItemIds] = useLocalStorage<string[]>('checklist_widget_checked_ids', []);
    const [newItemText, setNewItemText] = useState('');
    const inputClasses = "bg-transparent focus:bg-light-bg dark:focus:bg-dark-primary rounded-md p-1 transition-colors w-full text-sm";

    const handleToggle = (itemId: string) => {
        setCheckedItemIds(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
    };

    const handleUpdate = (itemId: string, text: string) => {
        setChecklistItems(prev => prev.map(item => item.id === itemId ? { ...item, text } : item));
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText) {
            setChecklistItems(prev => [...prev, { id: Date.now().toString(), text: newItemText }]);
            setNewItemText('');
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setChecklistItems(prev => prev.filter(item => item.id !== itemId));
        setCheckedItemIds(prev => prev.filter(id => id !== itemId));
    };
    
    return (
        <WidgetWrapper title="Pre-Show Checklist" onRemove={onRemove} isEditing={isEditing}>
            <ul className="space-y-3">
                {checklistItems.map(item => (
                    <li key={item.id} className="flex items-center group">
                        <input type="checkbox" id={item.id} checked={checkedItemIds.includes(item.id)} onChange={() => handleToggle(item.id)} className="h-4 w-4 rounded border-gray-300 text-light-accent focus:ring-light-accent flex-shrink-0" />
                        <div className="ml-3 flex-grow">
                            <input type="text" value={item.text} onChange={e => handleUpdate(item.id, e.target.value)} className={`${inputClasses} ${checkedItemIds.includes(item.id) ? 'line-through text-gray-500' : ''}`}/>
                        </div>
                        <button onClick={() => handleRemoveItem(item.id)} className="ml-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                    </li>
                ))}
            </ul>
             <form onSubmit={handleAddItem} className="flex items-center pt-3 mt-3 border-t border-light-primary/50 dark:border-dark-primary/50">
                <input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="Add new item..." className="bg-light-bg dark:bg-dark-primary rounded-md p-1 flex-grow text-sm"/>
                <button type="submit" className="ml-2 text-light-accent dark:text-dark-accent"><PlusIcon className="w-5 h-5"/></button>
            </form>
        </WidgetWrapper>
    );
};

const GuestCardWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [name, setName] = useLocalStorage('guest_name', '');
    const [topic, setTopic] = useLocalStorage('guest_topic', '');
    const [notes, setNotes] = useLocalStorage('guest_notes', '');

    return (
        <WidgetWrapper title="On-Air Guest Card" onRemove={onRemove} isEditing={isEditing}>
            <div className="space-y-2">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Guest Name" className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm"/>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic of Discussion" className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm"/>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes & Questions..." rows={4} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm resize-none"></textarea>
            </div>
        </WidgetWrapper>
    );
};

const QuickLinksWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
  const [links, setLinks] = useLocalStorage<Link[]>('quick_links', [{id: '1', title: 'Google News', url: 'https://news.google.com'}]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addLink = () => {
    if (newTitle && newUrl) {
      setLinks(prev => [...prev, { id: Date.now().toString(), title: newTitle, url: newUrl }]);
      setNewTitle('');
      setNewUrl('');
      setIsAdding(false);
    }
  };

  const removeLink = (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
  };

  return (
    <WidgetWrapper title="Quick Links" onRemove={onRemove} isEditing={isEditing}>
      <div className="space-y-2">
        {links.map(link => (
          <div key={link.id} className="flex items-center justify-between bg-light-bg dark:bg-dark-primary rounded-lg p-2 group">
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate flex-grow">{link.title}</a>
            {isEditing ? (
              <button onClick={() => removeLink(link.id)} className="text-destructive ml-2">
                <TrashIcon className="w-4 h-4" />
              </button>
            ) : (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-light-secondary dark:text-dark-secondary ml-2 group-hover:text-light-accent dark:group-hover:text-dark-accent">
                    <ExternalLinkIcon className="w-4 h-4"/>
                </a>
            )}
          </div>
        ))}
        {isEditing && (
            isAdding ? (
                 <div className="p-2 space-y-2">
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="w-full bg-light-surface dark:bg-dark-surface rounded-lg p-2 text-sm"/>
                    <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="w-full bg-light-surface dark:bg-dark-surface rounded-lg p-2 text-sm"/>
                    <div className="flex space-x-2">
                        <button onClick={addLink} className="bg-light-accent text-white text-sm px-3 py-1 rounded-md">Add</button>
                        <button onClick={() => setIsAdding(false)} className="bg-light-primary dark:bg-dark-primary text-sm px-3 py-1 rounded-md">Cancel</button>
                    </div>
                 </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full text-sm text-light-accent dark:text-dark-accent p-2 flex items-center justify-center">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Link
                </button>
            )
        )}
      </div>
    </WidgetWrapper>
  );
};

const StudioClockWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [time, setTime] = useState(new Date());
    const [stopwatch, setStopwatch] = useState({ time: 0, isRunning: false });
    const [laps, setLaps] = useState<number[]>([]);
    const stopwatchIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    
    useEffect(() => {
        if (stopwatch.isRunning) {
            stopwatchIntervalRef.current = window.setInterval(() => {
                setStopwatch(s => ({ ...s, time: s.time + 10 }));
            }, 10);
        } else {
            if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
        }
        return () => {
            if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
        };
    }, [stopwatch.isRunning]);

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        const ms = (Math.floor(milliseconds / 10) % 100).toString().padStart(2, '0');
        return `${minutes}:${seconds}.${ms}`;
    };

    const handleStopwatchToggle = () => setStopwatch(s => ({ ...s, isRunning: !s.isRunning }));
    const handleStopwatchReset = () => { setStopwatch({ time: 0, isRunning: false }); setLaps([]); };
    const handleLap = () => setLaps(l => [...l, stopwatch.time]);

    return (
        <WidgetWrapper title="Studio Clock" onRemove={onRemove} isEditing={isEditing} className="h-auto md:col-span-2">
            <div className="text-center">
                <div className="text-5xl font-bold font-mono tracking-tighter mb-4">{time.toLocaleTimeString()}</div>
            </div>
            <div className="border-t border-light-primary dark:border-dark-primary pt-3 mt-3">
                 <h4 className="font-bold text-center mb-2">Stopwatch</h4>
                 <div className="text-3xl font-mono text-center mb-3">{formatTime(stopwatch.time)}</div>
                 <div className="flex justify-center space-x-2 mb-2">
                     <button onClick={handleStopwatchToggle} className={`w-20 px-3 py-1 text-sm rounded-md ${stopwatch.isRunning ? 'bg-destructive text-white' : 'bg-light-accent text-white'}`}>{stopwatch.isRunning ? 'Stop' : 'Start'}</button>
                     <button onClick={handleStopwatchReset} className="w-20 px-3 py-1 text-sm rounded-md bg-light-primary dark:bg-dark-primary">Reset</button>
                     <button onClick={handleLap} disabled={!stopwatch.isRunning} className="w-20 px-3 py-1 text-sm rounded-md bg-light-secondary dark:bg-dark-secondary disabled:opacity-50">Lap</button>
                 </div>
                 {laps.length > 0 && <div className="text-xs text-center font-mono text-light-secondary dark:text-dark-secondary h-12 overflow-y-auto">
                    {laps.map((lap, i) => <div key={i}>Lap {i+1}: {formatTime(lap)}</div>)}
                 </div>}
            </div>
        </WidgetWrapper>
    );
};

const OnAirStatusWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [isOnAir, setIsOnAir] = useLocalStorage('on_air_status', false);
    return (
        <WidgetWrapper title="On-Air Status" onRemove={onRemove} isEditing={isEditing}>
            <div className="flex flex-col items-center justify-center h-full">
                <button 
                    onClick={() => setIsOnAir(prev => !prev)}
                    className={`w-full h-full text-white font-bold text-2xl rounded-lg transition-colors flex items-center justify-center ${isOnAir ? 'bg-destructive' : 'bg-gray-500'}`}
                >
                    {isOnAir ? 'ON AIR' : 'OFF AIR'}
                </button>
            </div>
        </WidgetWrapper>
    );
};

const BroadcastHoursWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [profile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
    return (
        <WidgetWrapper title="Broadcast Hours" onRemove={onRemove} isEditing={isEditing}>
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl font-bold text-light-accent dark:text-dark-accent">{profile.broadcastHours || 0}</div>
                <div className="text-sm text-gray-500">Total Hours Logged</div>
            </div>
        </WidgetWrapper>
    );
};

const PlaylistPreviewWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [songs] = useLocalStorage<Song[]>('playlist', []);
    const upcomingSongs = songs.slice(0, 2);

    return (
        <WidgetWrapper title="Up Next" onRemove={onRemove} isEditing={isEditing}>
            {upcomingSongs.length > 0 ? (
                <ul className="space-y-2">
                    {upcomingSongs.map(song => (
                        <li key={song.id} className="p-2 bg-light-bg dark:bg-dark-primary rounded-md">
                            <p className="font-semibold text-sm truncate">{song.title}</p>
                            <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-sm text-gray-400 h-full flex items-center justify-center">Playlist is empty.</div>
            )}
        </WidgetWrapper>
    );
};

const RecentMemoWidget: React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }> = ({ id, onRemove, isEditing }) => {
    const [recordings] = useLocalStorage<Recording[]>('voicememo_recordings', []);
    const latestRecording = recordings[0];
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = () => {
        if (!latestRecording) return;
        
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const url = URL.createObjectURL(latestRecording.blob);
            const newAudio = new Audio(url);
            audioRef.current = newAudio;
            newAudio.play();
            newAudio.onended = () => setIsPlaying(false);
            setIsPlaying(true);
        }
    };
    
    return (
        <WidgetWrapper title="Recent Memo" onRemove={onRemove} isEditing={isEditing}>
            {latestRecording ? (
                <div className="flex items-center justify-between h-full">
                    <div className="flex-grow truncate pr-2">
                        <p className="font-semibold text-sm truncate">{latestRecording.name}</p>
                        <p className="text-xs text-gray-500">{new Date(latestRecording.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={handlePlay} className="flex-shrink-0 w-12 h-12 bg-light-accent dark:bg-dark-accent text-white rounded-full flex items-center justify-center">
                        {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                    </button>
                </div>
            ) : (
                <div className="text-center text-sm text-gray-400 h-full flex items-center justify-center">No recordings yet.</div>
            )}
        </WidgetWrapper>
    );
};


// --- WIDGET MAPPING ---
const WIDGET_COMPONENTS: Record<WidgetType, React.FC<{ id: string, onRemove?: () => void, isEditing?: boolean }>> = {
  [WidgetType.Schedule]: TodayScheduleWidget,
  [WidgetType.Checklist]: ChecklistWidget,
  [WidgetType.GuestCard]: GuestCardWidget,
  [WidgetType.StudioClock]: StudioClockWidget,
  [WidgetType.QuickLinks]: QuickLinksWidget,
  [WidgetType.OnAirStatus]: OnAirStatusWidget,
  [WidgetType.BroadcastHours]: BroadcastHoursWidget,
  [WidgetType.PlaylistPreview]: PlaylistPreviewWidget,
  [WidgetType.RecentMemo]: RecentMemoWidget,
};

type WidgetInfo = {
    type: WidgetType;
    gridSpan: number;
    description: string;
    preview: React.ReactNode;
};

const ALL_WIDGETS: WidgetInfo[] = [
    { type: WidgetType.StudioClock, gridSpan: 2, description: "Real-time clock and stopwatch.", preview: <div className="text-center"><div className="text-3xl font-mono">10:09</div><div className="text-sm text-gray-400">01:30.45</div></div> },
    { type: WidgetType.Schedule, gridSpan: 1, description: "Keep track of your show's segments.", preview: <ul className="text-xs space-y-1"><li>10:00 AM: Live</li><li>11:00 AM: Guest</li></ul> },
    { type: WidgetType.Checklist, gridSpan: 1, description: "Ensure you're ready to go live.", preview: <ul className="text-xs space-y-1"><li>☑ Mic Check</li><li>☐ Show Notes</li></ul> },
    { type: WidgetType.GuestCard, gridSpan: 1, description: "Jot down notes for your guest.", preview: <div className="text-xs space-y-1"><div className="font-semibold">Jane Doe</div><div>Topic: New Book</div></div> },
    { type: WidgetType.QuickLinks, gridSpan: 1, description: "Access important websites quickly.", preview: <div className="text-xs space-y-1"><div className="flex items-center">News <ExternalLinkIcon className="w-3 h-3 ml-1"/></div><div className="flex items-center">Weather <ExternalLinkIcon className="w-3 h-3 ml-1"/></div></div>},
    { type: WidgetType.OnAirStatus, gridSpan: 1, description: "Toggle your on-air status.", preview: <div className="w-full h-full flex items-center justify-center bg-red-500 text-white font-bold rounded-md text-sm">ON AIR</div> },
    { type: WidgetType.BroadcastHours, gridSpan: 1, description: "Display total hours from profile.", preview: <div className="text-center"><div className="text-2xl font-bold">1250</div><div className="text-xs">HOURS</div></div> },
    { type: WidgetType.PlaylistPreview, gridSpan: 1, description: "See the next songs in your playlist.", preview: <div className="text-xs space-y-1"><div className="font-semibold">Song 1</div><div>Song 2</div></div> },
    { type: WidgetType.RecentMemo, gridSpan: 1, description: "Quick access to your last memo.", preview: <div className="flex items-center text-xs"><MicIcon className="w-4 h-4 mr-2"/> Latest Memo</div> },
];


// --- DASHBOARD ---
const Dashboard: React.FC = () => {
    const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>('dashboard_widgets', [
        { id: '1', type: WidgetType.StudioClock, gridSpan: 2 },
        { id: 'a', type: WidgetType.OnAirStatus, gridSpan: 1 },
        { id: 'b', type: WidgetType.BroadcastHours, gridSpan: 1 },
        { id: '2', type: WidgetType.Schedule, gridSpan: 1 },
        { id: '3', type: WidgetType.Checklist, gridSpan: 1 },
        { id: 'c', type: WidgetType.PlaylistPreview, gridSpan: 1 },
        { id: 'd', type: WidgetType.RecentMemo, gridSpan: 1 },

    ]);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddSheet, setShowAddSheet] = useState(false);

    const addWidget = (widget: {type: WidgetType, gridSpan: number}) => {
        setWidgets(prev => [...prev, { ...widget, id: Date.now().toString() }]);
        setShowAddSheet(false);
    };

    const removeWidget = (id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    };

    const availableWidgets = ALL_WIDGETS.filter(aw => !widgets.some(w => w.type === aw.type));

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-primary dark:bg-dark-primary hover:opacity-90 transition-opacity">{isEditing ? 'Done' : 'Edit'}</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {widgets.map(widget => {
                    const Component = WIDGET_COMPONENTS[widget.type];
                    return (
                        <div key={widget.id} className={widget.gridSpan === 2 ? 'md:col-span-2' : ''}>
                           <Component id={widget.id} isEditing={isEditing} onRemove={() => removeWidget(widget.id)} />
                        </div>
                    )
                })}
                {isEditing && (
                     <button onClick={() => setShowAddSheet(true)} className="border-2 border-dashed border-light-secondary dark:border-dark-secondary rounded-2xl flex flex-col items-center justify-center p-6 text-light-secondary dark:text-dark-secondary hover:bg-light-primary dark:hover:bg-dark-primary transition-colors h-full min-h-[120px]">
                        <PlusIcon className="w-8 h-8 mb-2" />
                        <span className="font-semibold">Add Widget</span>
                    </button>
                )}
            </div>

            {showAddSheet && (
                <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAddSheet(false)}>
                    <div className="fixed bottom-0 left-0 right-0 bg-light-surface dark:bg-dark-surface p-4 rounded-t-2xl max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-light-secondary dark:bg-dark-secondary rounded-full mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold mb-4 text-center">Add a Widget</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableWidgets.map(widget => (
                                <button key={widget.type} onClick={() => addWidget(widget)} className="bg-light-bg dark:bg-dark-primary p-4 rounded-xl text-left hover:bg-light-primary/80 dark:hover:bg-dark-primary/80 transition-colors space-y-2">
                                    <h4 className="font-semibold">{widget.type}</h4>
                                    <div className="h-16 w-full bg-light-surface dark:bg-dark-surface rounded-lg flex items-center justify-center p-2">
                                        {widget.preview}
                                    </div>
                                    <p className="text-xs text-light-secondary dark:text-dark-secondary">{widget.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;