import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadIcon, PlayIcon, PauseIcon, UploadIcon, RefreshCwIcon } from '../Icons';

type CompressionLevel = 'light' | 'medium' | 'heavy';

const COMPRESSION_PRESETS: Record<CompressionLevel, Omit<DynamicsCompressorOptions, 'channelCount'>> = {
    light: { threshold: -18, knee: 20, ratio: 4, attack: 0.005, release: 0.20 },
    medium: { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 },
    heavy: { threshold: -36, knee: 40, ratio: 20, attack: 0.001, release: 0.30 },
};

const NormalizeCompress: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
    const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState<null | 'original' | 'processed'>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Settings state
    const [useNormalize, setUseNormalize] = useState(true);
    const [useCompressor, setUseCompressor] = useState(true);
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        // Cleanup audio on unmount
        return () => {
            if (sourceNodeRef.current) {
                try {
                    sourceNodeRef.current.stop();
                } catch (e) {
                    console.warn("NormalizeCompress: Failed to stop audio source on unmount.", e);
                }
            }
        };
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        let file: File | null = null;
        if ('dataTransfer' in e) {
            e.preventDefault(); e.stopPropagation();
            file = e.dataTransfer.files?.[0];
        } else {
            file = e.target.files?.[0];
        }
        
        if (file) {
            setIsLoading(true);
            setAudioFile(file);
            setOriginalBuffer(null);
            setProcessedBuffer(null);
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const arrayBuffer = await file.arrayBuffer();
            const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            setOriginalBuffer(buffer);
            setIsLoading(false);
        }
    };

    const processAudio = useCallback(async () => {
        if (!originalBuffer) return;
        setIsLoading(true);

        const offlineCtx = new OfflineAudioContext(originalBuffer.numberOfChannels, originalBuffer.length, originalBuffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = originalBuffer;

        let currentNode: AudioNode = source;

        if (useNormalize) {
            let max = 0;
            for (let c = 0; c < originalBuffer.numberOfChannels; c++) {
                const channelData = originalBuffer.getChannelData(c);
                channelData.forEach(sample => { max = Math.max(max, Math.abs(sample)); });
            }
            const gainValue = max > 0 ? 1 / max : 1;
            const gainNode = offlineCtx.createGain();
            gainNode.gain.value = gainValue;
            currentNode.connect(gainNode);
            currentNode = gainNode;
        }

        if (useCompressor) {
            const compressorNode = offlineCtx.createDynamicsCompressor();
            const preset = COMPRESSION_PRESETS[compressionLevel];
            Object.keys(preset).forEach(key => {
                 const param = compressorNode[key as keyof DynamicsCompressorOptions] as AudioParam;
                 if (param) param.setValueAtTime(preset[key as keyof typeof preset] as number, offlineCtx.currentTime);
            });
            currentNode.connect(compressorNode);
            currentNode = compressorNode;
        }
        
        currentNode.connect(offlineCtx.destination);
        source.start();

        const renderedBuffer = await offlineCtx.startRendering();
        setProcessedBuffer(renderedBuffer);
        setIsLoading(false);
    }, [originalBuffer, useNormalize, useCompressor, compressionLevel]);


    const togglePlay = (type: 'original' | 'processed') => {
        // If anything is playing, stop it first.
        if (sourceNodeRef.current) {
            sourceNodeRef.current.onended = null; // Avoid race condition with onended callback
            sourceNodeRef.current.stop();
        }

        // If the user clicked the currently playing button, we just stop.
        if (isPlaying === type) {
            setIsPlaying(null);
            sourceNodeRef.current = null;
            return;
        }

        // Proceed to play the selected audio
        const bufferToPlay = type === 'original' ? originalBuffer : processedBuffer;
        if (!bufferToPlay || !audioContextRef.current) {
            setIsPlaying(null); // Ensure state is clean if we can't play
            sourceNodeRef.current = null;
            return;
        }

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = bufferToPlay;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            // Only update state if this is the currently active source
            if (sourceNodeRef.current === source) {
                setIsPlaying(null);
                sourceNodeRef.current = null;
            }
        };
        source.start();
        sourceNodeRef.current = source;
        setIsPlaying(type);
    };

    const bufferToWave = (abuffer: AudioBuffer) => {
        const numOfChan = abuffer.numberOfChannels;
        const length = abuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = Array.from({ length: abuffer.numberOfChannels }, (_, i) => abuffer.getChannelData(i));
        let offset = 0;
        let pos = 0;
        const writeString = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i)); pos += s.length; };
        
        writeString('RIFF'); view.setUint32(pos, length - 8, true); pos += 4; writeString('WAVE'); pos += 4; writeString('fmt '); pos += 4;
        view.setUint32(pos, 16, true); pos += 4; view.setUint16(pos, 1, true); pos += 2; view.setUint16(pos, numOfChan, true); pos += 2;
        view.setUint32(pos, abuffer.sampleRate, true); pos += 4; view.setUint32(pos, abuffer.sampleRate * 2 * numOfChan, true); pos += 4;
        view.setUint16(pos, numOfChan * 2, true); pos += 2; view.setUint16(pos, 16, true); pos += 2; writeString('data'); pos += 4;
        view.setUint32(pos, length - pos - 4, true); pos += 4;

        while (pos < length && offset < abuffer.length) {
            for (let i = 0; i < numOfChan; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        return new Blob([view], { type: 'audio/wav' });
    };

    const handleDownload = () => {
        if (!processedBuffer || !audioFile) return;
        const wavBlob = bufferToWave(processedBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_${audioFile.name.replace(/\.[^/.]+$/, "")}.wav`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const OptionToggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; description: string;}> = ({label, checked, onChange, description}) => (
        <div className="flex items-start space-x-3">
            <div className="flex items-center h-5">
                <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 rounded text-light-accent focus:ring-light-accent"/>
            </div>
            <div className="text-sm">
                <label className="font-bold text-light-text-primary dark:text-dark-text-primary">{label}</label>
                <p className="text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
            </div>
        </div>
    );
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Audio Processing</h2>
            {!originalBuffer ? (
                 <div onDrop={handleFileChange} onDragOver={e => e.preventDefault()} className="relative flex flex-col items-center justify-center h-64 border-2 border-dashed border-light-divider dark:border-dark-divider rounded-5xl">
                    <UploadIcon className="w-10 h-10 text-gray-400 mb-2"/>
                    <p className="font-semibold">Drag & drop or click to upload an audio file</p>
                    <p className="text-sm text-gray-500">Your file will be processed locally in the browser.</p>
                    <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-5 space-y-5 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                         <OptionToggle label="Normalize Audio" checked={useNormalize} onChange={setUseNormalize} description="Boosts the overall volume to the maximum level without clipping." />
                         <OptionToggle label="Apply Compressor" checked={useCompressor} onChange={setUseCompressor} description="Reduces the dynamic range, making quiet parts louder and loud parts quieter." />
                        
                         {useCompressor && (
                            <div className="pl-8">
                                <h4 className="text-sm font-bold mb-2">Compression Level</h4>
                                <div className="flex space-x-2">
                                    {(['light', 'medium', 'heavy'] as CompressionLevel[]).map(level => (
                                         <button key={level} onClick={() => setCompressionLevel(level)} className={`px-4 py-2 text-sm font-semibold rounded-full capitalize transition-colors ${compressionLevel === level ? 'bg-light-accent text-white' : 'bg-light-bg-primary dark:bg-dark-bg-secondary'}`}>
                                            {level}
                                         </button>
                                    ))}
                                </div>
                            </div>
                         )}

                    </div>
                    
                    <button onClick={processAudio} disabled={isLoading} className="w-full px-4 py-3 flex items-center justify-center space-x-2 rounded-full bg-light-accent dark:bg-dark-accent text-white font-semibold disabled:opacity-50 text-base shadow-lg hover:opacity-90 transition-opacity">
                        {isLoading ? <span>Processing...</span> : <><RefreshCwIcon className="w-5 h-5"/><span>Apply Effects</span></>}
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-light-surface dark:bg-dark-surface rounded-4xl p-4 text-center">
                             <h3 className="font-bold mb-2">Original</h3>
                             <button onClick={() => togglePlay('original')} className="w-16 h-16 flex items-center justify-center rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary mx-auto">
                                {isPlaying === 'original' ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                            </button>
                        </div>
                        <div className="bg-light-surface dark:bg-dark-surface rounded-4xl p-4 text-center">
                             <h3 className="font-bold mb-2">Processed</h3>
                             {processedBuffer ? (
                                <button onClick={() => togglePlay('processed')} className="w-16 h-16 flex items-center justify-center rounded-full bg-light-bg-primary dark:bg-dark-bg-secondary mx-auto">
                                    {isPlaying === 'processed' ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                                </button>
                             ) : <div className="h-16 flex items-center justify-center text-sm text-light-text-secondary dark:text-dark-text-secondary">Apply effects to preview</div>}
                        </div>
                    </div>
                    
                    {processedBuffer && (
                        <button onClick={handleDownload} className="w-full px-4 py-3 flex items-center justify-center space-x-2 rounded-full bg-green-500 text-white font-semibold text-base shadow-lg hover:opacity-90 transition-opacity">
                            <DownloadIcon className="w-5 h-5"/>
                            <span>Download Processed File</span>
                        </button>
                    )}
                </div>
            )}
             {isLoading && <div className="text-center p-4">Loading & Processing...</div>}
        </div>
    );
};

export default NormalizeCompress;