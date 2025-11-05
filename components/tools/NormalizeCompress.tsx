import React, { useState, useRef, useCallback } from 'react';
import { DownloadIcon, PlayIcon, PauseIcon, UploadIcon, RefreshCwIcon } from '../Icons';

// Helper component for a single control slider
const ControlSlider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; unit: string; }> =
    ({ label, value, min, max, step, onChange, unit }) => (
    <div>
        <label className="flex justify-between text-sm">
            <span>{label}</span>
            <span>{value}{unit}</span>
        </label>
        <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-full h-2 bg-light-primary dark:bg-dark-primary rounded-lg appearance-none cursor-pointer"/>
    </div>
);

const NormalizeCompress: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
    const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState<null | 'original' | 'processed'>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [compressor, setCompressor] = useState({
        threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Handles file upload via drag-and-drop or file input
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        let file: File | null = null;
        if ('dataTransfer' in e) {
            e.preventDefault();
            e.stopPropagation();
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

    // Applies normalization and compression to the audio buffer
    const processAudio = useCallback(async () => {
        if (!originalBuffer) return;
        setIsLoading(true);

        const offlineCtx = new OfflineAudioContext(originalBuffer.numberOfChannels, originalBuffer.length, originalBuffer.sampleRate);

        // --- Normalization Pass ---
        let max = 0;
        for (let c = 0; c < originalBuffer.numberOfChannels; c++) {
            const channelData = originalBuffer.getChannelData(c);
            for (let i = 0; i < channelData.length; i++) {
                max = Math.max(max, Math.abs(channelData[i]));
            }
        }
        const gainValue = max > 0 ? 1 / max : 1;
        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = gainValue;
        
        // --- Compression Pass ---
        const compressorNode = offlineCtx.createDynamicsCompressor();
        compressorNode.threshold.setValueAtTime(compressor.threshold, offlineCtx.currentTime);
        compressorNode.knee.setValueAtTime(compressor.knee, offlineCtx.currentTime);
        compressorNode.ratio.setValueAtTime(compressor.ratio, offlineCtx.currentTime);
        compressorNode.attack.setValueAtTime(compressor.attack, offlineCtx.currentTime);
        compressorNode.release.setValueAtTime(compressor.release, offlineCtx.currentTime);
        
        const source = offlineCtx.createBufferSource();
        source.buffer = originalBuffer;
        source.connect(gainNode).connect(compressorNode).connect(offlineCtx.destination);
        source.start();

        const renderedBuffer = await offlineCtx.startRendering();
        setProcessedBuffer(renderedBuffer);
        setIsLoading(false);
    }, [originalBuffer, compressor]);

    // Toggles playback for either original or processed audio
    const togglePlay = (type: 'original' | 'processed') => {
        const bufferToPlay = type === 'original' ? originalBuffer : processedBuffer;

        if (isPlaying) {
            sourceNodeRef.current?.stop();
            setIsPlaying(null);
            if (isPlaying === type) return; // If clicking the same button, just stop.
        }
        
        if (!bufferToPlay) return;
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = bufferToPlay;
        source.connect(audioContextRef.current!.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
        sourceNodeRef.current = source;
        setIsPlaying(type);
    };

    // Converts an AudioBuffer to a WAV file Blob for download
    const bufferToWave = (abuffer: AudioBuffer) => {
        const numOfChan = abuffer.numberOfChannels, length = abuffer.length * numOfChan * 2 + 44, buffer = new ArrayBuffer(length), view = new DataView(buffer), channels = [];
        let offset = 0, pos = 0;
        const writeString = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i)); pos += s.length; };
        
        writeString('RIFF'); view.setUint32(pos, length - 8, true); pos += 4; writeString('WAVE'); pos += 4; writeString('fmt '); pos += 4;
        view.setUint32(pos, 16, true); pos += 4; view.setUint16(pos, 1, true); pos += 2; view.setUint16(pos, numOfChan, true); pos += 2;
        view.setUint32(pos, abuffer.sampleRate, true); pos += 4; view.setUint32(pos, abuffer.sampleRate * 2 * numOfChan, true); pos += 4;
        view.setUint16(pos, numOfChan * 2, true); pos += 2; view.setUint16(pos, 16, true); pos += 2; writeString('data'); pos += 4;
        view.setUint32(pos, length - pos - 4, true); pos += 4;

        for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
        while (pos < length) {
            for (let i = 0; i < numOfChan; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCompressorChange = (param: keyof typeof compressor, value: number) => {
        setCompressor(prev => ({ ...prev, [param]: value }));
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Normalize & Compress Tool</h2>
            {!originalBuffer ? (
                 <div onDrop={handleFileChange} onDragOver={e => e.preventDefault()} className="relative flex flex-col items-center justify-center h-64 border-2 border-dashed border-light-secondary dark:border-dark-secondary rounded-lg">
                    <UploadIcon className="w-10 h-10 text-gray-400 mb-2"/>
                    <p className="font-semibold">Drag & drop or click to upload an audio file</p>
                    <p className="text-sm text-gray-500">Your file will be processed in the browser.</p>
                    <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4">
                        <h3 className="font-bold mb-2">Compressor Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ControlSlider label="Threshold" value={compressor.threshold} min={-100} max={0} step={1} onChange={e => handleCompressorChange('threshold', +e.target.value)} unit=" dB" />
                            <ControlSlider label="Knee" value={compressor.knee} min={0} max={40} step={1} onChange={e => handleCompressorChange('knee', +e.target.value)} unit=" dB" />
                            <ControlSlider label="Ratio" value={compressor.ratio} min={1} max={20} step={1} onChange={e => handleCompressorChange('ratio', +e.target.value)} unit=":1" />
                            <div/>
                            <ControlSlider label="Attack" value={compressor.attack} min={0} max={1} step={0.001} onChange={e => handleCompressorChange('attack', +e.target.value)} unit=" s" />
                            <ControlSlider label="Release" value={compressor.release} min={0} max={1} step={0.01} onChange={e => handleCompressorChange('release', +e.target.value)} unit=" s" />
                        </div>
                        <button onClick={processAudio} disabled={isLoading} className="mt-4 w-full px-4 py-3 flex items-center justify-center space-x-2 rounded-lg bg-light-accent dark:bg-dark-accent text-white font-semibold disabled:opacity-50">
                            {isLoading ? <span>Processing...</span> : <><RefreshCwIcon className="w-5 h-5"/><span>Apply Normalization & Compression</span></>}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 text-center">
                             <h3 className="font-bold mb-2">Original</h3>
                             <button onClick={() => togglePlay('original')} className="w-16 h-16 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary mx-auto">
                                {isPlaying === 'original' ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                            </button>
                        </div>
                        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 text-center">
                             <h3 className="font-bold mb-2">Processed</h3>
                             {processedBuffer ? (
                                <button onClick={() => togglePlay('processed')} className="w-16 h-16 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary mx-auto">
                                    {isPlaying === 'processed' ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                                </button>
                             ) : <div className="h-16 flex items-center justify-center text-sm text-gray-400">Apply settings to preview</div>}
                        </div>
                    </div>
                    
                    {processedBuffer && (
                        <button onClick={handleDownload} className="w-full px-4 py-3 flex items-center justify-center space-x-2 rounded-lg bg-green-500 text-white font-semibold">
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
