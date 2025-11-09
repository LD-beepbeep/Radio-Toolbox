

import React from 'react';
import { MicIcon, MusicIcon, Lightbulb, ScissorsIcon, TargetIcon, FileTextIcon, ActivityIcon, NormalizeCompressIcon, WaveformVisualizerIcon, ShowPosterMakerIcon, BarChartIcon, DownloadIcon } from '../Icons';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, onClick }) => (
  <button onClick={onClick} className="bg-light-surface dark:bg-dark-surface dark:border dark:border-dark-divider p-4 rounded-4xl text-left hover:bg-light-bg-primary dark:hover:bg-dark-surface/80 transition-colors w-full h-full flex flex-col shadow-soft dark:shadow-none">
    <div className="bg-light-accent-subtle dark:bg-dark-accent-subtle p-3 rounded-full self-start">
      <Icon className="w-6 h-6 text-light-accent dark:text-dark-accent" />
    </div>
    <div className="mt-4">
      <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{description}</p>
    </div>
  </button>
);


const TOOLS_LIST = [
  { id: 'Soundboard', title: 'Soundboard', description: 'Upload & play sound clips.', icon: MusicIcon },
  { id: 'ShowPosterMaker', title: 'Show Poster Maker', description: 'Quick graphics for shows.', icon: ShowPosterMakerIcon },
  { id: 'MicTest', title: 'Mic Test', description: 'Check your microphone quality.', icon: MicIcon },
  { id: 'DbMeter', title: 'dB Meter', description: 'Monitor your microphone input levels.', icon: BarChartIcon },
  { id: 'VoiceWarmup', title: 'Voice Warm-up', description: 'Guided voice exercises.', icon: ActivityIcon },
  { id: 'MicDistanceHelper', title: 'Mic Distance Helper', description: 'Find optimal mic distance.', icon: TargetIcon },
  { id: 'AudioTrimmer', title: 'Audio Trimmer', description: 'Quickly trim audio clips.', icon: ScissorsIcon },
  { id: 'NormalizeCompress', title: 'Normalize & Compress', description: 'Simple audio processing.', icon: NormalizeCompressIcon },
  { id: 'WaveformVisualizer', title: 'Waveform Visualizer', description: 'Create animated waveforms.', icon: WaveformVisualizerIcon },
  { id: 'StudioFlashlight', title: 'Studio Flashlight', description: 'A bright, full-screen light.', icon: Lightbulb },
  { id: 'ImportExport', title: 'Import / Export Data', description: 'Backup or restore your app data.', icon: DownloadIcon },
];

interface ToolsProps {
  navigateTo: (view: string) => void;
}

const Tools: React.FC<ToolsProps> = ({ navigateTo }) => {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
