import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { SubjectFieldSchema, DEFAULT_SCHEMA } from '../lib/subjectPresets';

export function useSubjectSchema(topicId?: string) {
  const [schema, setSchema] = useState<SubjectFieldSchema>(DEFAULT_SCHEMA);
  const [loading, setLoading] = useState(!!topicId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!topicId) {
      setSchema(DEFAULT_SCHEMA);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchSchema() {
      try {
        const fieldSchema = await db.topics.getSubjectSchema(topicId);
        if (isMounted) {
          setSchema({ ...DEFAULT_SCHEMA, ...(fieldSchema || {}) });
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching subject schema:', err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSchema();

    return () => { isMounted = false; };
  }, [topicId]);

  return { schema, loading, error };
}
