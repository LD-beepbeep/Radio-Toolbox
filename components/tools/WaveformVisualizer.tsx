

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon } from '../Icons';

const WaveformVisualizer: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // --- Customization State ---
    const [bgColor, setBgColor] = useState('#1C1C1E');
    const [waveColor, setWaveColor] = useState('#0A84FF');
    const [progressColor, setProgressColor] = useState('#FFFFFF');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const drawWaveform = useCallback((
        ctx: CanvasRenderingContext2D,
        buffer: AudioBuffer,
        color: string,
        progressPercent?: number
    ) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        
        // Draw main waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }
        ctx.stroke();

        // Draw progress overlay
        if (progressPercent !== undefined) {
            const progressWidth = width * progressPercent;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, progressWidth, height);
            ctx.clip();
            
            ctx.strokeStyle = progressColor;
            ctx.beginPath();
            for (let i = 0; i < width; i++) {
                 let min = 1.0;
                 let max = -1.0;
                 for (let j = 0; j < step; j++) {
                    const datum = data[(i * step) + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                ctx.moveTo(i, (1 + min) * amp);
                ctx.lineTo(i, (1 + max) * amp);
            }
            ctx.stroke();
            ctx.restore();

            // Draw playhead
            ctx.fillStyle = progressColor;
            ctx.fillRect(progressWidth - 1, 0, 2, height);
        }

    }, [bgColor, progressColor, waveColor]);

    // Effect to draw static preview when buffer or colors change
    useEffect(() => {
        if (audioBuffer && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) drawWaveform(ctx, audioBuffer, waveColor);
        }
    }, [audioBuffer, waveColor, bgColor, drawWaveform]);


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            setVideoUrl(null);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(buffer);
            audioContext.close();
        }
    };
    
    const startGeneration = () => {
        if (!canvasRef.current || !audioBuffer) return;
        
        setIsGenerating(true);
        setVideoUrl(null);
        setProgress(0);

        // 1. Create Audio Stream
        const audioContext = new AudioContext();
        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        const dest = audioContext.createMediaStreamDestination();
        sourceNode.connect(dest);
        const audioTrack = dest.stream.getAudioTracks()[0];
        sourceNode.start();

        // 2. Create Video Stream from Canvas
        const canvas = canvasRef.current;
        const canvasStream = canvas.captureStream(30); // 30 FPS
        const videoTrack = canvasStream.getVideoTracks()[0];

        // 3. Combine Streams
        const combinedStream = new MediaStream([videoTrack, audioTrack]);

        // 4. Setup MediaRecorder
        mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        
        recordedChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setIsGenerating(false);
            sourceNode.stop();
            audioContext.close();
        };
        
        mediaRecorderRef.current.start();
        
        // --- Animation Loop ---
        const duration = audioBuffer.duration;
        const frameCount = duration * 30; // 30 FPS
        let frame = 0;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const renderFrame = () => {
            if (frame > frameCount || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                if(mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current?.stop();
                return;
            }
            const progressPercent = frame / frameCount;
            setProgress(progressPercent);
            drawWaveform(ctx, audioBuffer, waveColor, progressPercent);
            frame++;
            requestAnimationFrame(renderFrame);
        };
        
        renderFrame();
    };


    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Waveform Visualizer</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 space-y-4">
                {!audioBuffer ? (
                    <div className="relative flex flex-col items-center justify-center h-48 border-2 border-dashed border-light-secondary dark:border-dark-secondary rounded-lg">
                        <UploadIcon className="w-10 h-10 text-gray-400 mb-2"/>
                        <p className="font-semibold">Upload an audio file to begin</p>
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                ) : (
                    <>
                        <div>
                             <h3 className="font-bold mb-2">Preview</h3>
                             <canvas ref={canvasRef} width="500" height="200" className="w-full h-auto bg-light-bg dark:bg-dark-bg rounded-lg"></canvas>
                        </div>
                       
                        <div>
                             <h3 className="font-bold mb-2">Customize</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center">
                                    <label htmlFor="bg-color" className="text-sm mb-1">Background</label>
                                    <input id="bg-color" type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-12 rounded-lg" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <label htmlFor="wave-color" className="text-sm mb-1">Waveform</label>
                                    <input id="wave-color" type="color" value={waveColor} onChange={e => setWaveColor(e.target.value)} className="w-12 h-12 rounded-lg" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <label htmlFor="progress-color" className="text-sm mb-1">Progress</label>
                                    <input id="progress-color" type="color" value={progressColor} onChange={e => setProgressColor(e.target.value)} className="w-12 h-12 rounded-lg" />
                                </div>
                            </div>
                        </div>

                        {!isGenerating && !videoUrl && (
                            <button onClick={startGeneration} className="w-full py-3 bg-light-accent dark:bg-dark-accent text-white font-bold rounded-lg">Generate Video</button>
                        )}

                        {isGenerating && (
                            <div className="text-center">
                                <p>Generating video... {Math.round(progress * 100)}%</p>
                                <div className="w-full bg-light-primary dark:bg-dark-primary rounded-full h-2.5 mt-2">
                                    <div className="bg-light-accent dark:bg-dark-accent h-2.5 rounded-full" style={{ width: `${progress * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        {videoUrl && (
                            <div className="text-center space-y-2">
                                <p className="font-bold">Generation Complete!</p>
                                <video src={videoUrl} controls className="w-full rounded-lg"></video>
                                <a href={videoUrl} download={`${audioFile?.name.replace(/\.[^/.]+$/, "")}-waveform.webm`} className="inline-block w-full py-3 bg-green-500 text-white font-bold rounded-lg">Download Video (with Audio)</a>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default WaveformVisualizer;
