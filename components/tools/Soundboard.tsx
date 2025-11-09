import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Sound } from '../../types';
import { PlusIcon, TrashIcon, XIcon, MusicIcon, DownloadIcon, GridIcon, ListIcon, ImageIcon, SearchIcon } from '../Icons';

// A new sub-component for each sound for better organization
const SoundItem: React.FC<{
    sound: Sound;
    viewMode: 'grid' | 'list';
    isEditing: boolean;
    onPlay: () => void;
    onRemove: () => void;
    onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ sound, viewMode, isEditing, onPlay, onRemove, onAddImage }) => {
    const imageInputRef = useRef<HTMLInputElement>(null);

    const downloadSound = (e: React.MouseEvent) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = sound.dataUrl;
        const fileExtension = sound.dataUrl.split(';')[0].split('/')[1] || 'audio';
        a.download = `${sound.name}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (viewMode === 'grid') {
        return (
            <div className="relative group">
                <button
                    onClick={onPlay}
                    className="w-full aspect-square bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl flex items-center justify-center text-center p-2 shadow-soft transition-transform active:scale-95 hover:bg-light-bg-primary dark:hover:bg-dark-surface/80 overflow-hidden relative"
                    disabled={isEditing}
                    style={{
                        backgroundImage: sound.imageUrl ? `url(${sound.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {!sound.imageUrl ? (
                         <span className="font-semibold text-sm break-all">{sound.name}</span>
                    ) : (
                        <div className="absolute inset-0 bg-black/40 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="font-semibold text-sm text-white break-all">{sound.name}</span>
                        </div>
                    )}
                </button>
                {isEditing && (
                    <>
                        <button onClick={onRemove} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 z-10 hover:opacity-90 transition-opacity">
                            <XIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => imageInputRef.current?.click()} className="absolute -top-2 -left-2 bg-light-accent text-white rounded-full p-1 z-10 hover:opacity-90 transition-opacity">
                            <ImageIcon className="w-4 h-4" />
                            <input type="file" ref={imageInputRef} onChange={onAddImage} accept="image/*" className="hidden" />
                        </button>
                    </>
                )}
            </div>
        );
    }

    // List View
    return (
         <div className="relative group flex items-center p-3 bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-3xl shadow-soft">
            <button
                onClick={onPlay}
                disabled={isEditing}
                className="flex items-center space-x-3 flex-grow text-left min-w-0"
            >
                <div 
                    className="w-12 h-12 rounded-2xl bg-light-bg-primary dark:bg-dark-bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                         backgroundImage: sound.imageUrl ? `url(${sound.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {!sound.imageUrl && <MusicIcon className="w-6 h-6 text-light-text-secondary"/>}
                </div>
                <p className="font-semibold text-sm break-all flex-grow truncate">{sound.name}</p>
            </button>
             <div className="flex items-center flex-shrink-0 ml-2">
                {!isEditing && (
                    <button onClick={downloadSound} className="p-2 rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary text-light-text-secondary dark:text-dark-text-secondary">
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                )}
                {isEditing && (
                     <>
                        <button onClick={() => imageInputRef.current?.click()} className="p-2 rounded-full hover:bg-light-accent/10 text-light-accent">
                           <ImageIcon className="w-5 h-5" />
                           <input type="file" ref={imageInputRef} onChange={onAddImage} accept="image/*" className="hidden" />
                       </button>
                        <button onClick={onRemove} className="p-2 rounded-full hover:bg-destructive/10 text-destructive">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};


const Soundboard: React.FC = () => {
    const [sounds, setSounds] = useLocalStorage<Sound[]>('soundboard_sounds', []);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('soundboard_view_mode', 'grid');
    const [gridSize, setGridSize] = useLocalStorage<number>('soundboard_grid_size', 4);

    const [newSoundName, setNewSoundName] = useState('');
    const [newSoundFile, setNewSoundFile] = useState<File | null>(null);

    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

    useEffect(() => {
        const refs = audioRefs.current;
        return () => {
            // Stop all sounds on unmount
            refs.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
        };
    }, []);

    const filteredSounds = useMemo(() => {
        if (!searchTerm) return sounds;
        return sounds.filter(sound => sound.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sounds, searchTerm]);

    const playSound = (sound: Sound) => {
        if (isEditing) return;
        
        let audio = audioRefs.current.get(sound.id);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play failed:", e));
        } else {
            const newAudio = new Audio(sound.dataUrl);
            audioRefs.current.set(sound.id, newAudio);
            newAudio.play().catch(e => console.error("Audio play failed:", e));
        }
    };

    const handleAddImage = (soundId: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const imageUrl = reader.result as string;
            setSounds(prev => prev.map(s => s.id === soundId ? { ...s, imageUrl } : s));
        };
        reader.readAsDataURL(file);
    };

    const handleAddSound = async () => {
        if (!newSoundName || !newSoundFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const newSound: Sound = {
                id: Date.now().toString(),
                name: newSoundName,
                dataUrl,
            };
            setSounds(prev => [...prev, newSound]);
            setShowAddModal(false);
            setNewSoundName('');
            setNewSoundFile(null);
        };
        reader.readAsDataURL(newSoundFile);
    };

    const removeSound = (id: string) => {
        setSounds(prev => prev.filter(s => s.id !== id));
    };
    
    const handleExportSounds = () => {
        const dataStr = JSON.stringify(sounds, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = "soundboard_export.json";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary"/>
                    <input 
                        type="text"
                        placeholder="Search sounds..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent shadow-soft dark:shadow-none"
                    />
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-light-surface dark:bg-dark-surface rounded-full shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-light-accent-subtle dark:bg-dark-accent-subtle' : ''}`}><GridIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-light-accent-subtle dark:bg-dark-accent-subtle' : ''}`}><ListIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex items-center space-x-2">
                    <button onClick={handleExportSounds} className="px-4 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 transition-opacity shadow-soft dark:shadow-none dark:border dark:border-dark-divider">Export</button>
                    <button onClick={() => setIsEditing(!isEditing)} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 transition-opacity shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                        {isEditing ? 'Done' : 'Edit'}
                    </button>
                </div>
            </div>

            {viewMode === 'grid' && (
                <div className="mb-4 flex items-center">
                    <label className="text-sm font-semibold mr-2">Columns:</label>
                    <input type="range" min="2" max="8" value={gridSize} onChange={e => setGridSize(parseInt(e.target.value))} className="w-48 align-middle"/>
                    <span className="ml-2 text-sm font-mono bg-light-bg-primary dark:bg-dark-bg-secondary rounded-md px-2 py-0.5">{gridSize}</span>
                </div>
            )}

            {filteredSounds.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                        {filteredSounds.map(sound => (
                            <SoundItem key={sound.id} sound={sound} viewMode="grid" isEditing={isEditing} onPlay={() => playSound(sound)} onRemove={() => removeSound(sound.id)} onAddImage={handleAddImage(sound.id)} />
                        ))}
                         <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full aspect-square border-2 border-dashed border-light-divider dark:border-dark-divider rounded-4xl flex flex-col items-center justify-center p-2 text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
                        >
                            <PlusIcon className="w-8 h-8" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSounds.map(sound => (
                            <SoundItem key={sound.id} sound={sound} viewMode="list" isEditing={isEditing} onPlay={() => playSound(sound)} onRemove={() => removeSound(sound.id)} onAddImage={handleAddImage(sound.id)} />
                        ))}
                        <button onClick={() => setShowAddModal(true)} className="w-full border-2 border-dashed border-light-divider dark:border-dark-divider rounded-3xl p-3 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2"/> Add Sound
                        </button>
                    </div>
                )
            ) : (
                 <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-16">
                    <MusicIcon className="w-12 h-12 mx-auto mb-4"/>
                    <p className="font-semibold">{searchTerm ? 'No sounds match your search.' : 'Your soundboard is empty.'}</p>
                    <p className="text-sm">{searchTerm ? 'Try a different search term.' : "Click the button below to upload your first clip."}</p>
                     <button onClick={() => setShowAddModal(true)} className="mt-4 px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">
                        Add Sound
                    </button>
                </div>
            )}


            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold mb-4 text-center">Add New Sound</h3>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                value={newSoundName} 
                                onChange={e => setNewSoundName(e.target.value)} 
                                placeholder="Sound Name" 
                                required 
                                className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"
                            />
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Audio File</label>
                                <input 
                                    type="file" 
                                    accept="audio/*"
                                    onChange={e => setNewSoundFile(e.target.files ? e.target.files[0] : null)}
                                    required
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-accent-subtle file:dark:bg-dark-accent-subtle file:text-light-accent file:dark:text-dark-accent hover:file:opacity-80"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                                <button type="button" onClick={handleAddSound} disabled={!newSoundName || !newSoundFile} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white disabled:opacity-50">Add Sound</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Soundboard;