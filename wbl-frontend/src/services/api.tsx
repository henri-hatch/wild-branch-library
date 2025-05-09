import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  Book, 
  LoginRequest, 
  SignUpRequest, 
  User 
} from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryTimestampStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (token && expiryTimestampStr) {
      const expiryTimestamp = parseInt(expiryTimestampStr, 10);
      if (isNaN(expiryTimestamp) || Date.now() >= expiryTimestamp) {
        // Token expired or invalid, logout and remove header
        await authService.logout(); // Use the logout function to clear all auth data
        delete config.headers.Authorization;
        // Optionally, redirect to login or show a message
        // window.location.href = '/login'; // Or use react-router navigate
        console.warn('Token expired or invalid. User logged out.');
        return config; // Return config without Authorization header
      }
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && !expiryTimestampStr) {
      // Token exists but no expiry, treat as invalid
      await authService.logout();
      delete config.headers.Authorization;
      console.warn('Token found without expiry. User logged out.');
    }
  } catch (error) {
    console.error('Error in request interceptor:', error);
    // If there's an error reading from localStorage, logout to be safe
    await authService.logout();
    delete config.headers.Authorization;
  }
  return config;
});

// Add a response interceptor to handle 401/403 errors globally
api.interceptors.response.use(
  (response) => response, // Simply return the response if it's successful
  async (error) => {
    const originalRequest = error.config;
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true; // Mark to avoid infinite loop
      console.warn(`Authentication error (${error.response.status}). Logging out user.`);
      await authService.logout();
    }
    return Promise.reject(error); // Important to reject the error so the calling code knows about it
  }
);

export const authService = {
  async signUp(userData: SignUpRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/api/users', userData);
      if (response.data.access_token) {
        storeAuthData(response.data);
      }
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Sign up failed',
        status: error.response?.status || 500
      };
    }
  },

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/api/login/access-token', credentials);
      if (response.data.access_token) {
        storeAuthData(response.data);
      }
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Login failed',
        status: error.response?.status || 500
      };
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    delete api.defaults.headers.common['Authorization'];
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiryTimestampStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token || !expiryTimestampStr) {
        return false;
      }
      
      const expiryTimestamp = parseInt(expiryTimestampStr, 10);
      if (isNaN(expiryTimestamp)) {
        await this.logout();
        return false;
      }

      const now = Date.now();
      if (now >= expiryTimestamp) {
        await this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Auth check error with localStorage:', error);
      await this.logout();
      return false;
    }
  },

  async fetchCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<User> = await api.get('/api/users/me');
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Failed to fetch user details',
        status: error.response?.status || 500
      };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        return JSON.parse(userStr);
      } else {
        const response = await this.fetchCurrentUser();
        if (response.data) {
          return response.data;
        } else {
          console.error('Failed to get current user:', response.error);
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      try {
        const response = await this.fetchCurrentUser();
        return response.data || null;
      } catch (fetchError) {
        console.error('Fallback fetch failed:', fetchError);
        return null;
      }
    }
  }
};

export const bookService = {
  async getAllBooks(): Promise<ApiResponse<Book[]>> {
    try {
      // This might need adjustment if you only want books for the current user by default
      // Or if the backend now filters by owner_id based on JWT
      const response: AxiosResponse<Book[]> = await api.get('/api/books');
      return { data: response.data, status: response.status };
    } catch (error: any) {
      return { 
        error: error.response?.data?.detail || 'Failed to fetch books',
        status: error.response?.status || 500
      };
    }
  },

  async getBookById(id: number): Promise<ApiResponse<Book>> { // Changed from getBookByISBN to getBookById
    try {
      const response: AxiosResponse<Book> = await api.get(`/api/books/${id}`);
      return { data: response.data, status: response.status };
    } catch (error: any) {
      return { 
        error: error.response?.data?.detail || 'Failed to fetch book',
        status: error.response?.status || 500
      };
    }
  },

  async getBookDetailsFromAPI(isbn: string): Promise<ApiResponse<Book>> { // For pre-populating form
    try {
      const response: AxiosResponse<Book> = await api.get(`/api/books/details/${isbn}`);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      if (error.response?.status === 204) {
        return {
          data: undefined, 
          status: error.response.status,
          // The backend for /details/{isbn} might not return a body for 204.
          // The component handles the message.
          error: 'Book with this ISBN already exists in the library.' 
        };
      }
      return {
        error: error.response?.data?.detail || 'Failed to fetch book details from API',
        status: error.response?.status || 500
      };
    }
  },

  async addBook(bookData: Omit<Book, 'id' | 'owner_id'>): Promise<ApiResponse<Book>> { // Frontend sends data without id/owner_id
    try {
      const response: AxiosResponse<Book> = await api.post('/api/books', bookData);
      return { data: response.data, status: response.status };
    } catch (error: any) {
      return { 
        error: error.response?.data?.detail || 'Failed to add book',
        status: error.response?.status || 500
      };
    }
  },

  async updateBook(id: number, bookData: Partial<Omit<Book, 'id' | 'owner_id' | 'isbn'>>): Promise<ApiResponse<Book>> { // Update by ID, ISBN likely not updatable
    try {
      const response: AxiosResponse<Book> = await api.put(`/api/books/${id}`, bookData);
      return { data: response.data, status: response.status };
    } catch (error: any) {
      return { 
        error: error.response?.data?.detail || 'Failed to update book',
        status: error.response?.status || 500
      };
    }
  },

  async deleteBook(id: number): Promise<ApiResponse<null>> { // Delete by ID
    try {
      const response: AxiosResponse<null> = await api.delete(`/api/books/${id}`);
      return { data: null, status: response.status };
    } catch (error: any) {
      return { 
        error: error.response?.data?.detail || 'Failed to delete book',
        status: error.response?.status || 500
      };
    }
  }
};

function storeAuthData(authData: AuthResponse): void {
  const { access_token, expires_in, user } = authData;
  localStorage.setItem(TOKEN_KEY, access_token);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  // expires_in is in seconds. Calculate expiry timestamp in milliseconds.
  const expiresInSeconds = expires_in ?? 3600; // Default to 1 hour if not provided
  const now = Date.now();
  const expiryTimestamp = now + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
}