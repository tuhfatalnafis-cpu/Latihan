import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import { getIconUrl } from '../../../lib/iconLibrary';
import { VocabRow } from '../../../lib/questionGenerator';

interface Step3Props {
  data: VocabRow[];
  onNext: (resolvedData: VocabRow[]) => void;
}

export default function Step3IconResolution({ data, onNext }: Step3Props) {
  const [resolved, setResolved] = useState<VocabRow[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const resolve = async () => {
      const results: VocabRow[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const iconUrl = item.image_keyword ? getIconUrl(item.image_keyword) : null;
        results.push({
          ...item,
          image_keyword: iconUrl || undefined // Store URL in image_keyword for simple passing
        });
        setProgress(Math.round(((i + 1) / data.length) * 100));
        // Slow down slightly for visual effect
        if (data.length < 50) await new Promise(r => setTimeout(r, 20));
      }
      setResolved(results);
    };

    resolve();
  }, [data]);

  return (
    <div className="space-y-8 py-4">
      <div className="text-center max-w-sm mx-auto">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div 
             className="absolute inset-0 border-4 border-indigo-600 rounded-full transition-all duration-300"
             style={{ 
               clipPath: `polygon(50% 50%, -50% -50%, ${progress > 25 ? '150% -50%' : '50% -50%'}, ${progress > 50 ? '150% 150%' : '50% -50%'}, ${progress > 75 ? '-50% 150%' : '50% -50%'}, -50% -50%)`,
               transform: 'rotate(0deg)'
             }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-slate-800">
            {progress}%
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Mencari Ikon...</h2>
        <p className="text-slate-500 text-sm font-medium">Memadankan kata kunci dengan perpustakaan ikon OpenMoji.</p>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-48 overflow-y-auto space-y-3">
        {data.slice(0, progress / 10).map((item, i) => (
           <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-600 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center gap-2">
               <span className="text-arabic text-lg leading-none">{item.arabic}</span>
               <ChevronRight className="w-3 h-3 text-slate-300" />
               <span>{item.meaning_ms}</span>
             </div>
             {item.image_keyword && getIconUrl(item.image_keyword) ? (
               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
             ) : (
               <Search className="w-4 h-4 text-slate-300" />
             )}
           </div>
        ))}
      </div>

      {progress === 100 && (
        <button 
          onClick={() => onNext(resolved)}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Seterusnya
        </button>
      )}
    </div>
  );
}
