import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart } from "lucide-react";

// --- Custom SVG Icons to replace missing Lucide Brand Icons ---
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);
// --------------------------------------------------------------

export function Footer() {
  return (
    <footer className="bg-[#0D0B1A] w-full mt-auto py-12 px-6">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8">

        <div className="w-full flex flex-col items-center text-center gap-8 lg:flex-row lg:items-start lg:justify-between lg:text-left">

                {/* Brand */}
        <div className="flex flex-col items-center gap-2 lg:items-start">
          <div className="flex items-center gap-3">
            <Image src="/logo1.webp" alt="EvenTime Logo" width={36} height={36} className="rounded-none" />
            <h3 className="text-2xl font-black text-white font-heading tracking-tight">
              EvenTime
            </h3>
          </div>
          <p className="text-white/40 text-sm font-medium">
            Your event search struggles end here.
          </p>
          {/* Action Pages Links */}
          <div className="flex items-center gap-3 mt-1">
            <Link href="/about" className="text-white/50 hover:text-white transition-colors text-[13px] font-semibold">About Us</Link>
            <span className="text-white/20 text-[13px]">•</span>
            <Link href="/terms" className="text-white/50 hover:text-white transition-colors text-[13px] font-semibold">Terms</Link>
            <span className="text-white/20 text-[13px]">•</span>
            <Link href="/privacy" className="text-white/50 hover:text-white transition-colors text-[13px] font-semibold">Privacy Policy</Link>
          </div>
        </div>


        {/* For any Queries */}
        <div className="flex flex-col items-center gap-3 lg:items-start">
          <h4 className="text-base font-bold text-white">For any Queries</h4>
          <a href="https://www.instagram.com/the_surfboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium">
            <InstagramIcon className="w-4 h-4" />
            Message us on Instagram
          </a>
          <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            Hyderabad, India
          </div>
        </div>

        {/* Join the Family */}
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <h4 className="text-base font-bold text-white">Join the Family</h4>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/the_surfboard" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all">
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a href="https://youtube.com/@the_surfboard?sub_confirmation=1" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all">
              <YoutubeIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        </div>

        {/* Divider with pill sitting on it */}
        <div className="relative w-full flex items-center justify-center">
          <div className="w-full h-px bg-white/10" />
          <div className="absolute flex items-center gap-2 text-sm font-bold text-white bg-[#0D0B1A] border border-white/10 px-5 py-2.5 rounded-full">
            Made with <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" /> by
            <Image src="/sb-logo.webp" alt="The SurfBoard" width={24} height={24} className="rounded-sm" />
            The SurfBoard
          </div>
        </div>

        {/* Copyright */}
        <p className="text-xs font-medium text-white/30 -mt-2">
          © {new Date().getFullYear()} EvenTime. All rights reserved.
        </p>

      </div>
    </footer>
  );
}