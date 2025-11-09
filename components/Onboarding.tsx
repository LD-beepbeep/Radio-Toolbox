import React, { useState, useRef } from 'react';
import { ProfileData, Theme } from '../types';
import { initialProfile } from '../data/initialData';
import { UploadIcon, Sun, Moon } from './Icons';

interface OnboardingProps {
    onComplete: (profileData: ProfileData) => void;
}

const Step: React.FC<{ number: number, label: string, isActive: boolean }> = ({ number, label, isActive }) => (
    <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-light-accent dark:bg-dark-accent text-white' : 'bg-light-bg-primary dark:bg-dark-bg-secondary'}`}>{number}</div>
        <div className={`mt-1 text-xs font-semibold transition-colors ${isActive ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{label}</div>
    </div>
);

const ThemePreviewCard: React.FC<{ theme: Theme, isSelected: boolean, onClick: () => void }> = ({ theme, isSelected, onClick }) => {
    const isLight = theme === Theme.Light;
    const bg = isLight ? 'bg-light-bg-primary' : 'bg-dark-bg-primary';
    const surface = isLight ? 'bg-light-surface' : 'bg-dark-surface';
    const text = isLight ? 'text-light-text-primary' : 'text-dark-text-primary';
    const accent = isLight ? 'bg-light-accent' : 'bg-dark-accent';
    const border = isSelected ? 'ring-2 ring-light-accent dark:ring-dark-accent' : 'ring-1 ring-light-divider dark:ring-dark-divider';

    return (
        <button onClick={onClick} className={`p-3 rounded-4xl transition-all ${bg} ${border}`}>
            <div className={`w-full h-20 ${surface} rounded-2xl p-2 space-y-1.5`}>
                <div className={`h-2.5 w-1/3 rounded-full ${text} opacity-80`}></div>
                <div className="flex space-x-2">
                    <div className={`h-8 w-8 rounded-full ${accent}`}></div>
                    <div className="flex-grow space-y-1">
                        <div className={`h-2.5 w-full rounded-full ${text} opacity-60`}></div>
                        <div className={`h-2.5 w-2/3 rounded-full ${text} opacity-60`}></div>
                    </div>
                </div>
            </div>
            <p className={`mt-2 font-semibold text-sm capitalize ${isLight ? 'text-light-text-primary' : 'text-dark-text-primary'}`}>{theme}</p>
        </button>
    )
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [profileData, setProfileData] = useState<ProfileData>(initialProfile);
    const profilePictureInputRef = useRef<HTMLInputElement>(null);
    const [selectedTheme, setSelectedTheme] = useState<Theme>(Theme.Dark);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const skills = e.target.value.split('\n').filter(Boolean).map((name, i) => ({ id: `onboard_skill_${i}`, name: name.trim() }));
        setProfileData(prev => ({ ...prev, skills }));
    };
    
    const handleAchievementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const achievements = e.target.value.split('\n').filter(Boolean).map((name, i) => ({ id: `onboard_ach_${i}`, name: name.trim() }));
        setProfileData(prev => ({ ...prev, achievements }));
    };
    
    const handleScheduleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const weeklySchedule = e.target.value.split('\n').filter(Boolean).map((line, i) => {
            const [day = '', time = '', show = ''] = line.split('|').map(s => s.trim());
            return { id: `onboard_sched_${i}`, day, time, show };
        });
        setProfileData(prev => ({ ...prev, weeklySchedule }));
    };

    const handleExperienceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const experience = e.target.value.split('\n').filter(Boolean).map((line, i) => {
            const [role = '', company = '', period = ''] = line.split('|').map(s => s.trim());
            return { id: `onboard_exp_${i}`, role, company, period };
        });
        setProfileData(prev => ({ ...prev, experience }));
    };

    const handleSocialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const socialLinks = e.target.value.split('\n').filter(Boolean).map((line, i) => {
            const [platform = '', url = ''] = line.split('|').map(s => s.trim());
            return { id: `onboard_social_${i}`, platform, url };
        });
        setProfileData(prev => ({ ...prev, socialLinks }));
    };
    
     const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileData(p => ({ ...p, profilePictureUrl: event.target?.result as string }));
            }
            reader.readAsDataURL(file);
        }
    }

    const nextStep = () => setStep(s => s + 1);
    
    const finish = () => {
        localStorage.setItem('theme', selectedTheme);
        onComplete(profileData);
    };
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const renderStepContent = () => {
        const inputClasses = "w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent";
        const textareaClasses = `${inputClasses} resize-none`;

        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 text-left">
                         <h2 className="text-2xl font-bold text-center mb-4">Let's Get Started</h2>
                         <div className="flex flex-col items-center space-y-3">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle flex items-center justify-center overflow-hidden">
                                     {profileData.profilePictureUrl ? (
                                        <img src={profileData.profilePictureUrl} alt={profileData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-light-accent dark:text-dark-accent">{getInitials(profileData.name)}</span>
                                    )}
                                </div>
                                <button onClick={() => profilePictureInputRef.current?.click()} className="absolute bottom-0 -right-1 bg-light-accent text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                    <UploadIcon className="w-4 h-4" />
                                    <input type="file" ref={profilePictureInputRef} onChange={handleProfilePictureUpload} accept="image/*" className="hidden" />
                                </button>
                            </div>
                         </div>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Your Name</label>
                            <input type="text" name="name" value={profileData.name} onChange={handleInputChange} placeholder="e.g., Alex Ryder" required className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Your Title</label>
                            <input type="text" name="title" value={profileData.title} onChange={handleInputChange} placeholder="e.g., Host of 'The Sonic Journey'" required className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Contact Email</label>
                            <input type="email" name="email" value={profileData.email} onChange={handleInputChange} placeholder="e.g., alex.ryder@radio.co" required className={inputClasses} />
                        </div>
                        <button onClick={nextStep} className="w-full px-5 py-3 mt-4 text-base font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Continue</button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 text-left">
                        <h2 className="text-2xl font-bold text-center mb-4">Tell Us About Yourself</h2>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Bio</label>
                            <textarea name="bio" value={profileData.bio} onChange={handleInputChange} rows={8} className={textareaClasses} placeholder="Tell your audience who you are..."/>
                        </div>
                         <div className="flex space-x-2 pt-2">
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Skip for now</button>
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Continue</button>
                        </div>
                    </div>
                );
             case 3:
                return (
                     <div className="space-y-4 text-left">
                        <h2 className="text-2xl font-bold text-center mb-4">Your Experience</h2>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Work Experience</label>
                            <textarea value={profileData.experience.map(s => `${s.role} | ${s.company} | ${s.period}`).join('\n')} onChange={handleExperienceChange} rows={4} className={textareaClasses} placeholder="Role | Company | Period"/>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Example: Lead Host | WRDX 101.5 | 2018 - Present</p>
                        </div>
                         <div>
                            <label className="text-sm font-semibold mb-1 block">Social Links</label>
                            <textarea value={profileData.socialLinks.map(a => `${a.platform} | ${a.url}`).join('\n')} onChange={handleSocialsChange} rows={4} className={textareaClasses} placeholder="Platform | URL"/>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Example: Instagram | https://instagram.com/...</p>
                        </div>
                        <div className="flex space-x-2 pt-2">
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Skip for now</button>
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Continue</button>
                        </div>
                    </div>
                );
            case 4:
                return (
                     <div className="space-y-4 text-left">
                        <h2 className="text-2xl font-bold text-center mb-4">Your Accomplishments</h2>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Skills</label>
                            <textarea value={profileData.skills.map(s => s.name).join('\n')} onChange={handleSkillsChange} rows={4} className={textareaClasses} placeholder="Enter one skill per line..."/>
                        </div>
                         <div>
                            <label className="text-sm font-semibold mb-1 block">Achievements</label>
                            <textarea value={profileData.achievements.map(a => a.name).join('\n')} onChange={handleAchievementsChange} rows={4} className={textareaClasses} placeholder="Enter one achievement per line..."/>
                        </div>
                        <div className="flex space-x-2 pt-2">
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Skip for now</button>
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Continue</button>
                        </div>
                    </div>
                );
            case 5:
                return (
                     <div className="space-y-4 text-left">
                        <h2 className="text-2xl font-bold text-center mb-4">Your Show Schedule</h2>
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Weekly Schedule</label>
                            <textarea value={profileData.weeklySchedule.map(s => `${s.day} | ${s.time} | ${s.show}`).join('\n')} onChange={handleScheduleChange} rows={5} className={textareaClasses} placeholder="Day | Time | Show Name (one per line)"/>
                             <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Example: Weekdays | 14:00 - 18:00 | The Sonic Journey</p>
                        </div>
                        <div className="flex space-x-2 pt-2">
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-divider dark:bg-dark-divider">Skip for now</button>
                            <button onClick={nextStep} className="w-full px-5 py-2 text-sm font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Continue</button>
                        </div>
                    </div>
                );
            case 6:
                return (
                     <div className="space-y-6 text-left">
                        <h2 className="text-2xl font-bold text-center mb-1">Customize Your Theme</h2>
                        <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary -mt-5 mb-4">
                            Choose your preferred look. You can change this later in settings.
                        </p>
                        <div>
                            <div className="grid grid-cols-2 gap-4">
                                <ThemePreviewCard theme={Theme.Light} isSelected={selectedTheme === Theme.Light} onClick={() => setSelectedTheme(Theme.Light)} />
                                <ThemePreviewCard theme={Theme.Dark} isSelected={selectedTheme === Theme.Dark} onClick={() => setSelectedTheme(Theme.Dark)} />
                            </div>
                        </div>
                        <button onClick={finish} className="w-full px-5 py-3 mt-4 text-base font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white">Finish Setup</button>
                    </div>
                );
            default:
                return null;
        }
    };
    

    return (
        <div className="fixed inset-0 bg-light-bg-primary dark:bg-dark-bg-primary z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-light-surface dark:bg-dark-surface rounded-6xl p-8 shadow-soft dark:shadow-none dark:border dark:border-dark-divider text-center animate-fade-in">
                 <div className="w-full mx-auto">
                    <div className="flex justify-between items-start mb-8">
                        <Step number={1} label="Basics" isActive={step >= 1} />
                        <div className={`flex-grow h-0.5 mt-4 ${step > 1 ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-divider dark:bg-dark-divider'}`}></div>
                        <Step number={2} label="Bio" isActive={step >= 2} />
                        <div className={`flex-grow h-0.5 mt-4 ${step > 2 ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-divider dark:bg-dark-divider'}`}></div>
                        <Step number={3} label="Experience" isActive={step >= 3} />
                        <div className={`flex-grow h-0.5 mt-4 ${step > 3 ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-divider dark:bg-dark-divider'}`}></div>
                        <Step number={4} label="Skills" isActive={step >= 4} />
                        <div className={`flex-grow h-0.5 mt-4 ${step > 4 ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-divider dark:bg-dark-divider'}`}></div>
                        <Step number={5} label="Schedule" isActive={step >= 5} />
                        <div className={`flex-grow h-0.5 mt-4 ${step > 5 ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-divider dark:bg-dark-divider'}`}></div>
                        <Step number={6} label="Theme" isActive={step >= 6} />
                    </div>
                    {renderStepContent()}
                </div>
            </div>
             <style>{`
                @keyframes animate-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: animate-fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Onboarding;