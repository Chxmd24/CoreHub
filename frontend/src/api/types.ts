/**
 * TypeScript types and DTO interfaces aligned with CoreHub Spring Boot backend.
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum ListingType {
  SELL = 'SELL',
  SWAP = 'SWAP',
  BORROW = 'BORROW',
}

export enum ComponentStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  EXCHANGED = 'EXCHANGED',
}

export enum ModerationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const SUPPORTED_DEPARTMENTS = [
  'Electrical and Information Engineering',
  'Civil and Environmental Engineering',
  'Marine Engineering and Naval Architecture',
  'Mechanical and Manufacturing Engineering',
  'Computer Engineering',
] as const;

export type SupportedDepartment = (typeof SUPPORTED_DEPARTMENTS)[number];

export interface UserResponse {
  id: number;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  role: Role;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  studentId: string;
  email: string;
  password: string;
  phone: string;
  department: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone: string;
  department: string;
}

export interface ComponentRequest {
  title: string;
  description: string;
  category: string;
  specifications?: string | null;
  listingType: ListingType;
  price?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface ComponentResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  specifications?: string | null;
  listingType: ListingType;
  price?: number | null;
  status: ComponentStatus;
  moderationStatus?: ModerationStatus;
  moderationReason?: string | null;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerContactResponse {
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  studentId: string;
}

export interface ReservationResponse {
  id: number;
  componentId: number;
  componentTitle: string;
  componentCategory: string;
  listingType: string;
  price?: number | null;
  reservedById: number;
  reservedByName: string;
  ownerId: number;
  ownerName: string;
  reservedAt: string;
  expiresAt?: string | null;
  status: ReservationStatus;
  sellerContact?: SellerContactResponse | null;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp?: string;
  validationErrors?: Record<string, string>;
}

// ==========================================
// Admin DTOs
// ==========================================

export interface AdminOverviewResponse {
  totalUsers: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  totalListings: number;
  availableListings: number;
  reservedListings: number;
  exchangedListings: number;
  moderatedListings: number;
  totalReservations: number;
  activeReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  expiredReservations: number;
  totalAuditLogs: number;
}

export interface AdminUserResponse {
  id: number;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  role: Role;
  createdAt: string;
  listingCount: number;
  reservationCount: number;
}

export interface UpdateUserRoleRequest {
  role: Role;
}

export interface ModerateListingRequest {
  action: 'SUSPEND' | 'REINSTATE';
  reason?: string;
}

export interface AdminListingResponse {
  id: number;
  title: string;
  category: string;
  listingType: ListingType;
  price?: number | null;
  status: ComponentStatus;
  moderationStatus: ModerationStatus;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  moderatedBy?: string | null;
  ownerId: number;
  ownerName: string;
  ownerEmail?: string | null;
  createdAt: string;
}

export interface AdminAuditLogResponse {
  id: number;
  actorId?: number | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: number;
  details?: string | null;
  timestamp: string;
}
