  "use client";

  import Image from "next/image";
  import Link from "next/link";
  import { Bookmark, Sparkles, Share2, Check, X, Clock, Users, IndianRupee, MapPin } from "lucide-react";
  import { useState, useEffect } from "react";
  import { format, differenceInCalendarDays } from "date-fns";
  import { motion, AnimatePresence } from "framer-motion";
  import { getCategoryConfig } from "@/lib/category-config";
  import { parseEventDateString } from "@/lib/utils/date";

  interface EventCardProps {
    id: string;   // MUST be the exact UUID from database
    slug: string; // NEW: MUST be the slug for URLs
    title: string;
    category: string;
    date: string;
    city: string;
    imageUrl: string;
    organizerName: string;
    isFree: boolean;
    isFeatured?: boolean;
    matchLabel?: string;
    audience?: string[]; 
    interestedCount?: number; // NEW: Dedicated count for interested people
    isSaved?: boolean;
    isGuest?: boolean; // NEW: Global auth check
    onSaveToggle?: (id: string) => Promise<void>;
    layout?: boolean;
    isPastDateView?: boolean; // NEW: true when user selected a past date in calendar
    userRole?: string; // NEW: 'admin' | 'curator' | 'student' | undefined
  }

  export function EventCard({
    id,
    slug, // NEW
    title,
    category,
    date,
    city,
    imageUrl,
    organizerName,
    isFree,
    isFeatured = false,
    matchLabel,
    audience,
    interestedCount, 
    isSaved = false,
    isGuest = false, // NEW
    onSaveToggle,
    layout,
    isPastDateView = false,
    userRole,
  }: EventCardProps) {
    const [savedState, setSavedState] = useState(isSaved);
    const [isSaving, setIsSaving] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false); // NEW: Auth Modal State
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const handleSave = async (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent navigating to the event page
      
      // NEW: Authentication Check
      if (isGuest) {
        setShowAuthModal(true);
        return;
      }
      
      setIsSaving(true);
      setSavedState(!savedState); // optimistic update
      
      if (onSaveToggle) {
        await onSaveToggle(id);
      }
      
      setIsSaving(false);
    };

    const getFormattedDate = (dateString: string) => {
      const parsedDate = parseEventDateString(dateString);
      if (parsedDate && (dateString.includes("T") || dateString.includes(" · "))) {
        const monthDay = format(parsedDate, "MMM d");
        const parts = dateString.split(" · ");
        const time = parts.length > 1 ? ` • ${parts[1]}` : "";
        return `${monthDay}${time}`;
      }
      return dateString;
    };

    // --- THE FOMO STATUS LOGIC ---
    let statusLabel = null;
    let statusColor = "";
    let diffDays: number | null = null;
    let isPastTime = false;
    
    const eventDate = parseEventDateString(date);
    if (eventDate) {
      const today = new Date();
      diffDays = differenceInCalendarDays(eventDate, today);
      isPastTime = today.getTime() > eventDate.getTime();

      if (diffDays < 0 || isPastTime) {
        statusLabel = "Past Event";
        statusColor = "bg-slate-800 text-white border border-slate-700";
        }  }

    useEffect(() => {
      // Skip auto-hide if: user is viewing a specific past date, or user is admin/curator
      const isTrustedRole = userRole === 'admin' || userRole === 'curator';
      if (layout && !isPastDateView && !isTrustedRole) {
        const checkDate = parseEventDateString(date);
        if (checkDate) {
          const today = new Date();
          const pastDate = differenceInCalendarDays(checkDate, today) < 0;
          const pastTime = today.getTime() > checkDate.getTime();
          
          if (pastDate || pastTime) {
            setIsVisible(false);
          }
        }
      }
    }, [date, layout, isPastDateView, userRole]);
    
    // --- NEW: TEMPLATE ENGINE LOGIC ---
    // Added a fallback to prevent crashes if the category is not found
    const config = getCategoryConfig(category) || { backgroundImage: '/card-backgrounds/default.png', dateColor: '#6C47FF' };
    // Only use uploaded image if it's featured AND an actual image was uploaded (not a placeholder)
    const isCustomUpload = imageUrl && imageUrl.startsWith('http');
    const finalImageSrc = (isFeatured && isCustomUpload) ? imageUrl : config.backgroundImage;

    // Format short date (e.g., "22 MAY") for the overlay
    const shortDateOverlay = (() => {
      const parsedDate = parseEventDateString(date);
      if (parsedDate) {
        return format(parsedDate, "d MMM").toUpperCase();
      }
      return "SOON";
    })();

    const handleShare = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const shareData = {
        title: title,
        text: `Check out ${title} on EvenTime!`,
        url: `${window.location.origin}/events/${slug}`, // Updated to use slug
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) { console.error("Share failed", err); }
      } else {
        // Fallback
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const cardVariantClass = isFeatured 
      ? "w-[280px] sm:w-[320px] shrink-0 snap-start" 
      : "w-full aspect-square";

    return (
      <>
        <AnimatePresence>
          {isVisible && (
            <motion.div 
              layout={layout}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              animate={{}}
              transition={{ duration: 0.3 }}
              className={`group relative flex flex-col bg-white p-3 rounded-[24px] border-[0.2px] border-transparent shadow-sm hover:-translate-y-1 transition-transform duration-500 ${cardVariantClass}`}
            >

              
              {/* --- IMAGE LAYER --- */}
              <div 
                className="relative w-full aspect-video rounded-[16px] overflow-hidden bg-slate-100 shrink-0"
              >
                <Link href={`/events/${slug}`} className="absolute inset-0 z-0">
                  <Image 
                    src={finalImageSrc}
                    alt={title} 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                  
                    {/* NEW: Dynamic Category Text for Fallback/Custom Categories */}
                    {finalImageSrc.includes('default.png') && (
                      <div className="absolute inset-0 flex items-center justify-center p-4 z-10 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                        <span 
                          className="font-black text-center uppercase tracking-tight w-full px-2 -mt-8"
                          style={{ 
                            fontSize: 'clamp(10px, 5vw, 20px)', 
                            lineHeight: 1.2, 
                            fontFamily: "'Outfit', sans-serif",
                            color: config.dateColor,
                            wordBreak: 'break-word'
                          }}
                        >
                          {category}
                        </span>
                      </div>
                    )}              
                    </Link>

                {/* Date top-left  */}
                <div className="absolute top-3 left-3 right-4 flex items-center justify-between z-10">
                  <span
                    className="font-semibold uppercase tracking-wider"
                    style={{ color: config.dateColor, fontSize: 'clamp(11px, 2.5vw, 11px)', fontFamily: "'Outfit', sans-serif" }}
                  >
                    {shortDateOverlay}
                  </span>
                  <span
                    className="font-semibold uppercase tracking-widest text-right"
                    style={{ color: config.dateColor, fontSize: 'clamp(9px, 2vw, 11px)', opacity: 0.75, fontFamily: "'Outfit', sans-serif" }}
                  >
                    EvenTime
                  </span>
                </div>

                {/* Badges Overlay (FOMO & Status) — below the top row */}
                <div className="absolute bottom-3 left-3 flex flex-col gap-2 items-start z-10">
                  {statusLabel && (
                    <span className={`${statusColor} text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-2 backdrop-blur-md`}>
                      {statusLabel === "Live Today" && <span className="w-1.5 h-1.5 rounded-full bg-white/90" />}
                      {statusLabel}
                    </span>
                  )}

                  {matchLabel && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-md flex items-center gap-1 backdrop-blur-md">
                      ⭐ {matchLabel}
                    </span>
                  )}

                  {isFeatured && !matchLabel && (
                    <span className="bg-linear-to-r from-amber-400 to-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-md shadow-amber-500/30 flex items-center gap-1 backdrop-blur-md">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Typography strip — mt-3 gap, left-aligned, right padding to prevent button overlap */}
              <div className="mt-3 pr-2 flex flex-col gap-1.5 flex-1 text-left relative overflow-hidden">
                <Link href={`/events/${slug}`} className="block transition-opacity hover:opacity-80">
                  <h3 
                    className="font-bold text-[18px] leading-snug truncate text-left text-slate-900"
                    style={{ 
                      fontFamily: "'Outfit', sans-serif",
                      textTransform: 'capitalize' 
                    }}
                  >
                    {title.toLowerCase()}
                  </h3>
                </Link>

                <div 
                  className="font-medium text-[14px] text-slate-500 truncate text-left flex items-center gap-1.5"
                  style={{ fontFamily: "'Switzer', sans-serif" }}
                >
                  by {organizerName}
                  {!isFree && (
                    <>
                      <span className="text-slate-300">|</span>
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full" />
                        <div className="relative flex items-center justify-center w-4 h-4 bg-emerald-500 rounded-full">
                          <IndianRupee className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {city && (
                  <div className="flex items-center gap-1 text-[12px] text-slate-500 font-medium truncate text-left">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{city}</span>
                  </div>
                )}

                <div className="flex flex-row items-center gap-2 text-[12px] text-slate-500 font-medium mt-0.5 w-full overflow-hidden">
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {date.includes(" · ") ? date.split(" · ")[1] : (eventDate ? format(eventDate, "h:mm a") : "TBA")}
                  </span>
                  {interestedCount && interestedCount > 0 ? (
                    <>
                      <span className="text-slate-300 shrink-0">|</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {interestedCount}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Save + Share — bottom-right of the main white card container */}
              <div className="absolute bottom-3 right-3 flex gap-1 z-20">
                <button 
                  onClick={(e) => { e.preventDefault(); handleSave(e); }}
                  disabled={isSaving}
                  className="w-8 h-8 rounded-full active:scale-95 transition-colors flex items-center justify-center disabled:opacity-70 hover:bg-slate-100 shrink-0"
                >
                  <Bookmark
                    className="w-4 h-4 text-slate-400 transition-colors hover:text-slate-900"
                    style={{ fill: savedState ? 'currentColor' : 'none' }}
                  />
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); handleShare(e); }}
                  className="w-8 h-8 rounded-full active:scale-95 transition-colors flex items-center justify-center hover:bg-slate-100 shrink-0"
                >
                  {copied
                    ? <Check className="w-4 h-4 text-emerald-500" />
                    : <Share2 className="w-4 h-4 text-slate-400 transition-colors hover:text-slate-900" />
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW: Auth Modal Overlay */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAuthModal(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 text-center border border-slate-100 z-10">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                <Bookmark className="w-6 h-6 text-brand" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">Save Events</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">Please sign in to save this event to your profile.</p>
              <Link href="/login" className="w-full bg-brand hover:brightness-110 text-white px-6 py-4 rounded-xl font-bold text-sm transition-all text-center">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </>
    );
  }