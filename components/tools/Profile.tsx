

import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProfileData, Recording } from '../../types';
import { initialProfile } from '../../data/initialData';
import { PlusIcon, TrashIcon, XIcon, ExternalLinkIcon, TrophyIcon, SettingsIcon, ShareIcon, PlayIcon, PauseIcon, UploadIcon } from '../Icons';

interface ProfileProps {
    navigateTo: (view: string) => void;
}

const generateProfileHTML = (profile: ProfileData): string => {
    const css = `
        :root {
            --light-bg: #F7F7F9; --light-surface: #FFFFFF; --light-text: #1C1C1E; --light-text-sec: #636366; --light-accent: #0A84FF;
            --dark-bg: #000000; --dark-surface: #1C1C1E; --dark-text: #FFFFFF; --dark-text-sec: #8E8E93; --dark-accent: #409CFF;
        }
        @media (prefers-color-scheme: dark) {
            body { background-color: var(--dark-bg); color: var(--dark-text); }
            .surface { background-color: var(--dark-surface); }
            .text-secondary { color: var(--dark-text-sec); }
            .accent { color: var(--dark-accent); }
            .avatar-bg { background-color: #1A3657; }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 2rem; background-color: var(--light-bg); color: var(--light-text); transition: all .3s; }
        .container { max-width: 800px; margin: auto; }
        .surface { background-color: var(--light-surface); border-radius: 1.5rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; }
        .avatar { width: 7rem; height: 7rem; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; background-color: #D6E9FF; overflow: hidden; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { font-size: 3rem; font-weight: bold; color: var(--light-accent); }
        h1 { font-size: 2.5rem; font-weight: 800; margin: 0; }
        .title { font-size: 1.2rem; color: var(--light-accent); margin: 0.25rem 0; }
        .email { font-size: 0.9rem; color: var(--light-text-sec); }
        h2 { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--light-text-sec); margin-top: 2rem; margin-bottom: 0.5rem; }
        p { line-height: 1.6; }
        ul { list-style: none; padding: 0; }
        li { padding: 0.75rem 0; border-bottom: 1px solid #E5E5EA; }
        li:last-child { border-bottom: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-top: .5rem; }
        .skill-tag { background-color: #D6E9FF; color: #0A84FF; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 500;}
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
    `;
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const body = `
        <div class="container">
            <div class="surface header">
                <div class="avatar">${profile.profilePictureUrl ? `<img src="${profile.profilePictureUrl}" alt="${profile.name}">` : `<span class="avatar-initials accent">${getInitials(profile.name)}</span>`}</div>
                <h1>${profile.name}</h1>
                <p class="title accent">${profile.title}</p>
                <p class="email">${profile.email}</p>
            </div>
            <div class="surface"><p>${profile.bio}</p></div>
             ${profile.skills && profile.skills.length > 0 ? `
                <h2>Skills</h2>
                <div class="surface skills-container">
                    ${profile.skills.map(s => `<span class="skill-tag">${s.name}</span>`).join('')}
                </div>` : ''}
            <div class="grid">
                <div>
                     ${profile.weeklySchedule && profile.weeklySchedule.length > 0 ? `
                        <h2>Weekly Schedule</h2>
                        <div class="surface"><ul>${profile.weeklySchedule.map(s => `<li><strong>${s.show}</strong><br><span class="text-secondary">${s.day} at ${s.time}</span></li>`).join('')}</ul></div>
                    ` : ''}
                </div>
                <div>
                     ${profile.experience && profile.experience.length > 0 ? `
                        <h2>Work Experience</h2>
                        <div class="surface"><ul>${profile.experience.map(e => `<li><strong>${e.role}</strong><br><span class="text-secondary">${e.company} (${e.period})</span></li>`).join('')}</ul></div>
                     ` : ''}
                </div>
            </div>
            ${profile.achievements && profile.achievements.length > 0 ? `
                <h2>Achievements</h2>
                <div class="surface"><ul>${profile.achievements.map(a => `<li>🏆 ${a.name}</li>`).join('')}</ul></div>` : ''}
        </div>
    `;

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${profile.name}'s Profile</title><style>${css}</style></head><body>${body}</body></html>`;
};


