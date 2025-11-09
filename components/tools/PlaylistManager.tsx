



import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Song } from '../../types';
import { TrashIcon, PlusIcon, ShuffleIcon, StarIcon, DownloadIcon, UploadIcon } from '../Icons';

const PlaylistManager: React.FC = () => {
  const [songs, setSongs] = useLocalStorage<Song[]>('playlist', []);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const importSongsRef = useRef<HTMLInputElement>(null);

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
        isFavorite: false,
      };
      setSongs(prev => [...prev, newSong]);
  }

  const removeSong = (id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id));
  };
  
  const toggleFavorite = (id: string) => {
    setSongs(prevSongs =>
      prevSongs.map(song =>
        song.id === id ? { ...song, isFavorite: !song.isFavorite } : song
      )
    );
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

  const shufflePlaylist = () => {
    setSongs(currentSongs => {
      const shuffled = [...currentSongs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  const handleExport = () => {
    if (songs.length === 0) {
        alert("Playlist is empty. Nothing to export.");
        return;
    }
    const dataStr = JSON.stringify(songs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `playlist_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("This will overwrite your current playlist. Are you sure?")) {
          if(importSongsRef.current) importSongsRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const text = event.target?.result as string;
              const importedSongs: Song[] = JSON.parse(text);
              if (Array.isArray(importedSongs) && importedSongs.every(s => 'id' in s && 'title' in s && 'artist' in s && 'duration' in s)) {
                  setSongs(importedSongs);
                  alert("Playlist imported successfully!");
              } else {
                  throw new Error("Invalid file format");
              }
          } catch (err) {
              alert("Failed to import playlist. Please check file format.");
              console.error(err);
          } finally {
               if(importSongsRef.current) importSongsRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const { totalTracks, totalRuntime } = useMemo(() => {
    const totalTracks = songs.length;
    const totalRuntime = songs.reduce((acc, song) => acc + song.duration, 0);
    return { totalTracks, totalRuntime };
  }, [songs]);
  
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
        if (showFavorites && !song.isFavorite) {
            return false;
        }
        return song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [songs, searchTerm, showFavorites]);

  const songsWithTimings = useMemo(() => {
    let runningTime = 0;
    return filteredSongs.map(song => {
        const startTime = runningTime;
        runningTime += song.duration;
        return { ...song, startTime };
    });
  }, [filteredSongs]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return hours > 0 ? `${hours}:${mins}:${secs}` : `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col h-full">
      <input type="file" ref={importSongsRef} onChange={handleImport} accept=".json" className="hidden" />
      <div className="flex-col md:flex-row flex justify-between items-start mb-4">
        <div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{totalTracks} Tracks, {formatTime(totalRuntime)}</p>
        </div>
         <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-full px-4 py-2 text-sm focus:outline-none w-48 shadow-soft dark:shadow-none"/>
            <button 
                onClick={() => setShowFavorites(!showFavorites)} 
                className={`p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none transition-colors ${showFavorites ? 'text-yellow-500' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} 
                aria-label="Show Favorites"
            >
                <StarIcon className="w-5 h-5" filled={showFavorites} />
            </button>
            <button onClick={shufflePlaylist} className="p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none" aria-label="Shuffle Playlist">
                <ShuffleIcon className="w-5 h-5" />
            </button>
            <button onClick={() => importSongsRef.current?.click()} className="p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none" aria-label="Import Playlist">
                <UploadIcon className="w-5 h-5" />
            </button>
            <button onClick={handleExport} className="p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none" aria-label="Export Playlist">
                <DownloadIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto -mx-4 px-4">
        {songs.length > 0 ? (
          <div className="space-y-3">
              {songsWithTimings.map((song, index) => (
                <div 
                  key={song.id} 
                  className="p-4 flex items-center justify-between cursor-grab bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl shadow-soft dark:shadow-none"
                  draggable
                  onDragStart={() => dragItem.current = songs.findIndex(s => s.id === song.id)}
                  onDragEnter={() => dragOverItem.current = songs.findIndex(s => s.id === song.id)}
                  onDragEnd={handleDragSort}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex items-center">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary mr-4 w-5 text-center font-medium">{index + 1}</span>
                      <div>
                          <p className="font-semibold">{song.title}</p>
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {song.artist} - {formatTime(song.duration)}
                            <span className="text-light-accent dark:text-dark-accent ml-2">(starts at {formatTime(song.startTime)})</span>
                          </p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-0">
                      <button 
                        onClick={() => toggleFavorite(song.id)} 
                        className={`p-2 rounded-full transition-colors ${song.isFavorite ? 'text-yellow-500' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-yellow-500/80'}`}
                      >
                          <StarIcon className="w-5 h-5" filled={!!song.isFavorite}/>
                      </button>
                      <button onClick={() => removeSong(song.id)} className="p-2 rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary text-destructive">
                          <TrashIcon className="w-5 h-5"/>
                      </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-16">
            <p className="font-semibold">Your playlist is empty.</p>
            <p className="text-sm">Tap the plus button to add a song.</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowAddModal(true)} 
        className="fixed bottom-24 right-6 bg-light-accent dark:bg-dark-accent text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40 hover:opacity-90 transition-transform active:scale-95 md:bottom-6"
        aria-label="Add new song"
      >
        <PlusIcon className="w-8 h-8" />
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

export default PlaylistManager;