/**
 * interview-recording.ts — Upload/download interview recordings
 * Handles Supabase Storage operations for interview video files.
 * Falls back to local blob URLs when Supabase storage is unavailable.
 */

import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'interview-recordings';

/**
 * Check if Supabase storage is properly configured and the bucket exists.
 */
async function isBucketAvailable(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a recording blob to Supabase Storage.
 * Falls back to a local blob URL if the bucket doesn't exist or upload fails.
 * Path: {userId}/{sessionId}.webm
 */
export async function uploadRecording(
  blob: Blob,
  userId: string,
  sessionId: string
): Promise<{ success: boolean; path?: string; localUrl?: string; error?: string }> {
  try {
    // Check bucket availability first to avoid noisy "Bucket not found" errors
    const bucketReady = await isBucketAvailable();
    if (!bucketReady) {
      console.warn('[Recording] ⚠️ Supabase bucket not found — using local blob URL instead.');
      const localUrl = URL.createObjectURL(blob);
      return { success: true, localUrl, error: 'Bucket not available — saved locally' };
    }

    const filePath = `${userId}/${sessionId}.webm`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: 'video/webm',
        upsert: true,
      });

    if (error) {
      console.warn('[Recording] ⚠️ Upload failed, falling back to local:', error.message);
      const localUrl = URL.createObjectURL(blob);
      return { success: true, localUrl, error: error.message };
    }

    console.log('[Recording] ✅ Uploaded to Supabase:', data.path);
    return { success: true, path: data.path };
  } catch (err: any) {
    console.warn('[Recording] ⚠️ Upload exception, falling back to local:', err.message);
    const localUrl = URL.createObjectURL(blob);
    return { success: true, localUrl, error: err.message };
  }
}

/**
 * Generate a time-limited signed URL for a recording.
 * Returns empty result gracefully if the bucket doesn't exist.
 */
export async function getSignedRecordingUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const bucketReady = await isBucketAvailable();
    if (!bucketReady) {
      return { success: false, error: 'Storage bucket not available' };
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.warn('[Recording] Signed URL error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (err: any) {
    console.warn('[Recording] Signed URL exception:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a recording from storage.
 */
export async function deleteRecording(filePath: string) {
  try {
    const bucketReady = await isBucketAvailable();
    if (!bucketReady) return { success: false, error: 'Storage bucket not available' };

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.warn('[Recording] Delete error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
