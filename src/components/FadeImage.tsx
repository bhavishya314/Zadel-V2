import { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

/** Image that softly fades in once loaded — no layout shift. */
export default function FadeImage({
  src,
  alt,
  className = '',
  onLoad,
  priority = false,
  loading,
  fetchPriority,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(() => priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      setLoaded(true);
      return;
    }
    // If the image is already cached or completed loading, reveal immediately
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, priority]);

  const calcLoading = loading ?? (priority ? 'eager' : 'lazy');
  const calcFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto');

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={calcLoading}
      fetchPriority={calcFetchPriority}
      decoding={priority ? 'sync' : 'async'}
      className={`img-fade ${loaded || priority ? 'is-loaded' : ''} ${className}`}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      {...rest}
    />
  );
}

