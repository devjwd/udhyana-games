import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
        {...props}
      >
        {/* Corner Brackets */}
        <svg className={styles.bracketTl} viewBox="0 0 20 20" fill="none">
          <path d="M 20 1 L 7 1 L 1 7 L 1 20" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
        <svg className={styles.bracketBr} viewBox="0 0 20 20" fill="none">
          <path d="M 0 19 L 13 19 L 19 13 L 19 0" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>

        {/* Inner button shape */}
        <div className={styles.inner}>
          {variant === 'outline' && <div className={styles.outlineInner} />}
          <span className={styles.content}>{children}</span>
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';
