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
    <footer className="bg-white border-t border-slate-200 py-12 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="EvenTime Logo" width={40} height={40} className="rounded-xl" />
              <h3 className="text-2xl font-black text-[#6C47FF] font-heading tracking-tight">EvenTime</h3>
            </div>
            <p className="text-[#6C47FF]/70 text-sm font-medium">
              Your event search struggles end here.
            </p>
          </div>

          {/* Queries Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-[#6C47FF]">For any Queries</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="flex items-center gap-2 text-[#6C47FF]/80 hover:text-[#6C47FF] transition-colors text-sm font-medium">
                  <div className="bg-[#6C47FF]/10 p-1.5 rounded-md">
                    <InstagramIcon className="w-4 h-4 text-[#6C47FF]" />
                  </div>
                  Message us on Instagram
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-[#6C47FF]/80 text-sm font-medium">
                  <div className="bg-pink-50 p-1.5 rounded-md">
                    <MapPin className="w-4 h-4 text-pink-500" />
                  </div>
                  Hyderabad, India
                </div>
              </li>
            </ul>
          </div>

          {/* Social Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-[#6C47FF]">Join the Family</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="w-12 h-12 rounded-full border-2 border-[#6C47FF]/10 flex items-center justify-center text-[#6C47FF] hover:bg-[#6C47FF] hover:text-white hover:border-[#6C47FF] transition-all duration-300">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 rounded-full border-2 border-[#6C47FF]/10 flex items-center justify-center text-[#6C47FF] hover:bg-[#6C47FF] hover:text-white hover:border-[#6C47FF] transition-all duration-300">
                <YoutubeIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-center space-y-6 pt-8 border-t border-[#6C47FF]/10">
          <div className="flex items-center gap-2 text-sm font-bold text-[#6C47FF] border-2 border-[#6C47FF]/10 px-5 py-2.5 rounded-full hover:bg-[#6C47FF]/5 transition-colors cursor-default">
            Made with <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" /> by 
            <span className="bg-[#6C47FF] text-white px-2 py-0.5 rounded text-xs ml-1">SB</span> 
            The SurfBoard
          </div>
          <p className="text-xs font-medium text-[#6C47FF]/50">
            © {new Date().getFullYear()} EvenTime. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}