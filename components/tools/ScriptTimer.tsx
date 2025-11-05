import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PlayIcon, PauseIcon } from '../Icons';

const Teleprompter: React.FC = () => {
    const [script, setScript] = useLocalStorage('teleprompter_script', 'Welcome to the show! Today, we have a very special guest...');
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useLocalStorage('teleprompter_speed', 2);
    const [fontSize, setFontSize] = useLocalStorage('teleprompter_fontSize', 48);
    const [isMirrored, setIsMirrored] = useState(false);

    const prompterRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);

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
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 space-y-4">
                <div 
                    ref={prompterRef} 
                    className={`h-96 overflow-y-scroll bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-light-primary dark:border-dark-primary smooth-scroll
                    ${isMirrored ? 'transform scale-x-[-1]' : ''}`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                >
                    <div className={`${isMirrored ? 'transform scale-x-[-1]' : ''}`}>
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
                    <div className="flex space-x-2">
                         <button onClick={togglePlay} className="px-4 py-2 rounded-lg bg-light-accent dark:bg-dark-accent text-white flex items-center">
                            {isPlaying ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary">Reset</button>
                    </div>
                     <button onClick={() => setIsMirrored(!isMirrored)} className={`px-4 py-2 rounded-lg ${isMirrored ? 'bg-light-accent dark:bg-dark-accent text-white' : 'bg-light-primary dark:bg-dark-primary'}`}>Mirror</button>
                </div>
                
                <div>
                    <label className="font-semibold text-sm">Script</label>
                    <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} className="w-full mt-2 bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm resize-y"></textarea>
                </div>
            </div>
        </div>
    );
};

export default Teleprompter;
