'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

const FALLBACK = '/images/product-placeholder.svg';

type SafeImageProps = Omit<ImageProps, 'src'> & { src: string };

export function SafeImage({ src, alt, onError, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK);

  useEffect(() => {
    setCurrentSrc(src || FALLBACK);
  }, [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized
      onError={(event) => {
        if (currentSrc !== FALLBACK) setCurrentSrc(FALLBACK);
        onError?.(event);
      }}
    />
  );
}
