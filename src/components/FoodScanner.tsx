import React, { useState } from 'react';
import { Camera as CameraIcon, X, Sparkles, Loader2, ImagePlus } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { api } from '../lib/api';
import { isNative } from '../lib/platform';
import { hapticTap, hapticSuccess } from '../lib/haptics';
import { motion } from 'motion/react';
import { FoodEntry } from '../types';

interface FoodScannerProps {
  onFoodDetected: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onClose: () => void;
}

export const FoodScanner: React.FC<FoodScannerProps> = ({ onFoodDetected, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const takePhoto = async (source: CameraSource) => {
    try {
      await hapticTap();

      if (isNative()) {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Base64,
          source,
          quality: 80,
          width: 1024,
          allowEditing: false,
        });

        if (photo.base64String) {
          const dataUrl = `data:image/${photo.format};base64,${photo.base64String}`;
          setCapturedImage(dataUrl);
          await analyzeImage(photo.base64String, `image/${photo.format}`);
        }
      } else {
        // Web fallback: use file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (source === CameraSource.Camera) {
          input.capture = 'environment';
        }
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            setCapturedImage(dataUrl);
            const base64Data = dataUrl.split(',')[1];
            await analyzeImage(base64Data, file.type);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    } catch (err: any) {
      // User cancelled — not an error
      if (err?.message?.includes('User cancelled')) return;
      console.error('Camera error:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const result = await api.scanFood(base64Data, mimeType);
      await hapticSuccess();
      onFoodDetected(result);
    } catch (err) {
      console.error('Error analyzing image:', err);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md aspect-[3/4] bg-slate-800 rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
        {!capturedImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="p-6 bg-violet-500/20 rounded-full">
              <CameraIcon className="w-12 h-12 text-violet-400" />
            </div>
            <div className="flex flex-col gap-3 w-full px-8">
              <button 
                onClick={() => takePhoto(CameraSource.Camera)}
                className="w-full px-8 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                Scan Food
              </button>
              <button 
                onClick={() => takePhoto(CameraSource.Photos)}
                className="w-full px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <ImagePlus className="w-5 h-5" />
                Choose from Gallery
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4"
              >
                <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <p className="font-bold">Analyzing Nutrition...</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-white/60 max-w-xs">
        <p className="text-sm">Take a photo of your meal or choose from gallery to automatically detect nutrition facts.</p>
      </div>
    </div>
  );
};
