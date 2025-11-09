

import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Sound } from '../../types';
import { PlusIcon, TrashIcon, PlayIcon, PauseIcon, ImageIcon, EditIcon, ListIcon, GridIcon } from '../Icons';

const SoundCard: React.FC<{
    sound: Sound;
    onPlay: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onImageUpload: () => void;
    gridSize: 'small' | 'medium' | 'large';
    isActive: boolean;
    isPlaying: boolean;
}> = ({ sound, onPlay, onEdit, onDelete, onImageUpload, gridSize, isActive, isPlaying }) => {

    const sizeClasses = {
        small: 'w-24 h-24',
        medium: 'w-32 h-32',
        large: 'w-40 h-40',
    }[gridSize];

    return (
        <div className={`relative group rounded-4xl overflow-hidden shadow-soft dark:shadow-none transition-all ${sizeClasses} ${isActive ? 'ring-2 ring-light-accent dark:ring-dark-accent' : ''}`}>
            <button onClick={onPlay} className="w-full h-full bg-light-surface dark:bg-dark-surface flex items-center justify-center relative">
                {sound.imageUrl ? (
                    <img src={sound.imageUrl} alt={sound.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xl font-bold text-light-accent dark:text-dark-accent p-2 text-center">{sound.name}</span>
                )}
                 {isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                        {isPlaying ? <PauseIcon className="w-12 h-12 text-white drop-shadow-lg"/> : <PlayIcon className="w-12 h-12 text-white drop-shadow-lg"/>}
                    </div>
                )}
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-xs font-semibold truncate backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {sound.name}
            </div>
            <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onImageUpload} className="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"><ImageIcon className="w-3 h-3" /></button>
                <button onClick={onEdit} className="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"><EditIcon className="w-3 h-3" /></button>
                <button onClick={onDelete} className="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"><TrashIcon className="w-3 h-3" /></button>
            </div>
        </div>
    );
};

