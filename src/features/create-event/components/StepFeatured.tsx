"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, UploadCloud, Crop, Trophy, Users, Clock } from "lucide-react";
import Cropper from "react-easy-crop";

function toLocalDateString(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

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
          <button
            type="button"
            onClick={() => updateData({ isFeatured: !data.isFeatured })}
            className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors " + (data.isFeatured ? "bg-amber-500" : "bg-slate-300")}
          >
            <span
              className={"inline-block h-4 w-4 transform rounded-full bg-white transition-transform " + (data.isFeatured ? "translate-x-6" : "translate-x-1")}
            />
          </button>
        </div>
      )}

      {/* EVENT POSTER UPLOAD (1:1 Ratio) */}
      <div className="space-y-3 pt-2">
        <label className="block text-sm font-semibold text-slate-700">
          Event Poster (1:1 Square) <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        
        {crop.isCropping && crop.rawImage ? (
          <div className="w-full max-w-md mx-auto bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-4">
              <Cropper
                image={crop.rawImage}
                crop={crop.crop}
                zoom={crop.zoom}
                aspect={1}
                onCropChange={crop.setCrop}
                onCropComplete={(_, pixels) => crop.setCroppedAreaPixels(pixels)}
                onZoomChange={crop.setZoom}
              />
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { crop.setIsCropping(false); crop.setRawImage(null); }}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={crop.handleCropComplete}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-brand-primary flex justify-center items-center gap-2 hover:bg-brand-hover transition-colors"
              >
                <Crop className="w-4 h-4"/> Save
              </button>
            </div>
          </div>
        ) : !crop.previewUrl ? (
          <div className="relative group w-full max-w-[280px] mx-auto">
            <input
              type="file"
              accept="image/*"
              onChange={crop.handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white hover:border-[#6C47FF] hover:bg-brand-primary/5 transition-colors">
              <UploadCloud className="w-10 h-10 mb-3 text-slate-300 group-hover:text-brand-primary transition-colors" />
              <span className="text-sm font-bold text-slate-600">Upload Poster (1:1)</span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full max-w-[280px] mx-auto aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
            style={{ backgroundImage: "url(" + crop.previewUrl + ")", backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <button
              type="button"
              onClick={() => {
                crop.setPreviewUrl(null);
                crop.setImageFile(null);
              }}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs font-bold transition-colors"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* ADVANCED FIELDS SUITE MATCHING APP */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Organizer Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Organizer Name</label>
            <span className={`text-xs font-mono ${(data.organizer || "").length >= 80 ? "text-red-500 font-bold" : "text-slate-400"}`}>
              {(data.organizer || "").length}/80
            </span>
          </div>
          <input
            type="text"
            value={data.organizer || ""}
            maxLength={80}
            onChange={(e) => updateData({ organizer: e.target.value })}
            placeholder="e.g. ACM Chapter, GDG, Student Club"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary"
          />
        </div>

        {/* Website Link */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Website / Link (Optional)</label>
          <input
            type="url"
            value={data.website || ""}
            maxLength={200}
            onChange={(e) => updateData({ website: e.target.value })}
            placeholder="https://myfest.com"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary"
          />
        </div>

        {/* Prizes / Cash Pool */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Prizes / Cash Pool (Optional)
            </label>
            <span className={`text-xs font-mono ${(data.prizes || "").length >= 120 ? "text-red-500 font-bold" : "text-slate-400"}`}>
              {(data.prizes || "").length}/120
            </span>
          </div>
          <input
            type="text"
            value={data.prizes || ""}
            maxLength={120}
            onChange={(e) => updateData({ prizes: e.target.value })}
            placeholder="e.g. ₹50,000 Cash Pool, Goodies, Swag"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary"
          />
        </div>

        {/* Registration Deadline */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Registration Deadline (Optional)
          </label>
          <input
            type="date"
            value={data.registrationDeadline ? toLocalDateString(data.registrationDeadline) : ""}
            onChange={(e) => updateData({ registrationDeadline: e.target.value ? new Date(e.target.value) : undefined })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary"
          />
        </div>

        {/* Team Size Selection Chips */}
        <div className="space-y-2 md:col-span-2 pt-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Team Size
          </label>
          <div className="flex flex-wrap gap-2">
            {["Solo", "Teams of 2-4", "Teams of 4+", "Both Solo & Team"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateData({ teamSize: opt })}
                className={"px-3.5 py-2 rounded-xl text-xs font-bold border transition-all " +
                  ((data.teamSize || "Solo") === opt
                    ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-sm shadow-[#6C47FF]/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300")}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-8 border-t border-slate-200 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-4 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || (data.isFeatured && !crop.previewUrl)}
          className="bg-brand-primary hover:bg-[#5535e0] disabled:bg-slate-300 text-white px-8 py-4 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#6C47FF]/20 transition-all active:scale-95"
        >
          {isEditing ? "Update Event" : (data.isTrustedDomain ? "Publish Instantly" : "Submit for Approval")}
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
