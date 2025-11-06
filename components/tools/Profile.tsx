

import React, { useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProfileData } from '../../types';
import { initialProfile } from '../../data/initialData';
import { PlusIcon, TrashIcon, XIcon, ExternalLinkIcon, TrophyIcon, SettingsIcon } from '../Icons';

interface ProfileProps {
    navigateTo: (view: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ navigateTo }) => {
    const [profile, setProfile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [editingProfile, setEditingProfile] = useState<ProfileData | null>(null);

    const handleEdit = () => {
        setEditingProfile(JSON.parse(JSON.stringify(profile)));
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editingProfile) setProfile(editingProfile);
        setIsEditing(false);
        setEditingProfile(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingProfile(null);
    }
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleFieldChange = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
        setEditingProfile(p => p ? { ...p, [field]: value } : null);
    };
    
    const handleItemChange = <K extends 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements'>(
        key: K,
        id: string,
        field: keyof ProfileData[K][number],
        value: string
    ) => {
        setEditingProfile(p => {
            if (!p) return null;
            const newItems = (p[key] as any[]).map(item =>
                item.id === id ? { ...item, [field]: value } : item
            );
            return { ...p, [key]: newItems as any };
        });
    };
    
    const addItem = (key: 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements') => {
        setEditingProfile(p => {
            if (!p) return null;
            let newItem;
            const baseId = Date.now().toString();
            if (key === 'experience') newItem = { id: baseId, role: '', company: '', period: '' };
            else if (key === 'skills') newItem = { id: baseId, name: '' };
            else if (key === 'socialLinks') newItem = { id: baseId, platform: '', url: '' };
            else if (key === 'weeklySchedule') newItem = { id: baseId, day: '', time: '', show: '' };
            else newItem = { id: baseId, name: '' }; // achievements
            return { ...p, [key]: [...p[key], newItem] as any };
        });
    }
    
    const removeItem = (key: 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements', id: string) => {
        setEditingProfile(p => {
            if (!p) return null;
            const newItems = p[key].filter((item: any) => item.id !== id);
            return { ...p, [key]: newItems as any };
        });
    };
    
    const currentData = isEditing && editingProfile ? editingProfile : profile;

    const inputClasses = "w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-2 text-sm focus:outline-none";
    const textareaClasses = `${inputClasses} resize-none`;

    const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div className="no-print">
            <h3 className="text-sm font-semibold mb-2 px-1 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{title}</h3>
            <div className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl overflow-hidden shadow-soft dark:shadow-none">
                {children}
            </div>
        </div>
    )

    return (
        <div>
            <div className="flex justify-between items-center mb-6 no-print">
                 <button onClick={() => navigateTo('Settings')} className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 transition-opacity shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                    <SettingsIcon className="w-5 h-5"/>
                    <span>Settings</span>
                 </button>
                <div className="flex space-x-2">
                     {isEditing ? (
                        <>
                            <button onClick={handleCancel} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-bg-secondary dark:bg-dark-surface transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white transition-colors">Save</button>
                        </>
                     ) : (
                        <button onClick={handleEdit} className="px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white transition-colors">Edit Profile</button>
                     )}
                </div>
            </div>

            <div id="printable-profile" className="space-y-8">
                {/* Header */}
                 <div className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-5xl flex flex-col items-center text-center p-6 shadow-soft dark:shadow-none">
                    <div className="w-28 h-28 rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle flex items-center justify-center mb-4">
                        <span className="text-5xl font-bold text-light-accent dark:text-dark-accent">{getInitials(currentData.name)}</span>
                    </div>
                    {isEditing ? <input value={currentData.name} onChange={e => handleFieldChange('name', e.target.value)} className={`${inputClasses} text-3xl font-bold text-center mb-1`}/> : <h1 className="text-4xl font-bold">{currentData.name}</h1>}
                    {isEditing ? <input value={currentData.title} onChange={e => handleFieldChange('title', e.target.value)} className={`${inputClasses} text-lg text-light-accent dark:text-dark-accent text-center`}/> : <p className="text-lg text-light-accent dark:text-dark-accent">{currentData.title}</p>}
                    {isEditing ? <input type="email" value={currentData.email} onChange={e => handleFieldChange('email', e.target.value)} className={`${inputClasses} text-sm text-light-text-secondary text-center mt-1`}/> : <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{currentData.email}</p>}
                </div>

                {/* Bio */}
                <Section title="About Me"><div className="p-4">{isEditing ? <textarea value={currentData.bio} onChange={e => handleFieldChange('bio', e.target.value)} rows={4} className={textareaClasses}/> : <p className="text-base leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">{currentData.bio}</p>}</div></Section>
                
                {/* Weekly Schedule */}
                <Section title="Weekly Schedule">
                    <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                        {currentData.weeklySchedule.map(item => (
                            <li key={item.id} className="flex items-start p-4">
                                <div className="flex-grow">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input value={item.day} onChange={e => handleItemChange('weeklySchedule', item.id, 'day', e.target.value)} placeholder="Day(s)" className={inputClasses}/>
                                        <input value={item.time} onChange={e => handleItemChange('weeklySchedule', item.id, 'time', e.target.value)} placeholder="Time" className={inputClasses}/>
                                        <input value={item.show} onChange={e => handleItemChange('weeklySchedule', item.id, 'show', e.target.value)} placeholder="Show Name" className={inputClasses}/>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="font-semibold">{item.show}</h4>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.day} at {item.time}</p>
                                    </>
                                )}
                                </div>
                                {isEditing && <button onClick={() => removeItem('weeklySchedule', item.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('weeklySchedule')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2 rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10"><PlusIcon className="w-4 h-4 mr-1"/> Add Item</button></div>}
                </Section>

                {/* Social Links */}
                <Section title="Social Links">
                    <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                        {currentData.socialLinks.map(link => (
                            <li key={link.id} className="flex items-center p-4">
                                <div className="flex-grow">
                                {isEditing ? (<div className="flex gap-2"><input value={link.platform} onChange={e => handleItemChange('socialLinks', link.id, 'platform', e.target.value)} placeholder="Platform (e.g. Twitter)" className={inputClasses}/><input value={link.url} onChange={e => handleItemChange('socialLinks', link.id, 'url', e.target.value)} placeholder="URL" className={inputClasses}/></div>) : (<a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold flex items-center hover:underline">{link.platform} <ExternalLinkIcon className="w-4 h-4 ml-2 text-gray-400"/></a>)}
                                </div>
                                {isEditing && <button onClick={() => removeItem('socialLinks', link.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('socialLinks')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2 rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10"><PlusIcon className="w-4 h-4 mr-1"/> Add Link</button></div>}
                </Section>

                {/* Experience */}
                <Section title="Work Experience">
                    <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                        {currentData.experience.map(exp => (
                            <li key={exp.id} className="flex items-start p-4">
                                <div className="flex-grow">
                                {isEditing ? (<div className="space-y-2"><input value={exp.role} onChange={e => handleItemChange('experience', exp.id, 'role', e.target.value)} placeholder="Role" className={inputClasses}/><input value={exp.company} onChange={e => handleItemChange('experience', exp.id, 'company', e.target.value)} placeholder="Company" className={inputClasses}/><input value={exp.period} onChange={e => handleItemChange('experience', exp.id, 'period', e.target.value)} placeholder="Period" className={inputClasses}/></div>) : (<><h4 className="font-semibold">{exp.role}</h4><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{exp.company}</p><p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{exp.period}</p></>)}
                                </div>
                                {isEditing && <button onClick={() => removeItem('experience', exp.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('experience')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2 rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10"><PlusIcon className="w-4 h-4 mr-1"/> Add Experience</button></div>}
                </Section>
                
                {/* Achievements */}
                <Section title="Achievements">
                     <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                        {currentData.achievements.map(item => (
                            <li key={item.id} className="flex items-center p-4">
                                <TrophyIcon className="w-5 h-5 mr-4 text-yellow-500 flex-shrink-0" />
                                <div className="flex-grow">
                                {isEditing ? (<input value={item.name} onChange={e => handleItemChange('achievements', item.id, 'name', e.target.value)} placeholder="Achievement" className={inputClasses}/>) : (<h4 className="font-semibold">{item.name}</h4>)}
                                </div>
                                {isEditing && <button onClick={() => removeItem('achievements', item.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('achievements')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2 rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10"><PlusIcon className="w-4 h-4 mr-1"/> Add Achievement</button></div>}
                </Section>

                 {/* Skills */}
                <Section title="Skills">
                     <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {currentData.skills.map(skill => (
                                <div key={skill.id} className="flex items-center bg-light-bg-primary dark:bg-dark-bg-secondary rounded-full">
                                {isEditing ? (<><input value={skill.name} onChange={e => handleItemChange('skills', skill.id, 'name', e.target.value)} className="bg-transparent text-sm rounded-full py-1.5 px-3 w-48 focus:outline-none"/><button onClick={() => removeItem('skills', skill.id)} className="mr-1 p-1 text-destructive"><XIcon className="w-4 h-4"/></button></>) : (<span className="text-sm font-medium rounded-full py-1.5 px-3">{skill.name}</span>)}
                                </div>
                            ))}
                        </div>
                        {isEditing && <button onClick={() => addItem('skills')} className="mt-3 text-sm text-light-accent dark:text-dark-accent flex items-center p-2 rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10"><PlusIcon className="w-4 h-4 mr-1"/> Add Skill</button>}
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default Profile;