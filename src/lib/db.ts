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
    },
    async getDashboardStats(id: string) {
      // 1. Get total questions attempted (unique question_id)
      const { data: attemptsData, error: qError } = await supabase
        .from('attempts')
        .select('question_id')
        .eq('student_id', id);

      if (qError) throw qError;
      
      const uniqueQuestionIds = new Set(attemptsData?.map(a => a.question_id) || []);
      const totalQuestions = uniqueQuestionIds.size;

      // 2. Calculate total time
      const { data: timeData, error: tError } = await supabase
        .from('attempts')
        .select('response_time_ms')
        .eq('student_id', id);
      
      const totalTimeMs = timeData?.reduce((acc, curr) => acc + (curr.response_time_ms || 0), 0) || 0;

      // 3. Total mastered
      const { count: totalMastered, error: mError } = await supabase
        .from('progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id)
        .gte('consecutive_correct', 3);
      
      if (mError) throw mError;

      // 4. Calculate streak
      const { data: days, error: dError } = await supabase
        .rpc('get_study_days', { user_id_param: id });
      
      // If RPC is not available, we fall back to a manual query
      let streak = 0;
      if (dError) {
        const { data: attempts } = await supabase
          .from('attempts')
          .select('answered_at')
          .eq('student_id', id)
          .order('answered_at', { ascending: false });

        if (attempts && attempts.length > 0) {
          const uniqueDays = new Set(attempts.map(a => a.answered_at.split('T')[0]));
          const sortedDays = Array.from(uniqueDays).sort().reverse();
          
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          if (sortedDays[0] === today || sortedDays[0] === yesterday) {
            streak = 1;
            let current = sortedDays[0];
            for (let i = 1; i < sortedDays.length; i++) {
              const prev = new Date(new Date(current).getTime() - 86400000).toISOString().split('T')[0];
              if (sortedDays[i] === prev) {
                streak++;
                current = prev;
              } else {
                break;
              }
            }
          }
        }
      } else {
        streak = days?.[0]?.streak || 0;
      }

      return {
        streak,
        totalQuestions: totalQuestions || 0,
        totalTimeMs,
        totalMastered: totalMastered || 0
      };
    }
  },

  admin: {
    async getGlobalStats() {
      // 1. Total Students
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // 2. Active Vocabulary (Total Questions)
      const { count: totalVocabulary } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // 3. Lessons/Sessions Today (Total unique users who studied today)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayAttempts } = await supabase
        .from('attempts')
        .select('student_id')
        .gte('answered_at', todayStart.toISOString());
      
      const uniqueStudentsToday = new Set(todayAttempts?.map(a => a.student_id)).size;
      
      // 4. Success Rate
      const { data: totalAttempts } = await supabase
        .from('attempts')
        .select('is_correct');
      
      const successRate = totalAttempts && totalAttempts.length > 0
        ? Math.round((totalAttempts.filter(a => a.is_correct).length / totalAttempts.length) * 100)
        : 0;

      // 5. Recent Activity (Recent signups)
      const { data: recentSignups } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(5);

      // 6. Chart Data (Attempts per day for last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: dailyActivity } = await supabase
        .from('attempts')
        .select('answered_at')
        .gte('answered_at', sevenDaysAgo.toISOString());
      
      const chartData: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        chartData[dayStr] = 0;
      }
      
      dailyActivity?.forEach(a => {
        const dayStr = a.answered_at.split('T')[0];
        if (chartData[dayStr] !== undefined) {
          chartData[dayStr]++;
        }
      });

      return {
        totalStudents: totalStudents || 0,
        totalVocabulary: totalVocabulary || 0,
        sessionsToday: uniqueStudentsToday || 0,
        successRate,
        recentSignups: recentSignups || [],
        chartData: Object.entries(chartData).map(([day, count]) => ({ day, count })).reverse()
      };
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
    async update(id: string, updates: Partial<Subject>) {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
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
    },
    async update(id: string, updates: Partial<Syllabus>) {
      const { data, error } = await supabase
        .from('syllabi')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Syllabus;
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
    async update(id: string, updates: Partial<Topic>) {
      const { data, error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', id)
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
    },
    async getStats(id: string, studentId: string) {
      // Get total questions for this topic
      const { data: topicQuestions, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('topic_id', id);
      
      if (qError) throw qError;
      const total = topicQuestions?.length || 0;
      const topicQuestionIds = topicQuestions?.map(q => q.id) || [];

      // Get mastered questions (consecutive_correct >= 3 and in this topic)
      let mastered = 0;
      if (topicQuestionIds.length > 0) {
        const { count, error: progressError } = await supabase
          .from('progress')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .in('question_id', topicQuestionIds)
          .gte('consecutive_correct', 3);
        
        if (progressError) throw progressError;
        mastered = count || 0;
      }

      // Get last session accuracy
      let recentAttempts: any[] = [];
      if (topicQuestionIds.length > 0) {
        const { data, error: attemptsError } = await supabase
          .from('attempts')
          .select('is_correct')
          .eq('student_id', studentId)
          .in('question_id', topicQuestionIds)
          .order('answered_at', { ascending: false })
          .limit(20);
        
        if (attemptsError) throw attemptsError;
        recentAttempts = data || [];
      }

      // Calculate accuracy of previous session
      // For trend, we can split the history if we had session IDs, 
      // but we can just compare last 20 with previous 20 or similar.
      const previousAccuracy = recentAttempts && recentAttempts.length > 0
        ? (recentAttempts.filter((a: any) => a.is_correct).length / recentAttempts.length) * 100
        : 0;

      return {
        total: total || 0,
        mastered: mastered,
        previousAccuracy
      };
    }
  },

  vocabulary: {
    async listForTopic(topicId: string) {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    async create(vocab: any) {
      const { data, error } = await supabase
        .from('vocabulary')
        .insert([vocab])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async batchCreate(vocabs: any[]) {
      const { data, error } = await supabase
        .from('vocabulary')
        .insert(vocabs)
        .select();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('vocabulary')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
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
    async batchCreate(questions: Partial<Question>[]) {
      const { data, error } = await supabase
        .from('questions')
        .insert(questions)
        .select();
      if (error) throw error;
      return data as Question[];
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
    },
    async deleteForQuestion(questionId: string) {
      const { error } = await supabase
        .from('attempts')
        .delete()
        .eq('question_id', questionId);
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
    },
    async listForUser(studentId: string) {
      const { data, error } = await supabase
        .from('progress')
        .select('*, questions(topic_id)')
        .eq('student_id', studentId);
      if (error) throw error;
      return data;
    },
    async deleteForQuestion(questionId: string) {
      const { error } = await supabase
        .from('progress')
        .delete()
        .eq('question_id', questionId);
      if (error) throw error;
    }
  }
};
