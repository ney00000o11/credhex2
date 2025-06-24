import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Waves from './components/Waves';
import Dock from './components/Dock';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if Supabase is properly configured
    if (supabase) {
      setIsSupabaseConfigured(true);
      checkUser();
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } else {
      setIsSupabaseConfigured(false);
      setLoading(false);
    }
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          showNotification('Please check your email and confirm your account before logging in.', 'error');
        } else {
          showNotification(error.message, 'error');
        }
        return;
      }

      if (data.user) {
        setUser(data.user);
        showNotification('Successfully logged in!', 'success');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('An unexpected error occurred during login.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (email, password) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        showNotification(error.message, 'error');
        return;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed (for development)
          setUser(data.user);
          showNotification('Account created successfully!', 'success');
        } else {
          // User needs to confirm email
          showNotification(
            'Account created! Please check your email and click the confirmation link to complete your registration.',
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      showNotification('An unexpected error occurred during signup.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showNotification(error.message, 'error');
        return;
      }
      setUser(null);
      setCurrentPage('home');
      showNotification('Successfully logged out!', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('An error occurred during logout.', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className={`App ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="waves-background">
          <Waves
            lineColor={isDarkTheme ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.3)"}
            backgroundColor="transparent"
          />
        </div>
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className={`App ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="waves-background">
          <Waves
            lineColor={isDarkTheme ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.3)"}
            backgroundColor="transparent"
          />
        </div>
        <div className="main-content">
          <header className="header">
            <div className="logo-section">
              <img 
                src="https://static.vecteezy.com/system/resources/previews/014/179/558/original/certificate-icons-design-in-blue-circle-png.png" 
                alt="CredHex Logo" 
                className="logo"
              />
              <h1 className="app-title">CredHex</h1>
            </div>
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
          </header>

          <div className="setup-section">
            <h2 className="setup-title">⚠️ Setup Required</h2>
            <div className="setup-content">
              <p className="setup-description">
                To use CredHex, you need to set up Supabase:
              </p>
              <ol className="setup-steps">
                <li>Create a Supabase account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                <li>Create a new project</li>
                <li>Go to Settings → API</li>
                <li>Copy your Project URL and anon public key</li>
                <li>Update the .env file with your credentials</li>
                <li>Create a storage bucket named "certificates"</li>
              </ol>
            </div>
          </div>
        </div>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <div className={`App ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="waves-background">
          <Waves
            lineColor={isDarkTheme ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.3)"}
            backgroundColor="transparent"
          />
        </div>

        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthForm 
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  isLoading={authLoading}
                />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <>
                  <Dashboard 
                    user={user} 
                    isDarkTheme={isDarkTheme}
                    currentPage={currentPage}
                  />
                  <Dock
                    onNavigate={handleNavigation}
                    onThemeToggle={toggleTheme}
                    onLogout={handleLogout}
                    isDarkTheme={isDarkTheme}
                    currentPage={currentPage}
                  />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;