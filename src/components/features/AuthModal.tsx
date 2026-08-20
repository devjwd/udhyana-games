'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { registerOnlineUser } from '@/backend/actions';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Shared fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Sign-up only
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setPhone('');
    setError('');
  };

  const switchMode = (next: Mode) => {
    resetForm();
    setMode(next);
  };

  const handleLogin = async () => {
    const result = await signIn('credentials', {
      redirect: false,
      username: username.trim(),
      password,
    });

    if (result?.ok) {
      onClose();
      resetForm();
      router.push('/profile');
      router.refresh();
    } else {
      if (result?.error === 'PENDING') {
        setError('Your account is pending verification. Please visit the reception desk with a valid ID to activate it.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }
  };

  const handleSignup = async () => {
    // Client-side pre-validation
    if (username.trim().length < 3) {
      setError('Gamer Tag must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    await registerOnlineUser({ username, password, email, phone, fullName });

    resetForm();
    setMode('login');
    setError('');
    // Show a success state instead of alert — using the error field with a success style
    setError('__SUCCESS__');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = error === '__SUCCESS__';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.accentTriangle}></div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={styles.title}>
          {mode === 'login' ? 'Login to Udhyana' : 'Create Account'}
        </h2>

        {/* Success message after sign up */}
        {isSuccess && (
          <div style={{ background: 'rgba(193,255,28,0.08)', border: '1px solid rgba(193,255,28,0.4)', borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1rem', color: '#c1ff1c', fontSize: '0.88rem', lineHeight: '1.5' }}>
            ✅ Account created! Visit the reception desk with a valid ID to activate it. Then you can log in here.
          </div>
        )}

        {/* Error message */}
        {error && !isSuccess && (
          <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.88rem', lineHeight: '1.5' }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your real name"
                  required
                  autoComplete="name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  required
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              {mode === 'login' ? 'Gamer Tag, Email, or Phone' : 'Gamer Tag'}
            </label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={mode === 'login' ? 'e.g. VIP_GAMER or you@example.com' : 'e.g. VIP_GAMER'}
              required
              autoComplete="username"
              minLength={3}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 6 : undefined}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
                ? 'Access Terminal'
                : 'Register Identity'}
          </button>
        </form>

        <div className={styles.toggleText}>
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}
          <button
            className={styles.toggleLink}
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
