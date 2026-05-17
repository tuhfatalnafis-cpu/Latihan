import React from 'react';
import { Plus, Trash2, LayoutGrid, Type, AlignLeft } from 'lucide-react';
import { SubjectFieldSchema, SUBJECT_PRESETS } from '../../lib/subjectPresets';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface SubjectSchemaEditorProps {
  schema: SubjectFieldSchema;
  onChange: (schema: SubjectFieldSchema) => void;
}

export default function SubjectSchemaEditor({ schema, onChange }: SubjectSchemaEditorProps) {
  const addExtraField = () => {
    const currentFields = schema?.extra_fields || [];
    onChange({
      ...schema,
      extra_fields: [...currentFields, { key: `field_${Date.now()}`, label: 'Medan Baru' }]
    });
  };

  const removeExtraField = (index: number) => {
    const newFields = [...(schema?.extra_fields || [])];
    newFields.splice(index, 1);
    onChange({ ...schema, extra_fields: newFields });
  };

  const updateExtraField = (index: number, updates: { key?: string, label?: string }) => {
    const newFields = [...(schema?.extra_fields || [])];
    newFields[index] = { ...newFields[index], ...updates };
    onChange({ ...schema, extra_fields: newFields });
  };

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100">
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(SUBJECT_PRESETS).map(([id, preset]) => (
          <button
            key={id}
            onClick={() => onChange(preset)}
            className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
          >
            Preset: {id.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Label Istilah (Term)</label>
          <input 
            type="text" 
            value={schema.term_label}
            onChange={(e) => onChange({ ...schema, term_label: e.target.value })}
            placeholder="e.g. Perkataan Arab"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary outline-none transition-all font-bold text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Label Maksud (Meaning)</label>
          <input 
            type="text" 
            value={schema.meaning_label}
            onChange={(e) => onChange({ ...schema, meaning_label: e.target.value })}
            placeholder="e.g. Maksud (Melayu)"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary outline-none transition-all font-bold text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 py-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={schema.rtl}
            onChange={(e) => onChange({ ...schema, rtl: e.target.checked })}
            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary focus:ring-primary"
          />
          <span className="text-sm font-bold text-ink group-hover:text-primary transition-colors">Teks Kanan-ke-Kiri (RTL)</span>
        </label>

        <div className="flex items-center gap-3">
          <Type className="w-4 h-4 text-ink-muted" />
          <select
            value={schema.term_font}
            onChange={(e) => onChange({ ...schema, term_font: e.target.value as any })}
            className="bg-transparent border-none text-sm font-bold text-ink focus:ring-0 cursor-pointer"
          >
            <option value="default">Font Standar (Sans)</option>
            <option value="arabic">Font Arab (Amiri)</option>
            <option value="jawi">Font Jawi</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest ml-1">Medan Tambahan (Extra Fields)</label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={addExtraField}
            className="h-8 text-[10px] font-black uppercase tracking-widest"
          >
            <Plus className="w-3 h-3 mr-1" /> Tambah
          </Button>
        </div>
        
        {(!schema?.extra_fields || schema.extra_fields.length === 0) ? (
          <p className="text-xs font-medium text-slate-400 italic px-1">Tiada medan tambahan.</p>
        ) : (
          <div className="space-y-2">
            {schema.extra_fields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                <input 
                  value={field.label}
                  onChange={(e) => updateExtraField(idx, { label: e.target.value })}
                  placeholder="Label (Paparan)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-primary outline-none"
                />
                <input 
                  value={field.key}
                  onChange={(e) => updateExtraField(idx, { key: e.target.value })}
                  placeholder="Kunci (DB)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:border-primary outline-none"
                />
                <button 
                  onClick={() => removeExtraField(idx)}
                  className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
