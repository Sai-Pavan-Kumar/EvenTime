export const CITY_CONFIG: Record<string, {
  backgroundImage: string;
  accentColor: string;
}> = {
  'hyderabad': {
    backgroundImage: '/cities/hyderabad.webp',
    accentColor: '#6C47FF',
  },
   'bengaluru': {
    backgroundImage: '/cities/bengaluru.webp', 
    accentColor: '#0EA5E9',
  },
  'mumbai': {
    backgroundImage: '/cities/mumbai.webp',
    accentColor: '#F59E0B',
  },
  'new-delhi': {
    backgroundImage: '/cities/new-delhi.webp', 
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
    backgroundImage: '/cities/visakhapatnam.webp', 
    accentColor: '#6366F1',
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
    backgroundImage: '/cities/online1.webp',
    accentColor: '#6366F1',
  },
  'bhopal': {
    backgroundImage: '/cities/bhopal.webp', 
    accentColor: '#3B82F6',
  },
  'guntur': {
    backgroundImage: '/cities/guntur.webp', 
    accentColor: '#6366F1',
  },
  'gurugram': {
    backgroundImage: '/cities/gurugram.webp', 
    accentColor: '#6366F1',
  },
  'indore': {
    backgroundImage: '/cities/indore.webp', 
    accentColor: '#6366F1',
  },
  'kakinada': {
    backgroundImage: '/cities/kakinada.webp', 
    accentColor: '#6366F1',
  },
  'kanpur': {
    backgroundImage: '/cities/kanpur.webp', 
    accentColor: '#6366F1',
  },
  'karimnagar': {
    backgroundImage: '/cities/karimnagar.webp', 
    accentColor: '#6366F1',
  },
  'khammam': {
    backgroundImage: '/cities/khammam.webp', 
    accentColor: '#6366F1',
  },
  'lucknow': {
    backgroundImage: '/cities/lucknow.webp', 
    accentColor: '#6366F1',
  },
  'mangaluru': {
    backgroundImage: '/cities/mangaluru.webp', 
    accentColor: '#6366F1',
  },
  'mysuru': {
    backgroundImage: '/cities/mysuru.webp', 
    accentColor: '#6366F1',
  },
  'nagpur': {
    backgroundImage: '/cities/nagpur.webp', 
    accentColor: '#6366F1',
  },
  'noida': {
    backgroundImage: '/cities/noida.webp', 
    accentColor: '#6366F1',
  },
  'thiruvananthapuram': {
    backgroundImage: '/cities/thiruvananthapuram.webp', 
    accentColor: '#6366F1',
  },
  'tirupati': {
    backgroundImage: '/cities/tirupati.webp', 
    accentColor: '#6366F1',
  },
  'vijayawada': {
    backgroundImage: '/cities/vijayawada.webp', 
    accentColor: '#6366F1',
  },
  'warangal': {
    backgroundImage: '/cities/warangal.webp', 
    accentColor: '#6366F1',
  },
};

export const getCityConfig = (city: string) => {
  const fallback = { 
    backgroundImage: '/cities/default.webp', 
    coverImage: '/cities/default.webp', 
    accentColor: '#6C47FF' 
  };
  
  if (!city) return fallback;
  
  const key = city.toLowerCase().trim().replace(/\s+/g, '-');
  const config = CITY_CONFIG[key];
  
  if (!config) return fallback;
  return {
    ...config,
    coverImage: `/cities/covers/${key}.webp`
  };
};



