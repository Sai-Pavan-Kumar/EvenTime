export const CATEGORY_CONFIG: Record<string, {
  backgroundImage: string;
  accentColor: string;
  dateColor: string;
}> = {
  'ai-event': {
  backgroundImage: '/card-backgrounds/ai-event.png',
  accentColor: '#7C3AED',
  dateColor: '#7C3AED',
},

'auto-ev-expo': {
  backgroundImage: '/card-backgrounds/auto-ev-expo.png',
  accentColor: '#06B6D4',
  dateColor: '#06B6D4',
},

'awards-night': {
  backgroundImage: '/card-backgrounds/awards-night.png',
  accentColor: '#EAB308',
  dateColor: '#EAB308',
},

'career-event': {
  backgroundImage: '/card-backgrounds/career-event.png',
  accentColor: '#0EA5E9',
  dateColor: '#0EA5E9',
},

'charity-event': {
  backgroundImage: '/card-backgrounds/charity-event.png',
  accentColor: '#06B6D4',
  dateColor: '#06B6D4',
},

'college-event': {
  backgroundImage: '/card-backgrounds/college-event.png',
  accentColor: '#2563EB',
  dateColor: '#2563EB',
},

'college-fest': {
  backgroundImage: '/card-backgrounds/college-fest.png',
  accentColor: '#9333EA',
  dateColor: '#9333EA',
},

'comedy-show': {
  backgroundImage: '/card-backgrounds/comedy-show.png',
  accentColor: '#FACC15',
  dateColor: '#FACC15',
},

'community-event': {
  backgroundImage: '/card-backgrounds/community-event.png',
  accentColor: '#14B8A6',
  dateColor: '#14B8A6',
},

'concert': {
  backgroundImage: '/card-backgrounds/concert.png',
  accentColor: '#D946EF',
  dateColor: '#D946EF',
},

'conference': {
  backgroundImage: '/card-backgrounds/conference.png',
  accentColor: '#6366F1',
  dateColor: '#6366F1',
},

'creator-meetup': {
  backgroundImage: '/card-backgrounds/creator-meetup.png',
  accentColor: '#F97316',
  dateColor: '#F97316',
},

'default-event': {
  backgroundImage: '/card-backgrounds/default-event.png',
  accentColor: '#6C47FF',
  dateColor: '#6C47FF',
},

'developer-event': {
  backgroundImage: '/card-backgrounds/developer-event.png',
  accentColor: '#2563EB',
  dateColor: '#2563EB',
},

'exhibition': {
  backgroundImage: '/card-backgrounds/exhibition.png',
  accentColor: '#EC4899',
  dateColor: '#EC4899',
},

'film-festival': {
  backgroundImage: '/card-backgrounds/film-festival.png',
  accentColor: '#DC2626',
  dateColor: '#DC2626',
},

'fitness-event': {
  backgroundImage: '/card-backgrounds/fitness-event.png',
  accentColor: '#22C55E',
  dateColor: '#22C55E',
},

'food-festival': {
  backgroundImage: '/card-backgrounds/food-festival.png',
  accentColor: '#F59E0B',
  dateColor: '#F59E0B',
},

'founder-meetup': {
  backgroundImage: '/card-backgrounds/founder-meetup.png',
  accentColor: '#A855F7',
  dateColor: '#A855F7',
},

'gaming-esports': {
  backgroundImage: '/card-backgrounds/gaming-esports.png',
  accentColor: '#3B82F6',
  dateColor: '#3B82F6',
},

'hackathon': {
  backgroundImage: '/card-backgrounds/hackathon.png',
  accentColor: '#3B82F6',
  dateColor: '#3B82F6',
},

'investor-event': {
  backgroundImage: '/card-backgrounds/investor-event.png',
  accentColor: '#10B981',
  dateColor: '#10B981',
},

'music-festival': {
  backgroundImage: '/card-backgrounds/music-festival.png',
  accentColor: '#8B5CF6',
  dateColor: '#8B5CF6',
},

'open-mic': {
  backgroundImage: '/card-backgrounds/open-mic.png',
  accentColor: '#FB923C',
  dateColor: '#FB923C',
},

'pet-event': {
  backgroundImage: '/card-backgrounds/pet-event.png',
  accentColor: '#10B981',
  dateColor: '#10B981',
},

'running-event': {
  backgroundImage: '/card-backgrounds/running-event.png',
  accentColor: '#F97316',
  dateColor: '#F97316',
},

'sports-tournament': {
  backgroundImage: '/card-backgrounds/sports-tournament.png',
  accentColor: '#EF4444',
  dateColor: '#EF4444',
},

'startup-event': {
  backgroundImage: '/card-backgrounds/startup-event.webp',
  accentColor: '#8B5CF6',
  dateColor: '#8B5CF6',
},

'summit': {
  backgroundImage: '/card-backgrounds/summit.png',
  accentColor: '#1E3A8A',
  dateColor: '#1E3A8A',
},

'tech-event': {
  backgroundImage: '/card-backgrounds/tech-event.png',
  accentColor: '#4F46E5',
  dateColor: '#4F46E5',
},

'wellness-event': {
  backgroundImage: '/card-backgrounds/wellness-event.png',
  accentColor: '#84CC16',
  dateColor: '#84CC16',
},

'women-event': {
  backgroundImage: '/card-backgrounds/women-event.png',
  accentColor: '#EC4899',
  dateColor: '#EC4899',
},

'workshop': {
  backgroundImage: '/card-backgrounds/workshop.png',
  accentColor: '#F59E0B',
  dateColor: '#F59E0B',
},
};

export const getCategoryConfig = (category: string) => {
  if (!category) return CATEGORY_CONFIG['default'];
  const key = category.toLowerCase().trim().replace(/\s+/g, '-');
  return CATEGORY_CONFIG[key] ?? CATEGORY_CONFIG['default-event'];
};