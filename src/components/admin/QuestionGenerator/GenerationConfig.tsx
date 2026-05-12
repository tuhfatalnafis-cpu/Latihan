import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, ChevronRight, AlertCircle, Sparkles, Database, Upload, FileText, ImageIcon, X, Loader2, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { GenConfig } from '../../../lib/questionGenerator';
import { toast } from 'sonner';

interface Step1Props {
  libSize: number;
  onNext: (config: { name: string; prompt?: string, files?: { data: string; mimeType: string }[] } & GenConfig & { strategy: 'random' | 'ai' | 'pure_ai' }) => void;
  onCancel: () => void;
}

export default function GenerationConfig({ libSize, onNext, onCancel }: Step1Props) {
  const [name, setName] = useState('');
  const [count, setCount] = useState(libSize > 0 ? Math.min(20, libSize) : 20);
  const [direction, setDirection] = useState<'ar_to_ms' | 'ms_to_ar' | 'both' | 'general'>('both');
  const [strategy, setStrategy] = useState<'random' | 'ai' | 'pure_ai'>(libSize > 0 ? 'random' : 'pure_ai');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<{ data: string; mimeType: string, name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAIKey = !!process.env.GEMINI_API_KEY;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    console.log('[QuestionGenerator] Files selected:', selectedFiles.length);
    setIsUploading(true);
    const newFiles: { data: string; mimeType: string, name: string }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
       const file = selectedFiles[i];
       console.log(`[QuestionGenerator] Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
       
       if (file.size > 10 * 1024 * 1024) {
         toast.error(`Fail ${file.name} terlalu besar (max 10MB)`);
         continue;
       }

       const reader = new FileReader();
       const promise = new Promise<void>((resolve) => {
         reader.onload = (e) => {
           if (e.target?.result) {
             console.log(`[QuestionGenerator] File read success: ${file.name}`);
             newFiles.push({
               data: e.target.result as string,
               mimeType: file.type,
               name: file.name
             });
           }
           resolve();
         };
         reader.onerror = (err) => {
           console.error(`[QuestionGenerator] File read error: ${file.name}`, err);
           toast.error(`Gagal membaca fail ${file.name}`);
           resolve();
         };
       });
       reader.readAsDataURL(file);
       await promise;
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
    if (strategy !== 'pure_ai') {
      setStrategy('pure_ai');
      console.log('[QuestionGenerator] Strategy auto-switched to pure_ai');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (!name.trim()) return setError('Sila masukkan nama set soalan.');
    
    if (strategy !== 'pure_ai') {
      if (libSize < 4) return setError('Pustaka memerlukan sekurang-kurangnya 4 perkataan.');
      if (count > libSize * 2) return setError(`Bilangan soalan tidak boleh melebihi ${libSize * 2} (2x saiz pustaka).`);
    } else {
      if (!prompt.trim() && files.length === 0) return setError('Sila masukkan topik atau muat naik fail untuk AI.');
    }
    
    setError(null);
    onNext({ name, count, direction, strategy, prompt, files: files.map(f => ({ data: f.data, mimeType: f.mimeType })) });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-slate-800">Jana Set Soalan Baru</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Langkah 1: Konfigurasi</p>
      </div>

      <div className="space-y-6">
        {/* Set Name */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Set Soalan</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Set Latihan 1, Ujian Bulanan..."
            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-100 focus:bg-white transition-all"
          />
        </div>

        {/* Count */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Bilangan Soalan</label>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{count} / {libSize * 2}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max={libSize * 2}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Arah atau Jenis Soalan</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'ar_to_ms', label: 'Arab → Melayu', hidden: strategy === 'random' && libSize < 1 },
              { id: 'ms_to_ar', label: 'Melayu → Arab', hidden: strategy === 'random' && libSize < 1 },
              { id: 'both', label: 'Kombinasi Arab-Melayu', hidden: strategy === 'random' },
              { id: 'general', label: 'Umum / Pemahaman (AI)', hidden: strategy !== 'pure_ai' }
            ].filter(d => !d.hidden).map(dir => (
              <button
                key={dir.id}
                onClick={() => setDirection(dir.id as any)}
                className={cn(
                  "py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                  direction === dir.id ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                )}
              >
                {dir.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategi Penjanaan</label>
          <div className="space-y-2">
            <button
              onClick={() => setStrategy('random')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                strategy === 'random' ? "bg-indigo-50 border-indigo-600 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200",
                libSize < 4 && "opacity-50 cursor-not-allowed"
              )}
              disabled={libSize < 4}
            >
              <div className={cn("p-2 rounded-xl", strategy === 'random' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400")}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className={cn("font-black text-sm", strategy === 'random' ? "text-indigo-900" : "text-slate-600")}>Berasaskan Pustaka</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Guna perkataan yang sedia ada</p>
              </div>
              <div className="ml-auto">
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", strategy === 'random' ? "border-indigo-600" : "border-slate-200")}>
                  {strategy === 'random' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                </div>
              </div>
            </button>

            {hasAIKey && (
              <button
                onClick={() => setStrategy('pure_ai')}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                  strategy === 'pure_ai' ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn("p-2 rounded-xl", strategy === 'pure_ai' ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className={cn("font-black text-sm", strategy === 'pure_ai' ? "text-primary" : "text-slate-600")}>Janakan Penuh (AI Tulen)</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tanpa CSV, AI bina soalan dari awal</p>
                </div>
                <div className="ml-auto">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", strategy === 'pure_ai' ? "border-primary" : "border-slate-200")}>
                    {strategy === 'pure_ai' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                </div>
              </button>
            )}

            {strategy === 'pure_ai' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 space-y-4"
              >
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 px-2">Muat Naik Fail (PDF/Imej)</label>
                  
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-[2.5rem] p-8 transition-all flex flex-col items-center justify-center text-center relative",
                      files.length > 0 ? "bg-primary/5 border-primary/30" : "bg-slate-50 border-slate-200 hover:border-primary/30"
                    )}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                      const droppedFiles = e.dataTransfer.files;
                      if (droppedFiles && droppedFiles.length > 0) {
                        const event = { target: { files: droppedFiles } } as any;
                        handleFileChange(event);
                      }
                    }}
                  >
                    {files.length === 0 ? (
                      <>
                        <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-soft flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-black text-slate-600 mb-1">Seret & Lepas atau Klik</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sokong PDF, PNG, JPG, WebP (Maks 10MB)</p>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white text-primary px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-soft group relative border border-primary/10">
                            {file.mimeType.includes('pdf') ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                              className="w-5 h-5 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="absolute inset-0 cursor-pointer opacity-0">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="application/pdf,image/*" 
                        multiple 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="flex justify-center">
                      <label className="cursor-pointer">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="application/pdf,image/*" 
                          multiple 
                          onChange={handleFileChange}
                        />
                        <div className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors py-1">
                          <Plus className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Tambah Fail Lain</span>
                        </div>
                      </label>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-bold px-2 italic text-center">
                    AI akan menggunakan kandungan fail ini untuk menjana soalan secara automatik.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 px-2">Topik atau Arahan Tambahan</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={files.length > 0 ? "Contoh: Fokus kepada pemahaman teks dalam fail ini..." : "Contoh: Pemahaman petikan, Tatabahasa, Sejarah Islam, atau kosa kata khusus..."}
                    className="w-full px-5 py-4 bg-primary/5 border-2 border-primary/20 rounded-2xl font-bold text-slate-800 outline-none focus:border-primary transition-all min-h-[100px]"
                  />
                </div>
              </motion.div>
            )}

            {hasAIKey && strategy !== 'pure_ai' && (
              <div className="pt-2">
                <label className="flex items-center gap-2 mb-2 px-2 cursor-pointer" onClick={() => setStrategy(s => s === 'ai' ? 'random' : 'ai')}>
                  <div className={cn("w-10 h-6 rounded-full transition-all relative p-1", strategy === 'ai' ? "bg-amber-500" : "bg-slate-200")}>
                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", strategy === 'ai' ? "translate-x-4" : "translate-x-0")} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkatkan dengan AI (Distraktor Pintar)</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600">
            <AlertCircle className="w-5 h-5" />
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
          >
            Batal
          </button>
          <button 
            onClick={handleNext}
            className="flex-3 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
          >
            Mula Menjana <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
