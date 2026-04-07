
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum EventFormat {
  CONFERENCE = 'conference',
  LECTURE = 'lecture',
  WORKSHOP = 'workshop',
  FEST = 'fest',
  OTHER = 'other',
}

export enum EventTheme {
  BUSINESS = 'business',
  POLITICS = 'politics',
  PSYCHOLOGY = 'psychology',
  TECHNOLOGY = 'technology',
  SCIENCE = 'science',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

export enum VisitorListVisibility {
  EVERYONE = 'everyone',
  ATTENDEES_ONLY = 'attendees_only',
}

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  TICKET_PURCHASED = 'ticket_purchased',
  EVENT_REMINDER = 'event_reminder',
  ORGANIZER_NEWS = 'organizer_news',
  NEW_VISITOR = 'new_visitor',
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: UserRole;
  showNameInEvents: boolean;
  isEmailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  description: string | null;
  location: string | null;
  logo: string | null;
  userId: number;
  createdAt: string;
  events?: Event[];
  owner?: User;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  format: EventFormat;
  theme: EventTheme;
  date: string;
  publishDate: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  price: number;
  maxTickets: number;
  ticketsSold: number;
  poster: string | null;
  visitorListVisibility: VisitorListVisibility;
  notifyOnNewVisitor: boolean;
  redirectAfterPurchase: string | null;
  companyId: number;
  createdAt: string;
  company?: Company;
  comments?: Comment[];
  isSubscribed?: boolean;
}

export interface Ticket {
  id: number;
  userId: number;
  eventId: number;
  purchaseDate: string;
  qrCode: string;
  qrCodeDataUrl?: string;
  price: number;
  status: TicketStatus;
  event?: Event;
  user?: User;
}

export interface Comment {
  id: number;
  text: string;
  userId: number;
  eventId: number;
  createdAt: string;
  user?: User;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  relatedEventId: number | null;
  createdAt: string;
}

export interface PromoCode {
  id: number;
  code: string;
  discountPercent: number;
  eventId: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface EventFilters {
  format?: EventFormat;
  theme?: EventTheme;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'date' | 'price' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
