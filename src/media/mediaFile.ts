import type { MediaKind } from './types';

/**
 * Pure helpers for the File API media layer — no React, no DOM element state, so
 * they are cheap to unit-test.
 */

// Extension fallbacks for when File.type is empty or unreliable (common for some
// containers on some OSes). Codec support is still decided by the browser at load
// time; these only pick the <video> vs <audio> element.
const VIDEO_EXTENSIONS = new Set(['mp4', 'm4v', 'webm', 'ogv', 'mov', 'mkv', 'avi']);
const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'm4a',
  'aac',
  'wav',
  'ogg',
  'oga',
  'opus',
  'flac',
  'weba',
]);

function extensionOf(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0 || dot === fileName.length - 1) return null;
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Decide whether a file should play through a <video> or <audio> element.
 * Returns null when the file is clearly neither (an upfront, friendly rejection);
 * anything that passes here may still fail to decode, which the element reports.
 */
export function detectMediaKind(file: File): MediaKind | null {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  const ext = extensionOf(file.name);
  if (ext && VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (ext && AUDIO_EXTENSIONS.has(ext)) return 'audio';

  return null;
}

/**
 * Format a duration in seconds as a timecode. Uses `H:MM:SS` past an hour,
 * otherwise `MM:SS`. Negative or non-finite inputs clamp to zero.
 */
export function formatTimecode(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Format the time remaining as `−MM:SS` (leading U+2212 minus, matching the
 * design). Clamps to zero when duration is unknown or already reached.
 */
export function formatRemaining(currentTime: number, duration: number): string {
  const remaining = Number.isFinite(duration) ? Math.max(0, duration - currentTime) : 0;
  return `−${formatTimecode(remaining)}`;
}

/** Progress through the media as a fraction in [0, 1]; 0 when duration unknown. */
export function playbackFraction(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(1, Math.max(0, currentTime / duration));
}
