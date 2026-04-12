'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '../utils/api.js';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [mode,    setMode]    = useState('login'); // 'login' | 'register'
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Fill in all fields');
    if (mode === 'register' && !name) return setError('Enter your name');

    setLoading(true);
    try {
      const res  = await apiFetch(`/api/auth/${mode}`, {
        method: 'POST',
        body:   JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.error || 'Something went wrong');

      // Зберігаємо токен в localStorage
      if (data.token) setToken(data.token);
      router.push('/');
    } catch {
      setError('Server unavailable. Check that backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: '#0d0e11', fontFamily: "'Syne', sans-serif" }}
    >
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, #4f7cff0d 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center w-12 h-12 text-xl font-black text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #4f7cff 0%, #8b5cf6 100%)' }}
          >C</div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e8eaf0' }}>ChatApp</h1>
            <p className="mt-1 text-sm" style={{ color: '#4a5168' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-2xl"
          style={{ background: '#12141a', border: '1px solid #1e2230' }}
        >

          {/* Mode toggle */}
          <div
            className="flex p-1 mb-6 rounded-lg"
            style={{ background: '#0d0e11' }}
          >
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 text-sm font-bold capitalize transition-all duration-150 rounded-md"
                style={{
                  background: mode === m ? '#1f2330' : 'transparent',
                  color:      mode === m ? '#e8eaf0' : '#4a5168',
                  border:     mode === m ? '1px solid #2a2f3d' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-3">

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#8891a8' }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your name"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: '#1f2330', border: '1px solid #2a2f3d',
                    color: '#e8eaf0', fontFamily: "'Syne', sans-serif",
                  }}
                  onFocus={e => e.target.style.borderColor = '#4f7cff'}
                  onBlur={e => e.target.style.borderColor = '#2a2f3d'}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#8891a8' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                autoFocus={mode === 'login'}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: '#1f2330', border: '1px solid #2a2f3d',
                  color: '#e8eaf0', fontFamily: "'Syne', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#4f7cff'}
                onBlur={e => e.target.style.borderColor = '#2a2f3d'}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#8891a8' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: '#1f2330', border: '1px solid #2a2f3d',
                  color: '#e8eaf0', fontFamily: "'Syne', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#4f7cff'}
                onBlur={e => e.target.style.borderColor = '#2a2f3d'}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-3.5 py-2.5 rounded-lg text-sm"
                style={{ background: '#ff6b6b15', border: '1px solid #ff6b6b30', color: '#ff6b6b' }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all duration-150 mt-1"
              style={{
                background: loading ? '#2a2f3d' : 'linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)',
                border: 'none', cursor: loading ? 'default' : 'pointer',
                color: loading ? '#4a5168' : '#ffffff',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: '#1e2230' }} />
            <span className="text-xs" style={{ color: '#4a5168' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: '#1e2230' }} />
          </div>

          {/* OAuth buttons */}
          <div className="flex gap-3">

            {/* Google */}
            <a
              href={`${API}/api/auth/google`}
              className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-bold transition-all duration-150"
              style={{
                background: '#1f2330', border: '1px solid #2a2f3d',
                color: '#e8eaf0', textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4f7cff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2f3d'}
            >
              {/* Google icon */}
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>

            {/* GitHub */}
            <a
              href={`${API}/api/auth/github`}
              className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-bold transition-all duration-150"
              style={{
                background: '#1f2330', border: '1px solid #2a2f3d',
                color: '#e8eaf0', textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4f7cff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2f3d'}
            >
              {/* GitHub icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#e8eaf0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-xs text-center" style={{ color: '#4a5168' }}>
          By signing in you agree to our terms of service
        </p>
      </div>
    </div>
  );
}