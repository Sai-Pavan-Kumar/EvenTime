import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
type CollegeRow = Database['public']['Tables']['colleges']['Row'];
export function useCollegeSearch(searchQuery: string, skip: boolean = false) {
  const [collegesList, setCollegesList] = useState<CollegeRow[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || skip) {
      setCollegesList([]);
      return;
    }
    setIsSearchingColleges(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('search_colleges', { search_term: query });
      if (error) console.error("Colleges fetch error:", error);
      setCollegesList((data as CollegeRow[]) || []);
      setIsSearchingColleges(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, skip]);
  return { collegesList, setCollegesList, isSearchingColleges };
}
