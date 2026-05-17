import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, ChevronRight, Loader2, Database, BrainCircuit, Search, Image as ImageIcon } from 'lucide-react';
import Step1Upload from './Step1Upload';
import Step2IconLookup from './Step2IconLookup';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { db } from '../../../lib/db';
import { toast } from 'sonner';

interface VocabImporterProps {
  topicId: string;
  schema: SubjectFieldSchema;
  onClose: () => void;
  onComplete: () => void;
}

export default function VocabImporter({ topicId, schema, onClose, onComplete }: VocabImporterProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const handleStep1Complete = (csvData: any[]) => {
    setData(csvData);
    setStep(2);
  };

  const handleSave = async (finalData: any[]) => {
    setSaving(true);
    try {
      // Fetch existing vocab for this topic to check for duplicates
      const existingVocab = await db.vocabulary.listForTopic(topicId);
      const existingEntries = new Set(existingVocab.map((v: any) => `${v.term}|${v.meaning}`));

      const vocabToInsert = finalData
        .filter(v => {
          const key = `${v.term || ''}|${v.meaning || ''}`;
          return !existingEntries.has(key);
        })
        .map(v => ({
          topic_id: topicId,
          term: v.term || '',
          meaning: v.meaning || '',
          extra_fields: v.extra_fields || {},
          image_keyword: v.image_keyword || '',
          metadata: { imported_at: new Date().toISOString() }
        }));

      if (vocabToInsert.length > 0) {
        await db.vocabulary.batchCreate(vocabToInsert);
      }
      
      const skippedCount = finalData.length - vocabToInsert.length;
      if (skippedCount > 0 && vocabToInsert.length > 0) {
        toast.success(`Berjaya mengimport ${vocabToInsert.length} perkataan! (${skippedCount} perkataan sedia ada dilangkau)`);
      } else if (vocabToInsert.length > 0) {
        toast.success(`Berjaya mengimport ${vocabToInsert.length} perkataan!`);
      } else {
        toast.info('Semua perkataan sudah wujud dalam topik ini.');
      }
      
      onComplete();
      onClose();
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
           <AnimatePresence mode="wait">
             {step === 1 ? (
               <motion.div
                 key="step1"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
               >
                 <Step1Upload 
                   schema={schema}
                   onNext={handleStep1Complete} 
                   onCancel={onClose} 
                 />
               </motion.div>
             ) : (
               <motion.div
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
               >
                 <Step2IconLookup 
                   data={data} 
                   schema={schema}
                   onNext={handleSave} 
                   onBack={() => setStep(1)} 
                 />
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {saving && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="font-black text-slate-800">Menyimpan ke pangkalan data...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
