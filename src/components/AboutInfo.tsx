import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Rocket, Heart, Code2, Sparkles } from 'lucide-react';
import { Card } from './ui/Card';
import { db } from '../lib/db';

export function AboutDeveloperCard() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const settings = await db.settings.get('about_developer');
        setContent(settings?.value || 'Kami adalah pasukan pembangun yang komited untuk merevolusi cara pembelajaran melalui teknologi AI Pintar.');
      } catch (err) {
        console.error('Error loading about developer:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card variant="white" className="overflow-hidden border-2 border-slate-50 relative group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-soft">
          <Code2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-black text-ink text-lg mb-2">Mengenai Pembangun</h4>
          <div className="text-sm text-ink-muted leading-relaxed font-bold space-y-1">
            <p>{loading ? 'Memuatkan...' : content}</p>
            {!loading && (
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Pasukan Utama:</p>
                <p className="text-ink">1. Dr Asyraf Saharudin</p>
                <p className="text-ink">2. Dr Atikah Rahman</p>
                <p className="text-ink">3. Abdullah Tariq</p>
                <p className="text-ink">4. Maryam Munirah</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function OurMissionCard() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const settings = await db.settings.get('our_mission');
        setContent(settings?.value || 'Misi kami adalah untuk menjadikan pembelajaran mudah, menyeronokkan, dan boleh diakses oleh semua pelajar dengan bantuan kecerdasan buatan.');
      } catch (err) {
        console.error('Error loading our mission:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card variant="white" className="overflow-hidden border-2 border-slate-50 relative group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent-warm/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-accent-warm/10 rounded-2xl flex items-center justify-center text-accent-warm shrink-0 shadow-soft">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-black text-ink text-lg mb-2">Misi Kami</h4>
          <p className="text-sm text-ink-muted leading-relaxed font-medium">
            {loading ? 'Memuatkan...' : content}
          </p>
        </div>
      </div>
    </Card>
  );
}
