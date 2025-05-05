import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Header } from '../components/Header';
import { authService } from '../services/api';
import { SignUpRequest, LoginRequest } from '../models';
import '../styles/Auth.css';

type AuthMode = 'login' | 'signup';

interface AuthFormData {
  username?: string;
  email: string;
  password: string;
}

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setApiError(null);
    reset();
  };

  const onSubmit: SubmitHandler<AuthFormData> = async (data) => {
    setLoading(true);
    setApiError(null);
    
    try {
      if (mode === 'signup') {
        if (!data.username) {
          setApiError('Username is required');
          setLoading(false);
          return;
        }
        
        const signupData: SignUpRequest = {
          username: data.username,
          email: data.email,
          password: data.password
        };
        
        const response = await authService.signUp(signupData);
        
        if (response.error) {
          setApiError(response.error);
        } else {
          navigate('/'); 
        }
      } else {
        const loginData: LoginRequest = {
          email: data.email,
          password: data.password
        };
        
        const response = await authService.login(loginData);
        
        if (response.error) {
          setApiError(response.error);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header showBackButton={false} />
      
      <main className="auth-container">
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <h2>{mode === 'login' ? 'Sign In' : 'Sign Up'}</h2>
          
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  }
                })}
              />
              {errors.username && <p className="error-message">{errors.username?.message}</p>}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <p className="error-message">{errors.email.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && <p className="error-message">{errors.password.message}</p>}
          </div>
          
          {apiError && <p className="error-message">{apiError}</p>}
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
          
          <div className="auth-toggle">
            {mode === 'login' ? (
              <p>Don't have an account? <button type="button" onClick={toggleMode}>Sign Up</button></p>
            ) : (
              <p>Already have an account? <button type="button" onClick={toggleMode}>Sign In</button></p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}