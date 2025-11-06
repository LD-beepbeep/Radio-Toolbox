

import { ProfileData, Tab, TabSetting, Segment } from '../types';

export const initialProfile: ProfileData = {
    name: 'Alex Ryder',
    title: 'Host of "The Sonic Journey"',
    email: 'alex.ryder@radio.co',
    bio: 'Host of the award-winning "The Sonic Journey," Alex Ryder is a voice for the musically curious. With a passion for untold stories and underground sounds, Alex has been connecting artists and audiences for over a decade. Tune in for your daily dose of sonic discovery.',
    profilePictureUrl: '',
    featuredDemos: [],
    experience: [
        { id: 'exp1', role: 'Lead Host & Producer', company: 'WRDX 101.5 The Vibe', period: '2018 - Present' },
        { id: 'exp2', role: 'Weekend Host', company: 'KICK 97.9 FM', period: '2015 - 2018' },
    ],
    skills: [
        { id: 'skill1', name: 'Audio Production' },
        { id: 'skill2', name: 'Live Interviews' },
        { id: 'skill3', name: 'Music Curation' },
        { id: 'skill4', name: 'Storytelling' },
    ],
    socialLinks: [
        {id: 'social1', platform: 'Instagram', url: 'https://instagram.com/alexryderonair'},
        {id: 'social2', platform: 'X (Twitter)', url: 'https://x.com/alexryderonair'},
    ],
    weeklySchedule: [
        {id: 'sched1', day: 'Weekdays', time: '14:00 - 18:00', show: 'The Sonic Journey'},
        {id: 'sched2', day: 'Saturday', time: '10:00 - 12:00', show: 'Indie Spotlight'},
    ],
    achievements: [
        {id: 'ach1', name: 'Radio Innovator of the Year 2023'},
        {id: 'ach2', name: 'Best Syndicated Music Show 2021'},
    ]
};

export const initialTabSettings: TabSetting[] = [
    { id: Tab.Dashboard, label: 'Dashboard', isVisible: true },
    { id: Tab.Showtime, label: 'Showtime', isVisible: true },
    { id: Tab.VoiceMemo, label: 'Memos', isVisible: true },
    { id: Tab.Tools, label: 'Tools', isVisible: true },
];

export const initialSegments: Segment[] = [
    { id: '1', type: 'Intro/Outro', title: 'Show Intro & Headlines', duration: 120, script: "Welcome back to The Sonic Journey with your host, Alex Ryder. Coming up on today's show, we're looking at the top headlines in music tech..." },
    { id: '2', type: 'Talk', title: 'Main Topic: Sci-Fi Tech in Real Life', duration: 600, script: 'The future is here, or is it? We are diving deep into the technology that once felt like science fiction, and how it\'s shaping the music you hear every day.' },
    { id: '3', type: 'Music', title: 'Future Funk Playlist', duration: 720, script: '' },
    { id: '4', type: 'Ad Break', title: 'Sponsor Messages', duration: 180, script: '' },
    { id: '5', type: 'Intro/Outro', title: 'Show Outro', duration: 90, script: 'And that\'s a wrap for this episode of The Sonic Journey. A big thank you to our guests and to you for listening. Join us next time...' },
];