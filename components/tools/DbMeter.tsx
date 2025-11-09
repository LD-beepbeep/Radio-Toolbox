
import React, { useState, useEffect, useRef } from 'react';

const DbMeter: React.FC = () => {
    const [db, setDb] = useState(-100); // dBFS value
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const dataArrayRef = useRef<Float32Array | null>(null);

    const updateMeter = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        
        let sumSquares = 0.0;
        for (const amplitude of dataArrayRef.current) {
            sumSquares += amplitude * amplitude;
        }
        const rms = Math.sqrt(sumSquares / dataArrayRef.current.length);
        
        const currentDb = 20 * Math.log10(rms);
        
        // Use a smoothing factor to prevent jerky movements
        setDb(prevDb => Math.max(currentDb, prevDb * 0.9));

        animationFrameId.current = requestAnimationFrame(updateMeter);
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
            dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);

            updateMeter();
        } catch (err) {
            console.error(err);
            alert("Could not access microphone.");
        }
    };

    const stopListening = () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
        setDb(-100);
    };

    useEffect(() => {
        startListening();
        return () => stopListening();
    }, []);

    // Convert dBFS (-60 to 0 range) to a 0-100 percentage for the meter
    const dbToPercentage = (dbValue: number) => {
        const minDb = -60;
        const maxDb = 0;
        if (dbValue < minDb) return 0;
        if (dbValue > maxDb) return 100;
        return ((dbValue - minDb) / (maxDb - minDb)) * 100;
    };
    
    const percentage = dbToPercentage(db);
    
    const getMeterColor = (p: number) => {
        if (p > 95) return 'bg-destructive'; // Clipping
        if (p > 75) return 'bg-yellow-500'; // Hot
        return 'bg-green-500'; // Good
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">dB Meter</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-6 flex flex-col items-center space-y-6 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                <div className="text-center">
                    <p className="text-6xl font-mono tracking-tighter">{db > -90 ? db.toFixed(1) : '-∞'}</p>
                    <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">dBFS</p>
                </div>
                
                <div className="w-full max-w-lg h-12 bg-light-bg-primary dark:bg-dark-bg-secondary rounded-full overflow-hidden border-2 border-light-divider dark:border-dark-divider">
                    <div 
                        className={`h-full rounded-full transition-all duration-75 ${getMeterColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                
                <div className="w-full max-w-lg flex justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    <span>-60</span>
                    <span>-40</span>
                    <span>-20</span>
                    <span>-10</span>
                    <span>0</span>
                </div>

                <p className="text-sm text-center text-light-text-secondary dark:text-dark-text-secondary max-w-md pt-4">
                    Aim for your voice to peak in the yellow zone (around -12 to -6 dB) for a strong, clear signal without clipping.
                </p>
            </div>
        </div>
    );
};

export default DbMeter;
