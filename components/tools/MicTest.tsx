

import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon, TrashIcon, PauseIcon } from '../Icons';

const MicTest: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const durationIntervalRef = useRef<number | null>(null);
    
    const draw = (analyser: AnalyserNode) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== canvas.clientWidth * dpr) {
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            ctx.scale(dpr, dpr);
        }
        
        const { width, height } = canvas;
        const clientWidth = canvas.clientWidth;
        const clientHeight = canvas.clientHeight;
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        const bgColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
        const waveColor = isDarkMode ? '#409CFF' : '#0A84FF';
        const meterGoodColor = '#22c55e';
        const meterWarnColor = '#eab308';
        const meterClipColor = '#ef4444';
        const meterBgColor = isDarkMode ? '#2C2C2E' : '#E5E5EA';
        const textColor = isDarkMode ? '#8E8E93' : '#636366';

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, clientWidth, clientHeight);

        const meterWidth = 40;
        const waveformWidth = clientWidth - meterWidth - 20;

        // --- Waveform ---
        analyser.getByteTimeDomainData(dataArray);
        ctx.lineWidth = 2;
        ctx.strokeStyle = waveColor;
        ctx.beginPath();
        const sliceWidth = waveformWidth / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * clientHeight / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.lineTo(waveformWidth, clientHeight / 2);
        ctx.stroke();
        
        // --- VU Meter ---
        const meterX = waveformWidth + 10;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
        const meterHeight = (avg / 255) * clientHeight;
        
        // Background
        ctx.fillStyle = meterBgColor;
        ctx.fillRect(meterX, 0, meterWidth, clientHeight);
        
        // Fill
        const gradient = ctx.createLinearGradient(0, clientHeight, 0, 0);
        gradient.addColorStop(0, meterGoodColor);
        gradient.addColorStop(0.75, meterWarnColor);
        gradient.addColorStop(0.95, meterClipColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(meterX, clientHeight - meterHeight, meterWidth, meterHeight);

        // Ticks and Labels
        ctx.font = "10px sans-serif";
        ctx.fillStyle = textColor;
        [-60, -40, -20, -12, -6, 0].forEach(db => {
            const y = clientHeight - ((db + 60) / 60) * clientHeight;
            ctx.fillRect(meterX - 5, y, 5, 1);
            ctx.fillText(db.toString(), meterX - 30, y + 3);
        });

        animationFrameId.current = requestAnimationFrame(() => draw(analyser));
    };


    const setupMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            draw(analyser);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone.');
        }
    };
    
    const startRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        setRecordedBlob(null);
        audioChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setRecordedBlob(blob);
        };
        mediaRecorderRef.current.start();

        setRecordingDuration(0);
        durationIntervalRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        setIsRecording(false);
    };
    
    const togglePlayback = () => {
        if (isPlaying) {
            audioPlayerRef.current?.pause();
            setIsPlaying(false);
        } else if (recordedBlob) {
            const url = URL.createObjectURL(recordedBlob);
            if(audioPlayerRef.current) audioPlayerRef.current.pause();
            audioPlayerRef.current = new Audio(url);
            audioPlayerRef.current.play();
            audioPlayerRef.current.onended = () => setIsPlaying(false);
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        setupMic();
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            streamRef.current?.getTracks().forEach(track => track.stop());
            audioContextRef.current?.close();
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
            audioPlayerRef.current?.pause();
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Mic Test &amp; Playback</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                <canvas ref={canvasRef} className="w-full h-48 rounded-2xl bg-light-bg dark:bg-dark-bg"></canvas>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-destructive' : 'bg-light-accent dark:bg-dark-accent'}`}
                        >
                            <div className={`w-6 h-6 bg-white transition-all ${isRecording ? 'rounded-md' : 'rounded-full'}`}></div>
                        </button>
                        <div className="font-mono text-xl text-light-text-secondary dark:text-dark-text-secondary">{isRecording ? 'Recording...' : 'Record a clip'}</div>
                         <div className="font-mono text-xl">{formatTime(recordingDuration)}</div>
                    </div>
                    {recordedBlob && (
                         <div className="flex items-center space-x-2 p-2 rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary">
                            <button onClick={togglePlayback} className="w-10 h-10 flex items-center justify-center rounded-full bg-light-surface dark:bg-dark-surface">
                                {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                            </button>
                             <button onClick={() => setRecordedBlob(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-light-surface dark:bg-dark-surface text-destructive">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MicTest;