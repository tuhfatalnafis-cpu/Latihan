import React, { useState, useRef } from 'react';
import { Camera, X, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadQuestionImage, deleteQuestionImage } from '../../lib/imageUpload';
import { toast } from 'sonner';

interface ImageUploaderProps {
  imageUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  topicId: string;
  questionId: string; // can be temp UUID
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  onUpload,
  onRemove,
  topicId,
  questionId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpg|jpeg|webp)/)) {
      toast.error('Hanya fail imej (PNG, JPG, WebP) dibenarkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imej terlalu besar (Maksimum 5MB sebelum pemampatan)');
      return;
    }

    try {
      setIsUploading(true);
      const publicUrl = await uploadQuestionImage(file, topicId, questionId);
      onUpload(publicUrl);
      toast.success('Imej berjaya dimuat naik');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Gagal memuat naik imej');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) return;
    try {
      await deleteQuestionImage(imageUrl);
      onRemove();
    } catch (err) {
      console.error('Remove error:', err);
      // Still remove from UI even if storage delete fails
      onRemove();
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept="image/*"
      />

      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group aspect-video w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          >
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={triggerUpload}
                disabled={isUploading}
                className="p-2 bg-white rounded-full text-ink hover:bg-slate-50 transition-colors disabled:opacity-50"
                title="Tukar Imej"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              </button>
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="p-2 bg-white rounded-full text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                title="Buang Imej"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={triggerUpload}
            disabled={isUploading}
            className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-ink">Tambah Gambar</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">(Pilihan)</p>
                </div>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader;
