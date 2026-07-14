"use client";

import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { X, Crop, UploadCloud, IndianRupee, Tag, ChevronUp, ChevronDown, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MiniCalendar } from "./SharedUI";
import { getCategoryConfig } from "@/lib/category-config";

interface StepMediaProps {
  isFree: boolean; setIsFree: (v: boolean) => void;
  price: string; setPrice: (v: string) => void;
  isFeatured: boolean; setIsFeatured: (v: boolean) => void;
  previewUrl: string | null; setPreviewUrl: (v: string | null) => void;
  setImageFile: (v: File | null) => void;
  isCompressing: boolean;
  rawImage: string | null; setRawImage: (v: string | null) => void;
  crop: { x: number; y: number }; setCrop: (v: { x: number; y: number }) => void;
  zoom: number; setZoom: (v: number) => void;
  setCroppedAreaPixels: (v: { x: number; y: number; width: number; height: number }) => void;
  isCropping: boolean; setIsCropping: (v: boolean) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropComplete: () => void;
  showAdvanced: boolean; setShowAdvanced: (v: boolean) => void;
  organizer: string; setOrganizer: (v: string) => void;
  prizes: string; setPrizes: (v: string) => void;
  teamSize: string; setTeamSize: (v: string) => void; teamOptions: string[];
  registrationDeadline?: Date; setRegistrationDeadline: (v?: Date) => void;
  website: string; setWebsite: (v: string) => void;
  isSubmitting: boolean; onSubmit: () => void;
  onBack: () => void; isValid: boolean; category: string;
}

