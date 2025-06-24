import React, { useState } from 'react';
import './AuthForm.css';

const AuthForm = ({ onLogin, onSignup, isLoading }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLoginMode) {
      onLogin(formData.email, formData.password);
    } else {
      onSignup(formData.email, formData.password);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <div className="wrapper">
      <div className="switch">
        <input
          type="checkbox"
          className="toggle"
          checked={!isLoginMode}
          onChange={toggleMode}
          disabled={isLoading}
        />
        <span className="slider"></span>
        <span className="card-side"></span>
        
        <div className="flip-card__inner">
          {/* Login Form */}
          <div className="flip-card__front">
            <div className="title">Welcome Back</div>
            <form className="flip-card__form" onSubmit={handleSubmit}>
              <input
                className={`flip-card__input ${errors.email ? 'error' : ''}`}
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
              
              <input
                className={`flip-card__input ${errors.password ? 'error' : ''}`}
                name="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
              
              <button className="flip-card__btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>

          {/* Signup Form */}
          <div className="flip-card__back">
            <div className="title">Create Account</div>
            <form className="flip-card__form" onSubmit={handleSubmit}>
              <input
                className={`flip-card__input ${errors.email ? 'error' : ''}`}
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
              
              <input
                className={`flip-card__input ${errors.password ? 'error' : ''}`}
                name="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
              
              <input
                className={`flip-card__input ${errors.confirmPassword ? 'error' : ''}`}
                name="confirmPassword"
                placeholder="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              
              <button className="flip-card__btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;