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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error retrieving token from localStorage:', error);
  }
  return config;
});

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
      const response: AxiosResponse<Book[]> = await api.get('/api/books');
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Failed to fetch books',
        status: error.response?.status || 500
      };
    }
  },

  async getBookByISBN(isbn: string): Promise<ApiResponse<Book>> {
    try {
      const response: AxiosResponse<Book> = await api.get(`/api/books/${isbn}`);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Failed to fetch book',
        status: error.response?.status || 500
      };
    }
  },

  async addBook(bookData: Book): Promise<ApiResponse<Book>> {
    try {
      const response: AxiosResponse<Book> = await api.post('/api/books', bookData);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Failed to add book',
        status: error.response?.status || 500
      };
    }
  },

  async updateBook(isbn: string, bookData: Partial<Book>): Promise<ApiResponse<Book>> {
    try {
      const response: AxiosResponse<Book> = await api.put(`/api/books/${isbn}`, bookData);
      return {
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || 'Failed to update book',
        status: error.response?.status || 500
      };
    }
  }
};

function storeAuthData(authData: AuthResponse): void {
  const { access_token, expires_in } = authData;
  const expiresInSeconds = expires_in ?? 3600; 
  const expiryTimestamp = Date.now() + (expiresInSeconds * 1000);
  
  localStorage.setItem(TOKEN_KEY, access_token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
}