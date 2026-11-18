import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Network, HeartHandshake,
  UploadCloud, Cpu, LogOut, Menu, X, ChevronDown,
  Search, GraduationCap, Building2
} from 'lucide-react';
import { useSession } from '../app/session';
import { useToast } from '../components/Toast';
import { QuickSearchModal } from '../components/QuickSearchModal';

interface Props {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ currentPath, onNavigate, children }) => {
  const { currentUser, logout, switchDemoRole } = useSession();
  const { success } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut for search ('/' or 'Ctrl+K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { path: '/overview', label: 'Cohort Overview', icon: LayoutDashboard },
    { path: '/students', label: 'Caseload Explorer', icon: Users, badge: '11.2k' },
    { path: '/patterns', label: 'Discovered Archetypes', icon: Network },
    { path: '/interventions', label: 'Active Support Cases', icon: HeartHandshake },
    { path: '/admin/imports', label: 'Institutional Feeds', icon: UploadCloud, adminOnly: true },
    { path: '/admin/models', label: 'ML Operations & Audit', icon: Cpu, adminOnly: true },
  ];

  const handleNav = (p: string) => {
    onNavigate(p);
    setMobileMenuOpen(false);
  };

  const handleRoleSwitch = async (role: string, name: string) => {
    await switchDemoRole(role);
    success(`Switched role to ${name} (${role.toUpperCase()})`, 'Perspective Updated');
    setShowRoleDropdown(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Desktop Persistent Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
        }}
        className="hidden md:flex"
      >
        <div>
          {/* Institutional Branding Header */}
          <div
            style={{
              padding: '20px 20px 18px',
              borderBottom: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Academic Risk
              </div>
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Monitor • EWS
              </div>
            </div>
          </div>

          {/* Quick Search Trigger Bar */}
          <div style={{ padding: '14px 16px 6px' }}>
            <button
              onClick={() => setIsSearchOpen(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '12.5px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={14} color="#94a3b8" />
                <span>Search student or ID...</span>
              </div>
              <span className="search-shortcut-kbd">/</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '8px 10px 4px' }}>
              Academic Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/overview' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? '#eef2ff' : 'transparent',
                    color: isActive ? '#4f46e5' : '#334155',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={17} color={isActive ? '#4f46e5' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isActive ? '#c7d2fe' : '#f1f5f9',
                        color: isActive ? '#3730a3' : '#64748b',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '6px',
                        bottom: '6px',
                        width: '3px',
                        borderRadius: '0 4px 4px 0',
                        background: '#4f46e5',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Demo Switcher in Sidebar Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)' }}>
          {/* Advisor Caseload Capacity Indicator */}
          <div
            style={{
              marginBottom: '14px',
              padding: '10px 12px',
              background: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Caseload Load
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                42 / 50 Active
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-card)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '84%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #4f46e5 0%, #10b981 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
              <span>84% Capacity</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>8 Slots Avail.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#3730a3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                {currentUser?.full_name?.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'DU'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentUser?.full_name || 'Demo User'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {currentUser?.role === 'mentor' ? 'Academic Mentor' : (currentUser?.role === 'faculty' ? 'Course Faculty' : 'System Admin')}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* University Department Context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="var(--primary)" />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                The Open University <span style={{ color: 'var(--text-muted)' }}>•</span> Faculty of STEM &amp; Social Sciences
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Term & Checkpoint Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-card)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="live-indicator-dot" />
              <span>Term: <strong style={{ color: 'var(--primary)' }}>2014J</strong></span>
              <span style={{ color: 'var(--border-card)' }}>|</span>
              <span style={{ color: 'var(--text-muted)' }}>Active: <strong>Week 4 Horizon</strong></span>
            </div>

            {/* Quick Demo Switcher Pill */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {currentUser?.full_name?.split(' ')[0]} ({currentUser?.role})
                </span>
                <ChevronDown size={13} />
              </button>

              {showRoleDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    width: '240px',
                    zIndex: 40,
                    padding: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px 4px' }}>
                    SELECT EVALUATOR PERSPECTIVE
                  </div>
                  {[
                    { role: 'mentor', name: 'Dr. Sarah Chen', sub: 'Assigned Mentor (5,570 Cohort)' },
                    { role: 'faculty', name: 'Prof. Alan Vance', sub: 'Course Coordinator Scope' },
                    { role: 'admin', name: 'Elena Rostova', sub: 'Institutional Administrator' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      onClick={() => handleRoleSwitch(r.role, r.name)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: currentUser?.role === r.role ? 'var(--bg-app)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (currentUser?.role !== r.role) e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                      }}
                      onMouseLeave={(e) => {
                        if (currentUser?.role !== r.role) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.sub}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1480px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
