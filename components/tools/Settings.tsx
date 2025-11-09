

import React, { useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TabSetting } from '../../types';
import { initialTabSettings } from '../../data/initialData';
import { RefreshCwIcon } from '../Icons';
import { DATA_KEYS } from './ImportExport';

interface SettingsProps {
    navigateTo: (view: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ navigateTo }) => {
    const [tabSettings, setTabSettings] = useLocalStorage<TabSetting[]>('tab_settings', initialTabSettings);

    const handleTabSettingChange = (id: string, isVisible: boolean) => {
        setTabSettings(prev => prev.map(tab => tab.id === id ? { ...tab, isVisible } : tab));
    };

    const resetDashboard = () => {
        if (window.confirm("Are you sure you want to reset your dashboard layout? This cannot be undone.")) {
            localStorage.removeItem('dashboard_widgets');
            // Force a reload to ensure the dashboard reflects the default state
            window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard_widgets', newValue: null }));
            alert("Dashboard has been reset. It will update on your next visit to the Dashboard tab.");
        }
    }

    const clearAllData = () => {
        if (window.confirm("Are you absolutely sure? This will delete ALL your profiles, settings, recordings, sounds, and show plans. This action is irreversible.")) {
            DATA_KEYS.forEach(key => {
                localStorage.removeItem(key);
            });
            alert("All application data has been cleared. The app will now reload.");
            window.location.reload();
        }
    }
    
    const Section: React.FC<{title: string; children: React.ReactNode; danger?: boolean}> = ({title, children, danger = false}) => (
        <div>
            <h3 className={`text-sm font-semibold mb-2 px-1 uppercase tracking-wider ${danger ? 'text-destructive' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{title}</h3>
            <div className={`bg-light-surface dark:bg-dark-surface rounded-4xl overflow-hidden shadow-soft dark:shadow-none dark:border ${danger ? 'border-destructive/50' : 'dark:border-dark-divider'}`}>
                {children}
            </div>
        </div>
    )

    return (
        <div>
            <div className="space-y-8">
                <Section title="Customization">
                    <div className="p-4">
                        <h4 className="font-semibold text-base mb-1">Tab Bar Visibility</h4>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">Choose which tabs appear in the main navigation dock.</p>
                        <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                        {tabSettings.map(tab => (
                            <li key={tab.id} className="flex justify-between items-center py-3">
                                <span className="font-medium text-sm">{tab.label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={tab.isVisible} onChange={e => handleTabSettingChange(tab.id, e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-light-bg-primary peer-focus:outline-none rounded-full peer dark:bg-dark-bg-secondary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-light-accent dark:peer-checked:bg-dark-accent"></div>
                                </label>
                            </li>
                        ))}
                        </ul>
                    </div>
                    <div className="border-t border-light-divider dark:border-dark-divider p-4">
                         <h4 className="font-semibold text-base mb-2">Dashboard Layout</h4>
                         <button onClick={resetDashboard} className="w-full text-sm text-destructive bg-destructive/10 p-3 rounded-full font-semibold hover:bg-destructive/20 transition-colors flex items-center justify-center space-x-2">
                            <RefreshCwIcon className="w-4 h-4" />
                            <span>Reset Dashboard to Default</span>
                         </button>
                    </div>
                </Section>
                <Section title="Danger Zone" danger>
                    <div className="p-4">
                        <h4 className="font-semibold text-base mb-1">Clear All Data</h4>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">This will permanently delete all your app data, including profiles, settings, recordings, sounds, and show plans. This action cannot be undone.</p>
                        <button onClick={clearAllData} className="w-full text-sm text-white bg-destructive p-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
                            Clear All Application Data
                        </button>
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default Settings;