const SoundListItem: React.FC<{
    sound: Sound;
    onPlay: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isActive: boolean;
    isPlaying: boolean;
}> = ({ sound, onPlay, onEdit, onDelete, isActive, isPlaying }) => {
    return (
        <div className={`flex items-center p-3 dark:border dark:border-dark-divider rounded-3xl shadow-soft dark:shadow-none transition-colors ${isActive ? 'bg-light-accent-subtle dark:bg-dark-accent-subtle' : 'bg-light-surface dark:bg-dark-surface'}`}>
            <button onClick={onPlay} className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-light-accent dark:bg-dark-accent text-white mr-4">
                {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
            </button>
            <div className="flex-grow truncate">
                <p className="font-semibold">{sound.name}</p>
            </div>
            <div className="flex items-center space-x-1">
                <button onClick={onEdit} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary"><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary text-destructive"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};


const SoundModal: React.FC<{
    sound: Sound | null;
    onSave: (sound: Sound, audioFile: File | null, imageFile: File | null) => void;
    onClose: () => void;
}> = ({ sound, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [volume, setVolume] = useState(1);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
    const isEditing = sound !== null;

    useEffect(() => {
        if (sound) {
            setName(sound.name);
            setPreviewUrl(sound.imageUrl);
            setVolume(sound.volume ?? 1);
        } else {
            setName('');
            setPreviewUrl(undefined);
            setVolume(1);
        }
        setAudioFile(null);
        setImageFile(null);
    }, [sound]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || (!isEditing && !audioFile)) {
            alert('Please provide a name and an audio file.');
            return;
        }
        const soundToSave: Sound = sound ? { ...sound, name, volume } : { id: Date.now().toString(), name, dataUrl: '', volume };
        onSave(soundToSave, audioFile, imageFile);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-4 text-center">{isEditing ? 'Edit Sound' : 'Add Sound'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Sound Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"/>
                    </div>
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Audio File</label>
                        <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-accent/10 dark:file:bg-dark-accent/10 file:text-light-accent dark:file:text-dark-accent hover:file:bg-light-accent/20 dark:hover:file:bg-dark-accent/20"/>
                        {isEditing && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Leave blank to keep the current audio.</p>}
                    </div>
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Image (Optional)</label>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-2xl bg-light-surface dark:bg-dark-surface flex items-center justify-center">
                                {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl"/> : <ImageIcon className="w-8 h-8 text-gray-400"/>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-accent/10 dark:file:bg-dark-accent/10 file:text-light-accent dark:file:text-dark-accent hover:file:bg-light-accent/20 dark:hover:file:bg-dark-accent/20"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Volume: {Math.round(volume * 100)}%</label>
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full"/>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                        <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Soundboard: React.FC = () => {
    const [sounds, setSounds] = useLocalStorage<Sound[]>('soundboard_sounds', []);
    const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('soundboard_view_mode', 'grid');
    const [gridSize, setGridSize] = useLocalStorage<'small' | 'medium' | 'large'>('soundboard_grid_size', 'medium');
    const [editingSound, setEditingSound] = useState<Sound | null>(null);
    const [activeSound, setActiveSound] = useState<{ id: string, isPlaying: boolean } | null>(null);

    const audioRefs = useRef<{[key: string]: HTMLAudioElement}>({});
    const imageInputRef = useRef<HTMLInputElement>(null);
    const soundIdToUpdateImage = useRef<string | null>(null);

    useEffect(() => {
        // Cleanup audio instances on component unmount
        return () => {
            // FIX: Explicitly type `audio` as HTMLAudioElement to resolve an issue where
            // TypeScript was inferring it as `unknown`, causing a type error.
            Object.values(audioRefs.current).forEach((audio: HTMLAudioElement) => audio.pause());
        };
    }, []);

    const togglePlay = (sound: Sound) => {
        if (activeSound && activeSound.id === sound.id) {
            if (activeSound.isPlaying) {
                audioRefs.current[sound.id]?.pause();
                setActiveSound({ ...activeSound, isPlaying: false });
            } else {
                audioRefs.current[sound.id]?.play().catch(e => console.error("Error playing sound:", e));
                setActiveSound({ ...activeSound, isPlaying: true });
            }
        } else {
            if (activeSound && audioRefs.current[activeSound.id]) {
                audioRefs.current[activeSound.id].pause();
                audioRefs.current[activeSound.id].currentTime = 0;
            }
            
            const playAudio = (audio: HTMLAudioElement) => {
                audio.volume = sound.volume ?? 1;
                audio.play().catch(e => console.error("Error playing sound:", e));
                 audio.onended = () => {
                    setActiveSound(current => (current && current.id === sound.id ? null : current));
                };
            }
            
            if (audioRefs.current[sound.id]) {
                audioRefs.current[sound.id].currentTime = 0;
                playAudio(audioRefs.current[sound.id]);
            } else {
                const audio = new Audio(sound.dataUrl);
                audioRefs.current[sound.id] = audio;
                playAudio(audio);
            }
            setActiveSound({ id: sound.id, isPlaying: true });
        }
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    const handleSave = async (sound: Sound, audioFile: File | null, imageFile: File | null) => {
        let soundToSave = { ...sound };
        if (audioFile) {
            soundToSave.dataUrl = await fileToBase64(audioFile);
        }
        if (imageFile) {
            soundToSave.imageUrl = await fileToBase64(imageFile);
        }
        
        const isEditing = sounds.some(s => s.id === soundToSave.id);
        if (isEditing) {
            setSounds(prev => prev.map(s => s.id === soundToSave.id ? soundToSave : s));
        } else {
            setSounds(prev => [...prev, soundToSave]);
        }
        setEditingSound(null);
    };
    
    const triggerImageUpload = (soundId: string) => {
        soundIdToUpdateImage.current = soundId;
        imageInputRef.current?.click();
    };

    const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const soundId = soundIdToUpdateImage.current;
        if (file && soundId) {
            const imageUrl = await fileToBase64(file);
            setSounds(prev => prev.map(s => s.id === soundId ? { ...s, imageUrl } : s));
        }
        if (imageInputRef.current) imageInputRef.current.value = "";
        soundIdToUpdateImage.current = null;
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this sound?")) {
            if (activeSound && activeSound.id === id) {
                audioRefs.current[id]?.pause();
                setActiveSound(null);
            }
            setSounds(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col">
            <input type="file" ref={imageInputRef} onChange={handleImageFileSelect} accept="image/*" className="hidden" />
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2 p-1 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider">
                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${viewMode === 'grid' ? 'bg-light-accent text-white' : ''}`}><GridIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${viewMode === 'list' ? 'bg-light-accent text-white' : ''}`}><ListIcon className="w-5 h-5"/></button>
                </div>
                {viewMode === 'grid' && (
                    <div className="flex items-center space-x-2 p-1 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider">
                        {(['small', 'medium', 'large'] as const).map(size => (
                            <button key={size} onClick={() => setGridSize(size)} className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${gridSize === size ? 'bg-light-accent text-white' : ''}`}>{size}</button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-y-auto -mx-4 px-4">
                {viewMode === 'grid' ? (
                    <div className="flex flex-wrap gap-4">
                        {sounds.map(sound => (
                            <SoundCard 
                                key={sound.id} 
                                sound={sound} 
                                onPlay={() => togglePlay(sound)} 
                                onEdit={() => setEditingSound(sound)} 
                                onDelete={() => handleDelete(sound.id)}
                                onImageUpload={() => triggerImageUpload(sound.id)}
                                gridSize={gridSize} 
                                isActive={activeSound?.id === sound.id}
                                isPlaying={activeSound?.id === sound.id && activeSound.isPlaying}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                         {sounds.map(sound => (
                            <SoundListItem 
                                key={sound.id} 
                                sound={sound} 
                                onPlay={() => togglePlay(sound)} 
                                onEdit={() => setEditingSound(sound)} 
                                onDelete={() => handleDelete(sound.id)}
                                isActive={activeSound?.id === sound.id}
                                isPlaying={activeSound?.id === sound.id && activeSound.isPlaying}
                             />
                        ))}
                    </div>
                )}
                {sounds.length === 0 && (
                    <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-16">
                        <p className="font-semibold">Your soundboard is empty.</p>
                        <p className="text-sm">Tap the plus button to add a sound.</p>
                    </div>
                )}
            </div>

            <button onClick={() => setEditingSound({} as Sound)} className="fixed bottom-24 right-6 bg-light-accent dark:bg-dark-accent text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40 hover:opacity-90 transition-transform active:scale-95 md:bottom-6">
                <PlusIcon className="w-8 h-8" />
            </button>
            
            {editingSound && <SoundModal sound={sounds.some(s => s.id === editingSound.id) ? editingSound : null} onSave={handleSave} onClose={() => setEditingSound(null)} />}
        </div>
    );
};

export default Soundboard;