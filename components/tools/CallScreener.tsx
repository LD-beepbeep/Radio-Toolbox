
import React from 'react';
import { Lightbulb } from '../Icons';

interface StudioFlashlightProps {
    isOn: boolean;
    onToggle: () => void;
    color: string;
    setColor: (color: string) => void;
}

const StudioFlashlight: React.FC<StudioFlashlightProps> = ({ isOn, onToggle, color, setColor }) => {

    const flashlightIconColor = isOn ? 'text-yellow-300' : 'text-light-text-secondary dark:text-dark-text-secondary';
    
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)]">
            <div 
                onClick={onToggle}
                className={`w-full max-w-sm h-72 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 cursor-pointer ${isOn ? 'bg-gray-800' : 'bg-light-surface dark:bg-dark-surface shadow-soft dark:shadow-none'}`}
            >
                <Lightbulb className={`w-24 h-24 transition-colors ${flashlightIconColor}`} />
                <span className={`mt-4 text-2xl font-bold transition-colors ${isOn ? 'text-white' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                    {isOn ? 'ON' : 'OFF'}
                </span>
                <p className={`text-sm ${isOn ? 'text-gray-400' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Tap to toggle</p>
            </div>
             {isOn && (
                <div className="mt-8 flex flex-col items-center">
                     <label htmlFor="color-picker" className="font-semibold text-sm mb-2">Light Color</label>
                     <input 
                        id="color-picker"
                        type="color" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-20 h-10 p-1 bg-transparent border-none rounded-lg cursor-pointer"
                     />
                </div>
            )}
        </div>
    );
};

export default StudioFlashlight;
