export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export enum Tab {
  Dashboard = 'Dashboard',
  Showtime = 'Showtime',
  VoiceMemo = 'Memos',
  Tools = 'Tools',
}

export enum WidgetType {
  Schedule = 'Today\'s Schedule',
  Checklist = 'Pre-Show Checklist',
  GuestCard = 'On-Air Guest Card',
  StudioClock = 'Studio Clock & Timers',
  QuickLinks = 'Quick Links',
  PlaylistPreview = 'Up Next',
  RecentMemo = 'Recent Memo',
  OnAirStatus = 'On-Air Status',
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  gridSpan: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
}

export interface Recording {
  id: string;
  name: string;
  dataUrl: string;
  duration: number;
  createdAt: Date;
}

export interface Sound {
  id: string;
  name: string;
  dataUrl: string;
}

export interface ProfileData {
  name: string;
  title: string;
  email: string;
  bio: string;
  profilePictureUrl?: string;
  featuredDemos?: string[]; // array of recording IDs
  experience: {
    id: string;
    role: string;
    company: string;
    period: string;
  }[];
  skills: {
    id: string;
    name: string;
  }[];
  socialLinks: {
    id:string;
    platform: string;
    url: string;
  }[];
  weeklySchedule: {
    id: string;
    day: string;
    time: string;
    show: string;
  }[];
  achievements: {
    id: string;
    name: string;
  }[];
}

export interface Link {
  id: string;
  title: string;
  url: string;
}

export interface TabSetting {
  id: Tab;
  label: string;
  isVisible: boolean;
}

export type SegmentType = 'Talk' | 'Music' | 'Ad Break' | 'Intro/Outro' | string;

export interface Segment {
  id: string;
  type: SegmentType;
  title: string;
  duration: number; // in seconds
  script?: string;
  songId?: string;
  color?: string;
}