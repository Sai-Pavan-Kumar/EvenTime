// Backgrounds point at /sm/: 828px copies (11-35 KB) of the 1672px originals, made once with sharp.
// Served unoptimized on purpose, so they never use Vercel's 5K/month image quota, which breaks
// images with a 402 once exceeded on Hobby. Originals stay in /card-backgrounds/ as masters.
export const CATEGORY_CONFIG: Record<string, {
  backgroundImage: string;
  accentColor: string;
  dateColor: string;
}> = {
  'ai-event': {
  backgroundImage: '/card-backgrounds/sm/ai-event.webp',
  accentColor: '#7C3AED',
  dateColor: '#7C3AED',
},

'auto-ev-expo': {
  backgroundImage: '/card-backgrounds/sm/auto-ev-expo.webp',
  accentColor: '#06B6D4',
  dateColor: '#06B6D4',
},

'awards-night': {
  backgroundImage: '/card-backgrounds/sm/awards-night.webp',
  accentColor: '#EAB308',
  dateColor: '#EAB308',
},

'career-event': {
  backgroundImage: '/card-backgrounds/sm/career-event.webp',
  accentColor: '#0EA5E9',
  dateColor: '#0EA5E9',
},

'charity-event': {
  backgroundImage: '/card-backgrounds/sm/charity-event.webp',
  accentColor: '#06B6D4',
  dateColor: '#06B6D4',
},

'college-event': {
  backgroundImage: '/card-backgrounds/sm/college-event.webp',
  accentColor: '#2563EB',
  dateColor: '#2563EB',
},

'college-fest': {
  backgroundImage: '/card-backgrounds/sm/college-fest.webp',
  accentColor: '#9333EA',
  dateColor: '#9333EA',
},

'comedy-show': {
  backgroundImage: '/card-backgrounds/sm/comedy-show.webp',
  accentColor: '#FACC15',
  dateColor: '#FACC15',
},

'community-event': {
  backgroundImage: '/card-backgrounds/sm/community-event.webp',
  accentColor: '#14B8A6',
  dateColor: '#14B8A6',
},

'concert': {
  backgroundImage: '/card-backgrounds/sm/concert.webp',
  accentColor: '#D946EF',
  dateColor: '#D946EF',
},

'alumni-event': {
  backgroundImage: '/card-backgrounds/sm/alumni-event.webp',
  accentColor: '#0EA5E9',
  dateColor: '#0EA5E9',
},

'educational-fair': {
  backgroundImage: '/card-backgrounds/sm/educational-fair.webp',
  accentColor: '#2563EB',
  dateColor: '#2563EB',
},

'expo': {
  backgroundImage: '/card-backgrounds/sm/expo.webp',
  accentColor: '#06B6D4',
  dateColor: '#06B6D4',
},

'networking-event': {
  backgroundImage: '/card-backgrounds/sm/networking-event.webp',
  accentColor: '#8B5CF6',
  dateColor: '#8B5CF6',
},

'conference': {
  backgroundImage: '/card-backgrounds/sm/conference.webp',
  accentColor: '#6366F1',
  dateColor: '#6366F1',
},

'creator-meetup': {
  backgroundImage: '/card-backgrounds/sm/creator-meetup.webp',
  accentColor: '#F97316',
  dateColor: '#F97316',
},

'default-event': {
  backgroundImage: '/card-backgrounds/sm/default-event.webp',
  accentColor: '#6C47FF',
  dateColor: '#6C47FF',
},

'developer-event': {
  backgroundImage: '/card-backgrounds/sm/developer-event.webp',
  accentColor: '#2563EB',
  dateColor: '#2563EB',
},

'exhibition': {
  backgroundImage: '/card-backgrounds/sm/exhibition.webp',
  accentColor: '#EC4899',
  dateColor: '#EC4899',
},

'film-festival': {
  backgroundImage: '/card-backgrounds/sm/film-festival.webp',
  accentColor: '#DC2626',
  dateColor: '#DC2626',
},

'fitness-event': {
  backgroundImage: '/card-backgrounds/sm/fitness-event.webp',
  accentColor: '#22C55E',
  dateColor: '#22C55E',
},

'food-festival': {
  backgroundImage: '/card-backgrounds/sm/food-festival.webp',
  accentColor: '#F59E0B',
  dateColor: '#F59E0B',
},

'founder-meetup': {
  backgroundImage: '/card-backgrounds/sm/founder-meetup.webp',
  accentColor: '#A855F7',
  dateColor: '#A855F7',
},

'gaming-esports': {
  backgroundImage: '/card-backgrounds/sm/gaming-esports.webp',
  accentColor: '#3B82F6',
  dateColor: '#3B82F6',
},

'hackathon': {
  backgroundImage: '/card-backgrounds/sm/hackathon.webp',
  accentColor: '#3B82F6',
  dateColor: '#3B82F6',
},

'investor-event': {
  backgroundImage: '/card-backgrounds/sm/investor-event.webp',
  accentColor: '#10B981',
  dateColor: '#10B981',
},

'meetup': {
  backgroundImage: '/card-backgrounds/sm/meetup.webp',
  accentColor: '#3F6B47',
  dateColor: '#3F6B47',
},

'music-festival': {
  backgroundImage: '/card-backgrounds/sm/music-festival.webp',
  accentColor: '#8B5CF6',
  dateColor: '#8B5CF6',
},

'open-mic': {
  backgroundImage: '/card-backgrounds/sm/open-mic.webp',
  accentColor: '#FB923C',
  dateColor: '#FB923C',
},

'pet-event': {
  backgroundImage: '/card-backgrounds/sm/pet-event.webp',
  accentColor: '#10B981',
  dateColor: '#10B981',
},

'running-event': {
  backgroundImage: '/card-backgrounds/sm/running-event.webp',
  accentColor: '#F97316',
  dateColor: '#F97316',
},

'sports-tournament': {
  backgroundImage: '/card-backgrounds/sm/sports-tournament.webp',
  accentColor: '#EF4444',
  dateColor: '#EF4444',
},

'startup-event': {
  backgroundImage: '/card-backgrounds/sm/startup-event.webp',
  accentColor: '#8B5CF6',
  dateColor: '#8B5CF6',
},

'summit': {
  backgroundImage: '/card-backgrounds/sm/summit.webp',
  accentColor: '#1E3A8A',
  dateColor: '#1E3A8A',
},

'tech-event': {
  backgroundImage: '/card-backgrounds/sm/tech-event.webp',
  accentColor: '#4F46E5',
  dateColor: '#4F46E5',
},

'wellness-event': {
  backgroundImage: '/card-backgrounds/sm/wellness-event.webp',
  accentColor: '#84CC16',
  dateColor: '#84CC16',
},

'women-event': {
  backgroundImage: '/card-backgrounds/sm/women-event.webp',
  accentColor: '#EC4899',
  dateColor: '#EC4899',
},

'workshop': {
  backgroundImage: '/card-backgrounds/sm/workshop.webp',
  accentColor: '#F59E0B',
  dateColor: '#F59E0B',
},
};

export const getCategoryConfig = (category: string) => {
  if (!category) return CATEGORY_CONFIG['default'];
  const key = category.toLowerCase().trim().replace(/\s+/g, '-');
  return CATEGORY_CONFIG[key] ?? CATEGORY_CONFIG['default-event'];
};