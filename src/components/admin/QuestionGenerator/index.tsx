import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BrainCircuit, Loader2 } from 'lucide-react';
import GenerationConfig from './GenerationConfig';
import GenerationPreview from './GenerationPreview';
import { VocabRow, GenConfig, GeneratedQuestion, generateQuestions } from '../../../lib/questionGenerator';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { generateQuestionsWithFiles } from '../../../lib/aiQuestionService';
import { enhanceDistractors } from '../../../lib/aiQuestionEnhancer';
import { db } from '../../../lib/db';
import { toast } from 'sonner';

interface QuestionGeneratorProps {
  topicId: string;
  schema: SubjectFieldSchema;
  userId: string;
  library: VocabRow[];
  onClose: () => void;
  onComplete: () => void;
}

export default function QuestionGenerator({ topicId, schema, userId, library, onClose, onComplete }: QuestionGeneratorProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<{ name: string; strategy: 'random' | 'ai' | 'pure_ai'; prompt?: string; files?: { data: string; mimeType: string }[] } & GenConfig | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState(0);

  const handleConfigComplete = async (newConfig: { name: string; strategy: 'random' | 'ai' | 'pure_ai'; prompt?: string; files?: { data: string; mimeType: string }[] } & GenConfig) => {
    setConfig(newConfig);
    setStep(2);
    
    if (newConfig.strategy === 'pure_ai') {
      setIsEnhancing(true);
      setEnhanceProgress(10);
      try {
        const aiQuestions = await generateQuestionsWithFiles(newConfig.prompt || '', newConfig.files || [], newConfig.count);
        setQuestions(aiQuestions);
      } catch (err: any) {
        toast.error('Gagal menjana soalan AI: ' + err.message);
        setStep(1);
      } finally {
        setIsEnhancing(false);
        setEnhanceProgress(100);
      }
      return;
    }

    const initialQuestions = generateQuestions(library, newConfig);
    setQuestions(initialQuestions);

    if (newConfig.strategy === 'ai') {
      setIsEnhancing(true);
      const enhanced = [...initialQuestions];
      
      for (let i = 0; i < enhanced.length; i++) {
        setEnhanceProgress((i / enhanced.length) * 100);
        // Only enhance MCQs
        if (enhanced[i].question_type === 'multiple_choice') {
           const distractors = await enhanceDistractors(enhanced[i] as any, library);
           if (distractors) {
             enhanced[i] = { ...enhanced[i], distractors: distractors as string[] };
             setQuestions([...enhanced]);
           }
        }
      }
      
      setEnhanceProgress(100);
      setIsEnhancing(false);
    }
  };

  const handleSave = async (finalQuestions: GeneratedQuestion[]) => {
    if (!config) return;

    try {
      const questionsToInsert = finalQuestions.map(q => {
        const metadata: any = {
          set_name: config.name,
          direction: q.direction,
          generation_method: config.strategy === 'pure_ai' ? 'pure_ai' : (config.strategy === 'ai' ? 'ai_enhanced' : 'random'),
          source_vocab_id: q.source_vocab_id,
          image_keyword: q.metadata?.image_keyword,
          pairs: q.metadata?.pairs,
          term: q.metadata?.term,
          stated_meaning: q.metadata?.stated_meaning,
          actual_meaning: q.metadata?.actual_meaning,
        };

        schema?.extra_fields?.forEach(f => {
          if (q.metadata?.[f.key]) metadata[f.key] = q.metadata[f.key];
        });

        return {
          topic_id: topicId,
          question_type: q.question_type,
          prompt: q.prompt,
          answer: q.answer,
          distractors: q.distractors,
          metadata,
          created_by: userId
        };
      });

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
                  schema={schema}
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
                  schema={schema}
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
