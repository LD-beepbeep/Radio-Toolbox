
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PlayIcon, PauseIcon } from '../Icons';

const Teleprompter: React.FC = () => {
    const [script, setScript] = useLocalStorage('teleprompter_script', 'Welcome back to The Sonic Journey with your host, Alex Ryder. Tonight, we\'re exploring the sounds of the city after midnight. From neon-drenched synthwave to soulful late-night jazz, we\'ve got a playlist that will carry you through the darkness. Stay tuned.');
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useLocalStorage('teleprompter_speed', 2);
    const [fontSize, setFontSize] = useLocalStorage('teleprompter_fontSize', 48);
    const [isMirrored, setIsMirrored] = useState(false);

    const prompterRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);

    const estimatedReadingTime = useMemo(() => {
        const wordCount = script.split(/\s+/).filter(Boolean).length;
        // Map speed (0.5 to 10) to WPM (e.g., 70 to 250 WPM)
        const wpm = 60 + (speed / 10) * 200;
        if (wordCount === 0 || wpm === 0) return '00:00';
        const minutes = wordCount / wpm;
        const totalSeconds = Math.round(minutes * 60);
        const displayMinutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const displaySeconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${displayMinutes}:${displaySeconds}`;
    }, [script, speed]);

    const startScrolling = () => {
        if (!prompterRef.current) return;
        const prompter = prompterRef.current;

        const scroll = () => {
            prompter.scrollTop += speed / 10;
            if (prompter.scrollTop < prompter.scrollHeight - prompter.clientHeight) {
                scrollIntervalRef.current = requestAnimationFrame(scroll);
            } else {
                setIsPlaying(false);
            }
        };
        scrollIntervalRef.current = requestAnimationFrame(scroll);
    };

    const stopScrolling = () => {
        if (scrollIntervalRef.current) {
            cancelAnimationFrame(scrollIntervalRef.current);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            startScrolling();
        } else {
            stopScrolling();
        }
        return () => stopScrolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, speed]);

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
    };
    
    const handleReset = () => {
        if (prompterRef.current) prompterRef.current.scrollTop = 0;
        setIsPlaying(false);
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Teleprompter</h2>
            <div className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-5xl p-4 space-y-4 shadow-soft">
                <div 
                    ref={prompterRef} 
                    className={`h-96 overflow-y-scroll bg-light-bg-primary dark:bg-dark-bg-secondary p-4 rounded-4xl border border-light-divider dark:border-dark-divider smooth-scroll
                    ${isMirrored ? 'transform scale-x-[-1]' : ''}`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                >
                    <div className={`text-light-text-primary dark:text-dark-text-primary ${isMirrored ? 'transform scale-x-[-1]' : ''}`}>
                       {script.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-semibold text-sm">Speed</label>
                        <input type="range" min="0.5" max="10" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full"/>
                    </div>
                     <div className="space-y-2">
                        <label className="font-semibold text-sm">Font Size</label>
                        <input type="range" min="16" max="120" step="1" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full"/>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex space-x-2 items-center">
                         <button onClick={togglePlay} className="px-4 py-2 rounded-full bg-light-accent dark:bg-dark-accent text-white flex items-center font-semibold">
                            {isPlaying ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={handleReset} className="px-4 py-2 rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary font-semibold">Reset</button>
                         <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary ml-4">
                            Est. Time: <span className="font-mono font-semibold">{estimatedReadingTime}</span>
                        </div>
                    </div>
                     <button onClick={() => setIsMirrored(!isMirrored)} className={`px-4 py-2 rounded-full font-semibold ${isMirrored ? 'bg-light-accent dark:bg-dark-accent text-white' : 'bg-light-bg-primary dark:bg-dark-bg-secondary'}`}>Mirror</button>
                </div>
                
                <div>
                    <label className="font-semibold text-sm">Script</label>
                    <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} className="w-full mt-2 bg-light-bg-primary dark:bg-dark-bg-secondary rounded-3xl p-4 text-sm resize-y border border-light-divider dark:border-dark-divider"></textarea>
                </div>
            </div>
        </div>
    );
};

export default Teleprompter;
