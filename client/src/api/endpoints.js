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

export const companiesApi = {
  bySlug: (slug) => api.get(`/companies/${slug}`).then(unwrap),
  mine: () => api.get('/companies/mine').then(unwrap),
  stats: () => api.get('/companies/mine/stats').then(unwrap),
  update: (payload) => api.patch('/companies/mine', payload).then(unwrap),
};
