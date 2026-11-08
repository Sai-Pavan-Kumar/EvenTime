export const CITY_CONFIG: Record<string, {
  backgroundImage: string;
  accentColor: string;
}> = {
  'hyderabad': {
    backgroundImage: '/cities/hyderabad1.webp',
    accentColor: '#6C47FF',
  },
   'bengaluru': {
    backgroundImage: '/cities/bengaluru1.webp', 
    accentColor: '#0EA5E9',
  },
  'mumbai': {
    backgroundImage: '/cities/mumbai1.webp',
    accentColor: '#F59E0B',
  },
  'new-delhi': {
    backgroundImage: '/cities/new-delhi1.webp', 
    accentColor: '#EF4444',
  },
  'chennai': {
    backgroundImage: '/cities/chennai1.webp',
    accentColor: '#10B981',
  },
  'pune': {
    backgroundImage: '/cities/pune1.webp',
    accentColor: '#8B5CF6',
  },
  'anantapur': {
    backgroundImage: '/cities/anantapur1.webp',
    accentColor: '#10B981',
  },
  'kolkata': {
    backgroundImage: '/cities/kolkata1.webp',
    accentColor: '#F97316',
  },
  'jaipur': {
    backgroundImage: '/cities/jaipur1.webp',
    accentColor: '#EC4899',
  },
  'ahmedabad': {
    backgroundImage: '/cities/ahmedabad1.webp',
    accentColor: '#14B8A6',
  },
  'kochi': {
    backgroundImage: '/cities/kochi1.webp',
    accentColor: '#22C55E',
  },
  'visakhapatnam': {
    backgroundImage: '/cities/visakhapatnam1.webp',
    accentColor: '#6366F1',
  },
  'coimbatore': {
    backgroundImage: '/cities/coimbatore1.webp',
    accentColor: '#A855F7',
  },
  'nizamabad': {
    backgroundImage: '/cities/nizamabad1.webp',
    accentColor: '#6C47FF',
  },
  'online': {
    backgroundImage: '/cities/online1.webp',
    accentColor: '#6366F1',
  },
  'bhopal': {
    backgroundImage: '/cities/bhopal1.webp', 
    accentColor: '#3B82F6',
  },
  'guntur': {
    backgroundImage: '/cities/guntur1.webp', 
    accentColor: '#6366F1',
  },
  'gurugram': {
    backgroundImage: '/cities/gurugram1.webp', 
    accentColor: '#6366F1',
  },
  'indore': {
    backgroundImage: '/cities/indore1.webp', 
    accentColor: '#6366F1',
  },
  'kakinada': {
    backgroundImage: '/cities/kakinada1.webp', 
    accentColor: '#6366F1',
  },
  'kanpur': {
    backgroundImage: '/cities/kanpur1.webp', 
    accentColor: '#6366F1',
  },
  'karimnagar': {
    backgroundImage: '/cities/karimnagar1.webp',
    accentColor: '#6366F1',
  },
  'khammam': {
    backgroundImage: '/cities/khammam1.webp', 
    accentColor: '#6366F1',
  },
  'lucknow': {
    backgroundImage: '/cities/lucknow1.webp', 
    accentColor: '#6366F1',
  },
  'mangaluru': {
    backgroundImage: '/cities/mangaluru1.webp',
    accentColor: '#6366F1',
  },
  'mysuru': {
    backgroundImage: '/cities/mysuru1.webp', 
    accentColor: '#6366F1',
  },
  'nagpur': {
    backgroundImage: '/cities/nagpur1.webp', 
    accentColor: '#6366F1',
  },
  'noida': {
    backgroundImage: '/cities/noida1.webp', 
    accentColor: '#6366F1',
  },
  'thiruvananthapuram': {
    backgroundImage: '/cities/thiruvananthapuram1.webp',
    accentColor: '#6366F1',
  },
  'tirupati': {
    backgroundImage: '/cities/tirupati1.webp', 
    accentColor: '#6366F1',
  },
  'vijayawada': {
    backgroundImage: '/cities/vijayawada1.webp',
    accentColor: '#6366F1',
  },
  'warangal': {
    backgroundImage: '/cities/warangal1.webp',
    accentColor: '#6366F1',
  },
  'surat': {
    backgroundImage: '/cities/surat.webp',
    accentColor: '#6366F1',
  },
  'goa': {
    backgroundImage: '/cities/goa1.webp',
    accentColor: '#6366F1',
  },
  'bhubaneswar': {
    backgroundImage: '/cities/bhubaneswar1.webp',
    accentColor: '#6366F1',
  },
  'patna': {
    backgroundImage: '/cities/patna1.webp',
    accentColor: '#6366F1',
  },
  'chandigarh': {
    backgroundImage: '/cities/chandigarh1.webp',
    accentColor: '#6366F1',
  },
};

// Unknown cities get no art on purpose: a generic stock image looked like a bug, a plain tile does not.
export const getCityConfig = (city: string) => {
  if (!city) return null;
  const key = city.toLowerCase().trim().replace(/\s+/g, '-');
  return CITY_CONFIG[key] ?? null;
};



