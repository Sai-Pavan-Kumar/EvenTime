export const CITY_CONFIG: Record<string, {
  backgroundImage: string;
  accentColor: string;
}> = {
  'hyderabad': {
    backgroundImage: '/cities/hyderabad.webp',
    accentColor: '#6C47FF',
  },
  'bangalore': {
    backgroundImage: '/cities/bangalore.webp',
    accentColor: '#0EA5E9',
  },
  'bengaluru': {
    backgroundImage: '/cities/bangalore.webp', // same image, alias
    accentColor: '#0EA5E9',
  },
  'mumbai': {
    backgroundImage: '/cities/mumbai.webp',
    accentColor: '#F59E0B',
  },
  'delhi': {
    backgroundImage: '/cities/delhi.webp',
    accentColor: '#EF4444',
  },
  'new-delhi': {
    backgroundImage: '/cities/delhi.webp', // alias
    accentColor: '#EF4444',
  },
  'chennai': {
    backgroundImage: '/cities/chennai.webp',
    accentColor: '#10B981',
  },
  'pune': {
    backgroundImage: '/cities/pune.webp',
    accentColor: '#8B5CF6',
  },
  'kolkata': {
    backgroundImage: '/cities/kolkata.webp',
    accentColor: '#F97316',
  },
  'jaipur': {
    backgroundImage: '/cities/jaipur.webp',
    accentColor: '#EC4899',
  },
  'ahmedabad': {
    backgroundImage: '/cities/ahmedabad.webp',
    accentColor: '#14B8A6',
  },
  'kochi': {
    backgroundImage: '/cities/kochi.webp',
    accentColor: '#22C55E',
  },
  'visakhapatnam': {
    backgroundImage: '/cities/vizag.webp', // alias
    accentColor: '#3B82F6',
  },
  'coimbatore': {
    backgroundImage: '/cities/coimbatore.webp',
    accentColor: '#A855F7',
  },
  'nizamabad': {
    backgroundImage: '/cities/nizamabad.webp',
    accentColor: '#6C47FF',
  },
  'online': {
    backgroundImage: '/cities/online.webp',
    accentColor: '#6366F1',
  },
};

export const getCityConfig = (city: string) => {
  if (!city) return CITY_CONFIG['default'] ?? { backgroundImage: '/cities/default.webp', accentColor: '#6C47FF' };
  const key = city.toLowerCase().trim().replace(/\s+/g, '-');
  return CITY_CONFIG[key] ?? { backgroundImage: '/cities/default.webp', accentColor: '#6C47FF' };
};