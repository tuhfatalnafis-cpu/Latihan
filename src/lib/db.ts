import { supabase } from './supabase';
import { 
  Profile, 
  Subject, 
  Syllabus, 
  Topic, 
  Question, 
  Attempt, 
  Progress 
} from './supabase';

/**
 * Database access layer for Cepat Belajar.
 * No component should touch the Supabase client directly.
 */

export const db = {
  profiles: {
    async get(id: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    async update(id: string, updates: Partial<Profile>) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    }
  },

  subjects: {
    async list() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Subject[];
    },
    async create(subject: Partial<Subject>) {
      const { data, error } = await supabase
        .from('subjects')
        .insert([subject])
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  syllabi: {
    async listForSubject(subjectId: string) {
      const { data, error } = await supabase
        .from('syllabi')
        .select('*')
        .eq('subject_id', subjectId)
        .order('name');
      if (error) throw error;
      return data as Syllabus[];
    },
    async create(syllabus: Partial<Syllabus>) {
      const { data, error } = await supabase
        .from('syllabi')
        .insert([syllabus])
        .select()
        .single();
      if (error) throw error;
      return data as Syllabus;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('syllabi')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  topics: {
    async listForSyllabus(syllabusId: string) {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('syllabus_id', syllabusId)
        .order('order_index');
      if (error) throw error;
      return data as Topic[];
    },
    async create(topic: Partial<Topic>) {
      const { data, error } = await supabase
        .from('topics')
        .insert([topic])
        .select()
        .single();
      if (error) throw error;
      return data as Topic;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async updateOrder(id: string, orderIndex: number) {
      const { error } = await supabase
        .from('topics')
        .update({ order_index: orderIndex })
        .eq('id', id);
      if (error) throw error;
    }
  },

  questions: {
    async listForTopic(topicId: string) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at');
      if (error) throw error;
      return data as Question[];
    },
    async create(question: Partial<Question>) {
      const { data, error } = await supabase
        .from('questions')
        .insert([question])
        .select()
        .single();
      if (error) throw error;
      return data as Question;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  attempts: {
    async record(attempt: Partial<Attempt>) {
      const { error } = await supabase
        .from('attempts')
        .insert([attempt]);
      if (error) throw error;
    }
  },

  progress: {
    async get(studentId: string, questionId: string) {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('question_id', questionId)
        .maybeSingle();
      if (error) throw error;
      return data as Progress | null;
    },
    async upsert(progress: Partial<Progress>) {
      const { data, error } = await supabase
        .from('progress')
        .upsert([progress])
        .select()
        .single();
      if (error) throw error;
      return data as Progress;
    },
    async getDue(studentId: string, limit = 50) {
      const { data, error } = await supabase
        .from('progress')
        .select('*, questions(*)')
        .eq('student_id', studentId)
        .lte('next_review', new Date().toISOString())
        .limit(limit);
      if (error) throw error;
      return data;
    }
  }
};
