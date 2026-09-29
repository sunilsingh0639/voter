import api from './api';
import type {
  LoginResponse, User, Ward, Voter, VoterFilters, InterestOption,
  PublicSubmission, AuditLog, DashboardStats, ContentItem, GalleryImage,
  PaginatedResult, ApiResponse, ImportSummary
} from '../types';

// Auth
export const authService = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password }),
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Users
export const userService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<User>>>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: Partial<User> & { password: string }) =>
    api.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse>(`/users/${id}/status`, { status }),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/users/${id}/reset-password`, { newPassword }),
  delete: (id: string) => api.delete(`/users/${id}`),
  getProfile: () => api.get<ApiResponse<User>>('/users/profile'),
};

// Wards
export const wardService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Ward>>>('/wards', { params }),
  getById: (id: string) => api.get<ApiResponse<Ward>>(`/wards/${id}`),
  create: (data: Partial<Ward>) => api.post<ApiResponse<Ward>>('/wards', data),
  update: (id: string, data: Partial<Ward>) =>
    api.put<ApiResponse<Ward>>(`/wards/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse>(`/wards/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/wards/${id}`),
};

// Voters
export const voterService = {
  getAll: (filters: VoterFilters) =>
    api.get<ApiResponse<PaginatedResult<Voter>>>('/voters', { params: filters }),
  getById: (id: string) => api.get<ApiResponse<Voter>>(`/voters/${id}`),
  update: (id: string, data: Partial<Voter>) =>
    api.put<ApiResponse<Voter>>(`/voters/${id}`, data),
  export: (filters: VoterFilters) =>
    api.get('/voters/export', { params: filters, responseType: 'blob' }),
};

// Voter Import
export const importService = {
  preview: (file: File, wardId: string, mode: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('wardId', wardId);
    form.append('mode', mode);
    return api.post<ApiResponse<{ validRows: unknown[]; invalidRows: unknown[]; duplicateRows: unknown[]; totalRows: number }>>('/voters/import/preview', form);
  },
  confirm: (importId: string) =>
    api.post<ApiResponse<ImportSummary>>(`/voters/import/${importId}/confirm`),
  downloadErrorFile: (importId: string) =>
    api.get(`/voters/import/${importId}/errors`, { responseType: 'blob' }),
  getHistory: () => api.get<ApiResponse<ImportSummary[]>>('/voters/import/history'),
};

// Dashboard
export const dashboardService = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/reports/dashboard'),
};

// Interest Options
export const interestOptionService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<InterestOption[]>>('/interest-options', { params }),
  create: (data: FormData) => api.post<ApiResponse<InterestOption>>('/interest-options', data),
  update: (id: string, data: FormData) =>
    api.put<ApiResponse<InterestOption>>(`/interest-options/${id}`, data),
  updateStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse>(`/interest-options/${id}/status`, { isActive }),
  delete: (id: string) => api.delete(`/interest-options/${id}`),
};

// Public Submissions
export const submissionService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<PublicSubmission>>>('/reports/public-interests', { params }),
  export: (params?: Record<string, unknown>) =>
    api.get('/reports/public-interests/export', { params, responseType: 'blob' }),
};

// Audit Logs
export const auditService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<AuditLog>>>('/audit-logs', { params }),
};

// Content
export const contentService = {
  getAll: () => api.get<ApiResponse<ContentItem[]>>('/content'),
  update: (id: string, data: Partial<ContentItem>) =>
    api.put<ApiResponse<ContentItem>>(`/content/${id}`, data),
};

// Gallery
export const galleryService = {
  getAll: () => api.get<ApiResponse<GalleryImage[]>>('/gallery'),
  create: (data: FormData) => api.post<ApiResponse<GalleryImage>>('/gallery', data),
  update: (id: string, data: FormData) =>
    api.put<ApiResponse<GalleryImage>>(`/gallery/${id}`, data),
  delete: (id: string) => api.delete(`/gallery/${id}`),
};

// Public APIs (no auth)
export const publicService = {
  getContent: () => api.get<ApiResponse<ContentItem[]>>('/public/content'),
  getGallery: () => api.get<ApiResponse<GalleryImage[]>>('/public/gallery'),
  getInterestOptions: () => api.get<ApiResponse<InterestOption[]>>('/public/interest-options'),
  submitInterest: (data: { interestOptionId: string; sessionId: string; language: string; source: string }) =>
    api.post<ApiResponse<{ submissionId: string }>>('/public/interests', data),
  sendOtp: (data: { submissionId: string; mobileNumber: string }) =>
    api.post<ApiResponse>('/public/otp/send', data),
  verifyOtp: (data: { submissionId: string; otp: string }) =>
    api.post<ApiResponse>('/public/otp/verify', data),
};
