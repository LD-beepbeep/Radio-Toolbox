


import React, { useState, useEffect } from 'react';
import { Tab, Theme, ProfileData } from './types';
import Header from './components/Header';
import TabBar from './components/TabBar';
import Dashboard from './components/tools/Dashboard';
import VoiceMemo from './components/tools/VoiceMemo';
import Showtime from './components/tools/Showtime';
import Profile from './components/tools/Profile';
import MicTest from './components/tools/MicTest';
import Tools from './components/tools/Tools';
import Soundboard from './components/tools/Soundboard';
import Teleprompter from './components/tools/ScriptTimer';
import StudioFlashlight from './components/tools/CallScreener';
import VoiceWarmup from './components/tools/VoiceWarmup';
import AudioTrimmer from './components/tools/AudioTrimmer';
import MicDistanceHelper from './components/tools/MicDistanceHelper';
import NormalizeCompress from './components/tools/NormalizeCompress';
import WaveformVisualizer from './components/tools/WaveformVisualizer';
import VoicePitchMonitor from './components/tools/VoicePitchMonitor';
import ShowPosterMaker from './components/tools/ShowPosterMaker';
import Settings from './components/tools/Settings';
import Onboarding from './components/Onboarding';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialProfile } from './data/initialData';
import { ExternalLinkIcon, TrophyIcon, XIcon } from './components/Icons';


