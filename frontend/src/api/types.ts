/**
 * TypeScript types and DTO interfaces aligned with CoreHub Spring Boot backend.
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
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

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

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
  phone?: string | null;
  department?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
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
