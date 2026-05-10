import React from 'react';
import { Sparkles, Smile, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';

interface Step2Props {
  onNext: (useIcons: boolean) => void;
  onBack: () => void;
}

export default function Step2IconChoice({ onNext, onBack }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Pilihan Ikon</h2>
        <p className="text-slate-500 text-sm font-medium">Tambah visual untuk memudahkan hafalan pelajar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => onNext(true)}
          className="p-8 bg-white border-2 border-slate-100 rounded-[32px] text-left hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group shadow-sm bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent"
        >
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-2">Gunakan Ikon</h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">Cari ikon secara automatik dari perpustakaan OpenMoji berdasarkan kata kunci.</p>
        </button>

        <button 
          onClick={() => onNext(false)}
          className="p-8 bg-white border-2 border-slate-100 rounded-[32px] text-left hover:border-slate-300 transition-all group shadow-sm"
        >
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <XCircle className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-2">Tanpa Ikon</h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">Teruskan tanpa memadankan sebarang imej visual pada kad hafalan.</p>
        </button>
      </div>

      <div className="pt-6 flex justify-between">
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali
        </button>
      </div>
    </div>
  );
}
