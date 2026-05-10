import React, { useState, useRef } from 'react';
import { Upload, FileText, Info, X } from 'lucide-react';
import Papa from 'papaparse';
import { VocabRow } from '../../../lib/questionGenerator';

interface Step1Props {
  onNext: (data: VocabRow[]) => void;
  onCancel: () => void;
}

export default function Step1Upload({ onNext, onCancel }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        // Filter and map to VocabRow
        const validRows: VocabRow[] = rows
          .filter(r => r.arabic && r.meaning_ms)
          .map(r => ({
            arabic: r.arabic,
            transliteration: r.transliteration || '',
            meaning_ms: r.meaning_ms,
            image_keyword: r.image_keyword || ''
          }));
        
        if (validRows.length === 0) {
          alert('Tiada data sah dijumpai. Sila pastikan kolum "arabic" dan "meaning_ms" wujud.');
          return;
        }
        onNext(validRows);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Muat Naik CSV</h2>
          <p className="text-slate-500 text-sm font-medium">Sediakan senarai perbendaharaan kata anda.</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
        className={`border-4 border-dashed rounded-[40px] p-12 flex flex-col items-center justify-center text-center transition-all ${
          isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[0.98]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
        }`}
      >
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 transition-transform">
          <Upload className="w-10 h-10" />
        </div>
        <h4 className="text-lg font-bold text-slate-800 mb-2">Seret fail CSV ke sini</h4>
        <p className="text-slate-400 text-sm mb-8 font-medium">Atau klik butang di bawah untuk pilih fail.</p>
        
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white text-slate-700 px-8 py-3 rounded-2xl font-black border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
        >
           Pilih Fail CSV
        </button>
      </div>

      <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-indigo-900 mb-1">Peringatan Format</p>
          <p className="text-indigo-600/80 leading-relaxed">Pastikan CSV anda mempunyai kolum: <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-black text-[10px]">arabic</code>, <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-black text-[10px]">transliteration</code>, <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-black text-[10px]">meaning_ms</code>, <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-black text-[10px]">image_keyword</code>.</p>
        </div>
      </div>
    </div>
  );
}
