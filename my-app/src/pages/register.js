import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../App.css';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

import { Outlet, Link } from "react-router-dom";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful: ', userCredential.user);
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  return (
    <div className="AppWrapper">
      <div className="AuthBox">
        <div className="AuthContent">
          <h1 className="AuthHeader">Sign up</h1>
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
          <button className='AuthButton' style={{ width: "30%" }} onClick={handleRegister}>Register</button>
        </div>
        <div className='AuthFooterRow'>
          <p className='AuthFooter'><Link to="/">Login</Link></p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default Register;
