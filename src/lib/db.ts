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
      // 1. Get all attempts for this user to calculate stats
      const { data: attemptsData, error: qError } = await supabase
        .from('attempts')
        .select('question_id, is_correct, response_time_ms, answered_at')
        .eq('student_id', id);

      if (qError) throw qError;
      
      const attempts = attemptsData || [];
      const uniqueQuestionIds = new Set(attempts.map(a => a.question_id));
      const totalQuestionsAttempted = uniqueQuestionIds.size;
      const totalAttempts = attempts.length;
      const totalCorrectAttempts = attempts.filter(a => a.is_correct).length;
      const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrectAttempts / totalAttempts) * 100) : 0;
      
      const totalTimeMs = attempts.reduce((acc, curr) => acc + (curr.response_time_ms || 0), 0);

      // 2. Total mastered
      const { count: totalMastered, error: mError } = await supabase
        .from('progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id)
        .gte('consecutive_correct', 3);
      
      if (mError) throw mError;

      // 3. Calculate streak
      const { data: days, error: dError } = await supabase
        .rpc('get_study_days', { user_id_param: id });
      
      let streak = 0;
      if (dError) {
        if (attempts.length > 0) {
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
        totalQuestions: totalQuestionsAttempted || 0,
        totalCorrect: totalCorrectAttempts,
        totalAttempts,
        accuracy: overallAccuracy,
        totalTimeMs,
        totalMastered: totalMastered || 0
      };
    },
    async savePartialSession(id: string, topicId: string, sessionData: any) {
      const profile = await this.get(id);
      const metadata = profile.metadata || {};
      const activeSessions = metadata.active_sessions || {};
      
      metadata.active_sessions = {
        ...activeSessions,
        [topicId]: {
          ...sessionData,
          updated_at: new Date().toISOString()
        }
      };

      return this.update(id, { metadata });
    },
    async clearPartialSession(id: string, topicId: string) {
      const profile = await this.get(id);
      const metadata = profile.metadata || {};
      if (metadata.active_sessions && metadata.active_sessions[topicId]) {
        delete metadata.active_sessions[topicId];
        return this.update(id, { metadata });
      }
      return profile;
    },
    async recordQuizResult(id: string, result: { 
      topic_id: string, 
      set_name: string, 
      score: number, 
      total: number, 
      accuracy: number,
      timestamp: string 
    }) {
      const profile = await this.get(id);
      const metadata = profile.metadata || {};
      const history = metadata.quiz_history || [];
      
      metadata.quiz_history = [
        ...history,
        { ...result, id: crypto.randomUUID() }
      ].slice(-100); // Keep last 100 results

      return this.update(id, { metadata });
    }
  },

  settings: {
    async get(key: string) {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      
      if (error) {
        console.warn('Settings table potentially missing, falling back to null', error);
        return null;
      }
      return data;
    },
    async set(key: string, value: string) {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
        .order('name', { ascending: true });
      if (error) throw error;
      
      return (data as any[]).map(s => {
        // If the database has the grade column and it's filled, use it
        if (s.grade) return s;
        
        // Fallback: Check for [Grade] Name pattern
        const match = s.name.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
          return { ...s, name: match[2], grade: match[1] };
        }
        return s;
      }) as Subject[];
    },
    async create(subject: Partial<Subject>) {
      const { grade, ...rest } = subject;
      const finalName = grade ? `[${grade}] ${rest.name}` : rest.name;
      
      // Try with grade column first
      try {
        const { data, error } = await supabase
          .from('subjects')
          .insert([{ ...rest, name: finalName, grade }])
          .select()
          .single();
        
        if (!error) return data as Subject;
      } catch (err) {
        // Ignore and fallback
      }

      // Fallback: Insert without grade column
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ ...rest, name: finalName }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Subject;
    },
    async update(id: string, updates: Partial<Subject>) {
      const { grade, ...rest } = updates;
      
      // If updating name or grade, we need to handle the prefix
      if (rest.name || grade) {
        // We need the current name to reconstruct correctly if only one is provided
        const current = await this.list().then(list => list.find(s => s.id === id));
        const newGrade = grade !== undefined ? grade : current?.grade;
        const newName = rest.name !== undefined ? rest.name : current?.name;
        
        const finalName = newGrade ? `[${newGrade}] ${newName}` : newName;
        
        // Try with grade column
        try {
          const { data, error } = await supabase
            .from('subjects')
            .update({ ...rest, name: finalName, grade: newGrade })
            .eq('id', id)
            .select()
            .single();
          if (!error) return data as Subject;
        } catch (err) {}

        // Fallback
        const { data, error } = await supabase
          .from('subjects')
          .update({ ...rest, name: finalName })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Subject;
      }

      // Simple update (no name/grade change)
      const { data, error } = await supabase
        .from('subjects')
        .update(rest)
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

      // Get mastered and attempted questions
      let masteredCount = 0;
      let attempted = 0;
      let progressPoints = 0;
      
      if (topicQuestionIds.length > 0) {
        // Fetch progress for all questions in this topic for this student
        const { data: progressData, error: progressError } = await supabase
          .from('progress')
          .select('question_id, consecutive_correct')
          .eq('student_id', studentId)
          .in('question_id', topicQuestionIds);
        
        if (progressError) throw progressError;

        if (progressData) {
          progressData.forEach(p => {
            const cc = p.consecutive_correct || 0;
            progressPoints += Math.min(cc, 3);
            if (cc >= 3) masteredCount++;
          });
        }

        // Attempted: unique question_id in attempts for this student and topic
        // optimized: just get the count from progress if we assume progress exists for all attempts
        // but some attempts might not have progress if they are just wrong once? 
        // No, progress is always upserted.
        attempted = progressData?.length || 0;
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

      // Calculate average accuracy
      const averageAccuracy = recentAttempts && recentAttempts.length > 0
        ? Math.round((recentAttempts.filter((a: any) => a.is_correct).length / recentAttempts.length) * 100)
        : 0;

      const masteryPercentage = total > 0 ? Math.round((progressPoints / (total * 3)) * 100) : 0;

      return {
        total: total || 0,
        mastered: masteredCount,
        masteryPercentage: masteryPercentage,
        attempted: attempted,
        accuracy: averageAccuracy,
        previousAccuracy: averageAccuracy // Maintain backward compatibility
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
    async listByIds(ids: string[]) {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', ids);
      if (error) throw error;
      
      // Return in the specific order requested in ids array
      const idMap = new Map(data.map(q => [q.id, q]));
      return ids.map(id => idMap.get(id)).filter(q => !!q) as Question[];
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
