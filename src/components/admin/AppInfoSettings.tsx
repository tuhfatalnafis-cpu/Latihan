import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Loader2, Sparkles, Code2, Rocket, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/db';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export default function AppInfoSettings() {
  const [aboutDeveloper, setAboutDeveloper] = useState('');
  const [ourMission, setOurMission] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const about = await db.settings.get('about_developer');
        const mission = await db.settings.get('our_mission');
        
        setAboutDeveloper(about?.value || 'Kami adalah pasukan pembangun yang komited untuk merevolusi cara pembelajaran bahasa Arab melalui teknologi AI Pintar.');
        setOurMission(mission?.value || 'Misi kami adalah untuk menjadikan pembelajaran bahasa Arab mudah, menyeronokkan, dan boleh diakses oleh semua pelajar dengan bantuan kecerdasan buatan.');
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await db.settings.set('about_developer', aboutDeveloper);
      await db.settings.set('our_mission', ourMission);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Gagal menyimpan tetapan. Sila cuba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-ink-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p className="font-black text-xs uppercase tracking-widest">Sila tunggu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-ink">Maklumat Aplikasi</h3>
          <p className="text- ink-muted font-bold mt-1">Kemaskini maklumat yang dipaparkan pada profil pelajar.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary text-white font-black px-8 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Menyimpan...' : saved ? 'Berjaya!' : 'Simpan Tetapan'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4 border-2 border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <h4 className="font-black text-ink">Mengenai Pembangun</h4>
          </div>
          <textarea
            value={aboutDeveloper}
            onChange={(e) => setAboutDeveloper(e.target.value)}
            className="w-full min-h-[150px] p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-medium text-ink leading-relaxed"
            placeholder="Masukkan info pembangun di sini..."
          />
        </Card>

        <Card className="space-y-4 border-2 border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent-warm/10 rounded-xl flex items-center justify-center text-accent-warm">
              <Rocket className="w-5 h-5" />
            </div>
            <h4 className="font-black text-ink">Misi Kami</h4>
          </div>
          <textarea
            value={ourMission}
            onChange={(e) => setOurMission(e.target.value)}
            className="w-full min-h-[150px] p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-accent-warm focus:bg-white transition-all font-medium text-ink leading-relaxed"
            placeholder="Masukkan misi aplikasi di sini..."
          />
        </Card>
      </div>

      <Card variant="primary" className="flex items-center gap-4 border-none shadow-lg shadow-primary/20">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-bold text-sm leading-relaxed">
          Info ini akan membantu pelajar mengenali siapa di sebalik platform hebat ini dan arah tuju pembelajaran mereka!
        </p>
      </Card>
    </div>
  );
}
