import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BrainCircuit, Loader2 } from 'lucide-react';
import GenerationConfig from './GenerationConfig';
import GenerationPreview from './GenerationPreview';
import { VocabRow, GenConfig, GeneratedMCQ, generateMCQs } from '../../../lib/questionGenerator';
import { enhanceDistractors } from '../../../lib/aiQuestionEnhancer';
import { db } from '../../../lib/db';
import { toast } from 'sonner';

interface QuestionGeneratorProps {
  topicId: string;
  userId: string;
  library: VocabRow[];
  onClose: () => void;
  onComplete: () => void;
}

export default function QuestionGenerator({ topicId, userId, library, onClose, onComplete }: QuestionGeneratorProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<{ name: string; strategy: 'random' | 'ai' } & GenConfig | null>(null);
  const [questions, setQuestions] = useState<GeneratedMCQ[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState(0);

  const handleConfigComplete = async (newConfig: { name: string; strategy: 'random' | 'ai' } & GenConfig) => {
    setConfig(newConfig);
    const initialQuestions = generateMCQs(library, newConfig);
    setQuestions(initialQuestions);
    setStep(2);

    if (newConfig.strategy === 'ai') {
      setIsEnhancing(true);
      const enhanced = [...initialQuestions];
      
      for (let i = 0; i < enhanced.length; i++) {
        setEnhanceProgress((i / enhanced.length) * 100);
        const distractors = await enhanceDistractors(enhanced[i], library);
        if (distractors) {
          enhanced[i] = { ...enhanced[i], distractors: distractors as [string, string, string] };
          setQuestions([...enhanced]); // Live update preview if possible
        }
      }
      
      setEnhanceProgress(100);
      setIsEnhancing(false);
    }
  };

  const handleSave = async (finalQuestions: GeneratedMCQ[]) => {
    if (!config) return;

    try {
      const questionsToInsert = finalQuestions.map(q => ({
        topic_id: topicId,
        question_type: 'multiple_choice' as const,
        prompt: q.prompt,
        answer: q.answer,
        arabic: q.direction === 'ar_to_ms' ? q.prompt : q.answer,
        distractors: q.distractors,
        metadata: {
          set_name: config.name,
          direction: q.direction,
          generation_method: config.strategy === 'ai' ? 'ai_enhanced' : 'random',
          source_vocab_id: q.source_vocab_id,
          image_keyword: q.metadata.image_keyword,
          transliteration: q.metadata.transliteration
        },
        created_by: userId
      }));

      await db.questions.batchCreate(questionsToInsert);
      toast.success(`Berjaya menyimpan set soalan '${config.name}'!`);
      onComplete();
      onClose();
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl relative overflow-hidden"
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
                <GenerationConfig 
                  libSize={library.length} 
                  onNext={handleConfigComplete} 
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
                <GenerationPreview 
                  questions={questions}
                  isEnhancing={isEnhancing}
                  enhanceProgress={enhanceProgress}
                  onBack={() => setStep(1)}
                  onSave={handleSave}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
