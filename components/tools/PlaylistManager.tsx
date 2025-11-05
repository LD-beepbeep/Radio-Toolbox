
import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Song } from '../../types';
import { TrashIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon } from '../Icons';

const PlaylistManager: React.FC = () => {
  const [songs, setSongs] = useLocalStorage<Song[]>('playlist', []);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && artist && duration) {
      addSongToList({ title, artist, duration: parseInt(duration, 10) });
      setTitle('');
      setArtist('');
      setDuration('');
      setShowAddModal(false);
    }
  };
  
  const addSongToList = (song: {title: string, artist: string, duration?: number}) => {
     const newSong: Song = {
        id: Date.now().toString(),
        title: song.title,
        artist: song.artist,
        duration: song.duration || 180, // Default 3 mins if not provided
      };
      setSongs(prev => [...prev, newSong]);
  }

  const removeSong = (id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id));
  };
  
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // Create a deep copy
    const songsCopy = JSON.parse(JSON.stringify(songs));
    // Remove and save the dragged item
    const draggedItemContent = songsCopy.splice(dragItem.current, 1)[0];
    // Switch the position
    songsCopy.splice(dragOverItem.current, 0, draggedItemContent);
    
    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;
    
    // Update state
    setSongs(songsCopy);
  }

  const { totalTracks, totalRuntime } = useMemo(() => {
    const totalTracks = songs.length;
    const totalRuntime = songs.reduce((acc, song) => acc + song.duration, 0);
    return { totalTracks, totalRuntime };
  }, [songs]);
  
  const filteredSongs = useMemo(() => {
    return songs.filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return hours > 0 ? `${hours}:${mins}:${secs}` : `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-col md:flex-row flex justify-between items-start mb-6">
        <div>
            <h2 className="text-3xl font-bold">Playlist</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{totalTracks} Tracks, {formatTime(totalRuntime)}</p>
        </div>
        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-2 md:mt-0 bg-light-surface dark:bg-dark-surface rounded-lg px-3 py-1.5 text-sm focus:outline-none"/>
      </div>

      <div className="flex-grow overflow-y-auto">
        {songs.length > 0 ? (
          <div className="bg-light-surface dark:bg-dark-surface rounded-xl">
            <ul className="divide-y divide-light-primary dark:divide-dark-primary">
              {filteredSongs.map((song, index) => (
                <li 
                  key={song.id} 
                  className="p-3 flex items-center justify-between cursor-grab"
                  draggable
                  onDragStart={() => dragItem.current = index}
                  onDragEnter={() => dragOverItem.current = index}
                  onDragEnd={handleDragSort}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex items-center">
                      <span className="text-gray-400 mr-4 w-5 text-center font-medium">{index + 1}</span>
                      <div>
                          <p className="font-semibold">{song.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{song.artist} - {formatTime(song.duration)}</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-0">
                      <button onClick={() => removeSong(song.id)} className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary text-destructive">
                          <TrashIcon className="w-5 h-5"/>
                      </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-16">
            <p>Your playlist is empty.</p>
            <p>Add songs using the plus button below.</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowAddModal(true)} 
        className="fixed bottom-24 right-6 bg-light-accent dark:bg-dark-accent text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 hover:opacity-90 transition-opacity"
        aria-label="Add new song"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Add New Song</h3>
                <form onSubmit={handleAddSong} className="space-y-3">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none"/>
                    <input type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" required className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none"/>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (sec)" required className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-3 text-sm focus:outline-none"/>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-primary dark:bg-dark-primary">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-accent dark:bg-dark-accent text-white">Add Song</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;