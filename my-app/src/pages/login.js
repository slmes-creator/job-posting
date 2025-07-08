import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './App.css';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/register';
import ForgotPassword from './pages/forgotPassword';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful: ', userCredential.user);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
      <div className="AppWrapper">
        <div className="AuthBox">
          <div className="AuthContent">
            <h1 className="AuthHeader">Welcome Back!</h1>
            <input className='AuthInput' type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <div className='PasswordInputWrapper'>
              <input
                className='AuthInput'
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className='PasswordToggleButton'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <button className='AuthButton' onClick={handleLogin}>Login</button>
          </div>
          <div className='AuthFooterRow'>
            <p className='AuthFooter'><a href="#">Forgot Password?</a></p>
            <p className='AuthFooter'><a href="#">Register</a></p>
          </div>
        </div>
      </div>
  )
}

export default Login;