const SharedProfileViewer: React.FC<{ profile: ProfileData; onDismiss: () => void }> = ({ profile, onDismiss }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const Section: React.FC<{title: string; children: React.ReactNode, className?: string}> = ({title, children, className}) => (
        <div>
            <h3 className="text-sm font-semibold mb-2 px-1 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{title}</h3>
            <div className={`bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-4xl overflow-hidden shadow-soft dark:shadow-none ${className}`}>
                {children}
            </div>
        </div>
    );

    return (
        <div className="font-sans min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary transition-colors duration-300">
             <div className="fixed top-0 right-0 p-4 z-50">
                <button onClick={onDismiss} className="w-10 h-10 flex items-center justify-center rounded-full bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg shadow-md">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            <main className="w-full max-w-3xl mx-auto px-4 py-12">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider rounded-5xl flex flex-col items-center text-center p-6 shadow-soft dark:shadow-none">
                        <div className="w-28 h-28 rounded-full bg-light-accent-subtle dark:bg-dark-accent-subtle flex items-center justify-center mb-4 overflow-hidden">
                            {profile.profilePictureUrl ? (
                                <img src={profile.profilePictureUrl} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-bold text-light-accent dark:text-dark-accent">{getInitials(profile.name)}</span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold">{profile.name}</h1>
                        <p className="text-lg text-light-accent dark:text-dark-accent">{profile.title}</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{profile.email}</p>
                    </div>
                    {/* Bio */}
                    <Section title="About Me"><p className="text-base leading-relaxed text-light-text-secondary dark:text-dark-text-secondary p-4">{profile.bio}</p></Section>
                    
                     {/* Skills */}
                     {profile.skills && profile.skills.length > 0 && (
                        <Section title="Skills">
                            <div className="p-4 flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <span key={skill.id} className="text-sm font-medium rounded-full py-1.5 px-3 bg-light-bg-primary dark:bg-dark-bg-secondary">{skill.name}</span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Work Experience */}
                     {profile.experience && profile.experience.length > 0 && (
                        <Section title="Work Experience">
                            <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                                {profile.experience.map(exp => (
                                    <li key={exp.id} className="p-4">
                                        <h4 className="font-semibold">{exp.role}</h4>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{exp.company}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{exp.period}</p>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Achievements */}
                     {profile.achievements && profile.achievements.length > 0 && (
                        <Section title="Achievements">
                            <ul className="divide-y divide-light-divider dark:divide-dark-divider">
                                {profile.achievements.map(item => (
                                    <li key={item.id} className="flex items-center p-4">
                                        <TrophyIcon className="w-5 h-5 mr-4 text-yellow-500 flex-shrink-0" />
                                        <h4 className="font-semibold">{item.name}</h4>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}
                </div>
            </main>
        </div>
    );
};


const App: React.FC = () => {
  const [viewStack, setViewStack] = useState<string[]>(['Dashboard']);
  const currentView = viewStack[viewStack.length - 1];
  const [profile, setProfile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sharedProfile, setSharedProfile] = useState<ProfileData | null>(null);


  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || Theme.Dark;
  });
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [flashlightColor, setFlashlightColor] = useState('#FFFFFF');
  
  useEffect(() => {
      const hasOnboarded = localStorage.getItem('has_onboarded');
      if (!hasOnboarded) {
          setShowOnboarding(true);
      } else {
        const params = new URLSearchParams(window.location.search);
        const profileDataB64 = params.get('profile');
        if (profileDataB64) {
            try {
                const jsonString = decodeURIComponent(atob(profileDataB64));
                const decodedProfile = JSON.parse(jsonString);
                setSharedProfile(decodedProfile);
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
                console.error("Failed to parse shared profile data:", e);
                alert("Could not read shared profile link.");
            }
        }
      }
  }, []);

  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', Theme.Dark);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', Theme.Light);
    }
  }, [theme]);
  
  const handleOnboardingComplete = (newProfileData: ProfileData) => {
      setProfile(newProfileData);
      localStorage.setItem('has_onboarded', 'true');
      setShowOnboarding(false);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === Theme.Dark ? Theme.Light : Theme.Dark));
  };

  const toggleFlashlight = () => {
    setIsFlashlightOn(prevState => !prevState);
  };
  
  const navigateTo = (view: string) => {
    setViewStack(prev => [...prev, view]);
  };

  const goBack = () => {
    setViewStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const navigateTab = (tab: Tab) => {
    setViewStack([tab]);
  };

  const getActiveTab = () => {
    const root_view = viewStack[0];
    if(Object.values(Tab).includes(root_view as Tab)){
      return root_view as Tab;
    }
    return Tab.Dashboard; // Fallback
  }
  
  const getHeaderTitle = () => {
    if (currentView === Tab.Dashboard) {
      return "Dashboard";
    }
    return currentView.replace(/([A-Z])/g, ' $1').trim();
  }


  const renderContent = () => {
    switch (currentView) {
      case Tab.Dashboard:
        return <Dashboard />;
      case 'Teleprompter':
        return <Teleprompter />;
      case 'StudioFlashlight':
        return <StudioFlashlight isOn={isFlashlightOn} onToggle={toggleFlashlight} color={flashlightColor} setColor={setFlashlightColor} />;
      case 'AudioTrimmer':
        return <AudioTrimmer />;
      case 'MicDistanceHelper':
          return <MicDistanceHelper />;
      case 'Soundboard':
        return <Soundboard />;
      case Tab.VoiceMemo:
        return <VoiceMemo />;
      case Tab.Showtime:
        return <Showtime />;
      case 'Profile':
        return <Profile navigateTo={navigateTo}/>;
      case 'Settings':
        return <Settings navigateTo={navigateTo} />;
      case 'MicTest':
        return <MicTest />;
      case 'VoiceWarmup':
        return <VoiceWarmup />;
      case 'NormalizeCompress':
        return <NormalizeCompress />;
      case 'WaveformVisualizer':
        return <WaveformVisualizer />;
      case 'VoicePitchMonitor':
        return <VoicePitchMonitor />;
      case 'ShowPosterMaker':
        return <ShowPosterMaker />;
      case Tab.Tools:
        return <Tools navigateTo={navigateTo} />;
      default:
        return <Dashboard />;
    }
  };

  if (sharedProfile) {
    return <SharedProfileViewer profile={sharedProfile} onDismiss={() => setSharedProfile(null)} />;
  }

  return (
    <div className="font-sans min-h-screen flex flex-col">
       {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
       {isFlashlightOn && (
        <div className="fixed inset-0 z-[100]" style={{ backgroundColor: flashlightColor }}></div>
      )}
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onToggleFlashlight={toggleFlashlight}
        showBack={viewStack.length > 1}
        onBack={goBack}
        onSettingsClick={() => navigateTo('Settings')}
        onProfileClick={() => navigateTo('Profile')}
        title={getHeaderTitle()}
      />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 pt-24 pb-32">
        {renderContent()}
      </main>
      <TabBar activeTab={getActiveTab()} onTabChange={navigateTab} />
    </div>
  );
};

export default App;