/** Media-layer shared types. */

export type MediaKind = 'video' | 'audio';

/** A local media file resolved to a playable object URL. */
export interface LoadedMedia {
  readonly file: File;
  readonly url: string;
  readonly kind: MediaKind;
}

/** Transport state surfaced to the UI (updated at the media element's own cadence). */
export interface TransportState {
  readonly isPlaying: boolean;
  /** Media playback position in seconds. */
  readonly currentTime: number;
  /** Total duration in seconds, or 0 until known. */
  readonly duration: number;
  readonly ended: boolean;
}

/** Reason a media file could not be used. */
export type MediaLoadError =
  | { readonly kind: 'unsupported-type'; readonly message: string }
  | { readonly kind: 'decode-failed'; readonly message: string };
