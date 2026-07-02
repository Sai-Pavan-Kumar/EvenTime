import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-lg w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* PREMIUM ILLUSTRATION PLACEHOLDER */}
        <div className="relative w-56 h-56 md:w-72 md:h-72 mb-8 transition-transform duration-500 hover:scale-105">
          <Image 
            src="/illustrations/404_state3.webp" 
            alt="404 Not Found Illustration" 
            fill 
            className="object-contain"
            priority 
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-4 tracking-tight">
          Lost in the crowd?
        </h1>
        
        <p className="text-slate-500 font-medium text-base md:text-lg max-w-md mb-10 leading-relaxed">
          We couldn't find the page you're looking for. Let's get you back to the events that matter.
        </p>
        
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white px-10 py-4 rounded-full font-bold active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          <ArrowLeft className="w-4 h-4" /> Take me Home
        </Link>
      </div>
    </div>
  );
}