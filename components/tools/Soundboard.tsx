
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon } from '../Icons';

type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
type NoiseType = 'white' | 'pink' | 'brown';
type GeneratorType = 'tone' | 'noise';

const ToneGenerator: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [generatorType, setGeneratorType] = useState<GeneratorType>('tone');
    const [volume, setVolume] = useState(0.5);
    const [frequency, setFrequency] = useState(440);
    const [waveform, setWaveform] = useState<WaveformType>('sine');
    const [noiseType, setNoiseType] = useState<NoiseType>('white');

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioScheduledSourceNode | AudioWorkletNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const stopSound = () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
    };

    const playSound = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioContextRef.current;
        
        if (!gainNodeRef.current) {
            gainNodeRef.current = audioCtx.createGain();
            gainNodeRef.current.connect(audioCtx.destination);
        }
        gainNodeRef.current.gain.setValueAtTime(volume, audioCtx.currentTime);

        if (generatorType === 'tone') {
            const oscillator = audioCtx.createOscillator();
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            oscillator.connect(gainNodeRef.current);
            oscillator.start();
            sourceNodeRef.current = oscillator;
        } else { // Noise
            const bufferSize = 2 * audioCtx.sampleRate;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            let lastOut = 0;
            switch(noiseType) {
                case 'white':
                    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
                    break;
                case 'pink':
                    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                    for (let i = 0; i < bufferSize; i++) {
                        const white = Math.random() * 2 - 1;
                        b0 = 0.99886 * b0 + white * 0.0555179;
                        b1 = 0.99332 * b1 + white * 0.0750759;
                        b2 = 0.96900 * b2 + white * 0.1538520;
                        b3 = 0.86650 * b3 + white * 0.3104856;
                        b4 = 0.55000 * b4 + white * 0.5329522;
                        b5 = -0.7616 * b5 - white * 0.0168980;
                        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                        output[i] *= 0.11;
                        b6 = white * 0.115926;
                    }
                    break;
                case 'brown':
                    for (let i = 0; i < bufferSize; i++) {
                        const white = Math.random() * 2 - 1;
                        output[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = output[i];
                        output[i] *= 3.5;
                    }
                    break;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;
            noise.connect(gainNodeRef.current);
            noise.start();
            sourceNodeRef.current = noise;
        }
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopSound();
        } else {
            playSound();
        }
    };

    useEffect(() => {
        if (isPlaying && gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1);
        }
    }, [volume, isPlaying]);

    useEffect(() => {
        if (isPlaying && generatorType === 'tone' && sourceNodeRef.current && 'frequency' in sourceNodeRef.current) {
            (sourceNodeRef.current as OscillatorNode).frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
        }
    }, [frequency, isPlaying, generatorType]);

     useEffect(() => {
        if (isPlaying) {
           stopSound();
           playSound();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waveform, noiseType, generatorType]);


    useEffect(() => {
        return () => { // Cleanup on unmount
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const ControlButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode}> = ({ active, onClick, children}) => (
        <button onClick={onClick} className={`px-4 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-light-accent dark:bg-dark-accent text-white' : 'bg-light-primary dark:bg-dark-primary'}`}>
            {children}
        </button>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Tone & Noise Generator</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 space-y-6">
                <div className="flex justify-center">
                     <button onClick={togglePlay} className="w-24 h-24 bg-light-accent dark:bg-dark-accent text-white rounded-full flex items-center justify-center">
                        {isPlaying ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10"/>}
                    </button>
                </div>

                <div className="p-4 bg-light-bg dark:bg-dark-primary rounded-lg space-y-4">
                     <label className="font-semibold">Volume</label>
                     <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full"/>
                </div>

                <div className="flex space-x-2 bg-light-bg dark:bg-dark-primary p-2 rounded-lg">
                    <ControlButton active={generatorType === 'tone'} onClick={() => setGeneratorType('tone')}>Tone</ControlButton>
                    <ControlButton active={generatorType === 'noise'} onClick={() => setGeneratorType('noise')}>Noise</ControlButton>
                </div>
                
                {generatorType === 'tone' ? (
                    <div className="p-4 bg-light-bg dark:bg-dark-primary rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                             <label className="font-semibold">Frequency</label>
                             <span className="font-mono">{frequency.toFixed(0)} Hz</span>
                        </div>
                        <input type="range" min="20" max="2000" step="1" value={frequency} onChange={e => setFrequency(parseInt(e.target.value))} className="w-full"/>
                        <div className="flex justify-between gap-2 pt-2">
                           <ControlButton active={waveform === 'sine'} onClick={() => setWaveform('sine')}>Sine</ControlButton>
                           <ControlButton active={waveform === 'square'} onClick={() => setWaveform('square')}>Square</ControlButton>
                           <ControlButton active={waveform === 'sawtooth'} onClick={() => setWaveform('sawtooth')}>Saw</ControlButton>
                           <ControlButton active={waveform === 'triangle'} onClick={() => setWaveform('triangle')}>Triangle</ControlButton>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-light-bg dark:bg-dark-primary rounded-lg space-y-4">
                        <label className="font-semibold">Noise Type</label>
                        <div className="flex justify-between gap-2">
                            <ControlButton active={noiseType === 'white'} onClick={() => setNoiseType('white')}>White</ControlButton>
                            <ControlButton active={noiseType === 'pink'} onClick={() => setNoiseType('pink')}>Pink</ControlButton>
                            <ControlButton active={noiseType === 'brown'} onClick={() => setNoiseType('brown')}>Brown</ControlButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToneGenerator;
