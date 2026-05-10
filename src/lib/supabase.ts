import { createClient } from '@supabase/supabase-js';

const getVal = (v: any) => (typeof v === 'string' ? v : '');

// Safer access to environment variables to avoid ReferenceError in some environments
const env = typeof process !== 'undefined' ? process.env : (import.meta as any).env;

const supabaseUrl = (
  getVal((import.meta as any).env?.VITE_SUPABASE_URL) || 
  getVal((import.meta as any).env?.SUPABASE_URL) || 
  getVal(env?.VITE_SUPABASE_URL) || 
  getVal(env?.SUPABASE_URL) || 
  ''
).trim()
  .replace(/\/$/, '')
  .replace(/\/rest\/v1$/, '')
  .replace(/\/auth\/v1$/, '')
  .replace(/\/storage\/v1$/, '')
  .replace(/\/realtime\/v1$/, '');

const supabaseAnonKey = (
  getVal((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  getVal(env?.VITE_SUPABASE_ANON_KEY) || 
  ''
).trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Export a real client. If keys are missing, it will still export but operations will fail gracefully.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export type UserRole = 'admin' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  grade?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface Syllabus {
  id: string;
  subject_id: string;
  name: string;
  grade?: string;
  created_by: string;
  created_at: string;
}

export interface Topic {
  id: string;
  syllabus_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export type QuestionType = 'flashcard' | 'multiple_choice' | 'matching' | 'fill_blank';

export interface Question {
  id: string;
  topic_id: string;
  question_type: QuestionType;
  prompt: string;
  answer: string;
  arabic?: string;
  transliteration?: string;
  distractors: string[];
  metadata: {
    image_url?: string;
    image_keyword?: string;
    direction?: 'ar_to_ms' | 'ms_to_ar';
  };
  created_by: string;
  created_at: string;
}

export interface Attempt {
  id: string;
  student_id: string;
  question_id: string;
  is_correct: boolean;
  response_time_ms: number;
  answered_at: string;
}

export interface Progress {
  id: string;
  student_id: string;
  question_id: string;
  ease: number;
  interval_days: number;
  next_review: string;
  consecutive_correct: number;
}
