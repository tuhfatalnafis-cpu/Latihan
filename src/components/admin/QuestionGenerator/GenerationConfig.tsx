import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, ChevronRight, AlertCircle, Sparkles, Database } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { GenConfig } from '../../../lib/questionGenerator';

interface Step1Props {
  libSize: number;
  onNext: (config: { name: string } & GenConfig & { strategy: 'random' | 'ai' }) => void;
  onCancel: () => void;
}

export default function GenerationConfig({ libSize, onNext, onCancel }: Step1Props) {
  const [name, setName] = useState('');
  const [count, setCount] = useState(Math.min(20, libSize));
  const [direction, setDirection] = useState<'ar_to_ms' | 'ms_to_ar' | 'both'>('both');
  const [strategy, setStrategy] = useState<'random' | 'ai'>('random');
  const [error, setError] = useState<string | null>(null);

  const hasAIKey = !!process.env.GEMINI_API_KEY;

  const handleNext = () => {
    if (!name.trim()) return setError('Sila masukkan nama set soalan.');
    if (libSize < 4) return setError('Pustaka memerlukan sekurang-kurangnya 4 perkataan.');
    if (count > libSize * 2) return setError(`Bilangan soalan tidak boleh melebihi ${libSize * 2} (2x saiz pustaka).`);
    
    setError(null);
    onNext({ name, count, direction, strategy });
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
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Arah Soalan</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ar_to_ms', label: 'Arab → Melayu' },
              { id: 'ms_to_ar', label: 'Melayu → Arab' },
              { id: 'both', label: 'Kedua-dua' }
            ].map(dir => (
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
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategi Distraktor (Pilihan Salah)</label>
          <div className="space-y-2">
            <button
              onClick={() => setStrategy('random')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                strategy === 'random' ? "bg-indigo-50 border-indigo-600 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
              )}
            >
              <div className={cn("p-2 rounded-xl", strategy === 'random' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400")}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className={cn("font-black text-sm", strategy === 'random' ? "text-indigo-900" : "text-slate-600")}>Rawak dari Pustaka</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pantas & Stabil (Percuma)</p>
              </div>
              <div className="ml-auto">
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", strategy === 'random' ? "border-indigo-600" : "border-slate-200")}>
                  {strategy === 'random' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                </div>
              </div>
            </button>

            {hasAIKey && (
              <button
                onClick={() => setStrategy('ai')}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                  strategy === 'ai' ? "bg-amber-50 border-amber-500 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn("p-2 rounded-xl", strategy === 'ai' ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400")}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className={cn("font-black text-sm", strategy === 'ai' ? "text-amber-900" : "text-slate-600")}>Cerdik (AI)</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Semantik Serupa (Internet diperlukan)</p>
                </div>
                <div className="ml-auto">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", strategy === 'ai' ? "border-amber-500" : "border-slate-200")}>
                    {strategy === 'ai' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                  </div>
                </div>
              </button>
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
