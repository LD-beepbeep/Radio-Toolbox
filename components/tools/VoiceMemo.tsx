
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Recording } from '../../types';
import { PlayIcon, PauseIcon, DownloadIcon, TrashIcon, XIcon } from '../Icons';

const Waveform: React.FC<{ blob: Blob }> = ({ blob }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        const audioContext = new AudioContext();
        
        blob.arrayBuffer().then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const data = audioBuffer.getChannelData(0);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d');
            if (!context) return;
            
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            
            const isDarkMode = document.documentElement.classList.contains('dark');
            const strokeColor = isDarkMode ? '#0A84FF' : '#007AFF';
            context.strokeStyle = strokeColor;
            context.lineWidth = 2 * window.devicePixelRatio;

            const step = Math.ceil(data.length / canvas.width);
            const amp = canvas.height / 2;
            
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
                context.lineTo(i, (1 + min) * amp);
                context.lineTo(i, (1 + max) * amp);
            }
            context.stroke();
        });

        return () => {
             if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };

    }, [blob]);

    return <canvas ref={canvasRef} className="w-full h-12" />;
};


const VoiceMemo: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useLocalStorage<Recording[]>('voicememo_recordings', []);
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationInterval = useRef<number | null>(null);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission(true);
        setStream(streamData);
      } catch (err) {
        alert((err as Error).message);
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };
  
  useEffect(() => {
    getMicrophonePermission();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = () => {
    if (!stream) return;
    setIsRecording(true);
    const media = new MediaRecorder(stream, { mimeType: 'audio/webm' });
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
    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      const now = new Date();
      const defaultName = `Recording - ${now.toLocaleTimeString()}`;
      const name = prompt("Enter a name for your recording:", defaultName);
      
      const newRecording: Recording = {
          id: now.toISOString(),
          name: name || defaultName,
          blob: audioBlob,
          duration: recordingDuration,
          createdAt: now,
      };
      setRecordings(prev => [newRecording, ...prev]);
      audioChunks.current = [];
      setIsRecording(false);
      if (durationInterval.current) clearInterval(durationInterval.current);
      setRecordingDuration(0);
    };
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };
  
  const downloadRecording = (recording: Recording) => {
    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${recording.name}.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const playRecording = (recording: Recording) => {
    if (playingId === recording.id) {
        if(audioRef.current) audioRef.current.pause();
        setPlayingId(null);
    } else {
        const url = URL.createObjectURL(recording.blob);
        if(audioRef.current) audioRef.current.pause();
        const newAudio = new Audio(url);
        audioRef.current = newAudio;
        newAudio.play();
        newAudio.onended = () => setPlayingId(null);
        setPlayingId(recording.id);
    }
  }

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
      <h2 className="text-3xl font-bold mb-6">Voice Memo</h2>
      
      <div className="flex flex-col items-center justify-center p-6 bg-light-surface dark:bg-dark-surface rounded-2xl">
        <div className="text-3xl font-mono mb-4">
            {formatTime(recordingDuration)}
        </div>
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!permission}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-destructive' : 'bg-light-accent dark:bg-dark-accent'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <div className={`w-8 h-8 transition-all duration-300 ${isRecording ? 'bg-white rounded-md' : 'bg-white rounded-full'}`}></div>
        </button>
        <p className="text-sm text-light-secondary dark:text-dark-secondary mt-4">{isRecording ? 'Tap to Stop' : 'Tap to Record'}</p>
      </div>

      <div className="mt-6 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-xl font-semibold">Recordings</h3>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-light-surface dark:bg-dark-surface rounded-lg px-3 py-1 text-sm focus:outline-none"/>
        </div>
        {recordings.length > 0 ? (
          <div className="bg-light-surface dark:bg-dark-surface rounded-xl flex-grow overflow-y-auto">
            <ul className="divide-y divide-light-primary dark:divide-dark-primary">
              {filteredRecordings.map(rec => (
                <li key={rec.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{rec.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(rec.duration)} - {new Date(rec.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-0">
                        <button onClick={() => playRecording(rec)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
                            {playingId === rec.id ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={() => downloadRecording(rec)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
                            <DownloadIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => deleteRecording(rec.id)} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-light-primary dark:hover:bg-dark-primary text-destructive">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                  </div>
                   <div className="mt-2">
                        <Waveform blob={rec.blob} />
                   </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No recordings yet.</p>
        )}
      </div>
    </div>
  );
};

export default VoiceMemo;