import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, ChevronRight, Loader2, Database, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../../../lib/utils';
import { VocabRow } from '../../../lib/questionGenerator';

interface Step1Props {
  onNext: (data: Partial<VocabRow>[]) => void;
  onCancel: () => void;
}

export default function Step1Upload({ onNext, onCancel }: Step1Props) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Partial<VocabRow>[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Basic validation of columns
        const hasArabic = data.some(row => row.arabic);
        const hasMalay = data.some(row => row.meaning_ms || row.meaning);

        if (!hasArabic || !hasMalay) {
          setError('Fail CSV tidak mengandungi pengepala yang betul (arabic, meaning_ms).');
          setParsing(false);
          return;
        }

        const validRows = data.map((row, index) => ({
          id: `temp-${index}`,
          arabic: row.arabic || '',
          meaning_ms: row.meaning_ms || row.meaning || '',
          transliteration: row.transliteration || '',
          image_keyword: row.image_keyword || ''
        })).filter(row => row.arabic && row.meaning_ms);

        setPreview(validRows);
        setParsing(false);
      },
      error: (err) => {
        setError('Gagal membaca fail CSV: ' + err.message);
        setParsing(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-slate-800">Muat Naik CSV</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Langkah 1: Pilih Fail</p>
      </div>

      {!preview.length ? (
        <div className="relative group">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="border-4 border-dashed border-slate-100 rounded-[32px] p-12 flex flex-col items-center justify-center group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10" />
            </div>
            <p className="font-black text-slate-800">Klik atau seret fail CSV</p>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">arabic, meaning_ms, transliteration, image_keyword</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-emerald-700 font-bold text-sm">Berjaya memproses {preview.length} baris data.</p>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-3 text-[10px] font-black uppercase text-slate-400">Arab</th>
                  <th className="p-3 text-[10px] font-black uppercase text-slate-400">Melayu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td className="p-3 text-arabic text-lg">{row.arabic}</td>
                    <td className="p-3 text-xs font-bold text-slate-600">{row.meaning_ms}</td>
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr>
                    <td colSpan={2} className="p-3 text-center text-slate-400 text-[10px] font-bold uppercase">... dan {preview.length - 5} lagi ...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setPreview([])}
              className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
            >
              Tukar Fail
            </button>
            <button 
              onClick={() => onNext(preview)}
              className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              Seterusnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {parsing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[32px] z-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="font-black text-slate-800">Sedang diproses...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
