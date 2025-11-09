

import React, { useRef, useState } from 'react';
import { UploadIcon, DownloadIcon, CheckCircleIcon } from '../Icons';

export const DATA_KEYS = [
    'schedule_widget_items', 'checklist_widget_items', 'checklist_widget_checked_ids',
    'guest_name', 'guest_topic', 'guest_notes', 'quick_links', 'on_air_status',
    'user_profile', 'playlist', 'voicememo_recordings', 'teleprompter_speed',
    'dashboard_widgets', 'tab_settings', 'soundboard_sounds',
    'shows_data', 'has_onboarded', 'theme', 'voicememo_quality', 'voicememo_monitoring',
    'soundboard_view_mode', 'soundboard_grid_size'
];


const ImportExport: React.FC = () => {
    const importFileRef = useRef<HTMLInputElement>(null);
    const [importSuccess, setImportSuccess] = useState(false);

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

        if (!window.confirm("WARNING: Importing this file will overwrite all your current app data. This action cannot be undone. Are you sure you want to continue?")) {
            if(importFileRef.current) importFileRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                Object.keys(data).forEach(key => {
                    if (DATA_KEYS.includes(key)) {
                        const value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                        localStorage.setItem(key, value);
                        window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
                    }
                });
                setImportSuccess(true);
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } catch (error) {
                console.error("Failed to import data:", error);
                alert("Failed to import data. The file may be corrupted or in the wrong format.");
            } finally {
                if(importFileRef.current) importFileRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };
    
    if (importSuccess) {
        return (
            <div className="fixed inset-0 bg-light-bg-primary/80 dark:bg-dark-bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                 <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-8 text-center shadow-soft dark:shadow-none dark:border dark:border-dark-divider max-w-md">
                     <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                     <h2 className="text-2xl font-bold">Import Successful!</h2>
                     <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">Your data has been restored. The application will now reload to apply the changes.</p>
                 </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Import / Export Data</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-6 space-y-6 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                <div>
                    <h3 className="text-xl font-bold">Export Data</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 mb-4">
                        Download a backup of all your app data, including profiles, settings, recordings, and show plans, into a single JSON file.
                    </p>
                    <button 
                        onClick={handleExport} 
                        className="w-full flex items-center justify-center space-x-2 text-base font-semibold p-3 rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle text-light-accent dark:text-dark-accent hover:opacity-80 transition-opacity"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Export All Data</span>
                    </button>
                </div>

                <div className="border-t border-light-divider dark:border-dark-divider my-4"></div>

                <div>
                    <h3 className="text-xl font-bold">Import Data</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 mb-4">
                        Restore your app data from a previously exported backup file. This is useful for syncing data across devices or recovering your setup.
                    </p>
                     <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs p-3 rounded-2xl mb-4">
                        <b>Warning:</b> Importing a file will completely overwrite all existing data in the app.
                    </div>
                    <button 
                        onClick={() => importFileRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 text-base font-semibold p-3 rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle text-light-accent dark:text-dark-accent hover:opacity-80 transition-opacity"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>Import from File</span>
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                </div>
            </div>
        </div>
    );
};

export default ImportExport;