

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
import ShowPosterMaker from './components/tools/ShowPosterMaker';
import Settings from './components/tools/Settings';
import Onboarding from './components/Onboarding';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialProfile } from './data/initialData';


const App: React.FC = () => {
  const [viewStack, setViewStack] = useState<string[]>(['Dashboard']);
  const currentView = viewStack[viewStack.length - 1];
  const [profile, setProfile] = useLocalStorage<ProfileData>('user_profile', initialProfile);
  const [showOnboarding, setShowOnboarding] = useState(false);


  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || Theme.Dark;
  });
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [flashlightColor, setFlashlightColor] = useState('#FFFFFF');
  
  useEffect(() => {
      const hasOnboarded = localStorage.getItem('has_onboarded');
      if (!hasOnboarded) {
          setShowOnboarding(true);
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
      case 'ShowPosterMaker':
        return <ShowPosterMaker />;
      case Tab.Tools:
        return <Tools navigateTo={navigateTo} />;
      default:
        return <Dashboard />;
    }
  };

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