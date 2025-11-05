import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon } from '../Icons';

interface Exercise {
    name: string;
    description: string;
    duration: number; // in seconds
    isInteractive?: boolean;
}

const WARMUPS: Exercise[] = [
    { name: "Lip Trills", description: "Gently blow air through your closed lips to create a buzzing sound. This relaxes your lips and vocal cords.", duration: 60 },
    { name: "Pitch Glide", description: "Follow the tone as it glides from low to high and back down. This helps warm up your entire vocal range.", duration: 60, isInteractive: true },
    { name: "Diaphragmatic Breathing", description: "Inhale deeply, allowing your belly to expand. Exhale slowly and steadily. This supports your voice.", duration: 90 },
    { name: "Tongue Twisters", description: "Repeat the phrase 'Red leather, yellow leather' clearly and quickly. This improves articulation.", duration: 60 },
];

const VoiceWarmup: React.FC = () => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(WARMUPS[0].duration);
    const [isActive, setIsActive] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);

    const exercise = WARMUPS[currentExerciseIndex];

    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if(exercise.isInteractive) stopPitchGlide();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, exercise.isInteractive]);

    const startPitchGlide = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioContextRef.current;
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);

        const startTime = audioCtx.currentTime;
        oscillator.frequency.setValueAtTime(100, startTime);
        oscillator.frequency.linearRampToValueAtTime(800, startTime + 4);
        oscillator.frequency.linearRampToValueAtTime(100, startTime + 8);
        
        oscillator.start();
        oscillator.stop(startTime + 8.1); // Stop after glide
        oscillator.onended = () => { // loop
            if (isActive) startPitchGlide();
        }
        oscillatorRef.current = oscillator;
    }

    const stopPitchGlide = () => {
        oscillatorRef.current?.stop();
    }

    const handleToggle = () => {
        if (isActive) {
            setIsActive(false);
            if (exercise.isInteractive) stopPitchGlide();
        } else {
            if (timeLeft === 0) {
                 setTimeLeft(exercise.duration);
            }
            setIsActive(true);
            if (exercise.isInteractive) startPitchGlide();
        }
    };
    
    const selectExercise = (index: number) => {
        setIsActive(false);
        if(WARMUPS[currentExerciseIndex].isInteractive) stopPitchGlide();
        setCurrentExerciseIndex(index);
        setTimeLeft(WARMUPS[index].duration);
    }
    
    const formatTime = (seconds: number) => `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Voice Warm-up</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-light-surface dark:bg-dark-surface rounded-2xl p-4">
                    <h3 className="font-semibold mb-2">Exercises</h3>
                    <ul className="space-y-2">
                        {WARMUPS.map((ex, index) => (
                             <li key={ex.name}>
                                 <button onClick={() => selectExercise(index)} className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${currentExerciseIndex === index ? 'bg-light-accent dark:bg-dark-accent text-white' : 'hover:bg-light-primary dark:hover:bg-dark-primary'}`}>
                                     {ex.name}
                                </button>
                             </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2 bg-light-surface dark:bg-dark-surface rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <h3 className="text-2xl font-bold mb-2">{exercise.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{exercise.description}</p>
                    
                    <div className="text-6xl font-mono mb-6">{formatTime(timeLeft)}</div>
                    
                    <button onClick={handleToggle} className="w-20 h-20 bg-light-accent dark:bg-dark-accent text-white rounded-full flex items-center justify-center">
                        {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceWarmup;
