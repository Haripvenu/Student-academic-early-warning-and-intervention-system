import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';
import { useSession } from '../app/session';
import { useToast } from '../components/Toast';

interface Props {
  onSuccess: () => void;
}

export const LoginPage: React.FC<Props> = ({ onSuccess }) => {
  const { login, switchDemoRole } = useSession();
  const { success } = useToast();
  const [email, setEmail] = useState('sarah.chen@campus.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      success('Authenticated successfully. Welcome back!', 'Access Granted');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: string, name: string) => {
    setLoading(true);
    try {
      await switchDemoRole(role);
      success(`Signed in as ${name} (${role.toUpperCase()})`, 'Demo Session Active');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, #e0e7ff 0%, #f8fafc 70%)',
        padding: '24px',
      }}
    >
      <div
        className="arm-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          boxShadow: 'var(--shadow-modal)',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.35)',
            }}
          >
            <GraduationCap size={28} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            The Open University
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', marginTop: '2px' }}>
            Academic Risk Monitor
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Unsupervised Machine Learning Early Warning System (EWS-ARM v2.4)
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontSize: '12.5px',
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
              Institutional Account Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  fontSize: '13.5px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  fontSize: '13.5px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '10px', marginTop: '6px' }}
          >
            <span>{loading ? 'Authenticating Credentials...' : 'Sign In to Campus EWS'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* 1-Click Evaluation Committee Demo Access */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-card)' }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            EXAMINER &amp; COMMITTEE 1-CLICK PERSPECTIVES:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className="btn btn-outline"
              onClick={() => handleQuickDemo('mentor', 'Dr. Sarah Chen')}
              style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px' }}
            >
              <div style={{ textAlign: 'left' }}>
                <strong>Dr. Sarah Chen</strong>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>(Designated Academic Mentor)</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>Enter &rarr;</span>
            </button>

            <button
              className="btn btn-outline"
              onClick={() => handleQuickDemo('faculty', 'Prof. Alan Vance')}
              style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px' }}
            >
              <div style={{ textAlign: 'left' }}>
                <strong>Prof. Alan Vance</strong>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>(Course Offering Faculty)</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>Enter &rarr;</span>
            </button>

            <button
              className="btn btn-outline"
              onClick={() => handleQuickDemo('admin', 'Elena Rostova')}
              style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px' }}
            >
              <div style={{ textAlign: 'left' }}>
                <strong>Elena Rostova</strong>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>(Institutional Administrator)</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>Enter &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
