

import React from "react";
import { X, Construction } from "lucide-react";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Coming Soon", 
  message = "This feature is currently under development. Stay tuned for updates!" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction className="w-8 h-8 text-orange-600" />
          </div>
          
          <h3 className="text-2xl font-black uppercase mb-4">{title}</h3>
          <p className="text-gray-600 mb-8">{message}</p>
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-orange-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
  
