import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function PriyasaMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`priyasa-mark ${className}`} viewBox="0 0 512 512" role="img" aria-label="PRIYASA logo" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="priyasaPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3158" />
          <stop offset="0.48" stopColor="#ff1749" />
          <stop offset="1" stopColor="#ff2d57" />
        </linearGradient>
      </defs>
      <rect x="25" y="20" width="462" height="472" rx="104" fill="url(#priyasaPink)" />
      <path fill="#fff" d="M120 94h174c89 0 141 54 141 143 0 91-55 151-139 151-38 0-66-19-75-49 20 17 43 24 67 24 53 0 88-47 88-111 0-62-31-105-92-105H157v309h-37V94Z" />
      <path fill="url(#priyasaPink)" d="M274 132c-49 0-86 34-86 82 0 45 34 77 82 77 18 0 34-4 48-12-8 26-27 43-53 56l-145 77v50h78v-89l92-48c54-28 87-59 87-111 0-47-40-82-103-82Zm-5 48c34 0 56 17 56 42 0 28-20 45-55 45-31 0-51-19-51-49 0-23 20-38 50-38Z" />
      <circle cx="274" cy="224" r="39" fill="#fff" />
    </svg>
  );
}

export function BrandLogo({ href = '/', compact = false, className = '' }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} ${className}`}>
      <PriyasaMark />
      <span className="brand-wordmark"><strong>PRIYASA</strong><small>Every You, Beautiful</small></span>
    </span>
  );

  return href ? <Link href={href} className="brand-logo-link" aria-label="PRIYASA home">{content}</Link> : content;
}
