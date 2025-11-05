
import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon, TrashIcon } from '../Icons';

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
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        const bgColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
        const waveColor = isDarkMode ? '#0A84FF' : '#007AFF';
        const meterColor = isDarkMode ? '#0A84FF' : '#007AFF';
        const meterBgColor = isDarkMode ? '#2C2C2E' : '#E5E5EA';

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Waveform
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = bgColor;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = waveColor;
        canvasCtx.beginPath();
        const sliceWidth = (canvas.width - 50) * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;
            if (i === 0) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y);
            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width - 50, canvas.height / 2);
        canvasCtx.stroke();
        
        // VU Meter
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
        const meterHeight = (avg / 255) * canvas.height;
        
        canvasCtx.fillStyle = meterBgColor;
        canvasCtx.fillRect(canvas.width - 30, 0, 20, canvas.height);
        
        canvasCtx.fillStyle = meterColor;
        canvasCtx.fillRect(canvas.width - 30, canvas.height - meterHeight, 20, meterHeight);

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
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Mic Test</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4">
                <canvas ref={canvasRef} className="w-full h-48 rounded-lg bg-light-bg dark:bg-dark-bg"></canvas>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-destructive' : 'bg-light-accent dark:bg-dark-accent'}`}
                        >
                            <div className={`w-6 h-6 bg-white transition-all ${isRecording ? 'rounded-md' : 'rounded-full'}`}></div>
                        </button>
                        <div className="font-mono text-lg">{formatTime(recordingDuration)}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {recordedBlob && (
                            <>
                            <button onClick={togglePlayback} className="p-2 w-12 h-12 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary">
                                <PlayIcon className={`w-6 h-6 ${isPlaying ? 'text-light-accent dark:text-dark-accent' : ''}`} />
                            </button>
                             <button onClick={() => setRecordedBlob(null)} className="p-2 w-12 h-12 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary text-destructive">
                                <TrashIcon className="w-6 h-6" />
                            </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MicTest;
