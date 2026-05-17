import { supabase } from './supabase';

/**
 * Compresses an image file to be under a certain size limit (in KB).
 * Resizes the longest dimension to ≤ 1200px and re-encodes as WebP.
 */
export async function compressImage(file: File, maxKB: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1200;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);

        const tryResize = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Failed to convert canvas to blob'));
              
              if (blob.size / 1024 <= maxKB || quality <= 0.2) {
                resolve(blob);
              } else {
                tryResize(quality - 0.2);
              }
            },
            'image/webp',
            quality
          );
        };

        tryResize(0.8);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/**
 * Uploads a question image to Supabase Storage.
 * Path: question-images/{topicId}/{questionId}.webp
 */
export async function uploadQuestionImage(file: File, topicId: string, questionId: string): Promise<string> {
  const compressedBlob = await compressImage(file, 500); // Max 500KB
  const fileName = `${questionId}.webp`;
  const filePath = `question-images/${topicId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('assets')
    .upload(filePath, compressedBlob, {
      contentType: 'image/webp',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('assets')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Deletes a question image from Supabase Storage given its public URL.
 */
export async function deleteQuestionImage(url: string): Promise<void> {
  try {
    // Extract file path from public URL
    // Public URL format: .../storage/v1/object/public/assets/question-images/topic-id/question-id.webp
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/public/assets/');
    if (pathParts.length < 2) return;
    
    const filePath = pathParts[1];
    
    const { error } = await supabase.storage
      .from('assets')
      .remove([filePath]);

    if (error) throw error;
  } catch (err) {
    console.warn('Failed to delete image from storage:', err);
  }
}
