// Library related types
export interface Library {
  id: number;
  name: string;
  user_id: number; // Foreign key to User
}

// Book related types
export interface Book {
  id: number; // Primary key
  isbn: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  cover_image?: string;
  library_id: number; // Foreign key to Library
  owner_id: number; // Foreign key to User
}

// Authentication related types
export interface User {
  id?: number;
  username: string;
  email: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number; // Make optional
  user?: User;         // Make optional
}

// API Response wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}