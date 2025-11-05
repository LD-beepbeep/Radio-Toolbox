import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Types and Templates ---
interface TextElement {
    type: 'text';
    content: string;
    x: number;
    y: number;
    size: number;
    color: string;
    font: string;
    width: number;
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
        name: "Modern Guest",
        bgColor: "#1A1A1A",
        elements: [
            { type: 'text', content: 'SPECIAL GUEST', x: 50, y: 80, size: 24, color: '#F2F2F7', font: 'Inter', width: 400 },
            { type: 'text', content: 'GUEST NAME', x: 50, y: 180, size: 72, color: '#0A84FF', font: 'Inter', width: 400 },
            { type: 'text', content: 'Discussing their new project and upcoming tour.', x: 50, y: 220, size: 20, color: '#8E8E93', font: 'Inter', width: 400 },
            { type: 'text', content: 'LIVE TODAY @ 4PM', x: 50, y: 450, size: 28, color: '#F2F2F7', font: 'Inter', width: 400 },
        ]
    },
    {
        name: "Bold Announcement",
        bgColor: "#0A84FF",
        elements: [
            { type: 'text', content: 'SHOW ANNOUNCEMENT', x: 250, y: 150, size: 60, color: '#FFFFFF', font: 'Inter', width: 400 },
            { type: 'text', content: 'New Show Title', x: 250, y: 220, size: 40, color: '#FFFFFF', font: 'Inter', width: 400 },
            { type: 'text', content: 'PREMIERES MONDAY', x: 250, y: 400, size: 32, color: '#FFFFFF', font: 'Inter', width: 400 },
        ]
    },
];

const ShowPosterMaker: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bgColor, setBgColor] = useState(TEMPLATES[0].bgColor);
    const [elements, setElements] = useState<PosterElement[]>(TEMPLATES[0].elements);
    const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);

    const canvasWidth = 500;
    const canvasHeight = 500;

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
                ctx.textAlign = 'center';
                // Adjust y to be the center of the text
                ctx.fillText(el.content, el.x, el.y, el.width);
            } else if (el.type === 'image') {
                const img = new Image();
                img.src = el.src;
                img.onload = () => {
                    ctx.drawImage(img, el.x - el.width / 2, el.y - el.height / 2, el.width, el.height);
                };
            }
             // Draw selection box
            if(index === selectedElementIndex) {
                ctx.strokeStyle = '#0A84FF';
                ctx.lineWidth = 2;
                if(el.type === 'text') {
                    const textMetrics = ctx.measureText(el.content);
                    const textHeight = el.size; // Approximation
                    ctx.strokeRect(el.x - textMetrics.width / 2 - 5, el.y - textHeight, textMetrics.width + 10, textHeight + 10);
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
        setElements(prev => prev.map((el, i) => i === index ? { ...el, ...newProps } : el));
    };

    const addImage = (src: string) => {
        const newImage: ImageElement = { type: 'image', src, x: canvasWidth/2, y: canvasHeight/2, width: 100, height: 100 };
        setElements(prev => [...prev, newImage]);
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'show-poster.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
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
                        <h3 className="font-bold mb-2">Customize</h3>
                        <label className="text-sm">Background Color</label>
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 mt-1" />
                         <label className="text-sm mt-2 block">Upload Logo/Image</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-light-accent/10 file:dark:bg-dark-accent/10 file:text-light-accent file:dark:text-dark-accent hover:file:bg-light-accent/20 dark:hover:file:bg-dark-accent/20"/>
                    </div>
                    {selectedElement?.type === 'text' && (
                        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 space-y-2">
                             <h3 className="font-bold mb-2">Edit Text</h3>
                             <textarea value={selectedElement.content} onChange={e => updateElement(selectedElementIndex!, { content: e.target.value })} className="w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm" rows={3}/>
                             <label className="text-sm">Size</label>
                             <input type="range" min="10" max="100" value={selectedElement.size} onChange={e => updateElement(selectedElementIndex!, { size: +e.target.value })} className="w-full" />
                             <label className="text-sm">Color</label>
                             <input type="color" value={selectedElement.color} onChange={e => updateElement(selectedElementIndex!, { color: e.target.value })} className="w-full h-10" />
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 space-y-4">
                    <canvas 
                        ref={canvasRef} 
                        width={canvasWidth} 
                        height={canvasHeight} 
                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                        onClick={(e) => {
                            const canvas = canvasRef.current;
                            if(!canvas) return;
                            const rect = canvas.getBoundingClientRect();
                            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                            const y = (e.clientY - rect.top) * (canvas.height / rect.height);

                            // Simple collision detection to find selected element
                            const clickedIndex = elements.findIndex(el => {
                                if(el.type === 'text') {
                                    // This is a rough approximation
                                    return x > el.x - el.width / 2 && x < el.x + el.width / 2 && y > el.y - el.size && y < el.y;
                                }
                                return false;
                            });
                            setSelectedElementIndex(clickedIndex > -1 ? clickedIndex : null);
                        }}
                    />
                     <button onClick={handleDownload} className="w-full py-3 bg-light-accent dark:bg-dark-accent text-white font-bold rounded-lg">Download Poster</button>
                </div>
            </div>
        </div>
    );
};

export default ShowPosterMaker;
