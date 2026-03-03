import React, { useState, useRef } from 'react';
import { Camera, X, Sparkles, Loader2, Check } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { FoodEntry } from '../types';

interface FoodScannerProps {
  onFoodDetected: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onClose: () => void;
}

export const FoodScanner: React.FC<FoodScannerProps> = ({ onFoodDetected, onClose }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraOpen(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
      }
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const base64Data = base64Image.split(',')[1];
      const result = await api.scanFood(base64Data, 'image/jpeg');
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
        onClick={() => { stopCamera(); onClose(); }}
        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md aspect-[3/4] bg-slate-800 rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {!isCameraOpen ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="p-6 bg-violet-500/20 rounded-full">
                  <Camera className="w-12 h-12 text-violet-400" />
                </div>
                <button 
                  onClick={startCamera}
                  className="px-8 py-3 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-colors"
                >
                  Open Camera
                </button>
              </div>
            ) : (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button 
                  onClick={captureImage}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"
                >
                  <div className="w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full relative">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <p className="font-bold">Analyzing Nutrition...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      <div className="mt-8 text-center text-white/60 max-w-xs">
        <p className="text-sm">Point your camera at your meal to automatically detect nutrition facts.</p>
      </div>
    </div>
  );
};
