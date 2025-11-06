
import React from 'react';
import { Tab, TabSetting } from '../types';
import { DashboardIcon, BroadcastIcon, MicIcon, GridIcon } from './Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialTabSettings } from '../data/initialData';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS = [
  { id: Tab.Dashboard, label: 'Dashboard', icon: DashboardIcon },
  { id: Tab.Showtime, label: 'Showtime', icon: BroadcastIcon },
  { id: Tab.VoiceMemo, label: 'Memos', icon: MicIcon },
  { id: Tab.Tools, label: 'Tools', icon: GridIcon },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const [tabSettings] = useLocalStorage<TabSetting[]>('tab_settings', initialTabSettings);

  const visibleTabs = React.useMemo(() => {
    // A bit of a hack to ensure Showtime is always present even if old settings exist
    const currentTabIds = tabSettings.map(t => t.id);
    if (!currentTabIds.includes(Tab.Showtime)) {
        const playlistSetting = tabSettings.find(t => t.id === 'Playlist' as any);
        if(playlistSetting) {
            playlistSetting.id = Tab.Showtime;
            playlistSetting.label = 'Showtime';
        } else if (!tabSettings.some(t => t.id === Tab.Showtime)) {
             tabSettings.push({ id: Tab.Showtime, label: 'Showtime', isVisible: true });
        }
    }

    return TABS.filter(tab => {
        const setting = tabSettings.find(s => s.id === tab.id);
        return setting ? setting.isVisible : true; // Default to visible if not found
    });
  }, [tabSettings]);


  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 p-2.5">
      <div className="w-full max-w-md mx-auto flex items-center justify-around h-16 px-2 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl rounded-full shadow-lg dark:shadow-soft-dark border border-black/5 dark:border-white/10">
        {visibleTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
                <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={`relative flex items-center justify-center h-12 transition-all duration-300 rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-light-accent
                    ${
                      isActive
                        ? 'text-light-text-primary dark:text-dark-text-primary px-4' 
                        : 'text-light-text-secondary dark:text-dark-text-secondary w-14'
                    }`}
                    aria-label={label}
                >
                    <div className={`absolute inset-0 transition-all duration-300 rounded-full ${isActive ? 'bg-light-accent-subtle dark:bg-dark-accent-subtle scale-100' : 'scale-0'} group-active:scale-90`}></div>
                    <div className="relative flex items-center">
                      <Icon className="w-6 h-6" />
                      <span className={`ml-2 text-sm font-bold transition-all duration-300 whitespace-nowrap ${isActive ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>{label}</span>
                    </div>
                </button>
            )
        })}
      </div>
    </nav>
  );
};

export default TabBar;