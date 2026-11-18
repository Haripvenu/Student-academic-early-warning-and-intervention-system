import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface Props {
  enrollmentId: string;
  studentName?: string;
  courseCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    enrollment_id: string;
    support_action: string;
    due_date: string;
    priority: string;
    notes: string;
  }) => Promise<void>;
}

export const InterventionForm: React.FC<Props> = ({
  enrollmentId,
  studentName,
  courseCode,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [supportAction, setSupportAction] = useState('Academic Advising Check-in');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      alert('Please confirm the mentor action plan before saving.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        enrollment_id: enrollmentId,
        support_action: supportAction,
        due_date: `${dueDate}T17:00:00Z`,
        priority,
        notes,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit intervention');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="arm-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#ffffff',
          boxShadow: 'var(--shadow-modal)',
          padding: '24px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Open Intervention Case
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Target: <strong>{studentName || enrollmentId}</strong> in <strong>{courseCode || 'Course'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Support Action */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Prescribed Support Action:
            </label>
            <select
              value={supportAction}
              onChange={(e) => setSupportAction(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                outline: 'none',
              }}
            >
              <option value="Academic Advising Check-in">Academic Advising Check-in (1-on-1 meeting)</option>
              <option value="Study Planning & Remediation">Study Planning & Remediation (Curriculum pacing)</option>
              <option value="Tutoring Referral">Tutoring Referral (Peer or faculty tutoring center)</option>
              <option value="Faculty Outreach">Faculty Outreach (Course coordinator consultation)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Case Priority:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)',
                  outline: 'none',
                }}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Routine">Routine Monitoring</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Follow-up Deadline:
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Mentor Action Notes & Observations:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record diagnostic context, student conversation notes, or action items..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {/* Mentor Confirmation Checkbox */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-card)',
              padding: '10px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <input
              type="checkbox"
              id="confirm-action"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="confirm-action" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <strong>Mentor Confirmation:</strong> I confirm this support action is assigned to the student's caseload and requires scheduled follow-up.
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !confirmed}
            >
              <Send size={13} />
              <span>{submitting ? 'Committing...' : 'Commit Intervention Case'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
