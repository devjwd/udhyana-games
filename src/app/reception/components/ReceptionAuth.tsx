'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from '../page.module.css';
import { signIn, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';

interface ReceptionAuthProps {
  sessionUser?: { name?: string | null; email?: string | null; role?: string | null };
  onLoginSuccess: () => void;
}

export default function ReceptionAuth({ sessionUser, onLoginSuccess }: ReceptionAuthProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        username: loginEmail.trim(),
        password: loginPassword,
      });

      if (result?.ok) {
        toast.success('Logged in to Reception Desk!');
        onLoginSuccess();
      } else {
        if (result?.error === 'PENDING') {
          setLoginError('This account is pending verification and cannot access reception.');
        } else {
          setLoginError('Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Image
              src="/images/logo.png"
              alt="Udhyana Games"
              width={180}
              height={54}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className={styles.loginBrand}>UDHYANA RECEPTION</h1>
          <p className={styles.loginSubtitle}>Staff & Admin Portal Authentication</p>
        </div>

        {sessionUser && (
          <div className={styles.loginError} style={{ borderColor: 'rgba(255, 180, 0, 0.4)', background: 'rgba(255, 180, 0, 0.1)', color: '#ffb400' }}>
            Logged in as <strong>{sessionUser.name || sessionUser.email}</strong> (Role: {sessionUser.role || 'USER'}).<br />
            This account does not have Receptionist or Admin privileges.
          </div>
        )}

        {loginError && <div className={styles.loginError}>{loginError}</div>}

        <form onSubmit={handleStaffLogin} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Staff Email / Gamer Tag</label>
            <input
              type="text"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={styles.input}
              placeholder="e.g. staff@udhyanagames.com"
              required
            />
          </div>

          <div className={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" disabled={isLoggingIn} className={styles.loginBtn}>
            {isLoggingIn ? 'Authenticating...' : 'Access Reception Desk'}
          </button>

          {sessionUser && (
            <button
              type="button"
              onClick={() => signOut()}
              className={styles.logoutBtn}
              style={{ marginTop: '0.5rem' }}
            >
              Sign Out Current Account
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
