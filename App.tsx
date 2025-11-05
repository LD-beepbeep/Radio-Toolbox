import React, { useState, useEffect } from 'react';
import { Tab, Theme } from './types';
import Header from './components/Header';
import TabBar from './components/TabBar';
import Dashboard from './components/tools/Dashboard';
import VoiceMemo from './components/tools/VoiceMemo';
import PlaylistManager from './components/tools/PlaylistManager';
import Profile from './components/tools/Profile';
import MicTest from './components/tools/MicTest';
import Tools from './components/tools/Tools';
import ToneGenerator from './components/tools/Soundboard';
import Teleprompter from './components/tools/ScriptTimer'; // Was NoiseGateVisualizer
import StudioFlashlight from './components/tools/CallScreener';
import ShowPlanner from './components/tools/ShowPlanner'; // Was AudioTrimmer
import VoiceWarmup from './components/tools/VoiceWarmup'; // Was MicDistanceHelper
import AudioTrimmer from './components/tools/AudioTrimmer';
import MicDistanceHelper from './components/tools/MicDistanceHelper';
import VoicePitchMonitor from './components/tools/VoicePitchMonitor';
import NormalizeCompress from './components/tools/NormalizeCompress';
import WaveformVisualizer from './components/tools/WaveformVisualizer';
import ShowPosterMaker from './components/tools/ShowPosterMaker';


const App: React.FC = () => {
  const [viewStack, setViewStack] = useState<string[]>(['Dashboard']);
  const currentView = viewStack[viewStack.length - 1];

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || Theme.Dark;
  });
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', Theme.Dark);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', Theme.Light);
    }
  }, [theme]);

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

  const renderContent = () => {
    switch (currentView) {
      case Tab.Dashboard:
        return <Dashboard />;
      case 'Teleprompter':
        return <Teleprompter />;
      case 'StudioFlashlight':
        return <StudioFlashlight isOn={isFlashlightOn} onToggle={toggleFlashlight} />;
      case 'AudioTrimmer':
        return <AudioTrimmer />;
      case 'MicDistanceHelper':
          return <MicDistanceHelper />;
      case 'ToneGenerator':
        return <ToneGenerator />;
      case Tab.VoiceMemo:
        return <VoiceMemo />;
      case Tab.PlaylistManager:
        return <PlaylistManager />;
      case 'Profile':
        return <Profile />;
      case 'MicTest':
        return <MicTest />;
      case 'ShowPlanner':
        return <ShowPlanner />;
      case 'VoiceWarmup':
        return <VoiceWarmup />;
      case 'VoicePitchMonitor':
        return <VoicePitchMonitor />;
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
    <div className="font-sans text-light-text dark:text-dark-text min-h-screen flex flex-col">
       {isFlashlightOn && (
        <div className="fixed inset-0 bg-white z-[100]" onClick={toggleFlashlight}></div>
      )}
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onToggleFlashlight={toggleFlashlight}
        showBack={viewStack.length > 1}
        onBack={goBack}
        onProfileClick={() => navigateTo('Profile')}
        currentView={currentView}
      />
      <main className="flex-grow w-full px-4 pt-20 pb-28">
        {renderContent()}
      </main>
      <TabBar activeTab={getActiveTab()} onTabChange={navigateTab} />
    </div>
  );
};

export default App;