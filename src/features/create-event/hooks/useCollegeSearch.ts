import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type CollegeRow = Database['public']['Tables']['colleges']['Row'];

const COMMON_COLLEGE_ALIASES: Record<string, string> = {
  cbit: "Chaitanya Bharathi",
  bits: "Birla Institute",
  iit: "Indian Institute of Technology",
  nit: "National Institute",
  iiit: "Information Technology",
  jntu: "JNTU",
  jntuh: "JNTUH",
  jntuk: "JNTUK",
  jntua: "JNTUA",
  ou: "Osmania",
  vit: "Vellore Institute",
  srm: "SRM",
  mit: "Manipal Institute",
  dtu: "Delhi Technological",
  nsut: "Netaji Subhas",
  vnr: "Vignana Jyothi",
  vnrvjiet: "Vignana Jyothi",
  vbit: "Vignana Bharathi",
  mgit: "Mahatma Gandhi Institute of Technology",
  griet: "Gokaraju",
  kmit: "Keshav Memorial",
  cvr: "CVR",
  bvrit: "B V Raju",
  snist: "Sreenidhi",
  mrec: "Malla Reddy",
  mlrit: "Marri Laxman",
  cmr: "CMR",
  cmrec: "CMR Engineering",
  vardhaman: "Vardhaman",
  gitam: "GITAM",
  kl: "K L University",
  klu: "K L University",
  amrita: "Amrita",
  thapar: "Thapar",
  lpu: "Lovely Professional",
};

// Global in-memory cache to ensure 0ms instantaneous results for repeated queries
const searchCache = new Map<string, CollegeRow[]>();

export function useCollegeSearch(searchQuery: string, skip: boolean = false) {
  const [collegesList, setCollegesList] = useState<CollegeRow[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const activeQueryRef = useRef("");

  useEffect(() => {
    const query = searchQuery.trim();
    activeQueryRef.current = query;

    if (!query || skip) {
      setCollegesList([]);
      setIsSearchingColleges(false);
      return;
    }

    const normalized = query.toLowerCase();

    // Instant Cache Hit (0ms)
    if (searchCache.has(normalized)) {
      setCollegesList(searchCache.get(normalized)!);
      setIsSearchingColleges(false);
      return;
    }

    setIsSearchingColleges(true);

    const timer = setTimeout(async () => {
      if (activeQueryRef.current !== query) return;

      const supabase = createClient();
      const alias = COMMON_COLLEGE_ALIASES[normalized];

      try {
        const calls: Promise<{ data: CollegeRow[] | null; error: any }>[] = [
          supabase.rpc('search_colleges', { search_term: query }) as any,
        ];

        if (alias) {
          calls.push(supabase.rpc('search_colleges', { search_term: alias }) as any);
          calls.push(
            supabase
              .from('colleges')
              .select('id, name, slug, state, theme_color, logo_url, website')
              .ilike('name', `%${alias}%`)
              .limit(10) as any
          );
        }

        const responses = await Promise.all(calls);
        const map = new Map<string, CollegeRow>();

        for (const res of responses) {
          if (res?.data && Array.isArray(res.data)) {
            for (const item of res.data) {
              if (item?.id && !map.has(item.id)) {
                map.set(item.id, item as CollegeRow);
              }
            }
          }
        }

        // Fallback: if nothing returned yet, try direct ILIKE on colleges table
        if (map.size === 0) {
          const { data: fallback } = await supabase
            .from('colleges')
            .select('id, name, slug, state, theme_color, logo_url, website')
            .ilike('name', `%${query}%`)
            .limit(10);
          if (fallback) {
            for (const item of fallback) {
              map.set(item.id, item as CollegeRow);
            }
          }
        }

        const list = Array.from(map.values());

        // Cache the result
        searchCache.set(normalized, list);

        if (activeQueryRef.current === query) {
          setCollegesList(list);
        }
      } catch (error) {
        console.error("Colleges fetch error:", error);
      } finally {
        if (activeQueryRef.current === query) {
          setIsSearchingColleges(false);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, skip]);

  return { collegesList, setCollegesList, isSearchingColleges };
}
