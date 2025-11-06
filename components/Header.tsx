
import React from 'react';
import { Theme, ProfileData } from '../types';
import { Sun, Moon, Lightbulb, ChevronLeftIcon } from './Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialProfile } from '../data/initialData';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onToggleFlashlight: () => void;
  showBack: boolean;
  onBack: () => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  title: string;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onToggleFlashlight, showBack, onBack, onSettingsClick, onProfileClick, title }) => {
  const [profile] = useLocalStorage<ProfileData>('user_profile', initialProfile);

  return (
    <header className="fixed top-0 left-0 right-0 bg-light-bg-primary/80 dark:bg-dark-bg-primary/80 backdrop-blur-lg z-50 border-b border-light-divider dark:border-dark-divider">
      <div className="mx-auto px-4 h-20 flex justify-between items-center">
        <div className="flex-1 flex justify-start items-center">
        {showBack ? (
            <button onClick={onBack} className="flex items-center text-light-text-primary dark:text-dark-text-primary -ml-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
        ) : <div className="w-10"></div> }
        </div>

        <div className="flex-1 flex justify-center items-center">
            <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {title}
            </h1>
        </div>

        <div className="flex-1 flex justify-end items-center space-x-1">
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button
            onClick={onToggleFlashlight}
            className="w-10 h-10 flex items-center justify-center rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle flashlight"
          >
            <Lightbulb className="w-6 h-6" />
          </button>
          <button
            onClick={onProfileClick}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle text-light-accent dark:text-dark-accent font-bold text-sm"
            aria-label="Open Profile"
          >
            {getInitials(profile.name)}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;