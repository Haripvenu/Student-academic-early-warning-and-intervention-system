import React, { useState, useEffect } from 'react';
import { useSession } from './session';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { OverviewPage } from '../pages/OverviewPage';
import { StudentExplorerPage } from '../pages/StudentExplorerPage';
import { StudentProfilePage } from '../pages/StudentProfilePage';
import { PatternsPage } from '../pages/PatternsPage';
import { InterventionsPage } from '../pages/InterventionsPage';
import { ImportsPage } from '../pages/ImportsPage';
import { ModelMonitoringPage } from '../pages/ModelMonitoringPage';

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
      {content}
    </AppShell>
  );
};
