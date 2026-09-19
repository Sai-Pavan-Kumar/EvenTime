import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type CollegeRow = Database['public']['Tables']['colleges']['Row'];

const WORD_NORMALIZATION: Record<string, string> = {
  clg: "college",
  engg: "engineering",
  eng: "engineering",
  univ: "university",
  varsity: "university",
  inst: "institute",
  tech: "technology",
  govt: "government",
};

const COMMON_COLLEGE_ALIASES: Record<string, string> = {
  cbit: "Chaitanya Bharathi",
  bits: "Birla Institute",
  iiit: "Information Technology",
  vnr: "Vignana Jyothi",
  vnrvjiet: "Vignana Jyothi",
  vbit: "Vignana Bharathi",
  mgit: "Mahatma Gandhi Institute of Technology",
  griet: "Gokaraju",
  snist: "Sreenidhi",
  mrec: "Malla Reddy",
  mlrit: "Marri Laxman",
  cmrec: "CMR Engineering",
  nsut: "Netaji Subhas",
  dtu: "Delhi Technological",
};

function cleanPrefix(name: string): string {
  // Strip AISHE codes or numbering like "130083-", "C497 ", etc.
  return name.replace(/^[\d\w]+[-_\s]+/, "");
}

// Global in-memory cache for instantaneous (0ms) results on repeated queries
const searchCache = new Map<string, CollegeRow[]>();

export function useCollegeSearch(searchQuery: string, skip: boolean = false) {
  const [collegesList, setCollegesList] = useState<CollegeRow[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = searchQuery.trim();

    // Reset immediately if empty or skipped
    if (!query || skip) {
      setCollegesList([]);
      setIsSearchingColleges(false);
      return;
    }

    // Require at least 2 characters to avoid lagging against 52k rows
    if (query.length < 2) {
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

    const currentRequestId = ++requestIdRef.current;
    setIsSearchingColleges(true);

    // Safety timeout: Never leave user stuck on "Searching..." if network stalls
    const safetyTimer = setTimeout(() => {
      if (requestIdRef.current === currentRequestId) {
        setIsSearchingColleges(false);
      }
    }, 3500);

    const timer = setTimeout(async () => {
      if (requestIdRef.current !== currentRequestId) return;

      const supabase = createClient();
      const rawWords = normalized.split(/\s+/).filter(Boolean);
      const words = rawWords.map(w => WORD_NORMALIZATION[w] || w);

      try {
        // Direct multi-word search with normalized terms (e.g. cvr clg -> cvr college)
        let directQuery = supabase
          .from('colleges')
          .select('id, name, slug, state, theme_color, logo_url, website');

        for (const w of words) {
          directQuery = directQuery.ilike('name', `%${w}%`);
        }

        const calls: PromiseLike<any>[] = [directQuery.limit(25)];

        // Check if any word matches a known abbreviation/alias (e.g. cbit, vnr, mgit)
        const matchedAliases = rawWords.map(w => COMMON_COLLEGE_ALIASES[w]).filter(Boolean);
        for (const alias of matchedAliases) {
          const aliasWords = alias.toLowerCase().split(/\s+/).filter(Boolean);
          let aliasQuery = supabase
            .from('colleges')
            .select('id, name, slug, state, theme_color, logo_url, website');

          for (const aw of aliasWords) {
            aliasQuery = aliasQuery.ilike('name', `%${aw}%`);
          }
          calls.push(aliasQuery.limit(15));
        }

        const results = await Promise.all(calls);

        if (requestIdRef.current !== currentRequestId) return;

        const map = new Map<string, CollegeRow>();
        for (const res of results) {
          if (res?.data && Array.isArray(res.data)) {
            for (const col of res.data) {
              if (col?.id && !map.has(col.id)) {
                map.set(col.id, col as CollegeRow);
              }
            }
          }
        }

        // Rank results: items starting with query or word boundaries rank higher, cleaner names first
        const sorted = Array.from(map.values()).sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aClean = cleanPrefix(aName);
          const bClean = cleanPrefix(bName);

          const aExact = aName === normalized || aClean === normalized;
          const bExact = bName === normalized || bClean === normalized;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          const aStarts = aName.startsWith(normalized) || aClean.startsWith(normalized);
          const bStarts = bName.startsWith(normalized) || bClean.startsWith(normalized);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          const firstWord = words[0] || normalized;
          const aWordBoundary = new RegExp(`(^|[\\s(-])` + firstWord).test(aName);
          const bWordBoundary = new RegExp(`(^|[\\s(-])` + firstWord).test(bName);
          if (aWordBoundary && !bWordBoundary) return -1;
          if (!aWordBoundary && bWordBoundary) return 1;

          // Shorter, cleaner college names preferred over 200+ char administrative strings
          return a.name.length - b.name.length;
        });

        const finalResults = sorted.slice(0, 20);

        // Store in LRU-style cache
        if (searchCache.size > 200) {
          const firstKey = searchCache.keys().next().value;
          if (firstKey) searchCache.delete(firstKey);
        }
        searchCache.set(normalized, finalResults);

        if (requestIdRef.current === currentRequestId) {
          setCollegesList(finalResults);
        }
      } catch (error) {
        console.warn("[useCollegeSearch] Search error:", error);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsSearchingColleges(false);
          clearTimeout(safetyTimer);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [searchQuery, skip]);

  return { collegesList, setCollegesList, isSearchingColleges };
}
