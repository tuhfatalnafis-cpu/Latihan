import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUploader from './ImageUploader';
import { Question, QuestionType } from '../../lib/supabase';
import { SubjectFieldSchema } from '../../lib/subjectPresets';
import { toast } from 'sonner';

interface QuestionEditorProps {
  question: Partial<Question>;
  schema?: SubjectFieldSchema;
  topicId: string;
  onSave: (updatedQuestion: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  schema,
  topicId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Question>>({
    id: crypto.randomUUID(),
    question_type: 'multiple_choice',
    prompt: '',
    answer: '',
    explanation: '',
    distractors: [],
    metadata: {},
    ...question
  });

  const [rtl, setRtl] = useState(schema?.rtl || false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value }
    }));
  };

  const handleDistractorChange = (index: number, value: string) => {
    const newDistractors = [...(formData.distractors || [])];
    newDistractors[index] = value;
    setFormData(prev => ({ ...prev, distractors: newDistractors }));
  };

  const addDistractor = () => {
    setFormData(prev => ({
      ...prev,
      distractors: [...(prev.distractors || []), '']
    }));
  };

  const removeDistractor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      distractors: (prev.distractors || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.prompt || !formData.answer) {
      toast.error('Sila isi soalan dan jawapan');
      return;
    }
    onSave(formData as Question);
  };

  const isRtl = (text: string) => {
    // Simple check for subject level RTL or if specific field should be RTL
    return rtl;
  };

  const renderFormatSpecificFields = () => {
    switch (formData.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1.5 block">Pilihan Pengalih (Distractors)</label>
              <div className="space-y-2">
                {(formData.distractors || []).map((d, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={d}
                      onChange={(e) => handleDistractorChange(index, e.target.value)}
                      placeholder={`Pengalih ${index + 1}`}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      dir={rtl ? 'rtl' : 'ltr'}
                      style={rtl ? { fontFamily: 'Amiri, serif' } : {}}
                    />
                    <button
                      onClick={() => removeDistractor(index)}
                      className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(formData.distractors || []).length < 5 && (
                  <button
                    onClick={addDistractor}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-ink-muted uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Pilihan
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'matching':
        const pairs = formData.metadata?.pairs || [];
        return (
          <div className="space-y-4">
             <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest block">Padanan (Terms & Meanings)</label>
             <div className="space-y-3">
               {pairs.map((pair: any, index: number) => (
                 <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                   <input
                     value={pair.left}
                     onChange={(e) => {
                       const newPairs = [...pairs];
                       newPairs[index] = { ...newPairs[index], left: e.target.value };
                       handleMetadataChange('pairs', newPairs);
                     }}
                     placeholder="Kiri"
                     className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-primary transition-all"
                     dir={rtl ? 'rtl' : 'ltr'}
                     style={rtl ? { fontFamily: 'Amiri, serif' } : {}}
                   />
                   <input
                     value={pair.right}
                     onChange={(e) => {
                       const newPairs = [...pairs];
                       newPairs[index] = { ...newPairs[index], right: e.target.value };
                       handleMetadataChange('pairs', newPairs);
                     }}
                     placeholder="Kanan"
                     className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-primary transition-all"
                   />
                   <button 
                    onClick={() => {
                      const newPairs = pairs.filter((_: any, i: number) => i !== index);
                      handleMetadataChange('pairs', newPairs);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
               {pairs.length < 8 && (
                 <button
                  onClick={() => handleMetadataChange('pairs', [...pairs, { left: '', right: '' }])}
                  className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-black text-ink-muted uppercase tracking-widest hover:border-primary transition-all"
                 >
                   + Tambah Baris
                 </button>
               )}
             </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest block">Jawapan Betul</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData(prev => ({ ...prev, answer: 'true' }))}
                className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  formData.answer === 'true' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]' 
                    : 'bg-slate-50 text-ink-muted border border-slate-200'
                }`}
              >
                Betul
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, answer: 'false' }))}
                className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  formData.answer === 'false' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]' 
                    : 'bg-slate-50 text-ink-muted border border-slate-200'
                }`}
              >
                Salah
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
      <div className="p-6 space-y-6">
        {/* Image Uploader Section */}
        <div>
          <ImageUploader
            imageUrl={formData.metadata?.image_url}
            onUpload={(url) => handleMetadataChange('image_url', url)}
            onRemove={() => handleMetadataChange('image_url', null)}
            topicId={topicId}
            questionId={formData.id!}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1.5 block">Format Soalan</label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-ink-muted select-none">
              {formData.question_type === 'multiple_choice' ? 'Pilihan Ganda' :
               formData.question_type === 'flashcard' ? 'Kad Imbasan' :
               formData.question_type === 'fill_blank' ? 'Isi Tempat Kosong' :
               formData.question_type === 'true_false' ? 'Betul/Salah' :
               formData.question_type === 'matching' ? 'Padanan' : formData.question_type}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1.5 block">Soalan (Prompt)</label>
            <textarea
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              rows={3}
              placeholder="Masukkan teks soalan..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              dir={rtl ? 'rtl' : 'ltr'}
              style={rtl ? { fontFamily: 'Amiri, serif' } : {}}
            />
          </div>

          {formData.question_type !== 'true_false' && (
            <div>
              <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1.5 block">Jawapan Betul</label>
              <input
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                placeholder="Masukkan jawapan yang tepat..."
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          )}

          {renderFormatSpecificFields()}

          {/* Extra fields from schema */}
          {schema?.extra_fields?.map((field) => (
             <div key={field.key}>
                <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1.5 block">{field.label}</label>
                <input
                  value={formData.metadata?.[field.key] || ''}
                  onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                  placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
             </div>
          ))}

          <div>
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1.5 block">Penjelasan (Pilihan)</label>
            <textarea
              name="explanation"
              value={formData.explanation || ''}
              onChange={handleInputChange}
              rows={2}
              placeholder="Berikan sedikit ulasan atau tip untuk soalan ini..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-ink-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none italic"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 flex items-center justify-between gap-3 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-2xl text-xs font-black text-ink-muted uppercase tracking-widest hover:bg-white hover:shadow-sm transition-all"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          className="px-8 py-2.5 bg-primary rounded-2xl text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;
