import { useRef, useState } from 'react';
import { detectMediaKind } from './mediaFile';
import type { LoadedMedia, MediaLoadError } from './types';
import './media.css';

interface FileDropZoneProps {
  onLoad: (media: Omit<LoadedMedia, 'url'>) => void;
}

/**
 * The "ready to load" state: Browse to a local media file (File API) or drag one
 * in. Validates that the file is playable media up front and surfaces a friendly
 * error for anything else. No backend — the file never leaves the browser.
 */
export function FileDropZone({ onLoad }: FileDropZoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<MediaLoadError | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const accept = (file: File) => {
    const kind = detectMediaKind(file);
    if (!kind) {
      setError({
        kind: 'unsupported-type',
        message: `"${file.name}" is not a recognised audio or video file.`,
      });
      return;
    }
    setError(null);
    onLoad({ file, kind });
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) accept(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) accept(file);
  };

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone${isDragging ? ' dropzone--drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="dropzone-icon" aria-hidden="true">
          <span className="dropzone-triangle" />
        </div>
        <div className="dropzone-title">Load a media file to rate</div>
        <div className="dropzone-hint">
          Browse to a local video or audio file, or drop it here. It stays on your device.
        </div>
        <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
          Browse…
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          className="visually-hidden"
          onChange={onInputChange}
        />
        <div className="dropzone-codec">Best support: H.264/AAC MP4 · WebM · common audio</div>
      </div>
      {error && (
        <p className="dropzone-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
