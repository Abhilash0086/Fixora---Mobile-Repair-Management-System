const BASE = '/api';

function getToken() {
  return localStorage.getItem('fx_token');
}

async function req(method, path, body) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    localStorage.removeItem('fx_token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login:         (email, password) => req('POST',  '/auth/login',   { email, password }),
  guestLogin:    ()                => req('POST',  '/auth/guest'),
  me:            ()                => req('GET',   '/auth/me'),
  updateProfile: (data)            => req('PATCH', '/auth/profile', data),

  // Users (admin)
  getUsers:   ()                          => req('GET',    '/users'),
  createUser: (data)                      => req('POST',   '/users', data),
  deleteUser: (id)                        => req('DELETE', `/users/${id}`),

  // Dashboard
  dashboard: () => req('GET', '/job-cards/dashboard'),

  // Job cards
  listJobCards: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/job-cards${qs ? `?${qs}` : ''}`);
  },
  readyJobCards:     (search) => req('GET', `/job-cards/ready${search ? `?search=${search}` : ''}`),
  deliveredJobCards: (search) => req('GET', `/job-cards/delivered${search ? `?search=${search}` : ''}`),
  getJobCard:        (id)     => req('GET', `/job-cards/${id}`),
  createJobCard:     (data)   => req('POST', '/job-cards', data),
  updateJobCard:     (id, data) => req('PATCH', `/job-cards/${id}`, data),

  // Brands & Models
  getBrands:  ()             => req('GET',  '/options/brands'),
  addBrand:   (name)         => req('POST', '/options/brands', { name }),
  getModels:  (brand)        => req('GET',  `/options/models?brand=${encodeURIComponent(brand)}`),
  addModel:   (brand, name)  => req('POST', '/options/models', { brand, name }),

  // Public (no auth)
  trackJobCard: (id) => fetch(`/api/public/track/${id}`).then(async r => {
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Not found');
    return d;
  }),

  // Enquiries
  getEnquiries:   (today) => req('GET',    `/enquiries${today ? '?today=true' : ''}`),
  createEnquiry:  (data)  => req('POST',   '/enquiries', data),
  deleteEnquiry:  (id)    => req('DELETE', `/enquiries/${id}`),

  // Analytics (admin only)
  getRevenue: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/analytics/revenue${qs ? `?${qs}` : ''}`);
  },
  getTechnicianStats: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/analytics/technicians${qs ? `?${qs}` : ''}`);
  },
};
