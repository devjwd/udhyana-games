'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import styles from '@/app/profile/page.module.css';
import { useRouter } from 'next/navigation';

interface UserData {
  id?: string;
  fullName?: string | null;
  phone?: string | null;
  image?: string | null;
}

function EditProfileForm({ user, onBack }: { user: UserData; onBack: () => void }) {
  // General Form State initialized directly from user prop
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [image, setImage] = useState(user.image || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setIsUpdatingProfile(true);

    try {
      const { updateUserProfile } = await import('@/backend/actions');
      const res = await updateUserProfile(user.id as string, { fullName, phone, image });
      if ('error' in res && typeof res.error === 'string') throw new Error(res.error);
      
      setProfileMsg({ type: 'success', text: 'Profile updated successfully! (Relog to see changes in header)' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    setIsUpdatingPassword(true);

    try {
      const { updateUserPassword } = await import('@/backend/actions');
      const res = await updateUserPassword(user.id as string, currentPassword, newPassword);
      
      if (res.error) throw new Error(res.error);
      
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordMsg({ type: 'error', text: message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem', background: '#0B0C10', color: 'white', 
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '1rem'
  };

  return (
    <main className={styles.main} style={{ justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <button 
          onClick={onBack} 
          style={{ alignSelf: 'flex-start', background: 'transparent', color: 'var(--primary-accent)', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
          &larr; Back to Profile
        </button>

        {/* General Information Panel */}
        <div className={styles.profileCard}>
          <div className={styles.accentTriangle}></div>
          <h2 className={styles.username} style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>GENERAL SETTINGS</h2>
          
          {profileMsg.text && (
            <div style={{ background: profileMsg.type === 'error' ? 'rgba(255,77,77,0.1)' : 'rgba(193,255,28,0.1)', border: `1px solid ${profileMsg.type === 'error' ? 'rgba(255,77,77,0.3)' : 'rgba(193,255,28,0.3)'}`, borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1.5rem', color: profileMsg.type === 'error' ? '#ff6b6b' : 'var(--primary-accent)' }}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Avatar Image URL</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Image src={image || 'https://via.placeholder.com/150'} alt="Avatar Preview" width={60} height={60} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-accent)' }} unoptimized />
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} style={inputStyle} placeholder="https://example.com/avatar.jpg" />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="Optional" />
            </div>

            <button type="submit" disabled={isUpdatingProfile} style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--primary-accent)', color: 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', opacity: isUpdatingProfile ? 0.5 : 1 }}>
              {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Security Panel */}
        <div className={styles.profileCard}>
          <div className={styles.accentTriangle}></div>
          <h2 className={styles.username} style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>SECURITY</h2>
          
          {passwordMsg.text && (
            <div style={{ background: passwordMsg.type === 'error' ? 'rgba(255,77,77,0.1)' : 'rgba(193,255,28,0.1)', border: `1px solid ${passwordMsg.type === 'error' ? 'rgba(255,77,77,0.3)' : 'rgba(193,255,28,0.3)'}`, borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1.5rem', color: profileMsg.type === 'error' ? '#ff6b6b' : 'var(--primary-accent)' }}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required />
            </div>

            <button type="submit" disabled={isUpdatingPassword} style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', opacity: isUpdatingPassword ? 0.5 : 1 }}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Loading...</div>;
  if (status === 'unauthenticated' || !session?.user) {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  return (
    <>
      <Header />
      <EditProfileForm user={session.user} onBack={() => router.push('/profile')} />
    </>
  );
}
