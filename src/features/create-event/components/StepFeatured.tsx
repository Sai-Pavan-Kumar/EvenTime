"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, UploadCloud, Crop } from "lucide-react";
import Cropper from "react-easy-crop";

export function StepFeatured({ data, updateData, crop, onBack, onSubmit, isSubmitting, isEditing, isAdminFeatureEnabled }: any) {
  
  return (
    <motion.div key="stepFeatured" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} className="space-y-8">
      
      {/* FEATURE TOGGLE - ONLY VISIBLE IF ENABLED GLOBALLY */}
      {isAdminFeatureEnabled && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">Feature this Event</h4>
            <p className="text-xs text-slate-600 mt-1">Get prominent placement on the homescreen with a custom poster.</p>
          </div>
          <button type="button" onClick={() => updateData({ isFeatured: !data.isFeatured })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.isFeatured ? "bg-amber-500" : "bg-slate-300"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.isFeatured ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      )}

      {/* FEATURED POSTER UPLOAD (1:1 Ratio) */}
      {isAdminFeatureEnabled && data.isFeatured && (
        <div className="space-y-3 pt-4">
          <label className="block text-sm font-semibold text-slate-700">1:1 Square Featured Poster <span className="text-red-500">*</span></label>
          
          {crop.isCropping && crop.rawImage ? (
            <div className="w-full max-w-md mx-auto bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-4">
                {/* Changed aspect to 1 for 1:1 ratio per your requirement */}
                <Cropper image={crop.rawImage} crop={crop.crop} zoom={crop.zoom} aspect={1} onCropChange={crop.setCrop} onCropComplete={(_, pixels) => crop.setCroppedAreaPixels(pixels)} onZoomChange={crop.setZoom} />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { crop.setIsCropping(false); crop.setRawImage(null); }} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100">Cancel</button>
                <button type="button" onClick={crop.handleCropComplete} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-brand-primary flex justify-center items-center gap-2"><Crop className="w-4 h-4"/> Save</button>
              </div>
            </div>
          ) : !crop.previewUrl ? (
            <div className="relative group w-full max-w-[280px] mx-auto">
              <input type="file" accept="image/*" onChange={crop.handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white hover:border-[#6C47FF] hover:bg-brand-primary/5">
                <UploadCloud className="w-10 h-10 mb-3 text-slate-300" />
                <span className="text-sm font-bold text-slate-600">Upload Poster (1:1)</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-[280px] mx-auto aspect-square rounded-2xl overflow-hidden border border-slate-200" style={{ backgroundImage: `url(${crop.previewUrl})`, backgroundSize: "cover" }} />
          )}
        </div>
      )}

      {/* ADVANCED FIELDS (Always shown in Step 2) */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase">Organizer</label>
          <input type="text" value={data.organizer} onChange={e => updateData({ organizer: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase">Website (Optional)</label>
          <input type="url" value={data.website} onChange={e => updateData({ website: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none" />
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200 flex justify-between items-center">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold px-4 py-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button type="button" onClick={onSubmit} disabled={isSubmitting || (data.isFeatured && !crop.previewUrl)} className="bg-brand-primary hover:bg-[#5535e0] disabled:bg-slate-300 text-white px-8 py-4 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#6C47FF]/20">
        {isEditing ? "Update Event" : (data.isTrustedDomain ? "Publish Instantly" : "Submit for Approval")} <CheckCircle2 className="w-4 h-4" />        </button>
      </div>
    </motion.div>
  );
}