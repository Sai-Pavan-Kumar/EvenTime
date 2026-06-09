"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FollowButton({ curatorId, initialIsFollowing }: { curatorId: string, initialIsFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const toggleFollow = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Please login to follow curators!");
      setIsLoading(false);
      return;
    }

    if (isFollowing) {
      // Unfollow logic
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("curator_id", curatorId);
    } else {
      // Follow logic
      await supabase
        .from("followers")
        .insert({ follower_id: user.id, curator_id: curatorId });
    }
    
    setIsFollowing(!isFollowing);
    setIsLoading(false);
  };

  return (
    <button 
      onClick={toggleFollow} 
      disabled={isLoading}
      className={`px-6 py-2.5 rounded-full font-bold transition-all active:scale-95 ${
        isFollowing 
          ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
          : "bg-[#6C47FF] text-white hover:bg-[#5535e0]"
      }`}
    >
      {isLoading ? "Loading..." : (isFollowing ? "Following" : "Follow")}
    </button>
  );
}