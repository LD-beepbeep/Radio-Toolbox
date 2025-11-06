import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DownloadIcon, PlayIcon, PauseIcon, UploadIcon } from '../Icons';

const AudioTrimmer: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [trimStart, setTrimStart] = useState(0); // in seconds
    const [trimEnd, setTrimEnd] = useState(0); // in seconds
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const waveformRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    
    const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);
    const HANDLE_WIDTH = 10; // px

    const drawWaveform = useCallback((buffer: AudioBuffer) => {
        const canvas = waveformRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);

        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / canvas.clientWidth);
        const amp = canvas.clientHeight / 2;
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDarkMode ? '#1C1C1E' : '#FFFFFF';
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

        ctx.lineWidth = 1;
        ctx.strokeStyle = isDarkMode ? '#505052' : '#C7C7CC';
        ctx.beginPath();
        for (let i = 0; i < canvas.clientWidth; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }
        ctx.stroke();

    }, []);

    const drawSelection = useCallback(() => {
        const canvas = waveformRef.current;
        if (!canvas || !audioBuffer) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        drawWaveform(audioBuffer);

        const startX = (trimStart / audioBuffer.duration) * canvas.clientWidth;
        const endX = (trimEnd / audioBuffer.duration) * canvas.clientWidth;
        const handleColor = '#0A84FF';

        // Selection area
        ctx.fillStyle = 'rgba(10, 132, 255, 0.3)';
        ctx.fillRect(startX, 0, endX - startX, canvas.clientHeight);

        // Start handle
        ctx.fillStyle = handleColor;
        ctx.fillRect(startX - (HANDLE_WIDTH/2), 0, HANDLE_WIDTH, canvas.clientHeight);
        
        // End handle
        ctx.fillStyle = handleColor;
        ctx.fillRect(endX - (HANDLE_WIDTH/2), 0, HANDLE_WIDTH, canvas.clientHeight);


    }, [audioBuffer, trimStart, trimEnd, drawWaveform]);

    useEffect(() => {
        if (audioBuffer) {
            drawSelection();
        }
    }, [audioBuffer, drawSelection]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        let file: File | null = null;
        if ('dataTransfer' in e) {
             e.preventDefault();
             e.stopPropagation();
             file = e.dataTransfer.files?.[0];
        } else {
             file = e.target.files?.[0];
        }
        
        if (file) {
            setIsLoading(true);
            setAudioFile(file);
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const arrayBuffer = await file.arrayBuffer();
            const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            setAudioBuffer(buffer);
            setTrimStart(0);
            setTrimEnd(buffer.duration);
            setIsLoading(false);
        }
    };
    
    const togglePlay = () => {
        if (isPlaying) {
            sourceNodeRef.current?.stop();
            setIsPlaying(false);
        } else if (audioBuffer) {
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current!.destination);
            source.onended = () => setIsPlaying(false);
            source.start(0, trimStart, trimEnd - trimStart);
            sourceNodeRef.current = source;
            setIsPlaying(true);
        }
    };

    const handleDownload = () => {
        if (!audioBuffer) return;
        const startSample = Math.floor(trimStart * audioBuffer.sampleRate);
        const endSample = Math.floor(trimEnd * audioBuffer.sampleRate);
        const length = endSample - startSample;
        
        const newBuffer = audioContextRef.current!.createBuffer(
            audioBuffer.numberOfChannels,
            length,
            audioBuffer.sampleRate
        );

        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            newBuffer.copyToChannel(audioBuffer.getChannelData(i).subarray(startSample, endSample), i);
        }

        const bufferToWave = (abuffer: AudioBuffer) => {
            const numOfChan = abuffer.numberOfChannels;
            const length = abuffer.length * numOfChan * 2 + 44;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let pos = 0;
            const writeString = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i)); pos += s.length; };
            writeString('RIFF'); view.setUint32(pos, length - 8, true); pos += 4; writeString('WAVE'); writeString('fmt '); pos += 4;
            view.setUint32(pos, 16, true); pos += 4; view.setUint16(pos, 1, true); pos += 2; view.setUint16(pos, numOfChan, true); pos += 2;
            view.setUint32(pos, abuffer.sampleRate, true); pos += 4; view.setUint32(pos, abuffer.sampleRate * 2 * numOfChan, true); pos += 4;
            view.setUint16(pos, numOfChan * 2, true); pos += 2; view.setUint16(pos, 16, true); pos += 2; writeString('data'); pos += 4;
            view.setUint32(pos, length - pos - 4, true); pos += 4;
            const channels = Array.from({ length: abuffer.numberOfChannels }, (_, i) => abuffer.getChannelData(i));
            let offset = 0;
            while (pos < length) {
                for (let i = 0; i < numOfChan; i++) {
                    let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                    sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                    view.setInt16(pos, sample, true);
                    pos += 2;
                }
                offset++;
            }
            return new Blob([view], { type: 'audio/wav' });
        }

        const wavBlob = bufferToWave(newBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trimmed_${audioFile?.name.replace(/\.[^/.]+$/, "")}.wav`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!audioBuffer) return;
        const canvas = waveformRef.current!;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        const startX = (trimStart / audioBuffer.duration) * canvas.clientWidth;
        const endX = (trimEnd / audioBuffer.duration) * canvas.clientWidth;

        if (Math.abs(x - startX) < HANDLE_WIDTH) {
            setDraggingHandle('start');
        } else if (Math.abs(x - endX) < HANDLE_WIDTH) {
            setDraggingHandle('end');
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
         if (!audioBuffer) return;
         const canvas = waveformRef.current!;
         const rect = canvas.getBoundingClientRect();
         const x = e.clientX - rect.left;
         
         const startX = (trimStart / audioBuffer.duration) * canvas.clientWidth;
         const endX = (trimEnd / audioBuffer.duration) * canvas.clientWidth;

         if (Math.abs(x - startX) < HANDLE_WIDTH || Math.abs(x - endX) < HANDLE_WIDTH || draggingHandle) {
             canvas.style.cursor = 'ew-resize';
         } else {
             canvas.style.cursor = 'default';
         }

        if (draggingHandle) {
            const time = (x / canvas.clientWidth) * audioBuffer.duration;
            if (draggingHandle === 'start') {
                setTrimStart(Math.max(0, Math.min(time, trimEnd)));
            } else {
                setTrimEnd(Math.min(audioBuffer.duration, Math.max(time, trimStart)));
            }
        }
    };

    const handleMouseUp = () => {
        setDraggingHandle(null);
    };


    const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substr(14, 8);
    }
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Audio Trimmer</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4">
                {!audioBuffer ? (
                     <div onDrop={handleFileChange} onDragOver={e => e.preventDefault()} className="relative flex flex-col items-center justify-center h-48 border-2 border-dashed border-light-secondary dark:border-dark-secondary rounded-lg">
                        <UploadIcon className="w-10 h-10 text-gray-400 mb-2"/>
                        <p className="font-semibold">Drag & drop or click to upload</p>
                        <p className="text-sm text-gray-500">Supported formats: MP3, WAV, OGG</p>
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                ) : (
                    <>
                        <canvas 
                            ref={waveformRef} 
                            className="w-full h-32 bg-light-bg dark:bg-dark-bg rounded-lg"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                         <div className="mt-4 grid grid-cols-2 gap-4">
                             <div className="text-center font-mono p-2 bg-light-bg dark:bg-dark-primary rounded-lg">
                                <label className="text-xs">Start</label>
                                <div className="text-lg font-semibold">{formatTime(trimStart)}</div>
                             </div>
                             <div className="text-center font-mono p-2 bg-light-bg dark:bg-dark-primary rounded-lg">
                                <label className="text-xs">End</label>
                                <div className="text-lg font-semibold">{formatTime(trimEnd)}</div>
                             </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <div className="font-mono text-sm">Duration: {formatTime(trimEnd-trimStart)}</div>
                            <div className="flex items-center space-x-2">
                                <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary">
                                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                                </button>
                                <button onClick={handleDownload} className="px-4 py-3 flex items-center space-x-2 rounded-lg bg-light-accent dark:bg-dark-accent text-white font-semibold">
                                    <DownloadIcon className="w-5 h-5"/>
                                    <span>Trim & Download</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
                 {isLoading && <div className="text-center p-4">Loading audio...</div>}
            </div>
        </div>
    );
};

export default AudioTrimmer;