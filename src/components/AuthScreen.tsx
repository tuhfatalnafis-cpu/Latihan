import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  BrainCircuit, 
  Mail, 
  Lock, 
  User as UserIcon,
  Loader2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  Library,
  Star,
  Gamepad2,
  Plus,
  Rocket,
  Lightbulb,
  Palette,
  Music,
  Apple
} from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { STRINGS } from '../lib/strings';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'signup';

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (authError) throw authError;
        
        if (!authData.user) throw new Error('Pendaftaran tidak berjaya. Sila cuba lagi.');

        // Wait a small amount of time for the trigger to execute
        await new Promise(r => setTimeout(r, 1000));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        onLogin({
          id: authData.user.id,
          email,
          name: profile?.full_name || fullName,
          role: profile?.role as UserRole || 'student'
        });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Log masuk gagal.');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        onLogin({
          id: authData.user.id,
          email: authData.user.email || '',
          name: profile?.full_name || 'Pengguna',
          role: profile?.role as UserRole || 'student'
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message === 'Invalid login credentials' ? 'Emel atau kata laluan salah.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#a5b4fc] to-[#e0e7ff] flex flex-col items-center justify-between p-6 sm:p-12 font-display overflow-hidden relative">
        {/* Background Sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
              className="absolute text-white/40"
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 90}%`,
              }}
            >
              <Star className="w-8 h-8 fill-white/20" />
            </motion.div>
          ))}
        </div>

        {/* Top Section: Heading */}
        <div className="pt-8 text-center relative z-20">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-8xl font-black text-white leading-tight drop-shadow-lg tracking-tighter"
          >
            Cepat <br />
            Belajar
          </motion.h1>
          <div className="mt-4 space-y-1">
            <p className="text-white/80 font-bold text-xl">Masa depan bermula di sini.</p>
            <p className="text-white/60 font-black text-xs uppercase tracking-[0.3em]">education app by TeamAra</p>
          </div>
        </div>

        {/* Main Illustration: Rocket & Floating Icons */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-lg">
          {/* Rocket Container */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ 
              y: [0, -15, 0],
              opacity: 1
            }}
            transition={{ 
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.8 }
            }}
            className="relative z-10"
          >
            {/* Mascots */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -left-20 bottom-0 z-20"
            >
              <img 
                src="/assets/mascots/boy.png" 
                alt="Boy Mascot" 
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute -right-20 bottom-0 z-20"
            >
              <img 
                src="/assets/mascots/girl.png" 
                alt="Girl Mascot" 
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner border border-white/30 relative">
              <Rocket className="w-24 h-24 sm:w-32 sm:h-32 text-white drop-shadow-[0_0_20px_white]" />
              
              {/* Flame Effect */}
              <motion.div
                animate={{ scaleY: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-orange-400 to-transparent rounded-full blur-md"
              />
            </div>

            {/* Floating Icons Around Rocket */}
            <motion.div
              animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-lg rotate-12"
            >
              <Lightbulb className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0], x: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              className="absolute top-20 -left-16 w-16 h-16 bg-rose-400 rounded-3xl flex items-center justify-center shadow-lg -rotate-12"
            >
              <Palette className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-6 -right-16 w-16 h-16 bg-emerald-400 rounded-3xl flex items-center justify-center shadow-lg"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
              className="absolute top-0 -left-24 w-12 h-12 bg-sky-400 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Music className="w-6 h-6 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 0.95, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
              className="absolute bottom-20 -right-24 w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Apple className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="w-full max-w-md pb-8 space-y-10 relative z-20">
          <div className="space-y-4">
            <Button 
              onClick={() => {
                setMode('login');
                setShowAuth(true);
              }}
              size="xl" 
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-[2rem] py-8 shadow-[0_10px_30px_rgba(14,165,233,0.4)] text-2xl font-black border-none"
            >
              Log Masuk
            </Button>
            <button 
              onClick={() => {
                setMode('signup');
                setShowAuth(true);
              }}
              className="w-full text-white font-black text-xl hover:opacity-80 transition-opacity"
            >
              Daftar Akaun Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#a5b4fc] to-[#e0e7ff] flex flex-col items-center justify-center p-6 sm:p-12 font-display overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, Math.random() * 20 - 10, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 5 + i, repeat: Infinity }}
            className="absolute text-white"
            style={{
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 90}%`,
            }}
          >
            {i % 2 === 0 ? <Star className="w-12 h-12 fill-white" /> : <Rocket className="w-12 h-12" />}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto relative z-10"
      >
        <button 
          onClick={() => setShowAuth(false)}
          className="mb-8 flex items-center gap-3 text-white hover:text-white transition-colors font-black text-xs uppercase tracking-widest group"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/30 transition-all">
            <ArrowRight className="w-6 h-6 rotate-180 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span className="drop-shadow-sm">Kembali</span>
        </button>

        <Card className="w-full bg-white/95 backdrop-blur-xl border-none shadow-2xl rounded-[3rem]" padding="lg">
          <div className="mb-10 text-center relative">
            <h3 className="text-4xl font-black text-ink mb-2 tracking-tight">
              {mode === 'login' ? 'Selamat Kembali!' : 'Ayuh Daftar!'}
            </h3>
            <p className="text-ink-muted font-bold text-lg">
              {mode === 'login' ? 'Sedia untuk belajar lagi?' : 'Mula cabaran baru hari ini.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold shadow-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div>
                    <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Nama Penuh</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama penuh anda"
                        className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-100 focus:border-[#0ea5e9] outline-none transition-all bg-sky-50 shadow-inner font-bold text-ink"
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Alamat Emel</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-[#0ea5e9] transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pengguna@emel.com"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-100 focus:border-[#0ea5e9] outline-none transition-all bg-sky-50 shadow-inner font-bold text-ink"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Kata Laluan</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-[#0ea5e9] transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-100 focus:border-[#0ea5e9] outline-none transition-all bg-sky-50 shadow-inner font-bold text-ink"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-[2rem] py-8 shadow-[0_10px_30px_rgba(14,165,233,0.3)] text-xl font-black border-none"
              isLoading={loading}
            >
              {mode === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang'}
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-ink-muted font-bold">
              {mode === 'login' ? "Belum ada akaun?" : "Sudah ada akaun?"}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-[#0ea5e9] font-black hover:underline"
              >
                {mode === 'login' ? 'Daftar sini' : 'Log masuk'}
              </button>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
