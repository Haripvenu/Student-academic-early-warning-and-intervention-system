import React, { useState } from 'react';
import {
  X, Copy, Check, ExternalLink, Sparkles,
  AlertTriangle, MessageSquare, HeartHandshake, CheckCircle2
} from 'lucide-react';
import { useToast } from '../components/Toast';

interface StudentContext {
  student_id: number | string;
  course_code?: string;
  term_code?: string;
  priority?: string;
  primary_factor?: string;
  mentor_name?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentContext;
  onLogIntervention?: (details: { template: string; subject: string; notes: string }) => void;
}

type TemplateType = 'urgent' | 'engagement' | 'commendation';

export const NudgeGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  onLogIntervention,
}) => {
  const { success, info } = useToast();
  const [template, setTemplate] = useState<TemplateType>('urgent');
  const [copied, setCopied] = useState(false);
  const [advisorNotes, setAdvisorNotes] = useState('');

  if (!isOpen) return null;

  const sId = student.student_id;
  const course = student.course_code || 'AAA';
  const mentor = student.mentor_name || 'Dr. Sarah Chen';

  const templates: Record<TemplateType, { title: string; badge: string; subject: string; body: string }> = {
    urgent: {
      title: 'Urgent Assessment Support Check-in',
      badge: 'High Priority',
      subject: `[Academic Support] Check-in regarding ${course} assessments - Student #${sId}`,
      body: `Dear Student #${sId},

I am writing from the Academic Advising team regarding your progress in module ${course}. 

Our early progress indicators noted that you have experienced difficulty with recent assessment deadlines and learning portal engagement. We understand that academic terms bring unexpected personal and study hurdles, and our goal is to help you get back on track before census.

Could we schedule a brief 15-minute virtual check-in this week? We can review deadline extensions, tutorial clinic hours, or direct you to student support services.

Please reply to this email or book directly via the campus portal.

Warm regards,
${mentor}
Academic Mentoring & Student Success Team
The Open University`,
    },
    engagement: {
      title: 'LMS Platform & Study Engagement Support',
      badge: 'Proactive Outreach',
      subject: `Academic Progress & Learning Resources for ${course} - Student #${sId}`,
      body: `Hello Student #${sId},

We noticed that your study activity in the ${course} Virtual Learning Environment (VLE) has slowed over the past week. 

Regular interaction with course materials, readings, and quiz checkpoints is the strongest predictor of module completion. We want to ensure you have everything needed to succeed.

If you are facing technical barriers or need guidance prioritizing study blocks, our academic peer tutors and study skills advisors are available to assist:
• Study Skills Workshop: https://learn.campus.edu/study-skills
• Module Clinic Times: Tuesdays & Thursdays 14:00 - 16:00 UTC

Let us know how we can best support your study routine.

Best wishes,
${mentor}
Module Student Support`,
    },
    commendation: {
      title: 'Mid-term Encouragement & Positive Milestone',
      badge: 'Positive Reinforcement',
      subject: `Commendation on your academic progress in ${course} - Student #${sId}`,
      body: `Dear Student #${sId},

Congratulations on your active coursework engagement in ${course}! 

Your consistent submission record and platform activity reflect strong academic commitment. Staying consistent through the mid-term checkpoint is key to distinction-level performance.

Keep up the excellent dedication, and please do not hesitate to reach out if you need advanced reading material or guidance on upcoming final projects.

Warm regards,
${mentor}
Academic Mentor`,
    },
  };

  const currentTemplate = templates[template];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${currentTemplate.subject}\n\n${currentTemplate.body}`);
      setCopied(true);
      success('Nudge template copied to clipboard', 'Ready to Paste');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      info('Could not copy directly; please select and copy text.');
    }
  };

  const handleMailTo = () => {
    const studentEmail = `student.${sId}@campus.edu`;
    const mailtoUrl = `mailto:${encodeURIComponent(studentEmail)}?subject=${encodeURIComponent(
      currentTemplate.subject
    )}&body=${encodeURIComponent(currentTemplate.body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleLogIntervention = () => {
    if (onLogIntervention) {
      onLogIntervention({
        template,
        subject: currentTemplate.subject,
        notes: advisorNotes,
      });
    }
    success(`Outreach event logged for Student #${sId}`, 'Record Updated');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-card)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-card-subtle) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(79, 70, 229, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                1-Click Outreach Nudge Generator
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target: <strong>Student #{sId}</strong> • Module <strong>{course}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Template Selection Tabs */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
              Select Outreach Tone &amp; Protocol
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {(
                [
                  { id: 'urgent', label: 'Urgent Overdue', icon: AlertTriangle, color: '#e11d48' },
                  { id: 'engagement', label: 'LMS Engagement', icon: MessageSquare, color: '#4f46e5' },
                  { id: 'commendation', label: 'Commendation', icon: HeartHandshake, color: '#059669' },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = template === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTemplate(tab.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? tab.color : 'var(--border-card)'}`,
                      background: isSelected ? 'var(--bg-card-subtle)' : 'transparent',
                      color: isSelected ? tab.color : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <TabIcon size={16} color={isSelected ? tab.color : 'var(--text-muted)'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '4px' }}>
              Email Subject
            </label>
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {currentTemplate.subject}
            </div>
          </div>

          {/* Generated Message Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Personalized Communication Draft
              </label>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                {currentTemplate.badge}
              </span>
            </div>
            <textarea
              readOnly
              value={currentTemplate.body}
              rows={9}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                fontSize: '12.5px',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>

          {/* Advisor Internal Note */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '4px' }}>
              Internal Mentor / Advisor Case Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sent early W4 check-in regarding TMA01 extension."
              value={advisorNotes}
              onChange={(e) => setAdvisorNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
              }}
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Draft'}</span>
            </button>
            <button
              onClick={handleMailTo}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} />
              <span>Open Mail Client</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button
              onClick={handleLogIntervention}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={14} />
              <span>Log Outreach Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
