"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

export function ShareMenu({
  ogImageUrl,
  profileUrl,
  text,
  label = "Share",
  small = false,
  className = "",
}: {
  ogImageUrl: string;
  profileUrl: string;
  text: string;
  label?: string;
  small?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullOgUrl = typeof window !== "undefined" ? `${window.location.origin}${ogImageUrl}` : ogImageUrl;
  const shareText = `${text}\n${profileUrl}`;

  const links = [
    {
      name: "LinkedIn",
      color: "bg-[#0A66C2] hover:bg-[#004182]",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    },
    {
      name: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#1DA851]",
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Instagram",
      color: "bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] hover:opacity-90",
      href: "https://www.instagram.com/",
      onClick: async (e: React.MouseEvent) => {
        e.preventDefault();
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        window.open("https://www.instagram.com/", "_blank");
        setTimeout(() => setCopied(false), 2000);
      },
    },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-full transition-colors shadow-md ${
          small ? "text-[10px] px-3 py-1.5" : "text-xs px-4 py-2"
        }`}
      >
        <Share2 className={small ? "w-3 h-3" : "w-3.5 h-3.5"} /> {label}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1.5 z-50 min-w-[180px]">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={l.onClick}
              className={`${l.color} text-white text-xs font-bold px-3 py-2 rounded-xl text-center transition-colors`}
            >
              {l.name}
            </a>
          ))}
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(shareText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy text"}
          </button>
        </div>
      )}
    </div>
  );
}