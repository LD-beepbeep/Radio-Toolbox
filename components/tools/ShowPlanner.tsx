

import React, { useState, useRef, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Segment, SegmentType } from '../../types';
import { PlusIcon, TrashIcon } from '../Icons';
import { initialSegments } from '../../data/initialData';

const SEGMENT_COLORS: Record<SegmentType, string> = {
  'Talk': 'bg-blue-500/80',
  'Music': 'bg-purple-500/80',
  'Ad Break': 'bg-yellow-500/80',
  'Intro/Outro': 'bg-green-500/80',
};

const ShowPlanner: React.FC = () => {
    const [segments, setSegments] = useLocalStorage<Segment[]>('show_planner_segments', initialSegments);
    
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const totalRuntime = useMemo(() => segments.reduce((acc, s) => acc + s.duration, 0), [segments]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString();
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return h > '0' ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    const handleSaveSegment = (segmentToSave: Segment) => {
        if (!segmentToSave.title) return;
        
        const exists = segments.some(s => s.id === segmentToSave.id);
        if (exists) {
            setSegments(prev => prev.map(s => s.id === segmentToSave.id ? segmentToSave : s));
        } else {
            setSegments(prev => [...prev, segmentToSave]);
        }
        setEditingSegment(null);
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

    const handleAddNew = () => {
        setEditingSegment({
            id: Date.now().toString(),
            title: '',
            type: 'Talk',
            duration: 300
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold">Show Planner</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Runtime: {formatTime(totalRuntime)}</p>
                </div>
                 <button onClick={handleAddNew} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-accent dark:bg-dark-accent text-white flex items-center">
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
                        className={`p-3 rounded-lg text-white flex justify-between items-center cursor-pointer`}
                        style={{ backgroundColor: SEGMENT_COLORS[segment.type].replace('/80', '') }}
                        onClick={() => setEditingSegment(segment)}
                    >
                        <div className="flex items-center">
                             <div className="w-8 mr-3 text-center text-sm font-mono opacity-80">{index + 1}</div>
                             <div>
                                <p className="font-bold">{segment.title}</p>
                                <p className="text-xs opacity-90">{segment.type} - {formatTime(segment.duration)}</p>
                             </div>
                        </div>
                        <button onClick={(e) => {e.stopPropagation(); removeSegment(segment.id)}} className="p-1 rounded-full hover:bg-black/20"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>

            {editingSegment && (
                 <EditSegmentModal 
                    segment={editingSegment} 
                    isNew={!segments.some(s => s.id === editingSegment.id)}
                    onClose={() => setEditingSegment(null)} 
                    onSave={handleSaveSegment} 
                    formatTime={formatTime}
                 />
            )}
        </div>
    );
};

interface EditSegmentModalProps {
    segment: Segment;
    isNew: boolean;
    onClose: () => void;
    onSave: (segment: Segment) => void;
    formatTime: (seconds: number) => string;
}

const EditSegmentModal: React.FC<EditSegmentModalProps> = ({ segment, isNew, onClose, onSave, formatTime }) => {
    const [editedSegment, setEditedSegment] = useState(segment);

    const handleFieldChange = <K extends keyof Segment>(field: K, value: Segment[K]) => {
        setEditedSegment(prev => ({...prev, [field]: value}));
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{isNew ? 'Add Segment' : 'Edit Segment'}</h3>
                <div className="space-y-3">
                    <input type="text" value={editedSegment.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="Segment Title" className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none"/>
                    <select value={editedSegment.type} onChange={e => handleFieldChange('type', e.target.value as SegmentType)} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none appearance-none">
                        {Object.keys(SEGMENT_COLORS).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <div>
                        <label className="text-sm font-medium">Duration: {formatTime(editedSegment.duration)}</label>
                        <input type="range" min="10" max="1800" step="10" value={editedSegment.duration} onChange={e => handleFieldChange('duration', parseInt(e.target.value))} className="w-full mt-1"/>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-primary dark:bg-dark-primary">Cancel</button>
                        <button type="button" onClick={() => onSave(editedSegment)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-accent dark:bg-dark-accent text-white">Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShowPlanner;