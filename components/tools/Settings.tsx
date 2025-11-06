
import React, { useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TabSetting } from '../../types';
import { initialTabSettings } from '../../data/initialData';
import { UploadIcon, DownloadIcon, UserIcon, RefreshCwIcon, ChevronLeftIcon } from '../Icons';

const DATA_KEYS = [
    'schedule_widget_items', 'checklist_widget_items', 'checklist_widget_checked_ids',
    'guest_name', 'guest_topic', 'guest_notes', 'quick_links', 'on_air_status',
    'user_profile', 'playlist', 'voicememo_recordings', 'teleprompter_script',
    'teleprompter_speed', 'teleprompter_fontSize', 'dashboard_widgets', 'tab_settings',
    'soundboard_sounds', 'show_planner_segments'
];

interface SettingsProps {
    navigateTo: (view: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ navigateTo }) => {
    const [tabSettings, setTabSettings] = useLocalStorage<TabSetting[]>('tab_settings', initialTabSettings);
    const importFileRef = useRef<HTMLInputElement>(null);

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

    const handleExport = () => {
        const data: { [key: string]: any } = {};
        DATA_KEYS.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    data[key] = JSON.parse(item);
                } catch (e) {
                    data[key] = item;
                }
            }
        });

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RadioToolBox_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("Are you sure you want to import this file? This will overwrite all your current data.")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                Object.keys(data).forEach(key => {
                    if (DATA_KEYS.includes(key)) {
                        const value = JSON.stringify(data[key]);
                        localStorage.setItem(key, value);
                        // Dispatch event to notify hooks
                        window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
                    }
                });
                alert("Data imported successfully! The app will now reload.");
                window.location.reload();
            } catch (error) {
                console.error("Failed to import data:", error);
                alert("Failed to import data. The file may be corrupted or in the wrong format.");
            }
        };
        reader.readAsText(file);
    };

    const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div>
            <h3 className="text-sm font-semibold mb-2 px-1 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{title}</h3>
            <div className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl overflow-hidden shadow-soft dark:shadow-none">
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

                <Section title="Data Management">
                    <div className="p-4">
                         <h4 className="font-semibold text-base mb-1">Import & Export Data</h4>
                         <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">Save all app data to a file, or import a file to restore data on a new device.</p>
                         <div className="flex space-x-2">
                            <button onClick={() => importFileRef.current?.click()} className="flex-1 flex items-center justify-center space-x-2 text-sm text-light-accent dark:text-dark-accent bg-light-accent-subtle dark:bg-dark-accent-subtle p-3 rounded-full font-semibold hover:opacity-80 transition-opacity">
                                <UploadIcon className="w-5 h-5" />
                                <span>Import Data</span>
                            </button>
                            <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                            <button onClick={handleExport} className="flex-1 flex items-center justify-center space-x-2 text-sm text-light-accent dark:text-dark-accent bg-light-accent-subtle dark:bg-dark-accent-subtle p-3 rounded-full font-semibold hover:opacity-80 transition-opacity">
                                <DownloadIcon className="w-5 h-5" />
                                <span>Export Data</span>
                            </button>
                         </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default Settings;