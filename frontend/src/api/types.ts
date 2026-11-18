export type PriorityLevel = 'High' | 'Monitor' | 'Routine' | 'Insufficient data';
export type UserRole = 'mentor' | 'faculty' | 'admin';

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface SessionTokenResponse {
  session_token: string;
  user: User;
  expires_at: string;
}

export interface FilterOptions {
  terms: { code: string; name: string }[];
  checkpoints: string[];
  offerings: {
    offering_id: string;
    term_code: string;
    course_code: string;
    course_name: string;
    section: string;
  }[];
}

export interface DashboardKPIs {
  assessed_enrollments: number;
  high_priority_count: number;
  high_priority_pct: number;
  overdue_followups_count: number;
  insufficient_data_count: number;
}

export interface CoursePriorityData {
  course_code: string;
  course_name: string;
  offering_id: string;
  High: number;
  Monitor: number;
  Routine: number;
  Insufficient: number;
  total: number;
}

export interface CheckpointTrendData {
  checkpoint: string;
  High: number;
  Monitor: number;
  Routine: number;
  total: number;
}

export interface ReviewQueueItem {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  course_code: string;
  course_name: string;
  section: string;
  priority: PriorityLevel;
  cluster_label?: string;
  anomaly_percentile?: number;
  primary_warning: string;
  policy_path: string;
  has_active_case: boolean;
  case_id?: string;
  case_status?: string;
}

export interface DashboardSummary {
  term_code: string;
  checkpoint: string;
  kpis: DashboardKPIs;
  priority_by_course: CoursePriorityData[];
  checkpoint_trend: CheckpointTrendData[];
  review_queue: ReviewQueueItem[];
}

export interface EnrollmentListItem {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  offering_id: string;
  course_code: string;
  course_name: string;
  term_code: string;
  section: string;
  mentor_user_id?: string;
  review_priority: PriorityLevel;
  cluster_label?: string;
  anomaly_percentile?: number;
  primary_warning: string;
  has_active_case: boolean;
  case_id?: string;
  case_status?: string;
}

export interface ScoreSensitivity {
  feature_name: string;
  feature_name_display: string;
  observed_value: number;
  benchmark_value: number;
  unit: string;
  denominator: string;
  score_delta: number;
  impact_direction: 'supports_adverse_signal' | 'protective_factor' | 'neutral';
  interpretation: string;
}

export interface EnrollmentDetail {
  enrollment_id: string;
  student: {
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
    cohort_year: number;
  };
  offering: {
    offering_id: string;
    term_code: string;
    course_code: string;
    course_name: string;
    section: string;
    credits: number;
    faculty_user_id?: string;
  };
  mentor_user_id?: string;
  current_checkpoint: string;
  assessment?: {
    priority: PriorityLevel;
    cluster_id?: number;
    cluster_label?: string;
    anomaly_score?: number;
    anomaly_percentile?: number;
    policy_path: string;
    primary_triggers: string[];
  };
  features: Record<string, any>;
  evidence_breakdown: Record<string, any>;
  score_sensitivities: ScoreSensitivity[];
  historical_checkpoints: any[];
  interventions: any[];
}

export interface ClusterProfile {
  cluster_id: number;
  label: string;
  badge_color: string;
  description: string;
  sample_count: number;
  sample_pct: number;
  actual_cohort_count?: number;
  actual_cohort_pct?: number;
  original_means: Record<string, number>;
}

export interface InterventionCase {
  case_id: string;
  enrollment_id: string;
  student_id?: string;
  student_name?: string;
  student_email?: string;
  course_code?: string;
  course_name?: string;
  assigned_mentor_id?: string;
  status: 'open' | 'in_progress' | 'pending_review' | 'closed';
  support_action: string;
  priority: string;
  due_date: string;
  is_overdue: boolean;
  notes?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  events_count?: number;
  events?: {
    event_id: number;
    author_user_id: string;
    event_type: string;
    description: string;
    created_at: string;
  }[];
}
