const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.error || `Error ${res.status}`);
  }
  return res.json();
}

export interface Favorite {
  id: number;
  user: number;
  medicine: number;
  medicine_detail: {
    id: number;
    name: string;
    description: string;
    price: string;
    category: string;
    image_url: string | null;
    stock: number;
    average_rating: number;
    reviews_count: number;
    pharmacy: number;
    created_at: string;
  };
  created_at: string;
}

export const api = {
  // AUTH
  register: (data: object) =>
    request('/register/', { method: 'POST', body: JSON.stringify(data) }),

  googleLogin: (token: string) =>
    request('/google-login/', { method: 'POST', body: JSON.stringify({ token }) }),

  // LOCATION
  updateLocation: (latitude: number, longitude: number) =>
    request('/update-location/', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    }),

  // MEDICINES
  getMedicines: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{
      results: import('@/types').Medicine[];
      count: number;
      next: string | null;
      previous: string | null;
    }>(`/medicines/${qs}`);
  },

  getMedicine: (id: number) =>
    request<import('@/types').Medicine>(`/medicines/${id}/`),

  createMedicine: (data: FormData) => {
    const token = getToken();
    return fetch(`${BASE}/medicines/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    }).then((r) => r.json());
  },

  deleteMedicine: (id: number) =>
    request(`/medicines/${id}/`, { method: 'DELETE' }),

  updateMedicine: (id: number, data: FormData) => {
    const token = getToken();
    return fetch(`${BASE}/medicines/${id}/`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    }).then(r => r.ok ? r.json() : r.json().then((e: any) => Promise.reject(new Error(e.detail || e.error || 'Update failed'))));
  },

  topMedicines: () =>
    request<import('@/types').Medicine[]>('/top-medicines/'),

  // PHARMACIES
  getPharmacies: () =>
    request<import('@/types').Pharmacy[]>('/pharmacies/'),

  getPharmacy: (id: number) =>
    request<import('@/types').Pharmacy>(`/pharmacies/${id}/`),

  createPharmacy: (data: FormData) => {
    const token = getToken();
    return fetch(`${BASE}/pharmacies/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    }).then((r) => r.json());
  },

  // CART
  getCart: () => request<import('@/types').Cart>('/cart/'),

  addToCart: (medicine_id: number, quantity: number) =>
    request('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ medicine_id, quantity }),
    }),

  removeFromCart: (item_id: number) =>
    request(`/cart/remove/${item_id}/`, { method: 'DELETE' }),

  // ORDERS
  createOrder: () =>
    request<import('@/types').Order>('/orders/create/', { method: 'POST' }),

  myOrders: () =>
    request<import('@/types').Order[]>('/orders/my/'),

  pharmacyOrders: () =>
    request<import('@/types').Order[]>('/orders/pharmacy/'),

  allOrders: () =>
    request<import('@/types').Order[]>('/admin/orders/'),

  updateOrderStatus: (order_id: number, status: string) =>
    request(`/admin/orders/${order_id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // REVIEWS
  getReviews: (medicine_id: number) =>
    request<import('@/types').Review[]>(`/reviews/${medicine_id}/`),

  addReview: (medicine_id: number, rating: number, comment: string) =>
    request('/reviews/add/', {
      method: 'POST',
      body: JSON.stringify({ medicine_id, rating, comment }),
    }),

  // FAVORITES
  getFavorites: () =>
    request<Favorite[]>('/favorites/'),

  toggleFavorite: (medicine_id: number) =>
    request<{ message: string }>('/favorites/toggle/', {
      method: 'POST',
      body: JSON.stringify({ medicine_id }),
    }),

  // NOTIFICATIONS
  getNotifications: () =>
    request<import('@/types').Notification[]>('/notifications/'),

  markNotificationRead: (id: number) =>
    request<{ message: string }>(`/notifications/${id}/mark_as_read/`, {
      method: 'POST',
    }),

  // AI GUIDE
  aiGuide: (symptoms: string) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 20000);
    return request<{ response: string; ai_powered: boolean }>('/ai-guide/', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
      signal: controller.signal,
    });
  },

  // DASHBOARDS
  ownerDashboard: () =>
    request<{
      pharmacy: string;
      location: string;
      verified: boolean;
      total_medicines: number;
      latest_medicines: {
        id: number;
        name: string;
        price: string;
        category: string;
      }[];
      categories: { category: string; total: number }[];
    }>('/owner/dashboard/'),

  adminDashboard: () =>
    request<{
      total_users: number;
      total_customers: number;
      total_owners: number;
      total_pharmacies: number;
      verified_pharmacies: number;
      total_medicines: number;
      total_orders: number;
      total_sales: number;
    }>('/admin/dashboard/'),

  recentActivity: () =>
    request<{
      latest_users: { id: number; username: string; role: string }[];
      latest_orders: {
        id: number;
        user: string;
        total_price: number;
        status: string;
      }[];
      latest_medicines: { id: number; name: string; price: number }[];
    }>('/admin/recent-activity/'),

  verifyPharmacy: (pharmacy_id: number) =>
    request<{ message: string }>(`/admin/verify-pharmacy/${pharmacy_id}/`, {
      method: 'POST',
    }),

  rejectPharmacy: (pharmacy_id: number) =>
    request<{ message: string }>(`/admin/reject-pharmacy/${pharmacy_id}/`, {
      method: 'DELETE',
    }),

  listUsers: () =>
    request<import('@/types').User[]>('/admin/users/'),

  deleteUser: (user_id: number) =>
    request<{ message: string }>(`/admin/users/${user_id}/`, {
      method: 'DELETE',
    }),

  deletePharmacy: (pharmacy_id: number) =>
    request<{ message: string }>(`/admin/delete-pharmacy/${pharmacy_id}/`, {
      method: 'DELETE',
    }),
};