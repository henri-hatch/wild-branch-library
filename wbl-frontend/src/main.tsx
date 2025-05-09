import React, { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import App from './App'
import { Library } from './pages/Library'
import { Auth } from './pages/Auth'
import { ManageAccount } from './pages/ManageAccount'
import { AddBook } from './pages/AddBook'
import { EditBook } from './pages/EditBook'
import { authService } from './services/api'

// Centralized Authentication Check Component
function AuthCheck({ children }: { children: React.ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    const check = async () => {
      // Reset to loading state only if the component is still mounted
      if (isMounted) {
        setIsAuthenticated(null); 
      }
      const auth = await authService.isAuthenticated();
      // Update state only if the component is still mounted
      if (isMounted) {
        setIsAuthenticated(auth);
      }
    };
    check();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => { isMounted = false; };
  }, [location]);

  if (isAuthenticated === null) {
    // Still checking authentication
    return <div>Loading...</div>;
  }

  // If not authenticated and trying to access a protected route (anything other than /auth)
  if (!isAuthenticated && location.pathname !== '/auth') {
     return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated and trying to access the /auth page
  if (isAuthenticated && location.pathname === '/auth') {
      // Redirect to the intended destination stored in location state, or fallback to root
      const from = location.state?.from?.pathname || "/";
      return <Navigate to={from} replace />;
  }

  // Otherwise, render the requested route (children)
  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* AuthCheck wraps all routes */}
      <AuthCheck>
        <Routes>
          {/* App is now the element for the root path */}
          <Route path="/" element={<App />} /> 
          <Route path="/auth" element={<Auth />} />
          <Route path="/library" element={<Library />} /> 
          <Route path="/manage-account" element={<ManageAccount />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/edit-book/:isbn" element={<EditBook />} />
          
          {/* Fallback route - redirects to root, AuthCheck handles the rest */}
          <Route path="*" element={<Navigate to="/" replace />} /> 
        </Routes>
      </AuthCheck>
    </BrowserRouter>
  </StrictMode>,
)
