

import React, { useState, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Sound } from '../../types';
import { PlusIcon, TrashIcon, XIcon, MusicIcon } from '../Icons';

const Soundboard: React.FC = () => {
    const [sounds, setSounds] = useLocalStorage<Sound[]>('soundboard_sounds', []);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSoundName, setNewSoundName] = useState('');
    const [newSoundFile, setNewSoundFile] = useState<File | null>(null);
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

    const playSound = (sound: Sound) => {
        if (isEditing) return;
        
        let audio = audioRefs.current.get(sound.id);
        if (audio) {
            audio.currentTime = 0;
            audio.play();
        } else {
            const newAudio = new Audio(sound.dataUrl);
            audioRefs.current.set(sound.id, newAudio);
            newAudio.play();
        }
    };

    const handleAddSound = () => {
        if (newSoundName && newSoundFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
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
        }
    };

    const removeSound = (id: string) => {
        setSounds(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 transition-opacity shadow-soft dark:shadow-none dark:border dark:border-dark-divider"
                >
                    {isEditing ? 'Done' : 'Edit'}
                </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sounds.map(sound => (
                    <div key={sound.id} className="relative">
                        <button 
                            onClick={() => playSound(sound)}
                            className="w-full aspect-square bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl flex items-center justify-center text-center p-2 shadow-soft transition-transform active:scale-95 hover:bg-light-bg-primary dark:hover:bg-dark-surface/80"
                            disabled={isEditing}
                        >
                            <span className="font-semibold text-sm break-all">{sound.name}</span>
                        </button>
                        {isEditing && (
                            <button
                                onClick={() => removeSound(sound.id)}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 z-10 hover:opacity-90 transition-opacity"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full aspect-square border-2 border-dashed border-light-divider dark:border-dark-divider rounded-4xl flex flex-col items-center justify-center p-2 text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
            </div>
            {sounds.length === 0 && (
                 <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-16">
                    <MusicIcon className="w-12 h-12 mx-auto mb-4"/>
                    <p className="font-semibold">Your soundboard is empty.</p>
                    <p className="text-sm">Click the '+' button to upload your first clip.</p>
                </div>
            )}


            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold mb-4 text-center">Add New Sound</h3>
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                value={newSoundName} 
                                onChange={e => setNewSoundName(e.target.value)} 
                                placeholder="Sound Name" 
                                required 
                                className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"
                            />
                            <input 
                                type="file" 
                                accept="audio/*"
                                onChange={e => setNewSoundFile(e.target.files ? e.target.files[0] : null)}
                                required
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-accent-subtle file:dark:bg-dark-accent-subtle file:text-light-accent file:dark:text-dark-accent hover:file:opacity-80"
                            />
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