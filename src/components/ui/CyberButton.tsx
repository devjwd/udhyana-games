import React from 'react';
import Link from 'next/link';
import styles from './CyberButton.module.css';

export interface CyberButtonProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  target?: string;
  rel?: string;
  'aria-label'?: string;
}

export default function CyberButton({
  children,
  href,
  className = '',
  fullWidth = false,
  style,
  onClick,
  type = 'button',
  disabled = false,
  target,
  rel,
  'aria-label': ariaLabel,
  ...rest
}: CyberButtonProps) {
  const content = (
    <>
      <span className={styles.cyberBg} aria-hidden="true">
        {/* Left piece (chamfered top-left, rounded bottom-left, corner bracket) */}
        <svg
          className={styles.cyberLeft}
          viewBox="0 0 22 44"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className={styles.cyberBgOuter}
            d="M 22 1 L 11 1 L 1 11 L 1 37 A 6 6 0 0 0 7 43 L 22 43"
          />
          <path
            className={styles.cyberBgBracket}
            d="M 19 1 L 11 1 L 1 11 L 1 19"
          />
          <path
            className={styles.cyberBgInner}
            d="M 22 4.5 L 12 4.5 L 4.5 12 L 4.5 34.5 A 5 5 0 0 0 9.5 39.5 L 22 39.5 Z"
          />
        </svg>

        {/* Middle piece (stretches to text length with 1px overlap) */}
        <svg
          className={styles.cyberMid}
          viewBox="0 0 10 44"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line className={styles.cyberBgOuter} x1="0" y1="1" x2="10" y2="1" />
          <line className={styles.cyberBgOuter} x1="0" y1="43" x2="10" y2="43" />
          <rect
            className={styles.cyberBgInner}
            x="0"
            y="4.5"
            width="10"
            height="35"
          />
        </svg>

        {/* Right piece (rounded top-right, chamfered bottom-right, corner bracket) */}
        <svg
          className={styles.cyberRight}
          viewBox="0 0 22 44"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className={styles.cyberBgOuter}
            d="M 0 1 L 15 1 A 6 6 0 0 1 21 7 L 21 33 L 11 43 L 0 43"
          />
          <path
            className={styles.cyberBgBracket}
            d="M 2 43 L 11 43 L 21 33 L 21 25"
          />
          <path
            className={styles.cyberBgInner}
            d="M 0 4.5 L 12.5 4.5 A 5 5 0 0 1 17.5 9.5 L 17.5 32 L 10 39.5 L 0 39.5 Z"
          />
        </svg>
      </span>
      {children}
    </>
  );

  const combinedClassName = `${styles.cyberBtn} ${fullWidth ? styles.fullWidth : ''} ${disabled ? styles.disabled : ''} ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClassName}
        style={style}
        onClick={disabled ? undefined : (onClick as React.MouseEventHandler<HTMLAnchorElement>)}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClassName}
      style={style}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      aria-label={ariaLabel}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
