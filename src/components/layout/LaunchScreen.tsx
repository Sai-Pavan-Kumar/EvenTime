"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function LaunchScreen() {
  const [show, setShow] = useState(true); 

  useEffect(() => {
    // 1. Check if the user has already seen the splash screen in this session
   let hasSeenSplash = false;
    try {
      hasSeenSplash = !!sessionStorage.getItem("hasSeenSplash");
    } catch (e) {
      console.warn("sessionStorage is blocked by browser settings");
    }
    
    if (hasSeenSplash) {
      setShow(false);
      return;
    }

    // 2. If not seen, show it for 2.5 seconds and then mark it as seen
    const timer = setTimeout(() => {
      setShow(false);
     try {
        sessionStorage.setItem("hasSeenSplash", "true");
      } catch (e) {}
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 bg-[#6C47FF] flex flex-col items-center justify-center overflow-hidden"
          style={{ zIndex: 99999, position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-20 h-20 md:w-24 md:h-24 relative mb-6"
          >
            <Image 
              src="/logo.webp" 
              alt="EvenTime" 
              fill 
              sizes="(max-width: 768px) 80px, 96px"
              className="object-contain" 
              priority 
            />
          </motion.div>

          {/* Animated Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight mb-2">
              EvenTime
            </h1>
            <p className="text-white/80 font-medium text-xs md:text-sm tracking-widest uppercase">
              Stop Searching. Start Attending.
            </p>
          </motion.div>

          {/* Loading Indicator */}
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "200px", opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
            className="h-[2px] bg-white/20 rounded-full mt-12 overflow-hidden relative"
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-1/2 h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}