
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown } from '../Icons';

// --- Types and Templates ---
type TextAlign = 'left' | 'center' | 'right';
type Font = 'Inter' | 'Times New Roman' | 'Courier New';

interface TextElement {
    type: 'text';
    content: string;
    x: number;
    y: number;
    size: number;
    color: string;
    font: Font;
    width: number;
    textAlign: TextAlign;
}
interface ImageElement {
    type: 'image';
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
type PosterElement = TextElement | ImageElement;
interface Template {
    name: string;
    bgColor: string;
    elements: PosterElement[];
}

const TEMPLATES: Template[] = [
    {
        name: "New Episode Alert",
        bgColor: "#F2F2F7",
        elements: [
            { type: 'text', content: 'NEW EPISODE', x: 250, y: 80, size: 24, color: '#8E8E93', font: 'Inter', width: 400, textAlign: 'center' },
            { type: 'text', content: 'The Future of Sound', x: 250, y: 180, size: 64, color: '#1C1C1E', font: 'Inter', width: 400, textAlign: 'center' },
            { type: 'text', content: 'Exploring AI in music creation and what it means for artists.', x: 250, y: 250, size: 20, color: '#636366', font: 'Inter', width: 380, textAlign: 'center' },
            { type: 'text', content: 'THE SONIC JOURNEY', x: 250, y: 450, size: 28, color: '#0A84FF', font: 'Inter', width: 400, textAlign: 'center' },
        ]
    },
    {
        name: "Artist Spotlight",
        bgColor: "#6E5CE2",
        elements: [
            { type: 'text', content: 'ARTIST SPOTLIGHT', x: 50, y: 60, size: 48, color: '#FFFFFF', font: 'Inter', width: 400, textAlign: 'left' },
            { type: 'text', content: 'GLASS ANIMALS', x: 50, y: 250, size: 72, color: '#FFFFFF', font: 'Inter', width: 400, textAlign: 'left' },
            { type: 'text', content: 'An exclusive interview and a live performance of their new single.', x: 50, y: 310, size: 22, color: '#FFFFFF', font: 'Inter', width: 400, textAlign: 'left' },
        ]
    },
];
const FONTS: Font[] = ['Inter', 'Times New Roman', 'Courier New'];

const ShowPosterMaker: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bgColor, setBgColor] = useState(TEMPLATES[0].bgColor);
    const [elements, setElements] = useState<PosterElement[]>(TEMPLATES[0].elements);
    const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const canvasWidth = 500;
    const canvasHeight = 500;
    
    const preloadedImages = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
        elements.forEach(el => {
            if (el.type === 'image' && !preloadedImages.current.has(el.src)) {
                const img = new Image();
                img.src = el.src;
                img.onload = () => {
                    preloadedImages.current.set(el.src, img);
                    draw();
                }
            }
        });
    }, [elements]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        elements.forEach((el, index) => {
            if (el.type === 'text') {
                ctx.fillStyle = el.color;
                ctx.font = `bold ${el.size}px ${el.font}`;
                ctx.textAlign = el.textAlign;
                ctx.textBaseline = 'middle';

                let drawX = el.x;
                if (el.textAlign === 'left') drawX = el.x - el.width / 2;
                if (el.textAlign === 'right') drawX = el.x + el.width / 2;
                
                ctx.fillText(el.content, drawX, el.y, el.width);
            } else if (el.type === 'image') {
                const img = preloadedImages.current.get(el.src);
                 if (img) {
                    ctx.drawImage(img, el.x - el.width / 2, el.y - el.height / 2, el.width, el.height);
                }
            }
             // Draw selection box
            if(index === selectedElementIndex) {
                ctx.strokeStyle = '#0A84FF';
                ctx.lineWidth = 2;
                if(el.type === 'text') {
                    const textMetrics = ctx.measureText(el.content);
                    const actualWidth = Math.min(textMetrics.width, el.width);
                    const textHeight = el.size; 
                    const rectX = el.x - actualWidth / 2 - 5;
                    ctx.strokeRect(rectX, el.y - textHeight / 2 - 5, actualWidth + 10, textHeight + 10);
                } else if(el.type === 'image') {
                    ctx.strokeRect(el.x - el.width / 2 - 5, el.y - el.height / 2 - 5, el.width + 10, el.height + 10);
                }
            }
        });
    }, [bgColor, elements, selectedElementIndex]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleTemplateChange = (index: number) => {
        setBgColor(TEMPLATES[index].bgColor);
        setElements(TEMPLATES[index].elements);
        setSelectedElementIndex(null);
    };

    const updateElement = (index: number, newProps: Partial<PosterElement>) => {
        setElements(prev => prev.map((el, i) => i === index ? ({ ...el, ...newProps } as PosterElement) : el));
    };

    const addImage = (src: string) => {
        const newImage: ImageElement = { type: 'image', src, x: canvasWidth/2, y: canvasHeight/2, width: 100, height: 100 };
        setElements(prev => [...prev, newImage]);
        setSelectedElementIndex(elements.length);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
                    addImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDownload = () => {
        setSelectedElementIndex(null);
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = 'show-poster.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }, 100);
    };
    
    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if(!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);
        const clickedIndex = [...elements].reverse().findIndex(el => {
            if (el.type === 'text') {
                const textHeight = el.size;
                return x > el.x - el.width / 2 && x < el.x + el.width / 2 && y > el.y - textHeight / 2 && y < el.y + textHeight / 2;
            } else if (el.type === 'image') {
                return x > el.x - el.width / 2 && x < el.x + el.width / 2 && y > el.y - el.height / 2 && y < el.y + el.height / 2;
            }
            return false;
        });

        if (clickedIndex > -1) {
            const actualIndex = elements.length - 1 - clickedIndex;
            setSelectedElementIndex(actualIndex);
            setIsDragging(true);
            setDragOffset({ x: elements[actualIndex].x - x, y: elements[actualIndex].y - y });
        } else {
            setSelectedElementIndex(null);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || selectedElementIndex === null) return;
        const { x, y } = getCanvasCoords(e);
        updateElement(selectedElementIndex, { x: x + dragOffset.x, y: y + dragOffset.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const changeLayer = (direction: 'up' | 'down') => {
        if (selectedElementIndex === null) return;
        const newElements = [...elements];
        const item = newElements.splice(selectedElementIndex, 1)[0];
        
        let newIndex = selectedElementIndex;
        if (direction === 'up' && selectedElementIndex < elements.length - 1) {
            newIndex = selectedElementIndex + 1;
        } else if (direction === 'down' && selectedElementIndex > 0) {
            newIndex = selectedElementIndex - 1;
        }
        
        newElements.splice(newIndex, 0, item);
        setElements(newElements);
        setSelectedElementIndex(newIndex);
    };

    const selectedElement = selectedElementIndex !== null ? elements[selectedElementIndex] : null;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Show Poster Maker</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4">
                        <h3 className="font-bold mb-2">Templates</h3>
                        <select onChange={(e) => handleTemplateChange(parseInt(e.target.value))} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm focus:outline-none">
                            {TEMPLATES.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4">
                        <h3 className="font-bold mb-2">Canvas</h3>
                        <label className="text-sm">Background Color</label>
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 mt-1" />
                         <label className="text-sm mt-2 block">Upload Logo/Image</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-accent/10 file:dark:bg-dark-accent/10 file:text-light-accent file:dark:text-dark-accent hover:file:bg-light-accent/20 dark:hover:file:bg-dark-accent/20"/>
                    </div>
                    {selectedElement && selectedElementIndex !== null && (
                        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 space-y-2">
                             <h3 className="font-bold mb-2">Edit Element</h3>
                             {selectedElement.type === 'text' && (
                                <>
                                    <textarea value={selectedElement.content} onChange={e => updateElement(selectedElementIndex, { content: e.target.value })} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm" rows={3}/>
                                    <label className="text-sm">Font</label>
                                    <select value={selectedElement.font} onChange={e => updateElement(selectedElementIndex, { font: e.target.value as Font })} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm focus:outline-none">
                                        {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                                    </select>
                                    <label className="text-sm">Size: {selectedElement.size}px</label>
                                    <input type="range" min="10" max="100" value={selectedElement.size} onChange={e => updateElement(selectedElementIndex, { size: +e.target.value })} className="w-full" />
                                    <label className="text-sm">Color</label>
                                    <input type="color" value={selectedElement.color} onChange={e => updateElement(selectedElementIndex, { color: e.target.value })} className="w-full h-10" />
                                    <div className="flex justify-around">
                                        <button onClick={() => updateElement(selectedElementIndex, { textAlign: 'left'})} className={`p-2 rounded ${selectedElement.textAlign === 'left' ? 'bg-light-accent text-white' : 'bg-light-bg dark:bg-dark-primary'}`}><AlignLeft className="w-5 h-5"/></button>
                                        <button onClick={() => updateElement(selectedElementIndex, { textAlign: 'center'})} className={`p-2 rounded ${selectedElement.textAlign === 'center' ? 'bg-light-accent text-white' : 'bg-light-bg dark:bg-dark-primary'}`}><AlignCenter className="w-5 h-5"/></button>
                                        <button onClick={() => updateElement(selectedElementIndex, { textAlign: 'right'})} className={`p-2 rounded ${selectedElement.textAlign === 'right' ? 'bg-light-accent text-white' : 'bg-light-bg dark:bg-dark-primary'}`}><AlignRight className="w-5 h-5"/></button>
                                    </div>
                                </>
                             )}
                             <label className="text-sm pt-2">Layers</label>
                             <div className="flex justify-around">
                                <button onClick={() => changeLayer('down')} className="p-2 rounded bg-light-bg dark:bg-dark-primary"><ArrowDown className="w-5 h-5"/></button>
                                <button onClick={() => changeLayer('up')} className="p-2 rounded bg-light-bg dark:bg-dark-primary"><ArrowUp className="w-5 h-5"/></button>
                             </div>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 space-y-4">
                    <canvas 
                        ref={canvasRef} 
                        width={canvasWidth} 
                        height={canvasHeight} 
                        className="w-full h-auto rounded-lg shadow-lg cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                     <button onClick={handleDownload} className="w-full py-3 bg-light-accent dark:bg-dark-accent text-white font-bold rounded-lg">Download Poster</button>
                </div>
            </div>
        </div>
    );
};

export default ShowPosterMaker;
