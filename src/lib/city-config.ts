export const CITY_CONFIG: Record<string, {
  backgroundImage: string;
  accentColor: string;
}> = {
  'hyderabad': {
    backgroundImage: '/cities/hyderabad2.webp',
    accentColor: '#6C47FF',
  },
   'bengaluru': {
    backgroundImage: '/cities/bengaluru2.webp', 
    accentColor: '#0EA5E9',
  },
  'mumbai': {
    backgroundImage: '/cities/mumbai2.webp',
    accentColor: '#F59E0B',
  },
  'new-delhi': {
    backgroundImage: '/cities/new-delhi2.webp', 
    accentColor: '#EF4444',
  },
  'chennai': {
    backgroundImage: '/cities/chennai2.webp',
    accentColor: '#10B981',
  },
  'pune': {
    backgroundImage: '/cities/pune2.webp',
    accentColor: '#8B5CF6',
  },
  'anantapur': {
    backgroundImage: '/cities/anantapur2.webp',
    accentColor: '#10B981',
  },
  'kolkata': {
    backgroundImage: '/cities/kolkata2.webp',
    accentColor: '#F97316',
  },
  'jaipur': {
    backgroundImage: '/cities/jaipur2.webp',
    accentColor: '#EC4899',
  },
  'ahmedabad': {
    backgroundImage: '/cities/ahmedabad2.webp',
    accentColor: '#14B8A6',
  },
  'kochi': {
    backgroundImage: '/cities/kochi2.webp',
    accentColor: '#22C55E',
  },
  'visakhapatnam': {
    backgroundImage: '/cities/visakhapatnam2.webp',
    accentColor: '#6366F1',
  },
  'coimbatore': {
    backgroundImage: '/cities/coimbatore2.webp',
    accentColor: '#A855F7',
  },
  'nizamabad': {
    backgroundImage: '/cities/nizamabad2.webp',
    accentColor: '#6C47FF',
  },
  'online': {
    backgroundImage: '/cities/online2.webp',
    accentColor: '#6366F1',
  },
  'bhopal': {
    backgroundImage: '/cities/bhopal2.webp', 
    accentColor: '#3B82F6',
  },
  'guntur': {
    backgroundImage: '/cities/guntur2.webp', 
    accentColor: '#6366F1',
  },
  'gurugram': {
    backgroundImage: '/cities/gurugram2.webp', 
    accentColor: '#6366F1',
  },
  'indore': {
    backgroundImage: '/cities/indore2.webp', 
    accentColor: '#6366F1',
  },
  'kakinada': {
    backgroundImage: '/cities/kakinada2.webp', 
    accentColor: '#6366F1',
  },
  'kanpur': {
    backgroundImage: '/cities/kanpur2.webp', 
    accentColor: '#6366F1',
  },
  'karimnagar': {
    backgroundImage: '/cities/karimnagar2.webp',
    accentColor: '#6366F1',
  },
  'khammam': {
    backgroundImage: '/cities/khammam2.webp', 
    accentColor: '#6366F1',
  },
  'lucknow': {
    backgroundImage: '/cities/lucknow2.webp', 
    accentColor: '#6366F1',
  },
  'mangaluru': {
    backgroundImage: '/cities/mangaluru2.webp',
    accentColor: '#6366F1',
  },
  'mysuru': {
    backgroundImage: '/cities/mysuru2.webp', 
    accentColor: '#6366F1',
  },
  'nagpur': {
    backgroundImage: '/cities/nagpur2.webp', 
    accentColor: '#6366F1',
  },
  'noida': {
    backgroundImage: '/cities/noida2.webp', 
    accentColor: '#6366F1',
  },
  'thiruvananthapuram': {
    backgroundImage: '/cities/thiruvananthapuram2.webp',
    accentColor: '#6366F1',
  },
  'tirupati': {
    backgroundImage: '/cities/tirupati2.webp', 
    accentColor: '#6366F1',
  },
  'vijayawada': {
    backgroundImage: '/cities/vijayawada2.webp',
    accentColor: '#6366F1',
  },
  'warangal': {
    backgroundImage: '/cities/warangal2.webp',
    accentColor: '#6366F1',
  },
  'surat': {
    backgroundImage: '/cities/surat2.webp',
    accentColor: '#6366F1',
  },
  'goa': {
    backgroundImage: '/cities/goa2.webp',
    accentColor: '#6366F1',
  },
  'bhubaneswar': {
    backgroundImage: '/cities/bhubaneswar2.webp',
    accentColor: '#6366F1',
  },
  'patna': {
    backgroundImage: '/cities/patna2.webp',
    accentColor: '#6366F1',
  },
  'chandigarh': {
    backgroundImage: '/cities/chandigarh2.webp',
    accentColor: '#6366F1',
  },
};

// Unknown cities get no art on purpose: a generic stock image looked like a bug, a plain tile does not.
export const getCityConfig = (city: string) => {
  if (!city) return null;
  const key = city.toLowerCase().trim().replace(/\s+/g, '-');
  return CITY_CONFIG[key] ?? null;
};



