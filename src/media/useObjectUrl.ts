import { useEffect, useState } from 'react';

/**
 * Create an object URL for a File and revoke it when the file changes or the
 * component unmounts. Returns null when no file is set.
 *
 * Keeping URL creation/revocation in one hook prevents leaks: every created URL
 * is revoked exactly once, on the cleanup that follows its creation.
 */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return url;
}
