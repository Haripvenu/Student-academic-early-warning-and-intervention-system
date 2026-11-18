import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSession } from './session';
import { AppShell } from '../layout/AppShell';

const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const OverviewPage = lazy(() => import('../pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const StudentExplorerPage = lazy(() => import('../pages/StudentExplorerPage').then(m => ({ default: m.StudentExplorerPage })));
const StudentProfilePage = lazy(() => import('../pages/StudentProfilePage').then(m => ({ default: m.StudentProfilePage })));
const PatternsPage = lazy(() => import('../pages/PatternsPage').then(m => ({ default: m.PatternsPage })));
const InterventionsPage = lazy(() => import('../pages/InterventionsPage').then(m => ({ default: m.InterventionsPage })));
const ImportsPage = lazy(() => import('../pages/ImportsPage').then(m => ({ default: m.ImportsPage })));
const ModelMonitoringPage = lazy(() => import('../pages/ModelMonitoringPage').then(m => ({ default: m.ModelMonitoringPage })));

export const Router: React.FC = () => {
  const { currentUser, isLoading } = useSession();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/overview');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/overview');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Loading Academic Risk Monitor...</span>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <LoginPage onSuccess={() => navigate('/overview')} />;
  }

  let content: React.ReactNode = null;

  if (currentPath === '/login') {
    content = <LoginPage onSuccess={() => navigate('/overview')} />;
  } else if (currentPath === '/overview' || currentPath === '/') {
    content = <OverviewPage onNavigate={navigate} />;
  } else if (currentPath === '/students') {
    content = <StudentExplorerPage onNavigate={navigate} />;
  } else if (currentPath.startsWith('/students/')) {
    const enrollmentId = currentPath.split('/')[2];
    content = <StudentProfilePage enrollmentId={enrollmentId} onBack={() => navigate('/students')} />;
  } else if (currentPath === '/patterns') {
    content = <PatternsPage onNavigate={navigate} />;
  } else if (currentPath === '/interventions') {
    content = <InterventionsPage />;
  } else if (currentPath === '/admin/imports') {
    content = <ImportsPage />;
  } else if (currentPath === '/admin/models') {
    content = <ModelMonitoringPage />;
  } else {
    content = <OverviewPage onNavigate={navigate} />;
  }

  return (
    <AppShell currentPath={currentPath} onNavigate={navigate}>
      <Suspense fallback={
        <div style={{ padding: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Loading view...</span>
        </div>
      }>
        {content}
      </Suspense>
    </AppShell>
  );
};
