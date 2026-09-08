import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Priyasa wordmark lockup.
 *
 * The previous implementation rendered an invented square “P” badge. The
 * storefront reference uses the PRIYASA wordmark, so the fake badge is
 * intentionally removed until the canonical brand SVG/PNG is supplied.
 */
export function BrandLogo({ href = '/', compact = false, className = '' }: BrandLogoProps) {
  const content = (
    <span className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} ${className}`}>
      <span className="brand-wordmark" aria-label="PRIYASA">
        <strong>PRIYASA</strong>
        {!compact && <small>Every You, Beautiful</small>}
      </span>
    </span>
  );

  return href ? <Link href={href} className="brand-logo-link" aria-label="PRIYASA home">{content}</Link> : content;
}
