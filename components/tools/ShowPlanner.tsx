import React, { useState, useRef, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PlusIcon, TrashIcon } from '../Icons';

type SegmentType = 'Talk' | 'Music' | 'Ad Break' | 'Intro/Outro';

interface Segment {
  id: string;
  type: SegmentType;
  title: string;
  duration: number; // in seconds
}

const SEGMENT_COLORS: Record<SegmentType, string> = {
  'Talk': 'bg-blue-500/80',
  'Music': 'bg-purple-500/80',
  'Ad Break': 'bg-yellow-500/80',
  'Intro/Outro': 'bg-green-500/80',
};

const ShowPlanner: React.FC = () => {
    const [segments, setSegments] = useLocalStorage<Segment[]>('show_planner_segments', [
        { id: '1', type: 'Intro/Outro', title: 'Show Intro', duration: 60 },
        { id: '2', type: 'Talk', title: 'Opening Monologue', duration: 300 },
        { id: '3', type: 'Music', title: 'Song 1', duration: 180 },
        { id: '4', type: 'Ad Break', title: 'Commercials', duration: 120 },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState<SegmentType>('Talk');
    const [newDuration, setNewDuration] = useState(300);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const totalRuntime = useMemo(() => segments.reduce((acc, s) => acc + s.duration, 0), [segments]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString();
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return h > '0' ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    const addSegment = () => {
        if (!newTitle) return;
        setSegments(prev => [...prev, {
            id: Date.now().toString(),
            title: newTitle,
            type: newType,
            duration: newDuration
        }]);
        setNewTitle('');
        setNewType('Talk');
        setNewDuration(300);
        setIsAdding(false);
    };

    const removeSegment = (id: string) => {
        setSegments(prev => prev.filter(s => s.id !== id));
    }
    
    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const segmentsCopy = [...segments];
        const draggedItem = segmentsCopy.splice(dragItem.current, 1)[0];
        segmentsCopy.splice(dragOverItem.current, 0, draggedItem);
        dragItem.current = null;
        dragOverItem.current = null;
        setSegments(segmentsCopy);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold">Show Planner</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Runtime: {formatTime(totalRuntime)}</p>
                </div>
                 <button onClick={() => setIsAdding(true)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-accent dark:bg-dark-accent text-white flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Segment
                </button>
            </div>
            
            <div className="bg-light-surface dark:bg-dark-surface rounded-xl p-2 space-y-2 min-h-[50vh]">
                {segments.map((segment, index) => (
                    <div 
                        key={segment.id}
                        draggable
                        onDragStart={() => dragItem.current = index}
                        onDragEnter={() => dragOverItem.current = index}
                        onDragEnd={handleDragSort}
                        onDragOver={(e) => e.preventDefault()}
                        className={`p-3 rounded-lg text-white flex justify-between items-center cursor-grab ${SEGMENT_COLORS[segment.type]}`}
                    >
                        <div className="flex items-center">
                             <div className="w-8 mr-3 text-center text-sm font-mono opacity-80">{index + 1}</div>
                             <div>
                                <p className="font-bold">{segment.title}</p>
                                <p className="text-xs opacity-90">{segment.type} - {formatTime(segment.duration)}</p>
                             </div>
                        </div>
                        <button onClick={() => removeSegment(segment.id)} className="p-1 rounded-full hover:bg-black/20"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>

            {isAdding && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsAdding(false)}>
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Add Segment</h3>
                        <div className="space-y-3">
                            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Segment Title" className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none"/>
                            <select value={newType} onChange={e => setNewType(e.target.value as SegmentType)} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none appearance-none">
                                {Object.keys(SEGMENT_COLORS).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <div>
                                <label className="text-sm font-medium">Duration: {formatTime(newDuration)}</label>
                                <input type="range" min="10" max="1800" step="10" value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value))} className="w-full mt-1"/>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-primary dark:bg-dark-primary">Cancel</button>
                                <button type="button" onClick={addSegment} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-accent dark:bg-dark-accent text-white">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShowPlanner;
