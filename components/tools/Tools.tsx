import React from 'react';
import { MicIcon, SlidersIcon, Lightbulb, ScissorsIcon, TargetIcon, FileTextIcon, CalendarDaysIcon, ActivityIcon, MusicIcon, NormalizeCompressIcon, WaveformVisualizerIcon, ShowPosterMakerIcon } from '../Icons';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, onClick }) => (
  <button onClick={onClick} className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl text-left hover:bg-light-primary/50 dark:hover:bg-dark-primary/50 transition-colors w-full">
    <div className="flex items-center space-x-4">
      <div className="bg-light-accent/10 dark:bg-dark-accent/10 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-light-accent dark:text-dark-accent" />
      </div>
      <div>
        <h3 className="font-semibold text-light-text dark:text-dark-text">{title}</h3>
        <p className="text-sm text-light-secondary dark:text-dark-secondary">{description}</p>
      </div>
    </div>
  </button>
);


const TOOLS_LIST = [
  { id: 'ShowPlanner', title: 'Show Planner', description: 'Plan your broadcast with a drag-and-drop schedule.', icon: CalendarDaysIcon },
  { id: 'Teleprompter', title: 'Teleprompter', description: 'Read from a smoothly scrolling script.', icon: FileTextIcon },
  { id: 'ShowPosterMaker', title: 'Show Poster Maker', description: 'Quick graphics for upcoming shows.', icon: ShowPosterMakerIcon },
  { id: 'VoiceWarmup', title: 'Voice Warm-up', description: 'Get your voice ready with guided exercises.', icon: ActivityIcon },
  { id: 'VoicePitchMonitor', title: 'Voice Pitch Monitor', description: 'Get real-time feedback on your vocal pitch.', icon: MusicIcon },
  { id: 'WaveformVisualizer', title: 'Waveform Visualizer', description: 'Turns clips into animated waveforms for socials.', icon: WaveformVisualizerIcon },
  { id: 'NormalizeCompress', title: 'Normalize & Compress', description: 'Simple drag-and-drop audio processing.', icon: NormalizeCompressIcon },
  { id: 'MicTest', title: 'Mic Test', description: 'Check your microphone levels and quality.', icon: MicIcon },
  { id: 'ToneGenerator', title: 'Tone & Noise Generator', description: 'Produce audio tones and noise for testing.', icon: SlidersIcon },
  { id: 'MicDistanceHelper', title: 'Mic Distance Helper', description: 'Find the optimal distance from your mic.', icon: TargetIcon },
  { id: 'AudioTrimmer', title: 'Audio Trimmer', description: 'Quickly trim and export audio clips.', icon: ScissorsIcon },
  { id: 'StudioFlashlight', title: 'Studio Flashlight', description: 'Toggle a bright, full-screen light.', icon: Lightbulb },
];

interface ToolsProps {
  navigateTo: (view: string) => void;
}

const Tools: React.FC<ToolsProps> = ({ navigateTo }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Tools</h2>
      <div className="space-y-4">
        {TOOLS_LIST.map(tool => (
          <ToolCard 
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            onClick={() => navigateTo(tool.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Tools;