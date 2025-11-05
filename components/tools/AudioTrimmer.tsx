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

        ctx.fillStyle = 'rgba(10, 132, 255, 0.3)';
        ctx.fillRect(startX, 0, endX - startX, canvas.clientHeight);

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

        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        const bufferToWave = (abuffer: AudioBuffer) => {
            const numOfChan = abuffer.numberOfChannels;
            const length = abuffer.length * numOfChan * 2 + 44;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            const channels = [];
            let i, sample;
            let offset = 0;
            let pos = 0;
            
            writeString(view, pos, 'RIFF'); pos += 4;
            view.setUint32(pos, length - 8, true); pos += 4;
            writeString(view, pos, 'WAVE'); pos += 4;
            writeString(view, pos, 'fmt '); pos += 4;
            view.setUint32(pos, 16, true); pos += 4;
            view.setUint16(pos, 1, true); pos += 2;
            view.setUint16(pos, numOfChan, true); pos += 2;
            view.setUint32(pos, abuffer.sampleRate, true); pos += 4;
            view.setUint32(pos, abuffer.sampleRate * 4, true); pos += 4;
            view.setUint16(pos, numOfChan * 2, true); pos += 2;
            view.setUint16(pos, 16, true); pos += 2;
            writeString(view, pos, 'data'); pos += 4;
            view.setUint32(pos, length - pos - 4, true); pos += 4;

            for (i = 0; i < abuffer.numberOfChannels; i++)
                channels.push(abuffer.getChannelData(i));

            while (pos < length) {
                for (i = 0; i < numOfChan; i++) {
                    sample = Math.max(-1, Math.min(1, channels[i][offset]));
                    sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                    view.setInt16(pos, sample, true);
                    pos += 2;
                }
                offset++
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
                        <canvas ref={waveformRef} className="w-full h-32 bg-light-bg dark:bg-dark-bg rounded-lg cursor-ew-resize"></canvas>
                        <div className="mt-4 space-y-2">
                             <div>
                                <label className="text-sm">Start: {formatTime(trimStart)}</label>
                                <input type="range" min="0" max={audioBuffer.duration} value={trimStart} step="0.01" onChange={e => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd))} className="w-full h-2 bg-light-primary dark:bg-dark-primary rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label className="text-sm">End: {formatTime(trimEnd)}</label>
                                <input type="range" min="0" max={audioBuffer.duration} value={trimEnd} step="0.01" onChange={e => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart))} className="w-full h-2 bg-light-primary dark:bg-dark-primary rounded-lg appearance-none cursor-pointer" />
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
