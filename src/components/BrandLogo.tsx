import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

/** Canonical Priyasa brand lockup: full wordmark on desktop, icon-only on mobile. */
export function BrandLogo({ href = '/', compact = false, className = '' }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} ${className}`}>
      <img
        className="brand-logo-full"
        src="/images/priyasa-logo.svg"
        alt="PRIYASA"
        width={184}
        height={48}
      />
      <img
        className="brand-logo-mobile"
        src="/images/priyasa-icon.svg"
        alt="PRIYASA"
        width={42}
        height={42}
      />
    </span>
  );

  return href ? (
    <Link href={href} className="brand-logo-link" aria-label="PRIYASA home">
      {content}
    </Link>
  ) : content;
}
