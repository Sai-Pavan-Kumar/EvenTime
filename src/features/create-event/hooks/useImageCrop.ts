import { useState } from "react";
import { toast } from "sonner";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
  
interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function getCroppedImg(imageSrc: string, pixelCrop: PixelCrop): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
      else resolve(null);
    }, "image/jpeg");
  });
}

export function useImageCrop(initialPosterUrl?: string) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPosterUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File size must be under 10MB"); return; }
    const imageUrl = URL.createObjectURL(file);
    setRawImage(imageUrl); setIsCropping(true);
  };

  const handleCropComplete = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setIsCompressing(true); setIsCropping(false);
    try {
      const croppedFile = await getCroppedImg(rawImage, croppedAreaPixels);
      if (!croppedFile) throw new Error("Cropping failed");
      const { default: imageCompression } = await import("browser-image-compression");
      const compressedFile = await imageCompression(croppedFile, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/webp" });
      setImageFile(compressedFile); setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (err) { console.error(err); toast.error("Failed to crop image."); }
    finally { setIsCompressing(false); setRawImage(null); }
  };

  return {
    imageFile, setImageFile, previewUrl, setPreviewUrl,
    isCompressing, rawImage, setRawImage, crop, setCrop, zoom, setZoom,
    croppedAreaPixels, setCroppedAreaPixels, isCropping, setIsCropping,
    handleImageUpload, handleCropComplete
  };
}