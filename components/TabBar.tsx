
import React from 'react';
import { Tab } from '../types';
import { DashboardIcon, PlaylistIcon, MicIcon, GridIcon } from './Icons';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS = [
  { id: Tab.Dashboard, label: 'Dashboard', icon: DashboardIcon },
  { id: Tab.PlaylistManager, label: 'Playlist', icon: PlaylistIcon },
  { id: Tab.VoiceMemo, label: 'Memos', icon: MicIcon },
  { id: Tab.Tools, label: 'Tools', icon: GridIcon },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-light-surface/90 dark:bg-dark-surface/80 backdrop-blur-2xl border-t border-light-primary/80 dark:border-dark-primary/80 z-50">
      <div className="w-full max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
                <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={`flex flex-col items-center justify-center h-12 px-3 flex-grow transition-all duration-300 relative rounded-lg
                    ${
                    isActive
                        ? 'bg-light-primary/80 dark:bg-dark-primary/80 text-light-accent dark:text-dark-accent' 
                        : 'text-light-secondary dark:text-dark-secondary'
                    }`}
                    aria-label={label}
                >
                    <Icon className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-medium">{label}</span>
                </button>
            )
        })}
      </div>
    </nav>
  );
};

export default TabBar;
