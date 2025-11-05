import React, { useState, useEffect, useRef } from 'react';

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const VoicePitchMonitor: React.FC = () => {
    const [pitch, setPitch] = useState({ hz: 0, note: '--', detune: 0 });
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const bufferRef = useRef<Float32Array | null>(null);

    const freqToNote = (frequency: number) => {
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    const noteToFreq = (note: number) => {
        return 440 * Math.pow(2, (note - 69) / 12);
    }
    
    const getCents = (frequency: number, note: number) => {
        return Math.floor(1200 * Math.log(frequency / noteToFreq(note)) / Math.log(2));
    }

    const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
        const SIZE = buf.length;
        const rms = Math.sqrt(buf.reduce((acc, val) => acc + val * val, 0) / SIZE);
        if (rms < 0.01) return -1;

        let r1 = 0, r2 = SIZE - 1;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }
        }
        buf = buf.slice(r1, r2);

        const newSize = buf.length;
        const c = new Array(newSize).fill(0);
        for (let i = 0; i < newSize; i++) {
            for (let j = 0; j < newSize - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }
        
        let d = 0;
        while (c[d] > c[d + 1]) d++;
        
        let maxval = -1, maxpos = -1;
        for (let i = d; i < newSize; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        
        let T0 = maxpos;
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);
        
        return sampleRate / T0;
    }

    const updatePitch = () => {
        if (!analyserRef.current || !bufferRef.current) return;
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const frequency = autoCorrelate(bufferRef.current, audioContextRef.current!.sampleRate);
        
        if (frequency !== -1) {
            const note = freqToNote(frequency);
            setPitch({
                hz: frequency,
                note: NOTE_NAMES[note % 12],
                detune: getCents(frequency, note)
            });
        } else {
             setPitch({ hz: 0, note: '--', detune: 0 });
        }
        
        animationFrameId.current = requestAnimationFrame(updatePitch);
    };

    const startListening = async () => {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            source.connect(analyserRef.current);
            bufferRef.current = new Float32Array(analyserRef.current.fftSize);
            updatePitch();
        } catch (err) {
            console.error(err);
            alert("Could not access microphone.");
        }
    };

    const stopListening = () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
    };

    useEffect(() => {
        startListening();
        return () => stopListening();
    }, []);

    const detunePercent = Math.max(-50, Math.min(50, pitch.detune)) / 50 * 100;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Voice Pitch Monitor</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 flex flex-col items-center space-y-6">
                 <div className="flex items-baseline space-x-2">
                    <span className="text-7xl font-bold">{pitch.note}</span>
                    <span className="text-2xl text-gray-400">{pitch.hz > 0 ? `${pitch.hz.toFixed(1)} Hz` : ''}</span>
                 </div>

                 <div className="w-full max-w-sm">
                    <div className="relative h-2 bg-light-primary dark:bg-dark-primary rounded-full">
                        <div className="absolute top-1/2 left-1/2 w-1 h-4 -translate-y-1/2 -translate-x-1/2 bg-gray-500 rounded-full"></div>
                        <div 
                            className="absolute top-0 h-2 w-2 bg-light-accent dark:bg-dark-accent rounded-full -translate-x-1/2 transition-all duration-75"
                            style={{ left: `calc(50% + ${detunePercent / 2}%)` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Flat</span>
                        <span>In Tune</span>
                        <span>Sharp</span>
                    </div>
                 </div>
                 
                 <p className="text-sm text-center text-gray-500 max-w-xs">Speak into your microphone to see your pitch. Use this to maintain a consistent vocal tone.</p>
            </div>
        </div>
    );
};

export default VoicePitchMonitor;
