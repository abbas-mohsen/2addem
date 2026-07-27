import { api } from './client.js';

const unwrap = (response) => response.data.data;
const unwrapList = (response) => ({ items: response.data.data, meta: response.data.meta });

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  refresh: () => api.post('/auth/refresh').then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  updateMe: (payload) => api.patch('/auth/me', payload).then(unwrap),
};

export const jobsApi = {
  list: (params) => api.get('/jobs', { params }).then(unwrapList),
  get: (slugOrId) => api.get(`/jobs/${slugOrId}`).then(unwrap),
  mine: (params) => api.get('/jobs/mine', { params }).then(unwrapList),
  create: (payload) => api.post('/jobs', payload).then(unwrap),
  update: ({ id, ...payload }) => api.patch(`/jobs/${id}`, payload).then(unwrap),
  setStatus: ({ id, status }) => api.patch(`/jobs/${id}/status`, { status }).then(unwrap),
  remove: (id) => api.delete(`/jobs/${id}`).then(unwrap),
  applications: ({ id, ...params }) =>
    api.get(`/jobs/${id}/applications`, { params }).then(unwrapList),
  aiDraft: (payload) => api.post('/jobs/ai-draft', payload).then(unwrap),
};

export const applicationsApi = {
  apply: ({ jobId, formData, onUploadProgress }) =>
    api.post(`/jobs/${jobId}/apply`, formData, { onUploadProgress }).then(unwrap),
  mine: (params) => api.get('/applications/mine', { params }).then(unwrapList),
  withdraw: (id) => api.patch(`/applications/${id}/withdraw`).then(unwrap),
  get: (id) => api.get(`/applications/${id}`).then(unwrap),
  setStage: ({ id, stage }) => api.patch(`/applications/${id}/stage`, { stage }).then(unwrap),
  addNote: ({ id, body }) => api.post(`/applications/${id}/notes`, { body }).then(unwrap),
  setTags: ({ id, tags }) => api.patch(`/applications/${id}/tags`, { tags }).then(unwrap),
  setScore: ({ id, score }) => api.patch(`/applications/${id}/score`, { score }).then(unwrap),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(unwrap),
  read: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  readAll: () => api.patch('/notifications/read-all').then(unwrap),
};

export const interviewsApi = {
  mine: (params) => api.get('/interviews/mine', { params }).then(unwrap),
  forApplication: (applicationId) =>
    api.get(`/applications/${applicationId}/interviews`).then(unwrap),
  create: ({ applicationId, ...payload }) =>
    api.post(`/applications/${applicationId}/interviews`, payload).then(unwrap),
  update: ({ id, ...payload }) => api.patch(`/interviews/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/interviews/${id}`).then(unwrap),
};

export const talentApi = {
  list: (params) => api.get('/talent-pool', { params }).then(unwrapList),
  ids: () => api.get('/talent-pool/ids').then(unwrap),
  save: (payload) => api.post('/talent-pool', payload).then(unwrap),
  update: ({ id, ...payload }) => api.patch(`/talent-pool/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/talent-pool/${id}`).then(unwrap),
};

export const adminApi = {
  overview: () => api.get('/admin/overview').then(unwrap),
  users: (params) => api.get('/admin/users', { params }).then(unwrapList),
  setUserActive: ({ id, isActive }) =>
    api.patch(`/admin/users/${id}/active`, { isActive }).then(unwrap),
  jobs: (params) => api.get('/admin/jobs', { params }).then(unwrapList),
  takeDownJob: (id) => api.patch(`/admin/jobs/${id}/takedown`).then(unwrap),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`).then(unwrap),
  companies: (params) => api.get('/admin/companies', { params }).then(unwrapList),
};

export const companiesApi = {
  bySlug: (slug) => api.get(`/companies/${slug}`).then(unwrap),
  mine: () => api.get('/companies/mine').then(unwrap),
  stats: () => api.get('/companies/mine/stats').then(unwrap),
  update: (payload) => api.patch('/companies/mine', payload).then(unwrap),
};