export function StepMedia(props: StepMediaProps) {
  const UploaderUI = (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        {props.isFeatured ? "Featured Poster (4:5) " : "Category Poster (1:1) "}
        {props.isFeatured && <span className="text-red-500">*</span>}
      </label>
      {props.isFeatured ? (
        props.isCropping && props.rawImage ? (
          <div className="w-full max-w-md mx-auto bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 mb-4">
              <Cropper image={props.rawImage} crop={props.crop} zoom={props.zoom} aspect={4 / 5} onCropChange={props.setCrop} onCropComplete={(_, pixels) => props.setCroppedAreaPixels(pixels)} onZoomChange={props.setZoom} />
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => { props.setIsCropping(false); props.setRawImage(null); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="button" onClick={props.handleCropComplete} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-brand-primary hover:bg-[#5835e5] transition-colors flex justify-center items-center gap-2"><Crop className="w-4 h-4" /> Crop & Save</button>
            </div>
          </div>
        ) : !props.previewUrl ? (
          <div className="relative group w-full max-w-[280px] mx-auto">
            <input type="file" accept="image/*" onChange={props.handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={props.isCompressing} />
            <div className={`w-full aspect-[4/5] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${props.isCompressing ? "border-slate-300 bg-slate-100" : "border-slate-300 bg-white group-hover:border-[#6C47FF] group-hover:bg-brand-primary/5"}`}>
              {props.isCompressing ? <div className="w-8 h-8 border-4 border-[#6C47FF]/30 border-t-[#6C47FF] rounded-full animate-spin mb-3" /> : <div className="flex flex-col items-center text-slate-400 p-6 text-center"><UploadCloud className="w-10 h-10 mb-3 text-slate-300" /><span className="text-sm font-bold text-slate-600">Upload Poster</span><span className="text-xs mt-1">4:5 ratio</span></div>}
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-[280px] mx-auto aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ backgroundImage: `url(${props.previewUrl})`, backgroundSize: "cover" }}>
            <button type="button" onClick={() => { props.setPreviewUrl(null); props.setImageFile(null); }} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors z-50"><X className="w-4 h-4" /></button>
          </div>
        )
      ) : (
        <div className="relative w-full max-w-[280px] mx-auto aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <img src={getCategoryConfig(props.category || "Default").backgroundImage} alt={`${props.category} placeholder`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold px-3 py-1 bg-black/50 rounded-full backdrop-blur-md">Auto-generated</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div key="step3" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} className="space-y-8">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Is this a paid event? <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => { props.setIsFree(true); props.setPrice(""); }} className={`py-4 px-4 rounded-xl border-2 flex items-center gap-3 transition-all ${props.isFree ? "border-[#6C47FF] bg-white shadow-sm" : "border-transparent bg-slate-100"}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${props.isFree ? "bg-brand-primary" : "border-2 border-slate-300"}`}>{props.isFree && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>
            <div className="text-left"><div className={`text-sm font-bold ${props.isFree ? "text-brand-primary" : "text-slate-600"}`}>Free Event</div></div>
          </button>
          <button type="button" onClick={() => props.setIsFree(false)} className={`py-4 px-4 rounded-xl border-2 flex items-center gap-3 transition-all ${!props.isFree ? "border-[#1D1D1F] bg-white shadow-sm" : "border-transparent bg-slate-100"}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${!props.isFree ? "bg-[#1D1D1F]" : "border-2 border-slate-300"}`}>{!props.isFree && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>
            <div className="text-left"><div className={`text-sm font-bold ${!props.isFree ? "text-text-primary" : "text-slate-600"}`}>Paid Event</div></div>
          </button>
        </div>
        {!props.isFree && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <input type="number" value={props.price} onChange={e => props.setPrice(e.target.value)} placeholder="Ticket Price (e.g., 499)" className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 focus:ring-4 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] outline-none font-medium" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
        <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">Feature this Event</h4>
            <p className="text-xs text-slate-600 mt-1">Get prominent placement on the homescreen with a custom poster.</p>
          </div>
          <button type="button" onClick={() => props.setIsFeatured(!props.isFeatured)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${props.isFeatured ? "bg-amber-500" : "bg-slate-300"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${props.isFeatured ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {props.isFeatured && <div className="pt-6 border-t border-slate-200">{UploaderUI}</div>}
      <div className="pt-6 border-t border-slate-200">
        <button type="button" onClick={() => props.setShowAdvanced(!props.showAdvanced)} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Tag className="w-4 h-4" /></div>
            <div className="text-left"><p className="text-sm font-bold text-slate-900">Advanced Options</p><p className="text-xs text-slate-500 font-medium">Prizes, Team Size, Deadline & more (Optional)</p></div>
          </div>
          {props.showAdvanced ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        <AnimatePresence>
          {props.showAdvanced && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 space-y-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-inner">
              {!props.isFeatured && <div className="mb-6 pb-6 border-b border-slate-100">{UploaderUI}</div>}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">Organizer Name</label>
                <input type="text" value={props.organizer} onChange={e => props.setOrganizer(e.target.value)} placeholder="Your Name or Community" className="w-full bg-surface-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#6C47FF]/20 text-sm font-medium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Prizes / Perks</label>
                  <input type="text" value={props.prizes} onChange={e => props.setPrizes(e.target.value)} placeholder="e.g. ₹50k Prize Pool, Certificates" className="w-full bg-surface-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#6C47FF]/20 text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Team Size</label>
                  <select value={props.teamSize} onChange={e => props.setTeamSize(e.target.value)} className="w-full bg-surface-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#6C47FF]/20 text-sm font-medium appearance-none">
                    <option value="">Select size</option>
                    {props.teamOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Registration Deadline</label>
                  <div className="bg-surface-base rounded-xl p-2"><MiniCalendar selectedDate={props.registrationDeadline} onSelect={props.setRegistrationDeadline} /></div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Official Website</label>
                  <input type="url" value={props.website} onChange={e => props.setWebsite(e.target.value)} placeholder="https://your-event.com" className="w-full bg-surface-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#6C47FF]/20 text-sm font-medium" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-8 border-t border-slate-200 flex justify-between items-center mt-8">
        <button type="button" onClick={props.onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button type="button" onClick={e => { e.preventDefault(); props.onSubmit(); }} disabled={!props.isValid || props.isSubmitting} className="bg-brand-primary hover:bg-[#5535e0] disabled:bg-slate-300 text-white px-8 py-4 rounded-full text-sm font-bold active:scale-95 transition-all shadow-lg shadow-[#6C47FF]/20 flex items-center gap-2">
          {props.isSubmitting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Publishing...</> : <>Publish Event <CheckCircle2 className="w-4 h-4" /></>}
        </button>
      </div>
    </motion.div>
  );
}