import React from 'react';
import { Lightbulb } from '../Icons';

interface StudioFlashlightProps {
    isOn: boolean;
    onToggle: () => void;
}

const StudioFlashlight: React.FC<StudioFlashlightProps> = ({ isOn, onToggle }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
            <h2 className="text-3xl font-bold mb-6 text-center">Studio Flashlight</h2>
            <button 
                onClick={onToggle}
                className={`w-full max-w-sm h-64 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95
                ${isOn ? 'bg-yellow-300 text-yellow-900 shadow-2xl shadow-yellow-300/50' : 'bg-light-surface dark:bg-dark-surface'}`}
            >
                <Lightbulb className={`w-24 h-24 transition-colors ${isOn ? 'text-yellow-800' : 'text-light-secondary dark:text-dark-secondary'}`} />
                <span className="mt-4 text-2xl font-bold">
                    {isOn ? 'ON' : 'OFF'}
                </span>
                <p className="text-sm">Tap to toggle</p>
            </button>
        </div>
    );
};

export default StudioFlashlight;
