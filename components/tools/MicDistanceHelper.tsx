import React, { useState, useEffect, useRef } from 'react';

const MicDistanceHelper: React.FC = () => {
    const [volume, setVolume] = useState(0); // 0 to 100
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);

    const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(dataArray);

        let sumSquares = 0.0;
        for (const amplitude of dataArray) {
            sumSquares += amplitude * amplitude;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        // Scale the RMS value (typically 0-1) to a 0-100 range. 
        // The multiplier (e.g., 200) is empirical and may need tuning.
        setVolume(Math.min(100, rms * 200));

        animationFrameId.current = requestAnimationFrame(updateVolume);
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

            updateVolume();
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
        setVolume(0);
    };

    useEffect(() => {
        startListening();
        return () => stopListening();
    }, []);

    const getStatus = () => {
        if (volume > 90) return { text: "Too Close / Clipping", color: "bg-destructive" };
        if (volume > 50) return { text: "Good", color: "bg-green-500" };
        return { text: "Too Far", color: "bg-yellow-500" };
    };

    const { text, color } = getStatus();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Mic Distance Helper</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 flex flex-col items-center space-y-6">
                <div className="text-center">
                    <p className="text-2xl font-bold">{text}</p>
                    <p className="text-sm text-gray-500">Adjust your distance until you are consistently in the "Good" range.</p>
                </div>
                
                <div className="w-full max-w-sm h-64 relative flex justify-center items-end space-x-2 p-4">
                    {/* Zones */}
                    <div className="absolute inset-0 flex justify-center items-end space-x-2">
                         <div className="h-[50%] w-1/3 bg-yellow-500/30 rounded-t-lg"></div>
                        <div className="h-[90%] w-1/3 bg-green-500/30 rounded-t-lg"></div>
                        <div className="h-full w-1/3 bg-destructive/30 rounded-t-lg"></div>
                    </div>
                    
                    {/* Indicator */}
                    <div 
                        className={`absolute w-[90%] h-12 rounded-lg border-4 border-white dark:border-black ${color} shadow-lg flex items-center justify-center transition-all duration-100`}
                        style={{ bottom: `${(volume / 100) * (16 - 3)}rem` }} // 16rem height - 3rem padding
                    >
                         <div className="h-1 w-8 bg-white/50 rounded-full"></div>
                    </div>
                </div>

                 <div className="w-full max-w-sm">
                    <div className="h-4 bg-light-primary dark:bg-dark-primary rounded-lg overflow-hidden">
                        <div className={`h-4 ${color} rounded-lg`} style={{ width: `${volume}%`, transition: 'width 0.1s linear' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MicDistanceHelper;
