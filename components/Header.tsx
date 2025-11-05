import React from 'react';
import { Theme } from '../types';
import { Sun, Moon, Lightbulb, ChevronLeftIcon, ProfileIcon } from './Icons';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onToggleFlashlight: () => void;
  showBack: boolean;
  onBack: () => void;
  onProfileClick: () => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onToggleFlashlight, showBack, onBack, onProfileClick, currentView }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-light-surface/90 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-light-primary/80 dark:border-dark-primary/80 z-50">
      <div className="mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex-1 flex justify-start">
        {showBack ? (
            <button onClick={onBack} className="flex items-center text-light-accent dark:text-dark-accent -ml-2 p-2">
                <ChevronLeftIcon className="w-6 h-6" />
                <span className="font-semibold">{currentView === "Profile" ? "Back" : "Tools"}</span>
            </button>
        ) : (
          <h1 className="text-xl font-bold text-light-text dark:text-dark-text">
            Radio<span className="text-light-accent dark:text-dark-accent">ToolBox</span>
          </h1>
        )}
        </div>

        <div className="flex-1 flex justify-end items-center space-x-0">
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full text-light-text dark:text-dark-text hover:bg-light-primary dark:hover:bg-dark-primary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button
            onClick={onToggleFlashlight}
            className="w-10 h-10 flex items-center justify-center rounded-full text-light-text dark:text-dark-text hover:bg-light-primary dark:hover:bg-dark-primary transition-colors"
            aria-label="Toggle flashlight"
          >
            <Lightbulb className="w-6 h-6" />
          </button>
           <button
            onClick={onProfileClick}
            className="w-10 h-10 flex items-center justify-center rounded-full text-light-text dark:text-dark-text hover:bg-light-primary dark:hover:bg-dark-primary transition-colors"
            aria-label="Open Profile"
          >
            <ProfileIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;