import api from './api';
import {
  User,
  Event,
  Company,
  Ticket,
  Comment,
  Notification,
  PromoCode,
  AuthTokens,
  PaginatedResult,
  EventFilters,
} from '../types';

const unwrap = <T>(res: { data: { data: T } }): T => res.data.data;

export const authService = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<{ data: { message: string } }>('/auth/register', data).then(unwrap),

  login: (email: string, password: string) =>
    api.post<{ data: AuthTokens }>('/auth/login', { email, password }).then(unwrap),

  refresh: (refreshToken: string) =>
    api.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken }).then(unwrap),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const usersService = {
  getMe: () => api.get<{ data: User }>('/users/me').then(unwrap),

  updateMe: (data: FormData) =>
    api.patch<{ data: User }>('/users/me', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  getMyEvents: () =>
    api.get<{ data: Event[] }>('/users/me/events').then(unwrap),

  getMyTickets: () =>
    api.get<{ data: Ticket[] }>('/users/me/tickets').then(unwrap),

  getMySubscriptions: () =>
    api.get<{ data: any[] }>('/users/me/subscriptions').then(unwrap),

  removeAvatar: () =>
    api.delete<{ data: User }>('/users/me/avatar').then(unwrap),
};

export const eventsService = {
  getAll: (filters: EventFilters = {}) =>
    api
      .get<{ data: PaginatedResult<Event> }>('/events', { params: filters })
      .then(unwrap),

  getOne: (id: number) =>
    api.get<{ data: Event }>(`/events/${id}`).then(unwrap),

  getSimilar: (id: number) =>
    api.get<{ data: Event[] }>(`/events/${id}/similar`).then(unwrap),

  getAttendees: (id: number) =>
    api.get<{ data: any }>(`/events/${id}/attendees`).then(unwrap),

  create: (data: FormData) =>
    api.post<{ data: Event }>('/events', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  update: (id: number, data: FormData) =>
    api.patch<{ data: Event }>(`/events/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  delete: (id: number) => api.delete(`/events/${id}`),

  subscribe: (id: number) => api.post(`/events/${id}/subscribe`),
  unsubscribe: (id: number) => api.delete(`/events/${id}/subscribe`),

  getPromoCodes: (eventId: number) =>
    api.get<{ data: PromoCode[] }>(`/events/${eventId}/promo-codes`).then(unwrap),

  createPromoCode: (eventId: number, data: Partial<PromoCode>) =>
    api.post<{ data: PromoCode }>(`/events/${eventId}/promo-codes`, data).then(unwrap),

  deletePromoCode: (id: number) => api.delete(`/events/promo-codes/${id}`),

  validatePromoCode: (code: string, eventId: number) =>
    api
      .post<{ data: { valid: boolean; discountPercent?: number } }>(
        '/events/promo-codes/validate',
        { code, eventId },
      )
      .then(unwrap),
};

export const companiesService = {
  create: (data: FormData) =>
    api.post<{ data: Company }>('/companies', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  getMine: () =>
    api.get<{ data: Company[] }>('/companies/my').then(unwrap),

  getOne: (id: number) =>
    api.get<{ data: Company }>(`/companies/${id}`).then(unwrap),

  update: (id: number, data: FormData) =>
    api.patch<{ data: Company }>(`/companies/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  subscribe: (id: number) => api.post(`/companies/${id}/subscribe`),
  unsubscribe: (id: number) => api.delete(`/companies/${id}/subscribe`),
  remove: (id: number) => api.delete(`/companies/${id}`),
};

export const ticketsService = {
  getMine: () =>
    api.get<{ data: Ticket[] }>('/tickets/my').then(unwrap),

  getOne: (id: number) =>
    api.get<{ data: Ticket & { qrCodeDataUrl: string } }>(`/tickets/${id}`).then(unwrap),

  resendEmail: (id: number) =>
    api.post<{ data: { ok: boolean } }>(`/tickets/${id}/resend-email`).then(unwrap),
};

export const paymentsService = {
  createCheckout: (eventId: number, promoCode?: string) =>
    api
      .post<{ data: { sessionId?: string; url?: string; mockMode?: boolean } }>(
        '/payments/create-checkout',
        { eventId, promoCode },
      )
      .then(unwrap),

  mockPay: (eventId: number, price: number, promoCode?: string) =>
    api
      .post<{ data: { ticket: Ticket; redirectUrl?: string } }>(
        '/payments/mock-pay',
        { eventId, price, promoCode },
      )
      .then(unwrap),
};

export const commentsService = {
  getForEvent: (eventId: number, page = 1) =>
    api
      .get<{ data: PaginatedResult<Comment> }>(`/events/${eventId}/comments`, {
        params: { page },
      })
      .then(unwrap),

  create: (eventId: number, text: string) =>
    api
      .post<{ data: Comment }>(`/events/${eventId}/comments`, { text })
      .then(unwrap),

  delete: (id: number) => api.delete(`/comments/${id}`),
};

export const notificationsService = {
  getAll: (page = 1) =>
    api
      .get<{ data: PaginatedResult<Notification> }>('/notifications', {
        params: { page },
      })
      .then(unwrap),

  getUnreadCount: () =>
    api.get<{ data: number }>('/notifications/unread-count').then(unwrap),

  markRead: (id: number) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),

  delete: (id: number) => api.delete(`/notifications/${id}`),
};

export const adminService = {
  getStats: () =>
    api
      .get<{
        data: {
          totalUsers: number;
          totalEvents: number;
          totalTicketsSold: number;
          totalRevenue: number;
        };
      }>('/admin/stats')
      .then(unwrap),

  getUsers: (page = 1, search?: string) =>
    api
      .get<{ data: PaginatedResult<User> }>('/admin/users', {
        params: { page, search },
      })
      .then(unwrap),

  changeRole: (userId: number, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),

  getEvents: (page = 1, search?: string) =>
    api
      .get<{ data: PaginatedResult<Event> }>('/admin/events', {
        params: { page, search },
      })
      .then(unwrap),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  deleteEvent: (id: number) => api.delete(`/admin/events/${id}`),
};
