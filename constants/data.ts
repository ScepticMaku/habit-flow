export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  current: number;
  unit: string;
  streak: number;
  time: string;
  category: string;
  completedToday: boolean;
}

export interface AIMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const mockHabits: Habit[] = [
  {
    id: '1',
    name: 'Drink a Glass of Water',
    icon: 'water',
    color: '#48CAE4',
    target: 8,
    current: 6,
    unit: 'glasses',
    streak: 5,
    time: 'All Day',
    category: 'Health',
    completedToday: false,
  },
  {
    id: '2',
    name: 'Morning Cycling',
    icon: 'bicycle',
    color: '#FF6B35',
    target: 30,
    current: 0,
    unit: 'min',
    streak: 0,
    time: '7:00 AM',
    category: 'Fitness',
    completedToday: false,
  },
  {
    id: '3',
    name: 'Read a Book',
    icon: 'book',
    color: '#7C3AED',
    target: 30,
    current: 15,
    unit: 'min',
    streak: 3,
    time: '9:00 PM',
    category: 'Learning',
    completedToday: false,
  },
  {
    id: '4',
    name: 'Meditation',
    icon: 'leaf',
    color: '#40916C',
    target: 10,
    current: 10,
    unit: 'min',
    streak: 7,
    time: '6:30 AM',
    category: 'Wellness',
    completedToday: true,
  },
  {
    id: '5',
    name: 'Write Journal',
    icon: 'create',
    color: '#F59E0B',
    target: 1,
    current: 0,
    unit: 'entry',
    streak: 2,
    time: '10:00 PM',
    category: 'Mindfulness',
    completedToday: false,
  },
];

export const mockAIMessages: AIMessage[] = [
  {
    id: '1',
    role: 'ai',
    text: "Good morning, Ahlde! You're on a 5-day streak for drinking water. Keep it up — you're 75% there today!",
    timestamp: '8:00 AM',
  },
  {
    id: '2',
    role: 'ai',
    text: 'I noticed you skipped cycling this morning. Would you like to reschedule it for the evening, or take a rest day?',
    timestamp: '8:01 AM',
  },
  {
    id: '3',
    role: 'user',
    text: "I'll do it in the evening.",
    timestamp: '8:05 AM',
  },
  {
    id: '4',
    role: 'ai',
    text: "Great plan! Evening cycling can actually help with sleep quality. I've set a reminder for 6:00 PM.",
    timestamp: '8:05 AM',
  },
];

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const weekHistory = [
  { day: 'Mon', completed: 4, total: 5 },
  { day: 'Tue', completed: 5, total: 5 },
  { day: 'Wed', completed: 3, total: 5 },
  { day: 'Thu', completed: 5, total: 5 },
  { day: 'Fri', completed: 4, total: 5 },
  { day: 'Sat', completed: 2, total: 5 },
  { day: 'Sun', completed: 0, total: 5 },
];

export const monthHistory = [
  { date: 'Dec 1', completed: 5, total: 5 },
  { date: 'Dec 2', completed: 4, total: 5 },
  { date: 'Dec 3', completed: 5, total: 5 },
  { date: 'Dec 4', completed: 3, total: 5 },
  { date: 'Dec 5', completed: 5, total: 5 },
  { date: 'Dec 6', completed: 5, total: 5 },
  { date: 'Dec 7', completed: 4, total: 5 },
  { date: 'Dec 8', completed: 2, total: 5 },
  { date: 'Dec 9', completed: 5, total: 5 },
  { date: 'Dec 10', completed: 5, total: 5 },
];
