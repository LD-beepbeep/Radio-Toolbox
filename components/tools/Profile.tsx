import React, { useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProfileData } from '../../types';
import { initialProfile } from '../../data/initialData';
import { ShareIcon, PlusIcon, TrashIcon, XIcon, ExternalLinkIcon, TrophyIcon } from '../Icons';

const Profile: React.FC = () => {
    const [profile, setProfile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
    const [isEditing, setIsEditing] = useState(false);

    const handleShare = () => {
        window.print();
    };
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleInputChange = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
        setProfile(p => ({ ...p, [field]: value }));
    };

    const handleItemChange = <K extends 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements'>(
        key: K,
        id: string,
        field: keyof ProfileData[K][number],
        value: string
    ) => {
        const newItems = (profile[key] as any[]).map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        handleInputChange(key, newItems);
    };
    
    const addItem = (key: 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements') => {
        let newItem;
        if (key === 'experience') newItem = { id: Date.now().toString(), role: '', company: '', period: '' };
        else if (key === 'skills') newItem = { id: Date.now().toString(), name: '' };
        else if (key === 'socialLinks') newItem = { id: Date.now().toString(), platform: '', url: '' };
        else if (key === 'weeklySchedule') newItem = { id: Date.now().toString(), day: '', time: '', show: '' };
        else newItem = { id: Date.now().toString(), name: '' }; // achievements
        handleInputChange(key, [...profile[key], newItem] as any);
    }
    
    const removeItem = (key: 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements', id: string) => {
        handleInputChange(key, profile[key].filter((item: any) => item.id !== id) as any);
    };

    const inputClasses = "w-full bg-light-bg dark:bg-dark-primary rounded-lg p-2 text-sm focus:outline-none";
    const textareaClasses = `${inputClasses} resize-none`;

    const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div>
            <h3 className="text-sm font-semibold mb-2 px-4 text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
            <div className="bg-light-surface dark:bg-dark-surface rounded-xl overflow-hidden">
                {children}
            </div>
        </div>
    )

    return (
        <div>
            <div className="flex justify-between items-center mb-6 no-print">
                <h2 className="text-3xl font-bold">Profile</h2>
                <div className="flex space-x-2">
                     <button onClick={handleShare} className="flex items-center px-3 py-2 text-sm font-semibold rounded-lg bg-light-primary dark:bg-dark-primary hover:opacity-90 transition-opacity">
                        <ShareIcon className="w-4 h-4"/>
                     </button>
                    <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-light-accent dark:bg-dark-accent text-white transition-colors">{isEditing ? 'Save' : 'Edit'}</button>
                </div>
            </div>

            <div id="printable-profile" className="space-y-6">
                {/* Header */}
                 <div className="flex flex-col items-center text-center p-6">
                    <div className="w-24 h-24 rounded-full bg-light-accent/20 dark:bg-dark-accent/20 flex items-center justify-center mb-4">
                        <span className="text-4xl font-bold text-light-accent dark:text-dark-accent">{getInitials(profile.name)}</span>
                    </div>
                    {isEditing ? <input value={profile.name} onChange={e => handleInputChange('name', e.target.value)} className={`${inputClasses} text-3xl font-bold text-center mb-1`}/> : <h1 className="text-3xl md:text-4xl font-bold">{profile.name}</h1>}
                    {isEditing ? <input value={profile.title} onChange={e => handleInputChange('title', e.target.value)} className={`${inputClasses} text-lg text-light-accent dark:text-dark-accent text-center`}/> : <p className="text-lg text-light-accent dark:text-dark-accent">{profile.title}</p>}
                    {isEditing ? <input type="email" value={profile.email} onChange={e => handleInputChange('email', e.target.value)} className={`${inputClasses} text-sm text-gray-500 text-center mt-1`}/> : <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.email}</p>}
                </div>
                
                {/* Stats */}
                <div className="bg-light-surface dark:bg-dark-surface rounded-xl p-4 text-center">
                    <h3 className="text-sm font-semibold uppercase text-gray-400">Broadcast Hours</h3>
                    {isEditing ? <input type="number" value={profile.broadcastHours} onChange={e => handleInputChange('broadcastHours', parseInt(e.target.value) || 0)} className={`${inputClasses} text-4xl font-bold text-light-accent dark:text-dark-accent text-center`}/> : <p className="text-4xl font-bold text-light-accent dark:text-dark-accent">{profile.broadcastHours}</p>}
                </div>

                {/* Bio */}
                <Section title="About Me"><div className="p-4">{isEditing ? <textarea value={profile.bio} onChange={e => handleInputChange('bio', e.target.value)} rows={4} className={textareaClasses}/> : <p className="text-base leading-relaxed">{profile.bio}</p>}</div></Section>
                
                {/* Weekly Schedule */}
                <Section title="Weekly Schedule">
                    <ul className="divide-y divide-light-primary dark:divide-dark-primary">
                        {profile.weeklySchedule.map(item => (
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
                                        <p className="text-sm">{item.day} at {item.time}</p>
                                    </>
                                )}
                                </div>
                                {isEditing && <button onClick={() => removeItem('weeklySchedule', item.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('weeklySchedule')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2"><PlusIcon className="w-4 h-4 mr-1"/> Add Schedule Item</button></div>}
                </Section>

                {/* Social Links */}
                <Section title="Social Links">
                    <ul className="divide-y divide-light-primary dark:divide-dark-primary">
                        {profile.socialLinks.map(link => (
                            <li key={link.id} className="flex items-center p-4">
                                <div className="flex-grow">
                                {isEditing ? (<div className="flex gap-2"><input value={link.platform} onChange={e => handleItemChange('socialLinks', link.id, 'platform', e.target.value)} placeholder="Platform (e.g. Twitter)" className={inputClasses}/><input value={link.url} onChange={e => handleItemChange('socialLinks', link.id, 'url', e.target.value)} placeholder="URL" className={inputClasses}/></div>) : (<a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold flex items-center hover:underline">{link.platform} <ExternalLinkIcon className="w-4 h-4 ml-2 text-gray-400"/></a>)}
                                </div>
                                {isEditing && <button onClick={() => removeItem('socialLinks', link.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('socialLinks')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2"><PlusIcon className="w-4 h-4 mr-1"/> Add Link</button></div>}
                </Section>

                {/* Experience */}
                <Section title="Work Experience">
                    <ul className="divide-y divide-light-primary dark:divide-dark-primary">
                        {profile.experience.map(exp => (
                            <li key={exp.id} className="flex items-start p-4">
                                <div className="flex-grow">
                                {isEditing ? (<div className="space-y-2"><input value={exp.role} onChange={e => handleItemChange('experience', exp.id, 'role', e.target.value)} placeholder="Role" className={inputClasses}/><input value={exp.company} onChange={e => handleItemChange('experience', exp.id, 'company', e.target.value)} placeholder="Company" className={inputClasses}/><input value={exp.period} onChange={e => handleItemChange('experience', exp.id, 'period', e.target.value)} placeholder="Period" className={inputClasses}/></div>) : (<><h4 className="font-semibold">{exp.role}</h4><p className="text-sm">{exp.company}</p><p className="text-xs text-gray-500 dark:text-gray-400">{exp.period}</p></>)}
                                </div>
                                {isEditing && <button onClick={() => removeItem('experience', exp.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('experience')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2"><PlusIcon className="w-4 h-4 mr-1"/> Add Experience</button></div>}
                </Section>
                
                {/* Achievements */}
                <Section title="Achievements">
                     <ul className="divide-y divide-light-primary dark:divide-dark-primary">
                        {profile.achievements.map(item => (
                            <li key={item.id} className="flex items-center p-4">
                                <TrophyIcon className="w-5 h-5 mr-4 text-yellow-500 flex-shrink-0" />
                                <div className="flex-grow">
                                {isEditing ? (<input value={item.name} onChange={e => handleItemChange('achievements', item.id, 'name', e.target.value)} placeholder="Achievement" className={inputClasses}/>) : (<h4 className="font-semibold">{item.name}</h4>)}
                                </div>
                                {isEditing && <button onClick={() => removeItem('achievements', item.id)} className="ml-2 p-1 text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                            </li>
                        ))}
                    </ul>
                    {isEditing && <div className="p-2"><button onClick={() => addItem('achievements')} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center p-2"><PlusIcon className="w-4 h-4 mr-1"/> Add Achievement</button></div>}
                </Section>

                 {/* Skills */}
                <Section title="Skills">
                     <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map(skill => (
                                <div key={skill.id} className="flex items-center bg-light-bg dark:bg-dark-primary rounded-full">
                                {isEditing ? (<><input value={skill.name} onChange={e => handleItemChange('skills', skill.id, 'name', e.target.value)} className="bg-transparent text-sm rounded-full py-1 px-3 w-48 focus:outline-none"/><button onClick={() => removeItem('skills', skill.id)} className="mr-1 p-1 text-destructive"><XIcon className="w-4 h-4"/></button></>) : (<span className="text-sm font-medium rounded-full py-1 px-3">{skill.name}</span>)}
                                </div>
                            ))}
                        </div>
                        {isEditing && <button onClick={() => addItem('skills')} className="mt-2 text-sm text-light-accent dark:text-dark-accent flex items-center p-2"><PlusIcon className="w-4 h-4 mr-1"/> Add Skill</button>}
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default Profile;