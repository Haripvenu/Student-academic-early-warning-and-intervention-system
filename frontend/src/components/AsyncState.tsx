import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react';

interface Props {
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const AsyncState: React.FC<Props> = ({
  isLoading,
  error,
  isEmpty,
  emptyTitle = 'No data available',
  emptyMessage = 'There are no records to display under the selected criteria.',
  onRetry,
  children,
}) => {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
        <Loader2 size={32} className="spin" color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Loading academic intelligence...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="arm-card"
        style={{
          border: '1px solid #fecdd3',
          background: '#fff1f2',
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <AlertCircle size={32} color="#e11d48" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#9f1239' }}>Unable to load data</h4>
        <p style={{ fontSize: '13px', color: '#be123c', maxWidth: '450px', margin: '4px auto 16px' }}>{error}</p>
        {onRetry && (
          <button className="btn btn-outline btn-sm" onClick={onRetry} style={{ background: '#ffffff', margin: '0 auto' }}>
            <RefreshCw size={13} />
            <span>Retry Query</span>
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="arm-card"
        style={{
          textAlign: 'center',
          padding: '50px 20px',
        }}
      >
        <Inbox size={36} color="var(--text-light)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{emptyTitle}</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', margin: '4px auto 0' }}>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};
