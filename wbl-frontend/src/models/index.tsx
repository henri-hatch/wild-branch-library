// Book related types
export interface Book {
  id?: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  cover_image: string;
  location: string;
  owner_id?: number; // ID of the user who owns the book
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