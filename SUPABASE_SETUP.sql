-- Idempotent Supabase Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create tables IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text CHECK (role IN ('admin', 'student')) DEFAULT 'student',
  full_name text,
  grade text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  grade text,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.syllabi (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid REFERENCES public.subjects ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  grade text,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  syllabus_id uuid REFERENCES public.syllabi ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.topics ON DELETE CASCADE NOT NULL,
  question_type text NOT NULL,
  prompt text NOT NULL,
  answer text NOT NULL,
  arabic text,
  transliteration text,
  distractors text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.questions ON DELETE CASCADE NOT NULL,
  is_correct boolean NOT NULL,
  response_time_ms integer,
  answered_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.questions ON DELETE CASCADE NOT NULL,
  ease float DEFAULT 2.5,
  interval_days integer DEFAULT 0,
  next_review timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  consecutive_correct integer DEFAULT 0,
  UNIQUE(student_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.vocabulary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.topics ON DELETE CASCADE NOT NULL,
  arabic text NOT NULL,
  meaning_ms text NOT NULL,
  transliteration text,
  image_keyword text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS (Safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (Checking if they exist first)
DO $$ 
BEGIN
    -- PROFILES
    DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
    CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
    CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id AND 
      (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

    DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
    CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id AND role = 'student');

    -- SUBJECTS
    DROP POLICY IF EXISTS "Subjects viewable by everyone" ON public.subjects;
    CREATE POLICY "Subjects viewable by everyone" ON public.subjects FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
    CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- SYLLABI
    DROP POLICY IF EXISTS "Syllabi viewable by everyone" ON public.syllabi;
    CREATE POLICY "Syllabi viewable by everyone" ON public.syllabi FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Admins manage syllabi" ON public.syllabi;
    CREATE POLICY "Admins manage syllabi" ON public.syllabi FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- TOPICS
    DROP POLICY IF EXISTS "Topics viewable by everyone" ON public.topics;
    CREATE POLICY "Topics viewable by everyone" ON public.topics FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Admins manage topics" ON public.topics;
    CREATE POLICY "Admins manage topics" ON public.topics FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- QUESTIONS
    DROP POLICY IF EXISTS "Questions viewable by everyone" ON public.questions;
    CREATE POLICY "Questions viewable by everyone" ON public.questions FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
    CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- ATTEMPTS
    DROP POLICY IF EXISTS "Users manage own attempts" ON public.attempts;
    CREATE POLICY "Users manage own attempts" ON public.attempts FOR ALL TO authenticated 
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
    
    DROP POLICY IF EXISTS "Admins see all attempts" ON public.attempts;
    CREATE POLICY "Admins see all attempts" ON public.attempts FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    -- PROGRESS
    DROP POLICY IF EXISTS "Users manage own progress" ON public.progress;
    CREATE POLICY "Users manage own progress" ON public.progress FOR ALL TO authenticated 
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

    -- VOCABULARY
    DROP POLICY IF EXISTS "Vocabulary viewable by everyone" ON public.vocabulary;
    CREATE POLICY "Vocabulary viewable by everyone" ON public.vocabulary FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Admins manage vocabulary" ON public.vocabulary;
    CREATE POLICY "Admins manage vocabulary" ON public.vocabulary FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
END $$;
