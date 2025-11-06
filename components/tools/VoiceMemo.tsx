

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Recording } from '../../types';
import { PlayIcon, PauseIcon, DownloadIcon, TrashIcon, EditIcon } from '../Icons';

let waveformAudioContext: AudioContext | null = null;
const getWaveformAudioContext = () => {
    if (!waveformAudioContext || waveformAudioContext.state === 'closed') {
        waveformAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return waveformAudioContext;
}

const Waveform: React.FC<{ dataUrl: string, isPlaying: boolean }> = ({ dataUrl, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const audioContext = getWaveformAudioContext();
        
        fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => blob.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const data = audioBuffer.getChannelData(0);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d');
            if (!context) return;
            
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            
            const isDarkMode = document.documentElement.classList.contains('dark');
            const strokeColor = isDarkMode ? '#8E8E93' : '#636366';
            const progressColor = isDarkMode ? '#409CFF' : '#0A84FF';
            context.strokeStyle = isPlaying ? progressColor : strokeColor;
            context.lineWidth = 2 * window.devicePixelRatio;

            const step = Math.ceil(data.length / canvas.width);
            const amp = canvas.height / 2;
            
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
            context.moveTo(0, amp);
            for (let i = 0; i < canvas.width; i++) {
                let min = 1.0;
                let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = data[(i * step) + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                const y = ((1 + min) * amp + (1 + max) * amp) / 2; // Midpoint for a cleaner line
                context.lineTo(i, y);
            }
            context.stroke();
        }).catch(err => console.error("Error processing audio for waveform: ", err));

    }, [dataUrl, isPlaying]);

    return <canvas ref={canvasRef} className="w-full h-12" />;
};


const VoiceMemo: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useLocalStorage<Recording[]>('voicememo_recordings', []);
  const [permission, setPermission] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationInterval = useRef<number | null>(null);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [newRecordingName, setNewRecordingName] = useState('');
  const [newRecordingData, setNewRecordingData] = useState<{ dataUrl: string; duration: number } | null>(null);


  useEffect(() => {
    if ("MediaRecorder" in window) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(streamData => {
          setPermission(true);
          streamRef.current = streamData;
        })
        .catch(err => {
          console.error(err);
          alert((err as Error).message);
        });
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    const media = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    audioChunks.current = [];
    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === "undefined") return;
      if (event.data.size === 0) return;
      audioChunks.current.push(event.data);
    };

    setRecordingDuration(0);
    durationInterval.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.stop();
    if(durationInterval.current) clearInterval(durationInterval.current);

    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
          const base64data = reader.result as string;
          const now = new Date();
          
          setNewRecordingData({ dataUrl: base64data, duration: recordingDuration });
          setNewRecordingName(`Recording - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`);
          setIsSaving(true);

          audioChunks.current = [];
          setIsRecording(false);
          setRecordingDuration(0);
      }
    };
  };

  const handleSaveRecording = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecordingData && newRecordingName) {
         const now = new Date();
         const newRecording: Recording = {
              id: now.toISOString(),
              name: newRecordingName,
              dataUrl: newRecordingData.dataUrl,
              duration: newRecordingData.duration,
              createdAt: now,
          };
          setRecordings(prev => [newRecording, ...prev]);
    }
    handleCancelSave();
  }

  const handleCancelSave = () => {
    setIsSaving(false);
    setNewRecordingData(null);
    setNewRecordingName('');
  }


  const deleteRecording = (id: string) => {
    if (playingId === id) {
        if(audioRef.current) audioRef.current.pause();
        setPlayingId(null);
    }
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };
  
  const downloadRecording = (recording: Recording) => {
    const a = document.createElement("a");
    a.href = recording.dataUrl;
    a.download = `${recording.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const playRecording = (recording: Recording) => {
    if (editingId === recording.id) return;
    if (playingId === recording.id) {
        if(audioRef.current) audioRef.current.pause();
        setPlayingId(null);
    } else {
        if(audioRef.current) audioRef.current.pause();
        const newAudio = new Audio(recording.dataUrl);
        audioRef.current = newAudio;
        newAudio.play();
        newAudio.onended = () => setPlayingId(null);
        setPlayingId(recording.id);
    }
  }

  const handleStartEditing = (recording: Recording) => {
    setEditingId(recording.id);
    setEditingName(recording.name);
  };

  const handleSaveName = (id: string) => {
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, name: editingName } : r));
    setEditingId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const filteredRecordings = useMemo(() => {
    return recordings.filter(rec => 
        rec.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recordings, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center justify-center p-6 bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-6xl shadow-soft dark:shadow-none">
        <div className="text-5xl font-mono mb-4 text-light-text-primary dark:text-dark-text-primary">
            {formatTime(recordingDuration)}
        </div>
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!permission}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-destructive' : 'bg-light-accent dark:bg-dark-accent'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <div className={`w-8 h-8 transition-all duration-300 ${isRecording ? 'bg-white rounded-md' : 'bg-white rounded-full'}`}></div>
        </button>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-4">{isRecording ? 'Recording...' : 'Tap to Record'}</p>
      </div>

      <div className="mt-8 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xl font-semibold">Recordings ({recordings.length})</h3>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-full px-4 py-2 text-sm focus:outline-none w-48 shadow-soft dark:shadow-none"/>
        </div>
        {recordings.length > 0 ? (
          <div className="space-y-3 flex-grow overflow-y-auto -mx-4 px-4">
              {filteredRecordings.map(rec => (
                <div key={rec.id} className="p-4 bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl shadow-soft dark:shadow-none">
                  <div className="flex items-center justify-between">
                    <button onClick={() => playRecording(rec)} className="flex items-center space-x-4 flex-grow">
                        <div className="p-3 rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary">
                            {playingId === rec.id ? <PauseIcon className="w-5 h-5 text-light-accent dark:text-dark-accent"/> : <PlayIcon className="w-5 h-5"/>}
                        </div>
                        <div>
                            {editingId === rec.id ? (
                                <input 
                                    type="text" 
                                    value={editingName} 
                                    onChange={(e) => setEditingName(e.target.value)} 
                                    onBlur={() => handleSaveName(rec.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName(rec.id)}
                                    autoFocus
                                    onClick={e => e.stopPropagation()}
                                    className="font-medium bg-light-bg-secondary dark:bg-dark-bg-secondary rounded px-1 -mx-1"
                                />
                            ) : (
                                <p className="font-medium text-left">{rec.name}</p>
                            )}
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-left">{formatTime(rec.duration)} - {new Date(rec.createdAt).toLocaleDateString()}</p>
                        </div>
                    </button>
                    <div className="flex items-center space-x-0">
                        <button onClick={() => handleStartEditing(rec)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary">
                            <EditIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => downloadRecording(rec)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary">
                            <DownloadIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => deleteRecording(rec.id)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-bg-primary dark:hover:bg-dark-bg-secondary text-destructive">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                  </div>
                   <div className="mt-3">
                        <Waveform dataUrl={rec.dataUrl} isPlaying={playingId === rec.id} />
                   </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-8">No recordings yet.</p>
        )}
      </div>

       {isSaving && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleCancelSave}>
            <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-4 text-center">Save Recording</h3>
                <form onSubmit={handleSaveRecording} className="space-y-3">
                    <input type="text" value={newRecordingName} onChange={e => setNewRecordingName(e.target.value)} placeholder="Recording Name" required className="w-full bg-light-surface dark:bg-dark-surface rounded-2xl p-3 text-sm focus:outline-none"/>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={handleCancelSave} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Cancel</button>
                        <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default VoiceMemo;