import type { ScaleConfig } from '../config/scale';
import type { MediaKind } from '../media/types';
import type { Sample, SamplingMode } from '../sampling/types';

/**
 * A persisted annotation session (participant × media item). Autosaved to
 * IndexedDB so an interrupted session can be resumed and re-exported identically.
 *
 * The media File itself cannot be persisted (File API objects are not
 * serialisable), so `mediaReference` records the filename and the participant
 * re-selects the file on resume.
 */
export interface SessionRecord {
  readonly appVersion: string;
  readonly mediaReference: string;
  readonly mediaKind: MediaKind;
  readonly scale: ScaleConfig;
  readonly samplingMode: SamplingMode | null;
  readonly samples: Sample[];
  /** The control's value at the last save (restored as the resume starting point). */
  readonly lastValue: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
