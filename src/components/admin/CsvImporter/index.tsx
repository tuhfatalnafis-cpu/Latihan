import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VocabRow } from '../../../lib/questionGenerator';
import { Question } from '../../../lib/supabase';
import Step1Upload from './Step1Upload';
import Step2IconChoice from './Step2IconChoice';
import Step3IconResolution from './Step3IconResolution';
import Step4ReviewSave from './Step4ReviewSave';

interface CsvImporterProps {
  onClose: () => void;
  onSave: (vocab: VocabRow[], questions: Partial<Question>[], withIcons: boolean) => void;
  topicId: string;
  userId: string;
}

type ImportStep = 1 | 2 | 3 | 4;

export default function CsvImporter({ onClose, onSave, topicId, userId }: CsvImporterProps) {
  const [step, setStep] = useState<ImportStep>(1);
  const [data, setData] = useState<VocabRow[]>([]);
  const [useIcons, setUseIcons] = useState(false);
  const [resolvedData, setResolvedData] = useState<VocabRow[]>([]);

  const handleStep1Next = (uploadedData: VocabRow[]) => {
    setData(uploadedData);
    setStep(2);
  };

  const handleStep2Next = (shouldUseIcons: boolean) => {
    setUseIcons(shouldUseIcons);
    if (shouldUseIcons) {
      setStep(3);
    } else {
      setResolvedData(data);
      setStep(4);
    }
  };

  const handleStep3Next = (finalData: VocabRow[]) => {
    setResolvedData(finalData);
    setStep(4);
  };

  const handleFinalSave = (finalVocab: VocabRow[], finalQuestions: Partial<Question>[]) => {
    onSave(finalVocab, finalQuestions, useIcons);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col"
      >
        {/* Progress Bar Header */}
        <div className="h-1.5 w-full bg-slate-100 shrink-0">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Step1Upload onNext={handleStep1Next} onCancel={onClose} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Step2IconChoice onNext={handleStep2Next} onBack={() => setStep(1)} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Step3IconResolution data={data} onNext={handleStep3Next} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Step4ReviewSave 
                  data={resolvedData} 
                  topicId={topicId}
                  userId={userId}
                  onSave={handleFinalSave} 
                  onBack={() => setStep(useIcons ? 3 : 2)} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