const DemoPlayer: React.FC<{ recording: Recording }> = ({ recording }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current) {
                audioRef.current = new Audio(recording.dataUrl);
                audioRef.current.onended = () => setIsPlaying(false);
            }
            audioRef.current.play();
            setIsPlaying(true);
        }
    };
    
    useEffect(() => {
        return () => {
            audioRef.current?.pause();
        }
    }, [])

    return (
        <div className="flex items-center p-3 bg-light-bg-primary dark:bg-dark-bg-secondary rounded-3xl">
            <button onClick={togglePlay} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-light-surface dark:bg-dark-surface mr-3">
                {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
            </button>
            <div className="truncate">
                <p className="font-semibold text-sm truncate">{recording.name}</p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{new Date(recording.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    )
}

// Dedicated layout for printing to achieve the CV look
const PrintLayout: React.FC<{ profile: ProfileData }> = ({ profile }) => (
    <div id="printable-profile">
        <header className="print-header">
            <div className="info">
                <h1>{profile.name}</h1>
                <p className="title">{profile.title}</p>
                <p className="email">{profile.email}</p>
            </div>
            {profile.profilePictureUrl && <img src={profile.profilePictureUrl} alt={profile.name} className="profile-pic" />}
        </header>

        <section className="print-section">
            <h2 className="print-section-title">About Me</h2>
            <p className="print-bio">{profile.bio}</p>
        </section>

        {profile.skills && profile.skills.length > 0 && (
            <section className="print-section">
                <h2 className="print-section-title">Skills</h2>
                <div className="print-skills-container">
                    {profile.skills.map(skill => <span key={skill.id} className="print-skill-tag">{skill.name}</span>)}
                </div>
            </section>
        )}
        
        <div className="print-grid">
            {profile.experience && profile.experience.length > 0 && (
                <section className="print-section">
                    <h2 className="print-section-title">Work Experience</h2>
                    {profile.experience.map(exp => (
                        <div key={exp.id} className="print-list-item">
                            <h4>{exp.role}</h4>
                            <p>{exp.company}</p>
                            <p>{exp.period}</p>
                        </div>
                    ))}
                </section>
            )}

            {profile.achievements && profile.achievements.length > 0 && (
                <section className="print-section">
                    <h2 className="print-section-title">Achievements</h2>
                    {profile.achievements.map(ach => (
                        <div key={ach.id} className="print-list-item">
                            <h4>{ach.name}</h4>
                        </div>
                    ))}
                </section>
            )}
        </div>
    </div>
);


const Profile: React.FC<ProfileProps> = ({ navigateTo }) => {
    const [profile, setProfile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
    const [recordings] = useLocalStorage<Recording[]>('voicememo_recordings', []);
    const [isEditing, setIsEditing] = useState(false);
    const [editingProfile, setEditingProfile] = useState<ProfileData | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDemosModal, setShowDemosModal] = useState(false);
    
    const profilePictureInputRef = useRef<HTMLInputElement>(null);

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
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const handleFieldChange = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
        setEditingProfile(p => p ? { ...p, [field]: value } : null);
    };
    
    const handleItemChange = <K extends 'experience' | 'skills' | 'socialLinks' | 'weeklySchedule' | 'achievements'>(
        key: K, id: string, field: keyof ProfileData[K][number], value: string
    ) => {
        setEditingProfile(p => {
            if (!p) return null;
            const newItems = (p[key] as any[]).map(item => item.id === id ? { ...item, [field]: value } : item);
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
    
    const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleFieldChange('profilePictureUrl', event.target?.result as string);
            }
            reader.readAsDataURL(file);
        }
    }
    
    const handleDownloadHtml = () => {
        const htmlContent = generateProfileHTML(profile);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profile.name.replace(/\s/g, '_')}_Profile.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
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
                 <button onClick={() => setShowShareModal(true)} className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full bg-light-surface dark:bg-dark-surface hover:opacity-90 transition-opacity shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                    <ShareIcon className="w-5 h-5"/>
                    <span>Share Profile</span>
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
            
            <PrintLayout profile={profile} />

            <div className="space-y-8 no-print">
                {/* Header */}
                 <div className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-5xl flex flex-col items-center text-center p-6 shadow-soft dark:shadow-none">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle flex items-center justify-center mb-4 overflow-hidden">
                            {currentData.profilePictureUrl ? (
                                <img src={currentData.profilePictureUrl} alt={currentData.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-bold text-light-accent dark:text-dark-accent">{getInitials(currentData.name)}</span>
                            )}
                        </div>
                        {isEditing && (
                            <button onClick={() => profilePictureInputRef.current?.click()} className="absolute bottom-4 -right-1 bg-light-accent text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                <UploadIcon className="w-4 h-4" />
                                <input type="file" ref={profilePictureInputRef} onChange={handleProfilePictureUpload} accept="image/*" className="hidden" />
                            </button>
                        )}
                    </div>
                    {isEditing ? <input value={currentData.name} onChange={e => handleFieldChange('name', e.target.value)} className={`${inputClasses} text-3xl font-bold text-center mb-1`}/> : <h1 className="text-4xl font-bold">{currentData.name}</h1>}
                    {isEditing ? <input value={currentData.title} onChange={e => handleFieldChange('title', e.target.value)} className={`${inputClasses} text-lg text-light-accent dark:text-dark-accent text-center`}/> : <p className="text-lg text-light-accent dark:text-dark-accent">{currentData.title}</p>}
                    {isEditing ? <input type="email" value={currentData.email} onChange={e => handleFieldChange('email', e.target.value)} className={`${inputClasses} text-sm text-light-text-secondary text-center mt-1`}/> : <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{currentData.email}</p>}
                </div>

                <Section title="Featured Demos">
                    <div className="p-4 space-y-3">
                         {currentData.featuredDemos && currentData.featuredDemos.length > 0 ? (
                            currentData.featuredDemos.map(id => {
                                const rec = recordings.find(r => r.id === id);
                                return rec ? <DemoPlayer key={id} recording={rec} /> : null;
                            })
                         ) : !isEditing && (
                            <p className="text-sm text-center text-light-text-secondary dark:text-dark-text-secondary py-4">No demos featured yet.</p>
                         )}
                         {isEditing && (
                             <button onClick={() => setShowDemosModal(true)} className="w-full text-sm text-light-accent dark:text-dark-accent flex items-center justify-center p-2 rounded-xl hover:bg-light-accent/10 dark:hover:bg-dark-accent/10"><PlusIcon className="w-4 h-4 mr-1"/> Manage Demos</button>
                         )}
                    </div>
                </Section>

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

            {showShareModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print" onClick={() => setShowShareModal(false)}>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                         <div className="w-12 h-1.5 bg-light-divider dark:bg-dark-divider rounded-full mx-auto mb-4"></div>
                         <h3 className="text-lg font-bold mb-4 text-center">Share Your Profile</h3>
                         <div className="space-y-4">
                             <div className="text-center p-4 bg-light-surface dark:bg-dark-surface rounded-4xl">
                                <h4 className="font-semibold">Scan QR Code</h4>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(`${window.location.origin}?profile=${btoa(encodeURIComponent(JSON.stringify(profile)))}`)}`} 
                                    alt="Profile QR Code"
                                    className="w-48 h-48 mx-auto my-2 rounded-2xl"
                                />
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Scan this code to open a preview of your profile on any device.</p>
                             </div>
                             <div className="flex space-x-2">
                                <button onClick={handleDownloadHtml} className="flex-1 text-sm font-semibold p-3 rounded-full bg-light-surface dark:bg-dark-surface">Download HTML</button>
                                <button onClick={() => window.print()} className="flex-1 text-sm font-semibold p-3 rounded-full bg-light-surface dark:bg-dark-surface">Save as PDF</button>
                             </div>
                         </div>
                    </div>
                </div>
            )}
            
            {showDemosModal && editingProfile && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print" onClick={() => setShowDemosModal(false)}>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-5xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Select Featured Demos</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {recordings.map(rec => {
                                const isSelected = editingProfile.featuredDemos?.includes(rec.id);
                                return (
                                <label key={rec.id} className={`flex items-center p-3 rounded-2xl cursor-pointer ${isSelected ? 'bg-light-accent-subtle dark:bg-dark-accent-subtle' : 'bg-light-surface dark:bg-dark-surface'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => {
                                            const currentDemos = editingProfile.featuredDemos || [];
                                            let newDemos;
                                            if(isSelected) {
                                                newDemos = currentDemos.filter(id => id !== rec.id);
                                            } else {
                                                if (currentDemos.length < 3) {
                                                    newDemos = [...currentDemos, rec.id];
                                                } else {
                                                    alert("You can select up to 3 demos.");
                                                    newDemos = currentDemos;
                                                }
                                            }
                                            handleFieldChange('featuredDemos', newDemos);
                                        }}
                                        className="h-5 w-5 rounded border-gray-300 text-light-accent focus:ring-light-accent mr-3"
                                    />
                                    <span>{rec.name}</span>
                                </label>
                            )})}
                        </div>
                        <button onClick={() => setShowDemosModal(false)} className="mt-4 w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Done</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;