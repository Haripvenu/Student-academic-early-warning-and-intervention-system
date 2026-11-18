import { apiClient } from './client';
import {
  FilterOptions, DashboardSummary, EnrollmentListItem,
  EnrollmentDetail, ClusterProfile, InterventionCase,
  User, SessionTokenResponse
} from './types';

export const queries = {
  // Auth
  login: async (email: string, password: string): Promise<SessionTokenResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  demoSwitch: async (role: string): Promise<SessionTokenResponse> => {
    const res = await apiClient.post(`/auth/demo-switch/${role}`);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // Filters & Dashboard
  getFilters: async (): Promise<FilterOptions> => {
    const res = await apiClient.get('/dashboard/filters');
    return res.data;
  },
  getDashboardSummary: async (term: string, checkpoint: string, offeringId?: string): Promise<DashboardSummary> => {
    const params: any = { term_code: term, checkpoint };
    if (offeringId && offeringId !== 'ALL') params.offering_id = offeringId;
    const res = await apiClient.get('/dashboard/summary', { params });
    return res.data;
  },

  // Enrollments
  getEnrollments: async (params: {
    term_code: string;
    checkpoint: string;
    course_code?: string;
    priority?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ total: number; page: number; total_pages: number; items: EnrollmentListItem[] }> => {
    const res = await apiClient.get('/enrollments', { params });
    return res.data;
  },
  getEnrollmentDetail: async (enrollmentId: string, checkpoint: string = 'W4'): Promise<EnrollmentDetail> => {
    const res = await apiClient.get(`/enrollments/${enrollmentId}`, { params: { checkpoint } });
    return res.data;
  },

  // Patterns
  getClusterPatterns: async (checkpoint: string = 'W4'): Promise<{ checkpoint: string; cluster_profiles: ClusterProfile[] }> => {
    const res = await apiClient.get('/patterns/clusters', { params: { checkpoint } });
    return res.data;
  },
  getClusterStudents: async (clusterId: number, checkpoint: string = 'W4'): Promise<any[]> => {
    const res = await apiClient.get(`/patterns/clusters/${clusterId}/students`, { params: { checkpoint } });
    return res.data;
  },

  // Interventions
  getInterventions: async (status?: string): Promise<InterventionCase[]> => {
    const params: any = {};
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get('/interventions', { params });
    return res.data;
  },
  getInterventionDetail: async (caseId: string): Promise<InterventionCase> => {
    const res = await apiClient.get(`/interventions/${caseId}`);
    return res.data;
  },
  createIntervention: async (data: {
    enrollment_id: string;
    support_action: string;
    due_date: string;
    assigned_mentor_id?: string;
    priority?: string;
    notes?: string;
  }): Promise<{ message: string; case_id: string }> => {
    const res = await apiClient.post('/interventions', data);
    return res.data;
  },
  updateIntervention: async (caseId: string, data: {
    status?: string;
    assigned_mentor_id?: string;
    support_action?: string;
    due_date?: string;
    notes?: string;
    new_note?: string;
  }): Promise<{ message: string; case_id: string }> => {
    const res = await apiClient.patch(`/interventions/${caseId}`, data);
    return res.data;
  },

  // Imports
  getImportBatches: async (): Promise<any[]> => {
    const res = await apiClient.get('/imports/batches');
    return res.data;
  },
  getBatchErrors: async (batchId: string): Promise<any[]> => {
    const res = await apiClient.get(`/imports/batches/${batchId}/errors`);
    return res.data;
  },
  uploadCsv: async (entityType: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('file', file);
    const res = await apiClient.post('/imports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Monitoring
  getRegisteredModels: async (checkpoint?: string): Promise<any[]> => {
    const params = checkpoint ? { checkpoint } : {};
    const res = await apiClient.get('/monitoring/models', { params });
    return res.data;
  },
  getJobs: async (): Promise<any[]> => {
    const res = await apiClient.get('/monitoring/jobs');
    return res.data;
  },
  triggerJob: async (data: { job_type: string; term_code?: string; checkpoint?: string; model_version_id?: string }): Promise<any> => {
    const res = await apiClient.post('/monitoring/jobs/trigger', data);
    return res.data;
  },
  activateModel: async (versionId: string): Promise<any> => {
    const res = await apiClient.post(`/monitoring/models/${versionId}/activate`);
    return res.data;
  },
  rollbackModel: async (checkpoint: string): Promise<any> => {
    const res = await apiClient.post(`/monitoring/models/${checkpoint}/rollback`);
    return res.data;
  },
  getEvaluationReport: async (checkpoint: string = 'W4'): Promise<any> => {
    const res = await apiClient.get('/monitoring/evaluation-report', { params: { checkpoint } });
    return res.data;
  }
};
