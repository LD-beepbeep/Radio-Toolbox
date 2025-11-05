import { ProfileData } from '../types';

export const initialProfile: ProfileData = {
    name: 'Your Name',
    title: 'Radio Host & Content Creator',
    email: 'your.email@example.com',
    bio: 'Passionate radio host with over a decade of experience in broadcasting. Specializing in morning shows and engaging content creation. Skilled in audio production, interviewing, and digital media strategy.',
    broadcastHours: 1250,
    experience: [
        { id: 'exp1', role: 'Senior Radio Host', company: 'FM 98.5 The Beat', period: '2018 - Present' },
        { id: 'exp2', role: 'Podcast Producer', company: 'Indie Productions', period: '2015 - 2018' },
    ],
    skills: [
        { id: 'skill1', name: 'Audio Editing (Adobe Audition)' },
        { id: 'skill2', name: 'Live Broadcasting' },
        { id: 'skill3', name: 'Public Speaking' },
    ],
    socialLinks: [
        {id: 'social1', platform: 'Twitter', url: 'https://twitter.com/yourhandle'},
        {id: 'social2', platform: 'LinkedIn', url: 'https://linkedin.com/in/yourprofile'},
    ],
    weeklySchedule: [
        {id: 'sched1', day: 'Monday-Friday', time: '6 AM - 10 AM', show: 'The Morning Drive'},
        {id: 'sched2', day: 'Saturday', time: '12 PM - 2 PM', show: 'Weekend Rewind'},
    ],
    achievements: [
        {id: 'ach1', name: 'Best Morning Show 2023'},
        {id: 'ach2', name: 'Top 40 Under 40 Broadcaster'},
    ]
};
