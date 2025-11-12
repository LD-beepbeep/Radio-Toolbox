

import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Song } from '../../types';
import { TrashIcon, PlusIcon, ShuffleIcon, StarIcon, DownloadIcon, UploadIcon, EditIcon, YouTubeIcon, SpotifyIcon, ExternalLinkIcon } from '../Icons';

const EditSongModal: React.FC<{
  song: Song;
  onSave: (song: Song) => void;
  onClose: () => void;
}> = ({ song, onSave, onClose }) => {
    const [editedSong, setEditedSong] = useState(song);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedSong(prev => ({...prev, [name]: name.includes('Duration') ? parseInt(value, 10) || 0 : value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedSong);
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 text-center">Edit Song</h3>
                <form onSubmit={handleSave} className="space-y-3">
                    <input name="title" value={editedSong.title} onChange={handleChange} placeholder="Title" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <input name="artist" value={editedSong.artist} onChange={handleChange} placeholder="Artist" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <div className="flex space-x-2">
                      <input name="duration" type="number" value={editedSong.duration} onChange={handleChange} placeholder="Duration (sec)" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                      <input name="introDuration" type="number" value={editedSong.introDuration || ''} onChange={handleChange} placeholder="Intro (sec)" className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    </div>
                    <input name="youtubeUrl" type="url" value={editedSong.youtubeUrl || ''} onChange={handleChange} placeholder="YouTube URL" className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <input name="spotifyUrl" type="url" value={editedSong.spotifyUrl || ''} onChange={handleChange} placeholder="Spotify URL" className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                        <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Save</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const PlaylistManager: React.FC = () => {
  const [songs, setSongs] = useLocalStorage<Song[]>('playlist', []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Form state for new song
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newIntroDuration, setNewIntroDuration] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newSpotifyUrl, setNewSpotifyUrl] = useState('');

  // Filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const importSongsRef = useRef<HTMLInputElement>(null);

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newArtist && newDuration) {
      const newSong: Song = {
        id: `local_${Date.now()}`,
        title: newTitle,
        artist: newArtist,
        duration: parseInt(newDuration, 10),
        introDuration: newIntroDuration ? parseInt(newIntroDuration, 10) : undefined,
        youtubeUrl: newYoutubeUrl || undefined,
        spotifyUrl: newSpotifyUrl || undefined,
        rating: 0,
        isFavorite: false,
      };
      setSongs(prev => [newSong, ...prev]);
      // Reset form
      setNewTitle(''); setNewArtist(''); setNewDuration(''); setNewIntroDuration(''); setNewYoutubeUrl(''); setNewSpotifyUrl('');
      setShowAddModal(false);
    }
  };

  const handleEditSong = (updatedSong: Song) => {
    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
    setEditingSong(null);
  };
  
  const removeSong = (id: string) => setSongs(prev => prev.filter(song => song.id !== id));
  const updateSong = (id: string, newProps: Partial<Song>) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, ...newProps } : s));
  };
  
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const songsCopy = [...songs];
    const draggedItem = songsCopy.splice(dragItem.current, 1)[0];
    songsCopy.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setSongs(songsCopy);
  }

  const shufflePlaylist = () => setSongs(currentSongs => [...currentSongs].sort(() => Math.random() - 0.5));

  const handleExport = () => {
    if (songs.length === 0) return alert("Your library is empty. Nothing to export.");
    const dataStr = JSON.stringify(songs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `song_library_${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("This will overwrite your current song library. Are you sure?")) {
          if(importSongsRef.current) importSongsRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const importedSongs: Song[] = JSON.parse(event.target?.result as string);
              if (Array.isArray(importedSongs) && importedSongs.every(s => 'id' in s && 'title' in s)) {
                  setSongs(importedSongs);
                  alert("Song library imported successfully!");
              } else { throw new Error("Invalid file format"); }
          } catch (err) {
              alert("Failed to import songs. Please check file format.");
          } finally {
               if(importSongsRef.current) importSongsRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const { totalTracks, totalRuntime } = useMemo(() => ({
    totalTracks: songs.length,
    totalRuntime: songs.reduce((acc, song) => acc + song.duration, 0)
  }), [songs]);
  
  const filteredSongs = useMemo(() => songs.filter(song => 
      (song.rating || 0) >= ratingFilter &&
      (song.title.toLowerCase().includes(searchTerm.toLowerCase()) || song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [songs, searchTerm, ratingFilter]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full">
      <input type="file" ref={importSongsRef} onChange={handleImport} accept=".json" className="hidden" />
      <div className="flex-col md:flex-row flex justify-between items-center mb-4 gap-2">
        <div>
            <h2 className="text-3xl font-bold">Song Library</h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{totalTracks} Tracks, {formatTime(totalRuntime)}</p>
        </div>
         <div className="flex items-center space-x-2">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-full px-4 py-2 text-sm w-36 shadow-soft dark:shadow-none"/>
            <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))} className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-full px-3 py-2 text-sm appearance-none shadow-soft dark:shadow-none">
              <option value="0">All Stars</option><option value="1">★+</option><option value="2">★★+</option><option value="3">★★★+</option><option value="4">★★★★+</option><option value="5">★★★★★</option>
            </select>
            <button onClick={shufflePlaylist} className="p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none" aria-label="Shuffle"><ShuffleIcon className="w-5 h-5" /></button>
            <button onClick={() => importSongsRef.current?.click()} className="p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none" aria-label="Import"><UploadIcon className="w-5 h-5" /></button>
            <button onClick={handleExport} className="p-2.5 rounded-full bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider shadow-soft dark:shadow-none" aria-label="Export"><DownloadIcon className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto -mx-4 px-4">
        {songs.length > 0 ? (
          <div className="space-y-3">
              {filteredSongs.map((song, index) => (
                <div key={song.id} className="p-3 cursor-grab bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-3xl shadow-soft dark:shadow-none" draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleDragSort} onDragOver={(e) => e.preventDefault()}>
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">{song.title}</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                    </div>
                    <div className="flex items-center space-x-0">
                      <div className="flex items-center">
                        {[1,2,3,4,5].map(star => <button key={star} onClick={() => updateSong(song.id, { rating: song.rating === star ? 0 : star })}><StarIcon className={`w-5 h-5 ${song.rating && song.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={!!(song.rating && song.rating >= star)}/></button>)}
                      </div>
                      <button onClick={() => setEditingSong(song)} className="p-2 rounded-full"><EditIcon className="w-5 h-5"/></button>
                      <button onClick={() => removeSong(song.id)} className="p-2 rounded-full text-destructive"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                  </div>
                  <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 pt-2 border-t border-light-divider dark:border-dark-divider flex justify-between items-center">
                    <div>
                      <span>Duration: {formatTime(song.duration)}</span>
                      {song.introDuration && <span className="ml-2">Intro: {formatTime(song.introDuration)}</span>}
                    </div>
                    <div className="flex space-x-2">
                      {song.youtubeUrl && <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"><YouTubeIcon className="w-5 h-5"/></a>}
                      {song.spotifyUrl && <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer"><SpotifyIcon className="w-5 h-5"/></a>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-16"><p className="font-semibold">Your library is empty.</p><p className="text-sm">Tap the plus button to add a song.</p></div>
        )}
      </div>

      <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-6 bg-light-accent dark:bg-dark-accent text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40 hover:opacity-90 transition-transform active:scale-95 md:bottom-6" aria-label="Add new song"><PlusIcon className="w-8 h-8" /></button>

      {editingSong && <EditSongModal song={editingSong} onSave={handleEditSong} onClose={() => setEditingSong(null)} />}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 text-center">Add New Song</h3>
                <form onSubmit={handleAddSong} className="space-y-3">
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <input type="text" value={newArtist} onChange={e => setNewArtist(e.target.value)} placeholder="Artist" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <div className="flex space-x-2">
                      <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="Duration (sec)" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                      <input type="number" value={newIntroDuration} onChange={e => setNewIntroDuration(e.target.value)} placeholder="Intro (sec)" className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    </div>
                    <input type="url" value={newYoutubeUrl} onChange={e => setNewYoutubeUrl(e.target.value)} placeholder="YouTube URL" className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
                    <input type="url" value={newSpotifyUrl} onChange={e => setNewSpotifyUrl(e.target.value)} placeholder="Spotify URL" className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm"/>
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